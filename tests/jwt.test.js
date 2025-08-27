const jwt = require('jsonwebtoken');

describe('JWT Authentication', () => {
  it('devrait créer et vérifier un token JWT', () => {
    const payload = { userId: '123', email: 'test@test.com' };
    const secret = 'test_secret';
    
    // Créer un token
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(token).toBeDefined();
    
    // Vérifier le token
    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe('123');
    expect(decoded.email).toBe('test@test.com');
  });

  it('devrait rejeter un token invalide', () => {
    expect(() => {
      jwt.verify('invalid.token.here', 'test_secret');
    }).toThrow();
  });

  it('devrait rejeter un token expiré', () => {
    const payload = { userId: '123' };
    const secret = 'test_secret';
    const expiredToken = jwt.sign(payload, secret, { expiresIn: '-1h' });
    
    expect(() => {
      jwt.verify(expiredToken, secret);
    }).toThrow('jwt expired');
  });
});
