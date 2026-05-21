# Guia de Ativação — Plataforma White Label

> **Para o fornecedor:** este documento descreve tanto o processo interno de criação de novos clientes quanto as instruções que devem ser repassadas a cada cliente no momento da ativação.

---

## Índice

1. [Para o Fornecedor — Criando um Novo Cliente](#1-para-o-fornecedor--criando-um-novo-cliente)
2. [Para o Cliente — Primeiro Acesso](#2-para-o-cliente--primeiro-acesso)
3. [Painel Administrativo](#3-painel-administrativo)
4. [Gerenciar Administradores](#4-gerenciar-administradores)
5. [Gerenciar Produtos](#5-gerenciar-produtos)
6. [Gerenciar Banners](#6-gerenciar-banners)
7. [Gerenciar Usuários da Loja](#7-gerenciar-usuários-da-loja)
8. [Configurações Importantes de Segurança](#8-configurações-importantes-de-segurança)
9. [Referência Rápida](#9-referência-rápida)

---

## 1. Para o Fornecedor — Criando um Novo Cliente

Execute estes passos no servidor **antes** de entregar o acesso ao cliente.

### 1.1 Criar o tenant

```bash
node scripts/criarTenant.js \
  --slug=nome-do-cliente \
  --nome="Nome Comercial da Loja" \
  --admin-email=admin@emaildocliente.com \
  --admin-senha=SenhaProvisoria@1 \
  --admin-nome="Nome do Responsável"
```

**Parâmetros:**

| Parâmetro | Obrigatório | Descrição |
|---|---|---|
| `--slug` | Sim | Identificador único, sem espaços ou acentos (ex: `sapataria-mario`). Vira o subdomínio em produção. |
| `--nome` | Sim | Nome comercial exibido internamente |
| `--admin-email` | Sim | Email do primeiro administrador do cliente |
| `--admin-senha` | Sim | Senha provisória — o cliente deve trocar no primeiro acesso |
| `--admin-nome` | Não | Nome do administrador (padrão: "Administrador") |

O script cria automaticamente:
- Um banco de dados isolado (`lojao_<slug>`)
- Todas as tabelas necessárias
- O usuário administrador inicial
- O registro no banco master

### 1.2 Configurar o subdomínio (produção)

Apontar o subdomínio no DNS do cliente ou no seu painel:

```
sapataria-mario.sualoja.com.br  →  IP do servidor
```

### 1.3 Popular dados iniciais (opcional)

Se quiser adicionar produtos e parceiros de demonstração para o cliente visualizar antes de configurar:

```bash
node scripts/popularTenant.js --slug=nome-do-cliente
```

> **Atenção:** o script de seed adiciona dados fictícios. Use apenas para demonstração — o cliente pode excluir depois.

### 1.4 Repassar as credenciais ao cliente

Envie ao cliente as informações do [Checklist de Entrega](#checklist-de-entrega-ao-cliente).

---

## 2. Para o Cliente — Primeiro Acesso

### 2.1 Acessar a loja

Abra o navegador e acesse o endereço fornecido pelo seu provedor:

```
https://sualoja.sualoja.com.br
```

Você será redirecionado automaticamente para a tela de login.

### 2.2 Login inicial

Use as credenciais provisórias fornecidas pelo provedor:

- **Email:** o email de administrador cadastrado
- **Senha:** a senha provisória fornecida

> ⚠️ **Importante:** troque a senha imediatamente após o primeiro acesso.

### 2.3 Trocar a senha (obrigatório)

Na tela de login, clique em **"Esqueceu sua senha?"** e siga o fluxo de redefinição, ou acesse:

```
/recuperar-senha
```

Informe o email de administrador e siga as instruções enviadas por email.

---

## 3. Painel Administrativo

Após o login, administradores têm acesso ao painel em `/admin`.

### Visão geral do painel

| Seção | URL | O que faz |
|---|---|---|
| Dashboard | `/admin` | Resumo de produtos e banners ativos |
| Produtos | `/admin/produtos` | Cadastrar, editar e excluir produtos |
| Banners | `/admin/banners` | Gerenciar banners do carrossel da home |
| Clientes | `/admin/clientes` | Logos de parceiros exibidas na home |
| Pedidos | `/admin/pedidos` | Visualizar e atualizar status de pedidos |
| Permissões | `/admin/permissoes` | Criar e gerenciar administradores |

---

## 4. Gerenciar Administradores

### 4.1 Criar um novo administrador

1. Acesse **Painel → Permissões** (`/admin/permissoes`)
2. Preencha o formulário:
   - **Nome completo**
   - **Email** (usado para login)
   - **Senha** (mínimo 8 caracteres, deve conter letras e números)
   - **CPF** (opcional, para identificação)
3. Clique em **Criar Administrador**

> O novo administrador terá acesso completo ao painel, incluindo criação de outros admins. Crie apenas para pessoas de confiança.

### 4.2 Desativar um administrador

Na lista de administradores (`/admin/permissoes`), clique em **Desativar** ao lado do nome. O usuário perde o acesso imediatamente mas continua no sistema.

### 4.3 Excluir um administrador

Clique em **Excluir** na lista. Esta ação é irreversível.

> Você não pode desativar ou excluir sua própria conta de administrador.

---

## 5. Gerenciar Produtos

### 5.1 Cadastrar um produto

1. Acesse **Painel → Produtos → Novo Produto**
2. Preencha os campos:
   - **Nome** — nome principal exibido na vitrine
   - **Subtítulo** — descrição curta (aparece abaixo do nome)
   - **Valor** — preço em reais (ex: `49,90`)
   - **Descrição** — texto longo, aceita detalhes técnicos
   - **Imagens** — até várias fotos; a primeira vira a imagem principal
3. Clique em **Salvar**

### 5.2 Editar um produto

Na lista de produtos (`/admin/produtos`), clique em **Editar**. Você pode:
- Alterar nome, preço, descrição
- Adicionar novas imagens
- Excluir imagens individualmente

### 5.3 Excluir um produto

Clique em **Excluir** na lista. As imagens físicas do servidor também são removidas automaticamente.

> Produtos que estiverem em pedidos existentes não têm os registros de pedido afetados — apenas o produto em si é removido da vitrine.

---

## 6. Gerenciar Banners

Os banners formam o carrossel exibido no topo da página inicial.

### 6.1 Criar um banner

1. Acesse **Painel → Banners → Novo Banner**
2. Preencha:
   - **Título** — texto grande exibido sobre a imagem
   - **Subtítulo** — texto secundário (opcional)
   - **Imagem** — foto do banner (recomendado: 1600×600px, formato JPG ou PNG)
   - **Texto do botão** — padrão: "Ver oferta"
   - **Link do botão** — URL de destino ao clicar (pode apontar para um produto)
   - **Produto vinculado** — se selecionado, o botão leva direto ao produto
   - **Ordem** — número que define a posição no carrossel (menor = primeiro)
   - **Ativo** — desmarcado = banner oculto da vitrine

### 6.2 Ativar / desativar banner

Na lista de banners, clique no botão de toggle ao lado do banner para ativá-lo ou desativá-lo sem excluir.

---

## 7. Gerenciar Usuários da Loja

### 7.1 Como clientes criam suas próprias contas

Clientes da loja se cadastram pela página pública:

```
/cadastro
```

Eles preenchem nome, email, senha e endereço. Após o cadastro, recebem um email de boas-vindas e já podem fazer compras.

### 7.2 O que administradores **não** conseguem fazer atualmente

- Ver a lista de usuários comuns da loja
- Redefinir a senha de um cliente manualmente
- Excluir uma conta de cliente

> Estas funcionalidades podem ser implementadas em versões futuras conforme a necessidade.

### 7.3 Fluxo de compra do cliente

1. Cliente acessa a loja e cria uma conta (ou faz login)
2. Navega pelos produtos e adiciona ao carrinho
3. Acessa o carrinho e vai para o checkout
4. Preenche os dados de entrega e escolhe o método de pagamento
5. Recebe a confirmação e pode acompanhar em **Meus Pedidos**

---

## 8. Configurações Importantes de Segurança

### 8.1 Política de senhas

Todas as senhas do sistema exigem:
- Mínimo de **8 caracteres**
- Recomendado: letras maiúsculas, minúsculas, números e símbolos

### 8.2 Bloqueio por tentativas

Após **5 tentativas de login incorretas** consecutivas, o IP é bloqueado por **15 minutos**. Isso protege contra ataques de força bruta.

Se um administrador for bloqueado acidentalmente, aguarde 15 minutos ou entre em contato com o provedor para desbloqueio.

### 8.3 Sessão automática

A sessão expira automaticamente após **8 horas** de inatividade. Após esse período, o sistema solicita um novo login.

### 8.4 Troca periódica de senhas

Recomendamos trocar as senhas de administrador a cada **90 dias**. Use senhas únicas — nunca reutilize senhas de outros sistemas.

### 8.5 Isolamento de dados

Cada loja opera em um **banco de dados exclusivo e isolado**. Nenhum dado do seu negócio é compartilhado com outros clientes da plataforma.

---

## 9. Referência Rápida

### URLs importantes

| Função | URL |
|---|---|
| Loja (vitrine) | `/` |
| Login | `/login` |
| Cadastro de cliente | `/cadastro` |
| Recuperar senha | `/recuperar-senha` |
| Carrinho | `/carrinho` |
| Checkout | `/checkout` |
| Meus pedidos | `/meus-pedidos` |
| Painel admin | `/admin` |
| Produtos (admin) | `/admin/produtos` |
| Banners (admin) | `/admin/banners` |
| Clientes/parceiros (admin) | `/admin/clientes` |
| Pedidos (admin) | `/admin/pedidos` |
| Permissões (admin) | `/admin/permissoes` |

---

## Checklist de Entrega ao Cliente

Use este checklist ao entregar o acesso a um novo cliente:

- [ ] Tenant criado com `node scripts/criarTenant.js`
- [ ] Subdomínio configurado e apontando para o servidor
- [ ] Credenciais iniciais enviadas por canal seguro (não por email em texto claro)
- [ ] Cliente informado para **trocar a senha no primeiro acesso**
- [ ] Cliente informado sobre a URL da loja e do painel
- [ ] Cliente recebeu cópia deste guia (seções 2 a 8)

---

## Checklist do Cliente (Primeiros Passos)

Recomende ao cliente executar estes passos na primeira semana:

- [ ] Fazer login e trocar a senha provisória
- [ ] Criar um segundo administrador de confiança (para recuperação de acesso)
- [ ] Cadastrar os primeiros produtos com fotos
- [ ] Configurar pelo menos um banner na home
- [ ] Realizar um pedido de teste com um usuário comum para validar o fluxo de compra
- [ ] Configurar as credenciais de pagamento (Mercado Pago / SumUp) junto ao provedor

---

*Dúvidas ou problemas? Entre em contato com seu provedor da plataforma.*
