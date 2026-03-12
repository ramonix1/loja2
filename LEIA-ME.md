# 🛒 Lojão — Guia de Instalação

## Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

## 1. Instalar dependências
```bash
npm install
```

## 2. Configurar banco de dados
Crie o banco e as tabelas:
```bash
psql -U postgres -c "CREATE DATABASE lojao;"
psql -U postgres -d lojao -f setup.sql
```

## 3. Ajustar conexão (se necessário)
Edite `config/db.js` com seu usuário/senha do PostgreSQL:
```js
connectionString: "postgresql://postgres:SUA_SENHA@localhost:5432/lojao"
```

## 4. Rodar o servidor
```bash
npm start
```

Acesse: http://localhost:3000  
Admin: http://localhost:3000/admin

---

## Correções aplicadas nesta versão

| Arquivo | Problema | Correção |
|---|---|---|
| `views/pages/index.ejs` | HTML duplicado, includes quebrados, produtos não exibidos | Reescrito corretamente |
| `views/pages/error.ejs` | Arquivo vazio | Criado página de erro |
| `views/partials/header.ejs` | Arquivo vazio | Criado header com navbar |
| `views/partials/produto-card.ejs` | Usava `produto.imagem` (não existe) | Corrigido para `produto.primeira_imagem` |
| `views/pages/admin.ejs` | JS de preview referenciava `id="imagem"` errado | Corrigido para `id="imagens"` |
| `views/pages/editar.ejs` | Input de arquivo com `name="imagem"` errado | Corrigido para `name="imagens"` |
| `controllers/produtoController.js` | Faltava buscar `primeira_imagem`; valor não era parseado do formato R$ | Corrigido com subquery e parseFloat |
| `routes/produtoRoutes.js` | Faltava rota de excluir imagem individual | Adicionada `/excluir-imagem/:id` |
| `package.json` | Sem script `start` | Adicionado `"start": "node server.js"` |
