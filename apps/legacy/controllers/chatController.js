exports.paginaAdmin = async (req, res) => {
  try {
    const [conversas, botRespostas] = await Promise.all([
      req.db.query(
        `SELECT c.*,
          (SELECT COUNT(*) FROM mensagens m
           WHERE m.conversa_id = c.id AND m.lida = false AND m.remetente = 'cliente') AS nao_lidas
         FROM conversas c ORDER BY c.updated_at DESC LIMIT 200`
      ),
      req.db.query(`SELECT * FROM bot_respostas ORDER BY ordem ASC, id ASC`),
    ]);
    res.render('pages/admin-chat', {
      activePage: 'chat',
      conversas: conversas.rows,
      botRespostas: botRespostas.rows,
    });
  } catch (err) {
    console.error('Erro admin chat:', err);
    res.status(500).render('pages/error', { message: 'Erro ao carregar chat' });
  }
};

exports.listarConversas = async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM mensagens m
         WHERE m.conversa_id = c.id AND m.lida = false AND m.remetente = 'cliente') AS nao_lidas
       FROM conversas c ORDER BY c.updated_at DESC LIMIT 200`
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
};

exports.mensagensConversa = async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.query(
      `UPDATE mensagens SET lida = true WHERE conversa_id = $1 AND remetente = 'cliente'`,
      [id]
    );
    const r = await req.db.query(
      `SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
};

exports.criarBotResposta = async (req, res) => {
  try {
    const { palavra_chave, resposta, ordem } = req.body;
    if (!palavra_chave || !resposta) return res.status(400).json({ error: 'Campos obrigatórios' });
    const r = await req.db.query(
      `INSERT INTO bot_respostas (palavra_chave, resposta, ordem) VALUES ($1, $2, $3) RETURNING *`,
      [palavra_chave.trim(), resposta.trim(), parseInt(ordem) || 0]
    );
    res.json(r.rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao criar resposta' });
  }
};

exports.atualizarBotResposta = async (req, res) => {
  try {
    const { id } = req.params;
    const { palavra_chave, resposta, ordem, ativo } = req.body;
    if (!palavra_chave || !resposta) return res.status(400).json({ error: 'Campos obrigatórios' });
    const r = await req.db.query(
      `UPDATE bot_respostas
       SET palavra_chave = $1, resposta = $2, ordem = $3, ativo = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [palavra_chave.trim(), resposta.trim(), parseInt(ordem) || 0, ativo !== false && ativo !== 'false', id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Não encontrado' });
    res.json(r.rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar resposta' });
  }
};

exports.excluirBotResposta = async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.query(`DELETE FROM bot_respostas WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir resposta' });
  }
};
