// ÄÄ Helpers de disponibilidade ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ

async function getAgendaConfig(db) {
  const r = await db.query('SELECT * FROM agenda_config WHERE id = 1');
  return r.rows[0] || { capacidade_diaria: 1, antecedencia_minima_dias: 1, antecedencia_maxima_dias: 180 };
}

async function getDisponibilidade(db, data) {
  const config = await getAgendaConfig(db);

  const especial = await db.query('SELECT * FROM agenda_dias_especiais WHERE data = $1', [data]);
  const e = especial.rows[0];

  let capacidade = config.capacidade_diaria;
  let bloqueado = false;
  let motivo = null;

  if (e) {
    motivo = e.motivo;
    if (e.capacidade === null || e.capacidade === 0) {
      bloqueado = true;
    } else {
      capacidade = e.capacidade;
    }
  }

  if (bloqueado) {
    return { disponivel: false, vagas_total: 0, vagas_usadas: 0, vagas_livres: 0, bloqueado: true, motivo };
  }

  const r = await db.query(
    "SELECT COUNT(*) FROM agendamentos WHERE data_evento = $1 AND status = 'confirmado'",
    [data]
  );
  const vagas_usadas = parseInt(r.rows[0].count);
  const vagas_livres = Math.max(0, capacidade - vagas_usadas);

  return { disponivel: vagas_livres > 0, vagas_total: capacidade, vagas_usadas, vagas_livres, bloqueado: false, motivo };
}

