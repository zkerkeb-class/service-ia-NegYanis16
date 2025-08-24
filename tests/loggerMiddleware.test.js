import { jest } from '@jest/globals';

// Mock logger
const mockLogger = {
  http: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('../src/config/logger.js', () => ({ default: mockLogger }));

const { loggerMiddleware } = await import('../src/middlewares/loggerMiddleware.js');

describe('LoggerMiddleware - Tests Complets', () => {
  let req, res, next;
  let originalDateNow;

  beforeAll(() => {
    originalDateNow = Date.now;
  });

  afterAll(() => {
    Date.now = originalDateNow;
  });

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1'
    };
    res = {
      statusCode: 200,
      on: jest.fn()
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  test('devrait logger une requête entrante', () => {
    loggerMiddleware(req, res, next);

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test - 127.0.0.1');
    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  test('devrait logger la réponse avec durée pour un succès (200)', () => {
    let timeCounter = 1000;
    Date.now = jest.fn(() => timeCounter++);

    loggerMiddleware(req, res, next);

    // Simuler la fin de la réponse
    const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')[1];
    finishCallback();

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test - 127.0.0.1');
    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test 200 - 1ms');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  test('devrait logger en warning pour une erreur client (400)', () => {
    let timeCounter = 1000;
    Date.now = jest.fn(() => timeCounter += 50);

    res.statusCode = 400;
    loggerMiddleware(req, res, next);

    const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')[1];
    finishCallback();

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test - 127.0.0.1');
    expect(mockLogger.warn).toHaveBeenCalledWith('GET /api/test 400 - 50ms');
    expect(mockLogger.http).toHaveBeenCalledTimes(1); // Seulement pour la requête entrante
  });

  test('devrait logger en warning pour une erreur serveur (500)', () => {
    let timeCounter = 1000;
    Date.now = jest.fn(() => timeCounter += 100);

    res.statusCode = 500;
    loggerMiddleware(req, res, next);

    const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')[1];
    finishCallback();

    expect(mockLogger.warn).toHaveBeenCalledWith('GET /api/test 500 - 100ms');
  });

  test('devrait fonctionner avec différentes méthodes HTTP', () => {
    req.method = 'POST';
    req.originalUrl = '/api/users';

    loggerMiddleware(req, res, next);

    expect(mockLogger.http).toHaveBeenCalledWith('POST /api/users - 127.0.0.1');
  });

  test('devrait fonctionner avec différentes IPs', () => {
    req.ip = '192.168.1.100';

    loggerMiddleware(req, res, next);

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test - 192.168.1.100');
  });

  test('devrait gérer les URLs complexes', () => {
    req.originalUrl = '/api/quiz/generate?level=lycée&subject=math';

    loggerMiddleware(req, res, next);

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/quiz/generate?level=lycée&subject=math - 127.0.0.1');
  });

  test('devrait calculer correctement la durée avec des temps différents', () => {
    const startTime = 1000;
    const endTime = 1250;
    Date.now = jest.fn()
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(endTime);

    loggerMiddleware(req, res, next);

    const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')[1];
    finishCallback();

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test 200 - 250ms');
  });

  test('devrait logger pour les codes de statut limites', () => {
    // Test pour 399 (succès)
    let timeCounter = 1000;
    Date.now = jest.fn(() => timeCounter++);
    res.statusCode = 399;

    loggerMiddleware(req, res, next);
    const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')[1];
    finishCallback();

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test 399 - 1ms');
    expect(mockLogger.warn).not.toHaveBeenCalled();

    jest.clearAllMocks();

    // Test pour 400 (erreur)
    res.statusCode = 400;
    loggerMiddleware(req, res, next);
    const finishCallback2 = res.on.mock.calls.find(call => call[0] === 'finish')[1];
    finishCallback2();

    expect(mockLogger.warn).toHaveBeenCalledWith('GET /api/test 400 - 1ms');
  });

  test('devrait gérer l\'absence d\'IP', () => {
    delete req.ip;

    loggerMiddleware(req, res, next);

    expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test - undefined');
  });
});
