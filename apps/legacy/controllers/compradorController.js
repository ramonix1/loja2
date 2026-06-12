function idValido(id) {
  return /^\d+$/.test(id);
}

exports.listar = async (req, res) => {
  try {
    const busca = (req.query.busca || '').trim();
    let query, params;

    if (busca) {
      query = `
        SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.cidade, u.estado,
               u.ativo, u.created_at, u.ultimo_acesso,
               COUNT(p.id) AS total_pedidos,
               COALESCE(SUM(p.total) FILTER (WHERE p.status NOT IN ('cancelado')), 0) AS total_gasto
        FROM usuarios u
        LEFT JOIN pedidos p ON p.usuario_id = u.id
        WHERE u.role = 'usuario'
          AND (u.nome ILIKE $1 OR u.email ILIKE $1 OR u.cpf ILIKE $1 OR u.telefone ILIKE $1)
        GROUP BY u.id ORDER BY u.created_at DESC
      `;
      params = [`%${busca}%`];
    } else {
      query = `
        SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.cidade, u.estado,
               u.ativo, u.created_at, u.ultimo_acesso,
               COUNT(p.id) AS total_pedidos,
               COALESCE(SUM(p.total) FILTER (WHERE p.status NOT IN ('cancelado')), 0) AS total_gasto
        FROM usuarios u
        LEFT JOIN pedidos p ON p.usuario_id = u.id
        WHERE u.role = 'usuario'
        GROUP BY u.id ORDER BY u.created_at DESC
      `;
      params = [];
    }

    const [compradores, totais] = await Promise.all([
      req.db.query(query, params),
      req.db.query(`
        SELECT
          COUNT(*) AS total_compradores,
          COUNT(*) FILTER (WHERE ativo = true) AS ativos,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS novos_mes
        FROM usuarios WHERE role = 'usuario'
      `),
    ]);

    res.render('pages/admin-compradores', {
      activePage: 'compradores',
      compradores: compradores.rows,
      totais: totais.rows[0],
      busca,
    });
  } catch (err) {
    console.error('Erro ao listar compradores:', err);
    res.status(500).render('pages/error', { message: 'Erro ao carregar compradores' });
  }
};

exports.detalhe = async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) return res.status(400).render('pages/error', { message: 'ID inválido' });

  try {
    const [usuarioRes, pedidosRes, agendamentosRes, totalRes] = await Promise.all([
      req.db.query(
        `SELECT * FROM usuarios WHERE id = $1 AND role = 'usuario'`,
        [id]
      ),
      req.db.query(
        `SELECT p.*,
                COUNT(pi.id) AS qtd_itens,
                JSON_AGG(JSON_BUILD_OBJECT(
                  'nome', pi.nome_produto,
                  'quantidade', pi.quantidade,
                  'preco_unitario', pi.preco_unitario,
                  'subtotal', pi.subtotal
                ) ORDER BY pi.id) AS itens
         FROM pedidos p
         LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
         WHERE p.usuario_id = $1
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        [id]
      ),
      req.db.query(
        `SELECT a.*, p.id AS pedido_id, p.total AS pedido_total,
                p.nome_entrega, p.status AS pedido_status
         FROM agendamentos a
         JOIN pedidos p ON p.id = a.pedido_id
         WHERE p.usuario_id = $1
         ORDER BY a.data_evento DESC`,
        [id]
      ),
      req.db.query(
        `SELECT
           COUNT(*) AS total_pedidos,
           COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelado')), 0) AS total_gasto,
           COALESCE(SUM(total) FILTER (WHERE status = 'cancelado'), 0) AS total_cancelado,
           MAX(created_at) AS ultimo_pedido
         FROM pedidos WHERE usuario_id = $1`,
        [id]
      ),
    ]);

    if (!usuarioRes.rows[0]) {
      return res.status(404).render('pages/error', { message: 'Comprador não encontrado' });
    }

    res.render('pages/admin-comprador-detalhe', {
      activePage: 'compradores',
      comprador: usuarioRes.rows[0],
      pedidos: pedidosRes.rows,
      agendamentos: agendamentosRes.rows,
      resumo: totalRes.rows[0],
    });
  } catch (err) {
    console.error('Erro ao carregar comprador:', err);
    res.status(500).render('pages/error', { message: 'Erro ao carregar ficha do comprador' });
  }
};
