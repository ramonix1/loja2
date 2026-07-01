import type { ProdutoDetail, ProdutoFieldsInput, ProdutoListItem } from '@lojao/types/produtos';
import type pg from 'pg';

function mapListRow(row: {
  id: number;
  nome: string;
  subtitulo: string | null;
  valor: string | number;
  descricao: string | null;
  estoque: number | null;
  categoria_id: number | null;
  primeira_imagem: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}): ProdutoListItem {
  return {
    id: row.id,
    nome: row.nome,
    subtitulo: row.subtitulo,
    valor: Number(row.valor),
    descricao: row.descricao,
    estoque: row.estoque,
    categoria_id: row.categoria_id,
    primeira_imagem: row.primeira_imagem,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function findAllProdutos(db: pg.Pool): Promise<ProdutoListItem[]> {
  const r = await db.query(`
    SELECT p.*,
      (SELECT pi.url FROM produtos_imagens pi
       WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
    FROM produtos p
    ORDER BY p.created_at DESC
  `);
  return r.rows.map(mapListRow);
}

export async function findProdutoById(db: pg.Pool, id: number): Promise<ProdutoDetail | null> {
  const produtoRes = await db.query('SELECT * FROM produtos WHERE id = $1', [id]);
  if (!produtoRes.rows[0]) return null;

  const imagensRes = await db.query(
    'SELECT id, url FROM produtos_imagens WHERE produto_id = $1 ORDER BY id ASC',
    [id],
  );

  const row = produtoRes.rows[0];
  return {
    ...mapListRow({ ...row, primeira_imagem: imagensRes.rows[0]?.url ?? null }),
    imagens: imagensRes.rows,
  };
}

export async function insertProduto(db: pg.Pool, input: ProdutoFieldsInput): Promise<number> {
  const ins = await db.query(
    `INSERT INTO produtos (nome, subtitulo, valor, descricao, estoque, categoria_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      input.nome,
      input.subtitulo ?? null,
      input.valor,
      input.descricao ?? null,
      input.estoque ?? null,
      input.categoria_id ?? null,
    ],
  );
  return ins.rows[0].id as number;
}

export async function insertProdutoImagem(
  db: pg.Pool,
  produtoId: number,
  url: string,
): Promise<void> {
  await db.query('INSERT INTO produtos_imagens (produto_id, url) VALUES ($1, $2)', [produtoId, url]);
}

export async function updateProdutoRecord(
  db: pg.Pool,
  id: number,
  input: ProdutoFieldsInput,
): Promise<boolean> {
  const upd = await db.query(
    `UPDATE produtos
     SET nome=$1, subtitulo=$2, valor=$3, descricao=$4, estoque=$5, categoria_id=$6, updated_at=NOW()
     WHERE id=$7`,
    [
      input.nome,
      input.subtitulo ?? null,
      input.valor,
      input.descricao ?? null,
      input.estoque ?? null,
      input.categoria_id ?? null,
      id,
    ],
  );
  return (upd.rowCount ?? 0) > 0;
}

export async function findProdutoImagemUrls(db: pg.Pool, produtoId: number): Promise<string[]> {
  const imagens = await db.query('SELECT url FROM produtos_imagens WHERE produto_id = $1', [produtoId]);
  return (imagens.rows as { url: string }[]).map((img) => img.url);
}

export async function deleteProdutoRecord(db: pg.Pool, id: number): Promise<boolean> {
  const del = await db.query('DELETE FROM produtos WHERE id = $1', [id]);
  return (del.rowCount ?? 0) > 0;
}

export async function findProdutoImagemUrlById(
  db: pg.Pool,
  imagemId: number,
): Promise<string | null> {
  const img = await db.query('SELECT url FROM produtos_imagens WHERE id = $1', [imagemId]);
  return (img.rows[0]?.url as string | undefined) ?? null;
}

export async function deleteProdutoImagemRecord(db: pg.Pool, imagemId: number): Promise<void> {
  await db.query('DELETE FROM produtos_imagens WHERE id = $1', [imagemId]);
}

export async function findProdutoEstoque(
  db: pg.Pool,
  id: number,
): Promise<number | null | undefined> {
  const anteriorRes = await db.query('SELECT estoque FROM produtos WHERE id = $1', [id]);
  if (!anteriorRes.rows[0]) return undefined;
  return anteriorRes.rows[0].estoque as number | null;
}

export async function updateProdutoEstoqueRecord(
  db: pg.Pool,
  id: number,
  estoque: number | null,
): Promise<void> {
  await db.query('UPDATE produtos SET estoque = $1, updated_at = NOW() WHERE id = $2', [estoque, id]);
}

export async function insertMovimentacaoEstoque(
  db: pg.Pool,
  produtoId: number,
  tipo: string,
  quantidade: number,
  observacao: string,
): Promise<void> {
  await db.query(
    'INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, origem, observacao) VALUES ($1,$2,$3,$4,$5)',
    [produtoId, tipo, quantidade, 'admin_ajuste', observacao],
  );
}
