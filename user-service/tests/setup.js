// Configuration globale pour les tests
process.env.NODE_ENV = 'test';

// Désactiver les logs console pendant les tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configuration globale des timeouts
jest.setTimeout(30000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
