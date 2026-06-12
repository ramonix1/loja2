exports.exibir = async (req, res) => {
  try {
    const r = await req.db.query(
      "SELECT chave, valor FROM configuracoes WHERE chave LIKE 'loja_%'"
    );
    const cfg = {};
    r.rows.forEach(row => { cfg[row.chave] = row.valor; });
    res.render('pages/admin-aparencia', {
      cfg,
      activePage: 'aparencia',
      salvo: req.query.salvo === '1',
    });
  } catch (err) {
    console.error('Erro aparência:', err);
    res.redirect('/admin');
  }
};

exports.salvar = async (req, res) => {
  const { loja_nome, loja_slogan, loja_cor_primaria, loja_rodape, loja_email, loja_whatsapp } = req.body;

  const pares = [
    ['loja_nome',          (loja_nome || '').trim()],
    ['loja_slogan',        (loja_slogan || '').trim()],
    ['loja_cor_primaria',  loja_cor_primaria || '#2563eb'],
    ['loja_rodape',        (loja_rodape || '').trim()],
    ['loja_email',         (loja_email || '').trim()],
    ['loja_whatsapp',      (loja_whatsapp || '').trim()],
  ];

  if (req.files?.logo?.[0]) {
    pares.push(['loja_logo', '/images/' + req.files.logo[0].filename]);
  }
  if (req.files?.favicon?.[0]) {
    pares.push(['loja_favicon', '/images/' + req.files.favicon[0].filename]);
  }

  try {
    for (const [chave, valor] of pares) {
      await req.db.query(`
        INSERT INTO configuracoes (chave, valor, updated_at) VALUES ($1, $2, NOW())
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()
      `, [chave, valor]);
    }
    res.redirect('/admin/aparencia?salvo=1');
  } catch (err) {
    console.error('Erro ao salvar aparência:', err);
    res.redirect('/admin/aparencia');
  }
};
