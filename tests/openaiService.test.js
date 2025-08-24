import { jest } from '@jest/globals';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => mockOpenAI) }));
jest.unstable_mockModule('../src/config/logger.js', () => ({ default: mockLogger }));

const { generateQuiz, evaluateAnswer } = await import('../src/services/openaiService.js');

describe('OpenAI Service - Tests Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockLogger).forEach(mock => mock.mockClear());
  });

  describe('generateQuiz', () => {
    test('devrait générer un quiz avec succès', async () => {
      const mockQuizData = [
        {
          question: 'Quelle est la capitale de la France ?',
          options: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
          correctAnswer: 'Paris',
          type: 'qcm',
          weight: 2
        },
        {
          question: 'Expliquez l\'importance de Paris',
          options: [],
          correctAnswer: '',
          type: 'ouverte',
          weight: 2
        }
      ];

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockQuizData)
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await generateQuiz('lycée', 'géographie');

      expect(mockLogger.info).toHaveBeenCalledWith('Génération de quiz pour géographie niveau lycée via OpenAI');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        messages: [{ role: "user", content: expect.stringContaining('Génère un quiz de niveau lycée sur le sujet géographie') }],
        model: "gpt-4o-mini"
      });
      expect(result).toEqual(mockQuizData);
      expect(mockLogger.info).toHaveBeenCalledWith('Quiz généré avec succès: 2 questions');
    });



    test('devrait gérer une réponse OpenAI invalide', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Réponse invalide non-JSON'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(generateQuiz('lycée', 'physique')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Erreur lors de la génération du quiz:', expect.any(Error));
    });

    test('devrait gérer les erreurs de l\'API OpenAI', async () => {
      const apiError = new Error('OpenAI API rate limit exceeded');
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(generateQuiz('lycée', 'histoire')).rejects.toThrow('OpenAI API rate limit exceeded');
      expect(mockLogger.error).toHaveBeenCalledWith('Erreur lors de la génération du quiz:', apiError);
    });


  });

  describe('evaluateAnswer', () => {
    test('devrait évaluer une réponse ouverte avec succès', async () => {
      const mockEvaluation = {
        isCorrect: true,
        score: 0.8,
        correctAnswer: "",
        explanation: 'Excellente analyse du concept',
        feedback: 'Excellente analyse du concept'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockEvaluation)
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await evaluateAnswer(
        'Expliquez le concept de photosynthèse',
        'La photosynthèse est un processus par lequel les plantes convertissent la lumière en énergie'
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Évaluation d\'une question ouverte via OpenAI');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        messages: [{ 
          role: "user", 
          content: expect.stringContaining('Tu es un professeur qui explique un concept')
        }],
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: 400
      });
      expect(result).toEqual(mockEvaluation);
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Question ouverte évaluée:'));
    });

    test('devrait valider et corriger une évaluation avec score invalide', async () => {
      const mockEvaluationInvalid = {
        isCorrect: true,
        score: 1.5, // Score > 1
        explanation: 'Bonne réponse'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockEvaluationInvalid)
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await evaluateAnswer('Question test', 'Réponse test');

      expect(result.score).toBe(1); // Corrigé de 1.5 à 1
    });

    test('devrait corriger un score négatif', async () => {
      const mockEvaluationNegative = {
        isCorrect: false,
        score: -0.2, // Score négatif
        explanation: 'Réponse incorrecte'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockEvaluationNegative)
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await evaluateAnswer('Question test', 'Réponse incorrecte');

      expect(result.score).toBe(0); // Corrigé de -0.2 à 0
    });

    test('devrait gérer une réponse d\'évaluation invalide', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Évaluation invalide non-JSON'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await evaluateAnswer('Question', 'Réponse');

      expect(result).toEqual({
        isCorrect: false,
        score: 0,
        correctAnswer: "",
        explanation: "Impossible d'évaluer la réponse. Veuillez réessayer.",
        feedback: "Impossible d'évaluer la réponse. Veuillez réessayer."
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Erreur lors de l\'évaluation :', expect.any(Error));
    });

    test('devrait gérer les erreurs de l\'API OpenAI pour l\'évaluation', async () => {
      const apiError = new Error('OpenAI API error during evaluation');
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      const result = await evaluateAnswer('Question', 'Réponse');

      expect(result).toEqual({
        isCorrect: false,
        score: 0,
        correctAnswer: "",
        explanation: "Impossible d'évaluer la réponse. Veuillez réessayer.",
        feedback: "Impossible d'évaluer la réponse. Veuillez réessayer."
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Erreur lors de l\'évaluation :', apiError);
    });

    test('devrait ajouter des champs manquants dans l\'évaluation', async () => {
      const mockEvaluationIncomplete = {
        score: 0.7,
        isCorrect: true
        // explanation manquant
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockEvaluationIncomplete)
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await evaluateAnswer('Question', 'Réponse');

      expect(result.isCorrect).toBe(true);
      expect(result.explanation).toBe(''); // Valeur par défaut vide
      expect(result.feedback).toBe('Évaluation terminée'); // Valeur par défaut
    });

    test('devrait déduire isCorrect à false pour un score faible', async () => {
      const mockEvaluationLowScore = {
        score: 0.3,
        isCorrect: false
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockEvaluationLowScore)
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await evaluateAnswer('Question', 'Réponse');

      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0.3);
    });
  });
});
