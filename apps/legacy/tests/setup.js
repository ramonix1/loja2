// Setup global para todos os testes
require('dotenv').config({ path: '.env.test' });

// Mock de console para não poluir output durante testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
