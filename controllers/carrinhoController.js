async function getCarrinho(db, usuarioId) {
  const r = await db.query(`
    SELECT
      ci.id, ci.quantidade, ci.preco_unitario,
      ci.preco_unitario * ci.quantidade AS subtotal,
      p.id AS produto_id, p.nome, p.subtitulo,
      (SELECT url FROM produtos_imagens WHERE produto_id = p.id ORDER BY id LIMIT 1) AS imagem
    FROM carrinho_itens ci
    JOIN produtos p ON p.id = ci.produto_id
    WHERE ci.usuario_id = $1
    ORDER BY ci.created_at ASC
  `, [usuarioId]);
  return r.rows;
}

exports.exibirCarrinho = async (req, res) => {
  try {
    const itens = await getCarrinho(req.db, req.session.usuarioId);
    const total = itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    res.render('pages/carrinho', { itens, total });
  } catch (err) {
    console.error('Erro ao carregar carrinho:', err);
    res.render('pages/carrinho', { itens: [], total: 0 });
  }
};

exports.adicionarItem = async (req, res) => {
  const { produto_id, quantidade } = req.body;
  const usuarioId = req.session.usuarioId;
  const qtd = Math.max(1, parseInt(quantidade) || 1);

  try {
    const prod = await req.db.query('SELECT id, valor, estoque FROM produtos WHERE id = $1', [produto_id]);
    if (!prod.rows[0]) return res.status(404).json({ erro: 'Produto n√£o encontrado.' });

    // Verificar estoque se o controle estiver ativo
    const configRes = await req.db.query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('controla_estoque', 'reservar_estoque_carrinho')"
    ).catch(() => ({ rows: [] }));

    const cfgMap = {};
    configRes.rows.forEach(r => { cfgMap[r.chave] = r.valor; });

    if (cfgMap.controla_estoque === 'true' && prod.rows[0].estoque !== null) {
      const estoqueDisponivel = prod.rows[0].estoque;

      if (cfgMap.reservar_estoque_carrinho === 'true') {
        // Conta itens j√° em todos os carrinhos para este produto
        const reservadoRes = await req.db.query(
          'SELECT COALESCE(SUM(quantidade), 0) AS total FROM carrinho_itens WHERE produto_id = $1',
          [produto_id]
        );
        const reservado = parseInt(reservadoRes.rows[0].total);
        if (reservado + qtd > estoqueDisponivel) {
          const disponivel = Math.max(0, estoqueDisponivel - reservado);
          return res.status(400).json({ erro: disponivel === 0 ? 'Produto esgotado.' : `Apenas ${disponivel} unidade(s) dispon√vel(is).` });
        }
      } else {
        if (estoqueDisponivel <= 0) {
          return res.status(400).json({ erro: 'Produto esgotado.' });
        }
        // Verifica se a quantidade solicitada ultrapassa o estoque
        const noCarrinhoRes = await req.db.query(
          'SELECT COALESCE(quantidade, 0) AS qtd FROM carrinho_itens WHERE usuario_id = $1 AND produto_id = $2',
          [usuarioId, produto_id]
        );
        const noCarrinho = parseInt(noCarrinhoRes.rows[0]?.qtd || 0);
        if (noCarrinho + qtd > estoqueDisponivel) {
          return res.status(400).json({ erro: `Apenas ${Math.max(0, estoqueDisponivel - noCarrinho)} unidade(s) dispon√vel(is).` });
        }
      }
    }

    await req.db.query(`
      INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (usuario_id, produto_id) DO UPDATE
        SET quantidade = carrinho_itens.quantidade + $3,
            updated_at = NOW()
    `, [usuarioId, produto_id, qtd, prod.rows[0].valor]);

    const contagem = await contagemItens(req.db, usuarioId);
    res.json({ sucesso: true, contagem });
  } catch (err) {
    console.error('Erro ao adicionar ao carrinho:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
};

exports.atualizarItem = async (req, res) => {
  const { id } = req.params;
  const { quantidade } = req.body;
  const qtd = parseInt(quantidade);

  try {
    if (!qtd || qtd < 1) {
      await req.db.query('DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2', [id, req.session.usuarioId]);
    } else {
      await req.db.query(
        'UPDATE carrinho_itens SET quantidade = $1, updated_at = NOW() WHERE id = $2 AND usuario_id = $3',
        [qtd, id, req.session.usuarioId]
      );
    }

    const itens = await getCarrinho(req.db, req.session.usuarioId);
    const total = itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
    res.json({ sucesso: true, contagem, total: total.toFixed(2) });
  } catch (err) {
    console.error('Erro ao atualizar carrinho:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
};

exports.removerItem = async (req, res) => {
  const { id } = req.params;
  try {
    await req.db.query('DELETE FROM carrinho_itens WHERE id = $1 AND usuario_id = $2', [id, req.session.usuarioId]);
    const itens = await getCarrinho(req.db, req.session.usuarioId);
    const total = itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
    res.json({ sucesso: true, contagem, total: total.toFixed(2) });
  } catch (err) {
    console.error('Erro ao remover item:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
};

exports.contagem = async (req, res) => {
  try {
    const c = await contagemItens(req.db, req.session.usuarioId);
    res.json({ contagem: c });
  } catch {
    res.json({ contagem: 0 });
  }
};

async function contagemItens(db, usuarioId) {
  const r = await db.query(
    'SELECT COALESCE(SUM(quantidade), 0) AS total FROM carrinho_itens WHERE usuario_id = $1',
    [usuarioId]
  );
  return parseInt(r.rows[0].total);
}