async function getDisponibilidadeRange(db, inicio, fim) {
  const config = await getAgendaConfig(db);

  const especiais = await db.query(
    'SELECT data::text AS data, capacidade, motivo FROM agenda_dias_especiais WHERE data BETWEEN $1 AND $2',
    [inicio, fim]
  );
  const especiaisMap = {};
  especiais.rows.forEach(e => { especiaisMap[e.data] = e; });

  const agendados = await db.query(`
    SELECT data_evento::text AS data, COUNT(*) AS count
    FROM agendamentos
    WHERE data_evento BETWEEN $1 AND $2 AND status = 'confirmado'
    GROUP BY data_evento
  `, [inicio, fim]);
  const agendadosMap = {};
  agendados.rows.forEach(a => { agendadosMap[a.data] = parseInt(a.count); });

  const result = {};
  const cur = new Date(inicio + 'T12:00:00');
  const end = new Date(fim + 'T12:00:00');

  while (cur <= end) {
    const dataStr = cur.toISOString().slice(0, 10);
    const e = especiaisMap[dataStr];
    let capacidade = config.capacidade_diaria;
    let bloqueado = false;
    let motivo = null;

    if (e) {
      motivo = e.motivo;
      if (e.capacidade === null || e.capacidade === 0) {
        bloqueado = true;
      } else {
        capacidade = e.capacidade;
      }
    }

    const vagas_usadas = agendadosMap[dataStr] || 0;
    const vagas_livres = bloqueado ? 0 : Math.max(0, capacidade - vagas_usadas);

    result[dataStr] = {
      disponivel: !bloqueado && vagas_livres > 0,
      vagas_total: bloqueado ? 0 : capacidade,
      vagas_usadas,
      vagas_livres,
      bloqueado,
      motivo,
    };

    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

exports.getAgendaConfig = getAgendaConfig;
exports.getDisponibilidade = getDisponibilidade;
exports.getDisponibilidadeRange = getDisponibilidadeRange;

// ÄÄ GET /admin/agenda ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ

exports.exibirAgenda = async (req, res) => {
  try {
    const config = await getAgendaConfig(req.db);

    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const [ano, mesNum] = mes.split('-').map(Number);

    const lastDay = new Date(ano, mesNum, 0).getDate();
    const inicio = `${mes}-01`;
    const pad = n => String(n).padStart(2, '0');
    const fim = `${mes}-${pad(lastDay)}`;

    const especiais = await req.db.query(
      'SELECT data::text AS data, capacidade, motivo FROM agenda_dias_especiais WHERE data BETWEEN $1 AND $2 ORDER BY data',
      [inicio, fim]
    );

    const agendados = await req.db.query(`
      SELECT data_evento::text AS data, COUNT(*) AS count
      FROM agendamentos
      WHERE data_evento BETWEEN $1 AND $2 AND status = 'confirmado'
      GROUP BY data_evento
    `, [inicio, fim]);

    const agendadosMap = {};
    agendados.rows.forEach(a => { agendadosMap[a.data] = parseInt(a.count); });

    res.render('pages/admin-agenda', {
      config, mes, ano, mesNum, lastDay,
      especiais: especiais.rows,
      agendadosMap,
      activePage: 'agenda',
      salvo: req.query.salvo === '1',
      erro: req.query.erro || null,
    });
  } catch (err) {
    console.error('Erro agenda admin:', err);
    res.status(500).render('pages/error', { message: 'Erro ao carregar agenda' });
  }
};

// ÄÄ POST /admin/agenda/config ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ

exports.salvarConfig = async (req, res) => {
  const { capacidade_diaria, antecedencia_minima_dias, antecedencia_maxima_dias, mes } = req.body;
  const mesRedir = mes || new Date().toISOString().slice(0, 7);
  try {
    await req.db.query(`
      INSERT INTO agenda_config (id, capacidade_diaria, antecedencia_minima_dias, antecedencia_maxima_dias, updated_at)
      VALUES (1, $1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET
        capacidade_diaria = $1, antecedencia_minima_dias = $2,
        antecedencia_maxima_dias = $3, updated_at = NOW()
    `, [
      Math.max(1, parseInt(capacidade_diaria) || 1),
      Math.max(0, parseInt(antecedencia_minima_dias) || 1),
      Math.max(1, parseInt(antecedencia_maxima_dias) || 180),
    ]);
    res.redirect(`/admin/agenda?mes=${mesRedir}&salvo=1`);
  } catch (err) {
    console.error('Erro ao salvar config agenda:', err);
    res.redirect(`/admin/agenda?mes=${mesRedir}&erro=config`);
  }
};

// ÄÄ POST /admin/agenda/dia ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ

exports.salvarDia = async (req, res) => {
  const { data, capacidade, motivo, mes } = req.body;
  const mesRedir = mes || (data ? data.slice(0, 7) : new Date().toISOString().slice(0, 7));
  try {
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.redirect(`/admin/agenda?mes=${mesRedir}&erro=data`);
    }
    const cap = capacidade === '' || capacidade === undefined ? null : parseInt(capacidade);
    await req.db.query(`
      INSERT INTO agenda_dias_especiais (data, capacidade, motivo)
      VALUES ($1, $2, $3)
      ON CONFLICT (data) DO UPDATE SET capacidade = $2, motivo = $3
    `, [data, cap, motivo || null]);
    res.redirect(`/admin/agenda?mes=${mesRedir}&salvo=1`);
  } catch (err) {
    console.error('Erro ao salvar dia especial:', err);
    res.redirect(`/admin/agenda?mes=${mesRedir}&erro=dia`);
  }
};

// ÄÄ POST /admin/agenda/dia/:data/remover ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ

exports.removerDia = async (req, res) => {
  const { data } = req.params;
  const mes = data ? data.slice(0, 7) : new Date().toISOString().slice(0, 7);
  try {
    await req.db.query('DELETE FROM agenda_dias_especiais WHERE data = $1', [data]);
    res.redirect(`/admin/agenda?mes=${mes}&salvo=1`);
  } catch (err) {
    console.error('Erro ao remover dia especial:', err);
    res.redirect(`/admin/agenda?mes=${mes}&erro=remover`);
  }
};

// ÄÄ GET /api/agenda/disponibilidade  (usado pelo JS do checkout e admin) ÄÄÄÄÄÄ

exports.disponibilidadeMes = async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const [ano, mesNum] = mes.split('-').map(Number);
    if (!ano || !mesNum) return res.status(400).json({ ok: false, erro: 'mes inv√°lido' });

    const pad = n => String(n).padStart(2, '0');
    const lastDay = new Date(ano, mesNum, 0).getDate();
    const inicio = `${mes}-01`;
    const fim = `${mes}-${pad(lastDay)}`;

    const disponibilidade = await getDisponibilidadeRange(req.db, inicio, fim);
    res.json({ ok: true, mes, disponibilidade });
  } catch (err) {
    console.error('Erro disponibilidade m√™s:', err);
    res.status(500).json({ ok: false, erro: 'Erro interno' });
  }
};

// ÄÄ GET /api/agenda/verificar?data=YYYY-MM-DD ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ

exports.verificarDisponibilidade = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ ok: false, erro: 'Data inv√°lida' });
    }
    const disp = await getDisponibilidade(req.db, data);
    res.json({ ok: true, data, ...disp });
  } catch (err) {
    console.error('Erro verificar disponibilidade:', err);
    res.status(500).json({ ok: false, erro: 'Erro interno' });
  }
};
