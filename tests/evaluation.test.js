describe('Évaluation des réponses', () => {
  function evaluateQCM(userAnswer, correctAnswer) {
    const isCorrect = userAnswer === correctAnswer;
    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: isCorrect ? "Bonne réponse !" : `La bonne réponse était : ${correctAnswer}`
    };
  }

  function validateScore(score) {
    return Math.max(0, Math.min(1, parseFloat(score) || 0));
  }

  function processOpenAIEvaluation(result) {
    const score = validateScore(result.score);
    const isCorrect = Boolean(result.isCorrect);
    
    return {
      isCorrect,
      score,
      correctAnswer: result.correctAnswer || "",
      explanation: result.explanation || "",
      feedback: result.explanation || "Évaluation terminée"
    };
  }

  describe('Évaluation QCM', () => {
    it('devrait évaluer une bonne réponse QCM', () => {
      const result = evaluateQCM('Paris', 'Paris');
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
      expect(result.feedback).toBe("Bonne réponse !");
    });

    it('devrait évaluer une mauvaise réponse QCM', () => {
      const result = evaluateQCM('Lyon', 'Paris');
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toBe("La bonne réponse était : Paris");
    });

    it('devrait être sensible à la casse', () => {
      const result = evaluateQCM('paris', 'Paris');
      expect(result.isCorrect).toBe(false);
    });

    it('devrait gérer les réponses vides', () => {
      const result = evaluateQCM('', 'Paris');
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('Validation des scores', () => {
    it('devrait valider un score normal', () => {
      expect(validateScore(0.5)).toBe(0.5);
      expect(validateScore(1)).toBe(1);
      expect(validateScore(0)).toBe(0);
    });

    it('devrait limiter les scores > 1', () => {
      expect(validateScore(1.5)).toBe(1);
      expect(validateScore(2)).toBe(1);
    });

    it('devrait limiter les scores < 0', () => {
      expect(validateScore(-0.5)).toBe(0);
      expect(validateScore(-1)).toBe(0);
    });

    it('devrait gérer les valeurs non numériques', () => {
      expect(validateScore('invalid')).toBe(0);
      expect(validateScore(null)).toBe(0);
      expect(validateScore(undefined)).toBe(0);
    });
  });

  describe('Traitement évaluation OpenAI', () => {
    it('devrait traiter une évaluation OpenAI valide', () => {
      const openAIResult = {
        isCorrect: true,
        score: 0.8,
        correctAnswer: "Une fonction qui retourne une autre fonction",
        explanation: "Bonne compréhension des closures"
      };

      const result = processOpenAIEvaluation(openAIResult);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(0.8);
      expect(result.explanation).toBe("Bonne compréhension des closures");
    });

    it('devrait gérer les scores invalides d\'OpenAI', () => {
      const openAIResult = {
        isCorrect: false,
        score: 1.5, // Score trop élevé
        explanation: "Réponse incorrecte"
      };

      const result = processOpenAIEvaluation(openAIResult);
      expect(result.score).toBe(1); // Limité à 1
    });

    it('devrait gérer les champs manquants', () => {
      const openAIResult = {
        isCorrect: true,
        score: 0.7
        // explanation et correctAnswer manquants
      };

      const result = processOpenAIEvaluation(openAIResult);
      expect(result.correctAnswer).toBe("");
      expect(result.explanation).toBe("");
      expect(result.feedback).toBe("Évaluation terminée");
    });
  });
});
