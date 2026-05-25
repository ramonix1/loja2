# 🧪 Guia de Testes Automatizados — Loja 3

**Versão**: 1.0  
**Atualizado**: 2026-05-24

---

## 📚 Índice

1. [Setup Inicial](#setup-inicial)
2. [Rodando Testes](#rodando-testes)
3. [Estrutura de Testes](#estrutura-de-testes)
4. [Exemplo: Criar Novo Teste](#exemplo-criar-novo-teste)
5. [Coverage](#coverage)
6. [Boas Práticas](#boas-práticas)
7. [CI/CD Integration](#cicd-integration)

---

## Setup Inicial

### 1. Instalar Dependências

```bash
npm install --save-dev jest supertest
```

**O que foi adicionado ao package.json:**
- `jest` — Framework de testes (assertions, mocks, coverage)
- `supertest` — Biblioteca para testar APIs HTTP

### 2. Configuração do Jest

Arquivo criado: `jest.config.js`

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['controllers/**/*.js', 'middlewares/**/*.js', ...],
  coverageThreshold: {
    global: { lines: 50, ... }
  }
}
```

### 3. Arquivo .env.test

Criar `.env.test` para testes (opcional):

```bash
NODE_ENV=test
DATABASE_URL=postgres://user:pass@localhost/loja_test
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## Rodando Testes

### Todos os Testes com Coverage

```bash
npm test
```

Gera relatório em `coverage/lcov-report/index.html`

### Testes em Watch Mode (desenvolvimento)

```bash
npm run test:watch
```

Reexecuta testes automaticamente quando arquivos mudam.

### Apenas Testes Unitários

```bash
npm run test:unit
```

### Apenas Testes de Integração

```bash
npm run test:integration
```

### Teste Específico

```bash
npm test -- validation.test.js
```

### Com Padrão de Arquivo

```bash
npm test -- --testPathPattern=checkout
```

---

## Estrutura de Testes

```
tests/
├── setup.js                    # Setup global
├── unit/
│   ├── validation.test.js      # ✅ Testes de validação
│   ├── rateLimiter.test.js     # ✅ Testes de rate limiting
│   └── relatorio.test.js       # ✅ Testes de SQL injection
├── integration/
│   └── checkout.test.js        # ✅ Testes de fluxo
└── fixtures/
    └── mockData.js             # (Criar depois) Dados de teste
```

### Testes Implementados

| Arquivo | Cobertura | Status |
|---------|-----------|--------|
| `validation.test.js` | Email, CEP, CPF, sanitização, checkout | ✅ 15+ testes |
| `rateLimiter.test.js` | Configuração, proteção, estratégia | ✅ 11+ testes |
| `relatorio.test.js` | SQL injection, constants, parsing | ✅ 8+ testes |
| `checkout.test.js` | Validação, pagamentos, valores | ✅ 16+ testes |

**Total: 50+ testes prontos para rodar**

---

## Exemplo: Criar Novo Teste

### Passo 1: Criar Arquivo

```bash
touch tests/unit/meuModulo.test.js
```

### Passo 2: Escrever Teste

```javascript
const { minhaFuncao } = require('../../middlewares/meuModulo');

describe('Meu Módulo', () => {
  test('deve fazer algo', () => {
    const resultado = minhaFuncao('input');
    expect(resultado).toBe('expected');
  });

  test('deve rejeitar input inválido', () => {
    expect(() => minhaFuncao(null)).toThrow();
  });
});
```

### Passo 3: Rodar

```bash
npm test -- meuModulo.test.js
```

---

## Coverage

### Visualizar Cobertura

```bash
npm test
# Abre: coverage/lcov-report/index.html
```

### Aumentar Threshold

Em `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 75,      // ← Aumentar
    functions: 80,
    lines: 85,
    statements: 85,
  }
}
```

### Cobertura Esperada Atual

- **Validation**: ~95% (muito bem isolado)
- **RateLimiter**: ~85% (config simples)
- **RelatorioController**: ~60% (precisa DB mock)
- **CheckoutController**: ~50% (precisa Stripe mock)

---

## Boas Práticas

### ✅ DOs

```javascript
// ✅ BOM: Arrange-Act-Assert
test('calcula total com frete', () => {
  // Arrange
  const subtotal = 100;
  const frete = 15;

  // Act
  const total = subtotal + frete;

  // Assert
  expect(total).toBe(115);
});

// ✅ BOM: Um conceito por teste
test('rejeita email sem @', () => {
  expect(validateEmail('invalid')).toBe(false);
});

// ✅ BOM: Nomes descritivos
test('deve rejeitar CEP com menos de 8 dígitos', () => {
  expect(validateCEP('123')).toBe(false);
});

// ✅ BOM: Mock de dependências externas
jest.mock('../services/stripeService');

// ✅ BOM: beforeEach para setup
beforeEach(() => {
  mockData = { id: 1, nome: 'Test' };
});
```

### ❌ DON'Ts

```javascript
// ❌ RUIM: Múltiplos conceitos em um teste
test('checkout completo', () => {
  // Validação
  // Pagamento
  // Email
  // Tudo junto
});

// ❌ RUIM: Sem assertions
test('o sistema funciona', () => {
  const result = doSomething();
  // Nada testado!
});

// ❌ RUIM: Dependência de testes anteriores
let usuarioId;
test('criar usuário', () => {
  usuarioId = criarUsuario(); // 🔴 Estado compartilhado
});
test('usar usuário', () => {
  expect(usuarioId).toBeDefined(); // 🔴 Depende do teste anterior
});

// ❌ RUIM: Timeouts muito longos
jest.setTimeout(30000); // Usar como último recurso
```

---

## Mock de Banco de Dados

Para testes que precisam de banco, use este padrão:

```javascript
describe('Checkout com DB Mock', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
  });

  test('insere pedido no banco', async () => {
    await processarCheckout(mockDb);
    expect(mockDb.query).toHaveBeenCalled();
  });
});
```

---

## CI/CD Integration

### GitHub Actions Exemplo

Criar `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm install
      - run: npm test
      - run: npm run test:integration
```

### Comando de CI

```bash
npm test -- --coverage --watchAll=false
```

---

## Próximos Passos

### Phase 1: Testes Unitários ✅ (Implementado)
- [x] Validação
- [x] Rate limiting
- [x] Constants

### Phase 2: Testes de Integração (Próximo)
- [ ] Mock de banco de dados
- [ ] Mock de Stripe
- [ ] Fluxo completo de checkout

### Phase 3: Testes E2E (Futuro)
- [ ] Selenium ou Cypress
- [ ] Testes em navegador real
- [ ] Visual regression tests

### Phase 4: Performance
- [ ] Testes de carga (k6)
- [ ] Benchmarks

---

## Troubleshooting

### Jest não encontra módulos

```bash
# Limpar cache
npm test -- --clearCache

# Usar caminho absoluto
NODE_PATH=./ npm test
```

### Teste trava

```bash
# Aumentar timeout
jest.setTimeout(20000);

# Fechar handles abertos
afterAll(() => db.end());
```

### Coverage baixa de repente

```bash
# Verificar se testes rodaram
npm test -- --verbose

# Conferir se collectCoverageFrom está correto
```

---

## Referências

- [Jest Docs](https://jestjs.io/)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Comando Rápido:**

```bash
# Instalar dependências
npm install

# Rodar testes
npm test

# Ver cobertura
open coverage/lcov-report/index.html
```

🚀 **Próximo passo:** `npm install && npm test`
