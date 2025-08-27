describe('Calcul de score Quiz', () => {
  function calculateQuizScore(corrections) {
    if (!corrections || corrections.length === 0) {
      return { totalScore: 0, averageScore: 0, percentage: '0.00' };
    }
    
    const totalScore = corrections.reduce((sum, correction) => sum + correction.score, 0);
    const averageScore = totalScore / corrections.length;
    const percentage = (averageScore * 100).toFixed(2);
    
    return { totalScore, averageScore, percentage };
  }

  function generateFeedback(percentage) {
    const score = parseFloat(percentage);
    if (score >= 90) {
      return "Excellent ! Vous avez une excellente compréhension du sujet !";
    } else if (score >= 70) {
      return "Bien ! Vous avez une bonne compréhension du sujet.";
    } else {
      return "Continuez à vous entraîner, vous allez y arriver !";
    }
  }

  describe('Calcul des scores', () => {
    it('devrait calculer le score correctement', () => {
      const corrections = [
        { score: 1 },   // Bonne réponse
        { score: 0.5 }, // Partiellement correct
        { score: 0 }    // Incorrect
      ];
      
      const result = calculateQuizScore(corrections);
      expect(result.totalScore).toBe(1.5);
      expect(result.averageScore).toBe(0.5);
      expect(result.percentage).toBe('50.00');
    });

    it('devrait gérer un tableau vide', () => {
      const result = calculateQuizScore([]);
      expect(result.totalScore).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.percentage).toBe('0.00');
    });

    it('devrait calculer 100% pour toutes bonnes réponses', () => {
      const corrections = [{ score: 1 }, { score: 1 }, { score: 1 }];
      const result = calculateQuizScore(corrections);
      expect(result.percentage).toBe('100.00');
    });

    it('devrait gérer les scores décimaux', () => {
      const corrections = [
        { score: 0.8 },
        { score: 0.6 },
        { score: 0.4 }
      ];
      const result = calculateQuizScore(corrections);
      expect(result.totalScore).toBeCloseTo(1.8); // Utiliser toBeCloseTo pour les décimaux
      expect(result.averageScore).toBeCloseTo(0.6);
      expect(result.percentage).toBe('60.00');
    });

    it('devrait gérer null/undefined', () => {
      expect(calculateQuizScore(null).percentage).toBe('0.00');
      expect(calculateQuizScore(undefined).percentage).toBe('0.00');
    });
  });

  describe('Génération de feedback', () => {
    it('devrait générer feedback "Excellent" pour 90%+', () => {
      const feedback = generateFeedback('95.00');
      expect(feedback).toBe("Excellent ! Vous avez une excellente compréhension du sujet !");
    });

    it('devrait générer feedback "Bien" pour 70-89%', () => {
      const feedback = generateFeedback('75.00');
      expect(feedback).toBe("Bien ! Vous avez une bonne compréhension du sujet.");
    });

    it('devrait générer feedback encourageant pour <70%', () => {
      const feedback = generateFeedback('50.00');
      expect(feedback).toBe("Continuez à vous entraîner, vous allez y arriver !");
    });

    it('devrait gérer les cas limites', () => {
      expect(generateFeedback('90.00')).toContain("Excellent");
      expect(generateFeedback('70.00')).toContain("Bien");
      expect(generateFeedback('69.99')).toContain("Continuez");
    });
  });
});
