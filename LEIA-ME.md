# Lojão

Plataforma de e-commerce multi-tenant construída com Node.js, Express e PostgreSQL.

---

## Pré-requisito

Apenas **Docker** precisa estar instalado na sua máquina.

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows e macOS)
- [Docker Engine](https://docs.docker.com/engine/install/) (Linux)

Não é necessário instalar Node.js, PostgreSQL ou qualquer outra dependência localmente.

---

## Início rápido

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd loja2

# 2. Suba os serviços (na primeira vez faz o build automaticamente)
make up
```

Aguarde a mensagem `Servidor rodando na porta 3000` no terminal.

Acesse **http://localhost:3000**

---

## Credenciais padrão de desenvolvimento

| O quê | Valor |
|---|---|
| URL da aplicação | http://localhost:3000 |
| Painel admin | http://localhost:3000/admin |
| E-mail admin | `admin@loja.com` |
| Senha admin | `admin123` |
| Host do banco (externo) | `localhost:5432` |
| Usuário do banco | `postgres` |
| Senha do banco | `postgres` |
| Nome do banco | `lojao` |

> Você pode se conectar ao banco com qualquer cliente (DBeaver, Beekeeper Studio, TablePlus) usando as credenciais acima.

---

## Comandos disponíveis

Execute `make` ou `make help` para ver todos os comandos disponíveis.

| Comando | Descrição |
|---|---|
| `make up` | Sobe todos os serviços (com build) |
| `make up-d` | Sobe em background (detached) |
| `make down` | Para e remove os containers |
| `make restart` | Reinicia apenas o container da aplicação |
| `make logs` | Exibe os logs da aplicação em tempo real |
| `make logs-all` | Exibe os logs de todos os serviços |
| `make shell` | Abre terminal dentro do container da aplicação |
| `make db` | Abre o psql dentro do container do banco |
| `make install` | Reinstala dependências após alterar `package.json` |
| `make test` | Roda todos os testes |
| `make test-unit` | Roda apenas os testes unitários |
| `make test-integration` | Roda apenas os testes de integração |
| `make reset` | **Apaga tudo** (containers + banco) |

---

## Fluxo de desenvolvimento

O servidor reinicia automaticamente a cada alteração no código (nodemon).
Basta editar qualquer arquivo `.js` ou `.ejs` e a mudança é aplicada em segundos.

```bash
# Após alterar package.json (adicionar/remover dependências)
make install
make restart
```

---

## Variáveis de ambiente

As variáveis de desenvolvimento já vêm configuradas no `docker-compose.yml`.
Para personalizar (ex.: integrar pagamentos, e-mail ou SMS), edite diretamente o bloco `environment` do serviço `app` no `docker-compose.yml`.

As principais variáveis disponíveis são:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão com o PostgreSQL |
| `TENANT_SLUG` | Slug do tenant provisionado automaticamente |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | Credenciais do admin inicial |
| `SESSION_SECRET` | Segredo das sessões (troque em produção) |
| `CSRF_SECRET` | Segredo do token CSRF (troque em produção) |
| `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` | Configurações de e-mail (Nodemailer) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Configurações de SMS (Twilio) |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe |

Consulte `.env.example` para a lista completa.

---

## Resetar o ambiente

```bash
# Para tudo e apaga o banco (útil para começar do zero)
make reset

# Sobe tudo novamente com banco limpo
make up
```

---

## Estrutura dos serviços Docker

| Serviço | Imagem | Porta |
|---|---|---|
| `app` | Node 24 Alpine — Active LTS (build local) | 3000 |
| `db` | PostgreSQL 16 Alpine | 5432 |
