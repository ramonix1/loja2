import type {
  PublicBanner,
  PublicCategory,
  PublicProduct,
  PublicProductDetail,
  PublicStoreData,
} from '@lojao/types/public-store';
import { DEFAULT_LOJA_COR_PRIMARIA } from '@lojao/types/aparencia';
import { parseStoreTheme } from '@lojao/types/store-theme';
import type { TenantDatabase } from '@lojao/db';
import { asc, desc, eq, produtos, produtosImagens, sql } from '@lojao/db';
import type pg from 'pg';

function toNum(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}

function mapProduct(row: Record<string, unknown>): PublicProduct {
  return {
    id: Number(row.id),
    nome: String(row.nome),
    subtitulo: row.subtitulo == null ? null : String(row.subtitulo),
    valor: toNum(row.valor as string | number | null | undefined),
    estoque: row.estoque == null ? null : Number(row.estoque),
    categoria_id: row.categoria_id == null ? null : Number(row.categoria_id),
    primeira_imagem: row.primeira_imagem == null ? null : String(row.primeira_imagem),
  };
}

/** Configs `loja_*` + controla_estoque — espelha legacy `getConfigs`. */
async function getStoreConfigs(db: pg.Pool): Promise<{
  loja: PublicStoreData['loja'];
  controla_estoque: boolean;
}> {
  const result = await db.query(
    "SELECT chave, valor FROM configuracoes WHERE chave LIKE 'loja_%' OR chave = 'controla_estoque'",
  );

  const cfg: Record<string, string> = {};
  for (const row of result.rows as { chave: string; valor: string | null }[]) {
    cfg[row.chave] = row.valor ?? '';
  }

  return {
    loja: {
      nome: cfg.loja_nome || 'Ata Commerce Demo',
      cor_primaria: cfg.loja_cor_primaria || DEFAULT_LOJA_COR_PRIMARIA,
      tema: parseStoreTheme(cfg.loja_tema),
      logo: cfg.loja_logo ?? '',
      slogan: cfg.loja_slogan ?? '',
      favicon: cfg.loja_favicon || undefined,
    },
    controla_estoque: cfg.controla_estoque === 'true',
  };
}

const PRODUCT_FIELDS = `
  p.id, p.nome, p.subtitulo, p.valor, p.estoque, p.categoria_id,
  (SELECT pi.url FROM produtos_imagens pi WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
`;

/**
 * Agregações públicas da vitrine — SQL alinhado a `produtoController.home` / `detail`.
 * Compartilhado entre GET /public/store, /categories, /products.
 */
export async function getPublicCategoriesWithProducts(db: pg.Pool): Promise<PublicCategory[]> {
  const res = await db
    .query(
      `
      SELECT c.id AS cat_id, c.nome AS cat_nome, c.ordem AS cat_ordem,
             ${PRODUCT_FIELDS}
      FROM categorias c
      JOIN produtos p ON p.categoria_id = c.id
      WHERE c.ativo = true
      ORDER BY c.ordem ASC, c.nome ASC, p.created_at DESC
    `,
    )
    .catch(() => ({ rows: [] }));

  const categoriaMap = new Map<number, PublicCategory>();
  for (const row of res.rows as Record<string, unknown>[]) {
    const catId = Number(row.cat_id);
    if (!categoriaMap.has(catId)) {
      categoriaMap.set(catId, {
        id: catId,
        nome: String(row.cat_nome),
        ordem: Number(row.cat_ordem ?? 0),
        produtos: [],
      });
    }
    categoriaMap.get(catId)!.produtos.push(mapProduct(row));
  }

  return [...categoriaMap.values()];
}

export async function getPublicProductsWithoutCategory(db: pg.Pool): Promise<PublicProduct[]> {
  const res = await db.query(`
    SELECT ${PRODUCT_FIELDS}
    FROM produtos p
    WHERE p.categoria_id IS NULL
    ORDER BY p.created_at DESC
  `);

  return res.rows.map((row) => mapProduct(row as Record<string, unknown>));
}

export async function listPublicProducts(db: TenantDatabase): Promise<PublicProduct[]> {
  const rows = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      subtitulo: produtos.subtitulo,
      valor: produtos.valor,
      estoque: produtos.estoque,
      categoriaId: produtos.categoriaId,
      primeiraImagem: sql<string | null>`(
        SELECT pi.url FROM produtos_imagens pi
        WHERE pi.produto_id = ${produtos.id}
        ORDER BY pi.id ASC LIMIT 1
      )`.as('primeira_imagem'),
    })
    .from(produtos)
    .orderBy(desc(produtos.createdAt));

  return rows.map((row) =>
    mapProduct({
      id: row.id,
      nome: row.nome,
      subtitulo: row.subtitulo,
      valor: row.valor,
      estoque: row.estoque,
      categoria_id: row.categoriaId,
      primeira_imagem: row.primeiraImagem,
    }),
  );
}

export async function getPublicStore(db: pg.Pool): Promise<PublicStoreData> {
  const [configs, categorias, produtos_sem_categoria] = await Promise.all([
    getStoreConfigs(db),
    getPublicCategoriesWithProducts(db),
    getPublicProductsWithoutCategory(db),
  ]);

  return {
    ...configs,
    categorias,
    produtos_sem_categoria,
  };
}

export async function getPublicProductById(
  db: TenantDatabase,
  id: number,
): Promise<PublicProductDetail | null> {
  const [row] = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  if (!row) return null;

  const imagens = await db
    .select({ id: produtosImagens.id, url: produtosImagens.url })
    .from(produtosImagens)
    .where(eq(produtosImagens.produtoId, id))
    .orderBy(asc(produtosImagens.id));

  const primeira = imagens[0]?.url ?? null;

  return {
    id: row.id,
    nome: row.nome,
    subtitulo: row.subtitulo,
    valor: toNum(row.valor),
    estoque: row.estoque,
    categoria_id: row.categoriaId,
    primeira_imagem: primeira,
    descricao: row.descricao,
    imagens: imagens.map((img) => ({ id: img.id, url: img.url })),
  };
}

export async function listPublicBanners(db: pg.Pool): Promise<PublicBanner[]> {
  const res = await db
    .query(
      `SELECT b.id, b.titulo, b.subtitulo, b.imagem, b.cta_texto, b.cta_url, b.produto_id
       FROM banners b
       WHERE b.ativo = true
       ORDER BY b.ordem ASC, b.created_at ASC`,
    )
    .catch(() => ({ rows: [] }));

  return res.rows.map((r) => ({
    id: Number(r.id),
    titulo: String(r.titulo),
    subtitulo: r.subtitulo == null ? null : String(r.subtitulo),
    imagem: String(r.imagem),
    cta_texto: String(r.cta_texto ?? 'Ver oferta'),
    cta_url: r.cta_url == null ? null : String(r.cta_url),
    produto_id: r.produto_id == null ? null : Number(r.produto_id),
  }));
}
