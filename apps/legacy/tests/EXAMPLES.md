# 📖 Exemplos Práticos de Testes

Guia passo-a-passo para escrever testes para diferentes tipos de módulos.

---

## 1️⃣ Testes de Funções Puras

**Função a testar:** `middlewares/validation.js`

```javascript
// ✅ BOM: Função pura (sem side effects)
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Teste simples
test('aceita email válido', () => {
  expect(validateEmail('user@example.com')).toBe(true);
});
```

**Por que é fácil testar:**
- Entrada clara → Saída previsível
- Sem chamadas de banco
- Sem HTTP

---

## 2️⃣ Testes de Funções com Dependências

**Função a testar:** `controllers/produtoController.js#atualizarEstoque`

```javascript
// ❌ ANTES: Difícil de testar (acoplado ao banco)
exports.atualizarEstoque = async (req, res) => {
  const estoqueNovo = parseInt(req.body.estoque);
  await req.db.query('UPDATE produtos SET estoque = $1 ...', [estoqueNovo]);
  res.redirect('/admin/produtos');
};

// ✅ DEPOIS: Extrair lógica (fácil de testar)
function calcularDifEstoque(estoqueAnterior, estoqueNovo) {
  return {
    diff: estoqueNovo - estoqueAnterior,
    tipo: estoqueNovo > estoqueAnterior ? 'entrada' : 'saida',
  };
}

// Agora é testável:
test('calcula diferença de estoque', () => {
  const result = calcularDifEstoque(10, 15);
  expect(result.diff).toBe(5);
  expect(result.tipo).toBe('entrada');
});
```

---

## 3️⃣ Testes com Mocks de Banco

```javascript
const { calcularDifEstoque } = require('../../controllers/produtoController');

describe('Estoque Controller', () => {
  let mockDb;

  beforeEach(() => {
    // Mock do banco
    mockDb = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
  });

  test('registra movimentação ao atualizar estoque', async () => {
    // Arrange
    const produtoId = 1;
    const estoqueNovo = 15;

    // Act
    await atualizarEstoque(mockDb, produtoId, estoqueNovo);

    // Assert
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE produtos'),
      expect.any(Array)
    );
  });

  test('não registra movimentação se update falhar', async () => {
    // Setup error
    mockDb.query.mockRejectedValueOnce(new Error('DB Error'));

    // Deve lançar erro
    await expect(atualizarEstoque(mockDb, 1, 10))
      .rejects
      .toThrow('DB Error');
  });
});
```

---

## 4️⃣ Testes de API com Supertest

```javascript
const request = require('supertest');
const app = require('../../server');

describe('POST /carrinho/adicionar', () => {
  test('adiciona item ao carrinho com sucesso', async () => {
    const response = await request(app)
      .post('/carrinho/adicionar')
      .set('Cookie', 'lojao.sid=test-session')
      .send({
        produto_id: 1,
        quantidade: 2,
      })
      .expect(200);

    expect(response.body).toHaveProperty('total');
  });

  test('rejeita request sem autenticação', async () => {
    const response = await request(app)
      .post('/carrinho/adicionar')
      .send({ produto_id: 1, quantidade: 2 })
      .expect(401); // Unauthorized
  });

  test('respeita rate limit', async () => {
    // Fazer 11 requests em 1 minuto
    for (let i = 0; i < 11; i++) {
      const response = await request(app)
        .post('/carrinho/adicionar')
        .set('Cookie', 'lojao.sid=test-session')
        .send({ produto_id: 1, quantidade: 1 });

      if (i === 10) {
        expect(response.status).toBe(429); // Too Many Requests
      }
    }
  });
});
```

---

## 5️⃣ Testes Parametrizados (test.each)

```javascript
describe('Validação de CEP', () => {
  test.each([
    ['01310-100', true],
    ['12345-678', true],
    ['12345678', true],
    ['123', false],
    ['', false],
    ['abcde-fgh', false],
  ])('validateCEP("%s") -> %s', (cep, expected) => {
    expect(validateCEP(cep)).toBe(expected);
  });
});

// Resultado: 6 testes em 5 linhas!
```

---

## 6️⃣ Testes de Segurança

