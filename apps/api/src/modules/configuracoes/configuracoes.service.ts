import type { ConfiguracoesConfig, UpdateConfiguracoesInput } from '@lojao/types/configuracoes';

import type { StoreScope } from '../../lib/store-scope.js';
import {
  findConfiguracoes,
  formatCep,
  upsertConfiguracoes,
} from './configuracoes.repository.js';

export async function getConfiguracoes(scope: StoreScope): Promise<ConfiguracoesConfig> {
  return findConfiguracoes(scope);
}

export async function updateConfiguracoes(
  scope: StoreScope,
  input: UpdateConfiguracoesInput,
): Promise<ConfiguracoesConfig> {
  const pares: [string, string][] = [
    ['controla_estoque', input.controla_estoque ? 'true' : 'false'],
    ['reservar_estoque_carrinho', input.reservar_estoque_carrinho ? 'true' : 'false'],
    ['modulo_agenda', input.modulo_agenda ? 'true' : 'false'],
    ['habilitar_sumup', input.habilitar_sumup ? 'true' : 'false'],
    ['frete_cep_origem', formatCep(input.frete_cep_origem ?? '')],
    ['frete_fixo', String(input.frete_fixo ?? 0)],
    ['frete_gratis_acima', String(input.frete_gratis_acima ?? 0)],
    ['melhor_envio_token', (input.melhor_envio_token ?? '').trim()],
    ['melhor_envio_sandbox', input.melhor_envio_sandbox ? 'true' : 'false'],
    ['frete_peso_padrao', String(input.frete_peso_padrao ?? 300)],
    ['frete_altura', String(input.frete_altura ?? 4)],
    ['frete_largura', String(input.frete_largura ?? 12)],
    ['frete_comprimento', String(input.frete_comprimento ?? 17)],
  ];

  await upsertConfiguracoes(scope, pares);
  return findConfiguracoes(scope);
}
