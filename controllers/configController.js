async function getConfigs(db) {
  try {
    const r = await db.query('SELECT chave, valor FROM configuracoes');
    const cfg = {};
    r.rows.forEach(row => { cfg[row.chave] = row.valor; });
    return cfg;
  } catch {
    return {};
  }
}

exports.getConfigs = getConfigs;

exports.exibirConfiguracoes = async (req, res) => {
  try {
    const configs = await getConfigs(req.db);
    res.render('pages/admin-configuracoes', {
      configs,
      activePage: 'configuracoes',
      salvo: req.query.salvo === '1',
      erro: req.query.erro === '1',
    });
  } catch (err) {
    console.error('Erro configurações:', err);
    res.status(500).render('pages/error', { message: 'Erro ao carregar configurações' });
  }
};

exports.salvarConfiguracoes = async (req, res) => {
  const { controla_estoque, reservar_estoque_carrinho } = req.body;
  try {
    const pares = [
      ['controla_estoque', controla_estoque === 'on' ? 'true' : 'false'],
      ['reservar_estoque_carrinho', reservar_estoque_carrinho === 'on' ? 'true' : 'false'],
    ];
    for (const [chave, valor] of pares) {
      await req.db.query(`
        INSERT INTO configuracoes (chave, valor, updated_at) VALUES ($1, $2, NOW())
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()
      `, [chave, valor]);
    }
    res.redirect('/admin/configuracoes?salvo=1');
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    res.redirect('/admin/configuracoes?erro=1');
  }
};
