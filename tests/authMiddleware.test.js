import { jest } from '@jest/globals';

// Mock jsonwebtoken
const mockJwt = {
  verify: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));

const { authMiddleware } = await import('../src/middlewares/authMiddleware.js');

describe('AuthMiddleware - Tests Complets', () => {
  let req, res, next;
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.JWT_SECRET;
  });

  afterAll(() => {
    if (originalEnv) {
      process.env.JWT_SECRET = originalEnv;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('devrait authentifier un token valide', () => {
    const mockUser = { userId: 'user123', email: 'test@test.com' };
    req.headers.authorization = 'Bearer valid-token';
    mockJwt.verify.mockReturnValue(mockUser);

    authMiddleware(req, res, next);

    expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('devrait utiliser la valeur par défaut si JWT_SECRET manque', () => {
    delete process.env.JWT_SECRET;
    const mockUser = { userId: 'user123' };
    req.headers.authorization = 'Bearer valid-token';
    mockJwt.verify.mockReturnValue(mockUser);

    authMiddleware(req, res, next);

    expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'votre_secret_jwt');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  test('devrait rejeter une requête sans header authorization', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token d\'authentification manquant.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait rejeter un header authorization vide', () => {
    req.headers.authorization = '';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token d\'authentification manquant.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait rejeter un token avec format invalide mais token présent', () => {
    req.headers.authorization = 'InvalidFormat token123';
    const jwtError = new Error('Invalid token');
    jwtError.name = 'JsonWebTokenError';
    mockJwt.verify.mockImplementation(() => {
      throw jwtError;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait rejeter un format Bearer sans token', () => {
    req.headers.authorization = 'Bearer';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Format de token invalide.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait rejeter un format Bearer avec token vide', () => {
    req.headers.authorization = 'Bearer ';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Format de token invalide.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait gérer un token expiré', () => {
    req.headers.authorization = 'Bearer expired-token';
    const expiredError = new Error('Token expired');
    expiredError.name = 'TokenExpiredError';
    mockJwt.verify.mockImplementation(() => {
      throw expiredError;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expiré.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait gérer un token malformé', () => {
    req.headers.authorization = 'Bearer malformed-token';
    const jwtError = new Error('Invalid token');
    jwtError.name = 'JsonWebTokenError';
    mockJwt.verify.mockImplementation(() => {
      throw jwtError;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait gérer les erreurs génériques', () => {
    req.headers.authorization = 'Bearer some-token';
    const genericError = new Error('Generic error');
    mockJwt.verify.mockImplementation(() => {
      throw genericError;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erreur lors de la vérification du token.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait extraire correctement le token avec des espaces supplémentaires', () => {
    const mockUser = { userId: 'user123' };
    req.headers.authorization = 'Bearer token-with-spaces';
    mockJwt.verify.mockReturnValue(mockUser);

    authMiddleware(req, res, next);

    expect(mockJwt.verify).toHaveBeenCalledWith('token-with-spaces', 'test-secret');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