```javascript
describe('SQL Injection Prevention', () => {
  const ataques = [
    "' OR '1'='1",
    "'; DROP TABLE produtos; --",
    "UNION SELECT * FROM usuarios",
  ];

  test.each(ataques)('bloqueia injection: %s', (ataque) => {
    expect(() => {
      buildWhereClause(ataque); // Deve falhar ou sanitizar
    }).toThrow();
  });
});

describe('XSS Prevention', () => {
  test('sanitiza tags HTML', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeString(input);
    expect(output).not.toContain('<script>');
  });
});
```

---

## 7️⃣ Testes com Setup/Teardown

```javascript
describe('Checkout Flow', () => {
  let usuario, carrinho, pedido;

  beforeAll(async () => {
    // Setup executado UMA VEZ antes de todos os testes
    usuario = await criarUsuarioTeste();
  });

  beforeEach(async () => {
    // Setup executado ANTES DE CADA TESTE
    carrinho = await criarCarrinhoVazio(usuario.id);
  });

  afterEach(async () => {
    // Cleanup DEPOIS DE CADA TESTE
    await limparCarrinho(carrinho.id);
  });

  afterAll(async () => {
    // Cleanup UMA VEZ depois de todos os testes
    await deletarUsuarioTeste(usuario.id);
  });

  test('checkout com 1 item', async () => {
    // ... teste
  });

  test('checkout com múltiplos itens', async () => {
    // ... teste
  });
});
```

---

## 8️⃣ Testes de Tratamento de Erros

```javascript
describe('Error Handling', () => {
  test('registra erro em vez de ignorar', async () => {
    const consoleSpy = jest.spyOn(console, 'error');

    // Trigger error
    await processarPedidoComErro();

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Erro');

    consoleSpy.mockRestore();
  });

  test('não deixa transação pendente em erro', async () => {
    const mockDb = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Insert failed')) // INSERT
        .mockResolvedValueOnce({ rows: [] }), // ROLLBACK
    };

    await processarCheckout(mockDb);

    expect(mockDb.query).toHaveBeenCalledWith('ROLLBACK');
  });
});
```

---

## 9️⃣ Testes de Performance

```javascript
describe('Performance', () => {
  test('validação é rápida', () => {
    const start = Date.now();

    for (let i = 0; i < 10000; i++) {
      validateEmail(`user${i}@example.com`);
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // < 100ms para 10k validações
  });

  test('cálculo de total é exato', () => {
    // Evitar erros de ponto flutuante
    const subtotal = 99.99;
    const frete = 15.50;
    const total = Math.round((subtotal + frete) * 100) / 100;

    expect(total).toBe(115.49);
  });
});
```

---

## 🔟 Cobertura de Teste

```bash
# Gerar relatório de cobertura
npm test -- --coverage

# Ver apenas arquivo específico
npm test -- --coverage --testPathPattern=validation

# Coverage por linha
npm test -- --collectCoverageFrom='controllers/**/*.js'
```

**Interpretando o relatório:**

```
------------|---------|---------|---------|---------|
File        | Stmts   | Branch  | Funcs   | Lines   |
------------|---------|---------|---------|---------|
validation  | 95%     | 92%     | 100%    | 95%     |
------------|---------|---------|---------|---------|
```

- **Stmts** (Statements): % de linhas executadas
- **Branch**: % de condições testadas (if/else)
- **Funcs**: % de funções chamadas
- **Lines**: % de linhas de código

**Meta realista:** 80%+ para código crítico

---

## 📊 Checklist para Novo Teste

- [ ] Teste tem nome descritivo?
- [ ] Testa UM comportamento?
- [ ] Não depende de outro teste?
- [ ] Tem Arrange-Act-Assert claro?
- [ ] Mock de dependências externas?
- [ ] Cleanup no afterEach()?
- [ ] Testa caso de sucesso E erro?
- [ ] Coverage aumentou?

---

## 🚀 Próximos Testes a Escrever

### Prioridade Alta

1. **checkoutController.processarCheckout**
   - Validação de dados
   - Transação com rollback
   - Notificações de email

2. **relatorioController**
   - Filtros SQL injetados
   - Formatting de datas
   - CSV export

3. **produtoController.atualizarEstoque**
   - Registra movimentação
   - Valida estoque mínimo
   - Tratamento de erro

### Prioridade Média

- Auth controller (login, logout)
- Carrinho (adicionar, remover, atualizar)
- Categorias (CRUD)

### Prioridade Baixa

- Banners
- Agenda
- Aparência

---

**Comando para começar:**

```bash
npm test -- --watch
```

Aí escrever testes enquanto o Watch mode reexecuta automaticamente! 🎯
