import { bannerFieldsSchema } from '@lojao/types/banners';

export { bannerFieldsSchema };

export type {
  BannerDetail,
  BannerFieldsInput,
  BannerListItem,
  ProdutoOption,
} from '@lojao/types/banners';

/** Parseia campos multipart do formulário de banner. */
export function parseBannerFields(fields: Record<string, string>) {
  const ativoRaw = fields.ativo;
  const ativo =
    ativoRaw === 'true' || ativoRaw === 'on' || ativoRaw === '1' || ativoRaw === undefined
      ? true
      : ativoRaw === 'false' || ativoRaw === 'off' || ativoRaw === '0'
        ? false
        : true;

  return bannerFieldsSchema.safeParse({
    titulo: fields.titulo,
    subtitulo: fields.subtitulo || null,
    cta_texto: fields.cta_texto || 'Ver oferta',
    cta_url: fields.cta_url || null,
    produto_id: fields.produto_id && fields.produto_id !== '' ? fields.produto_id : null,
    ativo,
    ordem: fields.ordem ?? 0,
  });
}
