describe('Validation des paramètres Quiz', () => {
  function validateQuizParams(level, subject) {
    if (!level || !subject) {
      return { valid: false, error: 'Niveau ou matière manquant.' };
    }
    return { valid: true };
  }

  function validateUserId(user) {
    if (!user) {
      return { valid: false, error: 'Utilisateur non authentifié.' };
    }
    
    const userId = user.userId || user.id || user._id;
    if (!userId) {
      return { valid: false, error: 'ID utilisateur manquant.' };
    }
    
    return { valid: true, userId };
  }

  function validateQuizCorrection(quizId, answers) {
    if (!quizId || !answers) {
      return { valid: false, error: 'Quiz ID et réponses requis.' };
    }
    return { valid: true };
  }

  describe('Paramètres de génération de quiz', () => {
    it('devrait valider des paramètres corrects', () => {
      const result = validateQuizParams('licence', 'javascript');
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter si level manquant', () => {
      const result = validateQuizParams(null, 'javascript');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Niveau ou matière manquant.');
    });

    it('devrait rejeter si subject manquant', () => {
      const result = validateQuizParams('licence', null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Niveau ou matière manquant.');
    });

    it('devrait rejeter si les deux sont manquants', () => {
      const result = validateQuizParams('', '');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Niveau ou matière manquant.');
    });
  });

  describe('Validation utilisateur', () => {
    it('devrait valider un utilisateur avec userId', () => {
      const user = { userId: 'user123' };
      const result = validateUserId(user);
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user123');
    });

    it('devrait valider un utilisateur avec id', () => {
      const user = { id: 'user456' };
      const result = validateUserId(user);
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user456');
    });

    it('devrait rejeter si utilisateur null', () => {
      const result = validateUserId(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Utilisateur non authentifié.');
    });

    it('devrait rejeter si aucun ID utilisateur', () => {
      const user = { email: 'test@test.com' };
      const result = validateUserId(user);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ID utilisateur manquant.');
    });
  });

  describe('Validation correction de quiz', () => {
    it('devrait valider des paramètres de correction corrects', () => {
      const result = validateQuizCorrection('quiz123', ['A', 'B', 'C']);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter si quizId manquant', () => {
      const result = validateQuizCorrection(null, ['A', 'B']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Quiz ID et réponses requis.');
    });

    it('devrait rejeter si answers manquant', () => {
      const result = validateQuizCorrection('quiz123', null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Quiz ID et réponses requis.');
    });
  });
});
