exports.listar = async (req, res) => {
  try {
    const r = await req.db.query(`
      SELECT c.*, COUNT(p.id) AS total_produtos
      FROM categorias c
      LEFT JOIN produtos p ON p.categoria_id = c.id
      GROUP BY c.id
      ORDER BY c.ordem ASC, c.nome ASC
    `);
    res.render('pages/admin-categorias', { categorias: r.rows, activePage: 'categorias' });
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.redirect('/admin');
  }
};

exports.criar = async (req, res) => {
  const { nome } = req.body;
  try {
    const r = await req.db.query(
      'INSERT INTO categorias (nome) VALUES ($1) RETURNING id', [nome.trim()]
    );
    res.redirect(`/admin/categorias/${r.rows[0].id}/editar`);
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    res.redirect('/admin/categorias');
  }
};

exports.exibirEditar = async (req, res) => {
  try {
    const [catRes, produtosRes] = await Promise.all([
      req.db.query('SELECT * FROM categorias WHERE id = $1', [req.params.id]),
      req.db.query('SELECT id, nome, categoria_id FROM produtos ORDER BY nome ASC'),
    ]);
    if (!catRes.rows[0]) return res.redirect('/admin/categorias');
    res.render('pages/admin-categoria-editar', {
      categoria: catRes.rows[0],
      produtos: produtosRes.rows,
      activePage: 'categorias',
    });
  } catch (err) {
    console.error('Erro ao abrir edição de categoria:', err);
    res.redirect('/admin/categorias');
  }
};

exports.atualizar = async (req, res) => {
  const id = req.params.id;
  const { nome, ordem, produtos_ids } = req.body;
  try {
    await req.db.query(
      'UPDATE categorias SET nome=$1, ordem=$2, updated_at=NOW() WHERE id=$3',
      [nome.trim(), parseInt(ordem) || 0, id]
    );
    await req.db.query('UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1', [id]);
    const ids = Array.isArray(produtos_ids) ? produtos_ids : (produtos_ids ? [produtos_ids] : []);
    if (ids.length > 0) {
      await req.db.query(
        'UPDATE produtos SET categoria_id = $1 WHERE id = ANY($2::int[])',
        [id, ids.map(Number)]
      );
    }
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error('Erro ao atualizar categoria:', err);
    res.redirect('/admin/categorias');
  }
};

exports.remover = async (req, res) => {
  try {
    await req.db.query('UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1', [req.params.id]);
    await req.db.query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error('Erro ao remover categoria:', err);
    res.redirect('/admin/categorias');
  }
};
