describe('Utilitaires', () => {
  function cleanOpenAIContent(content) {
    return content.replace(/```(?:json)?\n?/, '').replace(/```$/, '').trim();
  }

  function parseQuizQuestions(content) {
    try {
      const cleaned = cleanOpenAIContent(content);
      return JSON.parse(cleaned);
    } catch (error) {
      throw new Error('Format JSON invalide');
    }
  }

  function validateQuizStructure(questions) {
    if (!Array.isArray(questions)) {
      return { valid: false, error: 'Le quiz doit être un tableau' };
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || typeof q.question !== 'string') {
        return { valid: false, error: `Question ${i + 1}: texte manquant` };
      }
      if (!q.type || (q.type !== 'qcm' && q.type !== 'ouverte')) {
        return { valid: false, error: `Question ${i + 1}: type invalide` };
      }
      if (typeof q.weight !== 'number' || q.weight <= 0) {
        return { valid: false, error: `Question ${i + 1}: weight invalide` };
      }
    }

    return { valid: true };
  }

  describe('Nettoyage contenu OpenAI', () => {
    it('devrait nettoyer les balises markdown JSON', () => {
      const input = '```json\n{"question":"Test"}\n```';
      const result = cleanOpenAIContent(input);
      expect(result).toBe('{"question":"Test"}');
    });

    it('devrait nettoyer les balises markdown simples', () => {
      const input = '```\n{"question":"Test"}\n```';
      const result = cleanOpenAIContent(input);
      expect(result).toBe('{"question":"Test"}');
    });

    it('devrait laisser le contenu sans balises intact', () => {
      const input = '{"question":"Test"}';
      const result = cleanOpenAIContent(input);
      expect(result).toBe('{"question":"Test"}');
    });

    it('devrait supprimer les espaces en début/fin', () => {
      const input = '  \n  {"question":"Test"}  \n  ';
      const result = cleanOpenAIContent(input);
      expect(result).toBe('{"question":"Test"}');
    });
  });

  describe('Parsing des questions de quiz', () => {
    it('devrait parser un JSON valide', () => {
      const content = '[{"question":"Test","type":"qcm","weight":1}]';
      const result = parseQuizQuestions(content);
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Test');
    });

    it('devrait parser après nettoyage markdown', () => {
      const content = '```json\n[{"question":"Test","type":"qcm","weight":1}]\n```';
      const result = parseQuizQuestions(content);
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Test');
    });

    it('devrait rejeter un JSON invalide', () => {
      const content = '{invalid json}';
      expect(() => parseQuizQuestions(content)).toThrow('Format JSON invalide');
    });
  });

  describe('Validation structure quiz', () => {
    it('devrait valider une structure correcte', () => {
      const questions = [
        { question: 'Q1', type: 'qcm', weight: 1, options: ['A', 'B'] },
        { question: 'Q2', type: 'ouverte', weight: 2, options: [] }
      ];
      const result = validateQuizStructure(questions);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter si ce n\'est pas un tableau', () => {
      const result = validateQuizStructure({ question: 'Test' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Le quiz doit être un tableau');
    });

    it('devrait rejeter si question manquante', () => {
      const questions = [{ type: 'qcm', weight: 1 }];
      const result = validateQuizStructure(questions);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('texte manquant');
    });

    it('devrait rejeter si type invalide', () => {
      const questions = [{ question: 'Q1', type: 'invalid', weight: 1 }];
      const result = validateQuizStructure(questions);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('type invalide');
    });

    it('devrait rejeter si weight invalide', () => {
      const questions = [{ question: 'Q1', type: 'qcm', weight: 0 }];
      const result = validateQuizStructure(questions);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('weight invalide');
    });
  });
});
