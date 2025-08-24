import { jest } from '@jest/globals';

// Mock axios
const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn()
};

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
  warn: jest.fn()
};

// Mock metrics middleware
const mockMetrics = {
  recordQuizRequest: jest.fn(),
  recordQuizGenerationDuration: jest.fn(),
  recordOpenAIRequest: jest.fn(),
  recordOpenAIResponseTime: jest.fn()
};

// Mock openaiService
const mockOpenAIService = {
  generateQuiz: jest.fn(),
  evaluateAnswer: jest.fn()
};

// Mocks
jest.unstable_mockModule('axios', () => ({ default: mockAxios }));
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => mockOpenAI) }));
jest.unstable_mockModule('../src/config/logger.js', () => ({ default: mockLogger }));
jest.unstable_mockModule('../src/middlewares/metricsMiddleware.js', () => mockMetrics);
jest.unstable_mockModule('../src/services/openaiService.js', () => mockOpenAIService);

const { generateQuizController, correctQuizController, getQuizById, getQuizByUser, getQuizBySubject, deleteQuizController } = await import('../src/controllers/quizController.js');

describe('QuizController - Tests Complets', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      user: {
        userId: 'user123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Clear all mocks
    jest.clearAllMocks();
    Object.values(mockMetrics).forEach(mock => mock.mockClear());
    Object.values(mockLogger).forEach(mock => mock.mockClear());
  });

  describe('generateQuizController', () => {
    test('devrait générer un quiz avec succès', async () => {
      const mockQuestions = [
        {
          question: 'Test question',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          type: 'qcm',
          weight: 2
        }
      ];

      const mockSavedQuiz = {
        _id: 'quiz123',
        level: 'lycée',
        subject: 'mathématiques',
        user_id: 'user123',
        questions: mockQuestions
      };

      req.query = { level: 'lycée', subject: 'mathématiques' };
      mockOpenAIService.generateQuiz.mockResolvedValue(mockQuestions);
      mockAxios.post.mockResolvedValue({ data: mockSavedQuiz });

      await generateQuizController(req, res);

      expect(mockOpenAIService.generateQuiz).toHaveBeenCalledWith('lycée', 'mathématiques');
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/quizzes',
        {
          level: 'lycée',
          subject: 'mathématiques',
          user_id: 'user123',
          questions: mockQuestions
        }
      );
      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('generate', 'success');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSavedQuiz);
    });

    test('devrait retourner une erreur si level manque', async () => {
      req.query = { subject: 'mathématiques' };

      await generateQuizController(req, res);

      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('generate', 'error_missing_params');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Niveau ou matière manquant.' });
    });

    test('devrait retourner une erreur si subject manque', async () => {
      req.query = { level: 'lycée' };

      await generateQuizController(req, res);

      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('generate', 'error_missing_params');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Niveau ou matière manquant.' });
    });

    test('devrait retourner une erreur si utilisateur non authentifié', async () => {
      req.query = { level: 'lycée', subject: 'mathématiques' };
      req.user = null;

      await generateQuizController(req, res);

      expect(mockLogger.error).toHaveBeenCalledWith('Tentative de génération sans authentification');
      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('generate', 'error_unauthorized');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Utilisateur non authentifié.' });
    });

    test('devrait retourner une erreur si userId manque', async () => {
      req.query = { level: 'lycée', subject: 'mathématiques' };
      req.user = {};

      await generateQuizController(req, res);

      expect(mockLogger.error).toHaveBeenCalledWith('ID utilisateur manquant dans le token:', {});
      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('generate', 'error_missing_user_id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID utilisateur manquant.' });
    });

    test('devrait gérer les erreurs d\'OpenAI', async () => {
      req.query = { level: 'lycée', subject: 'mathématiques' };
      const error = new Error('OpenAI API error');
      mockOpenAIService.generateQuiz.mockRejectedValue(error);

      await generateQuizController(req, res);

      expect(mockLogger.error).toHaveBeenCalledWith('Erreur lors de la génération du quiz:', error);
      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('generate', 'error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: error.message
      });
    });

    test('devrait gérer les erreurs de sauvegarde en base', async () => {
      req.query = { level: 'lycée', subject: 'mathématiques' };
      const mockQuestions = [{ question: 'Test' }];
      mockOpenAIService.generateQuiz.mockResolvedValue(mockQuestions);
      const dbError = new Error('Database error');
      mockAxios.post.mockRejectedValue(dbError);

      await generateQuizController(req, res);

      expect(mockLogger.error).toHaveBeenCalledWith('Erreur lors de la génération du quiz:', dbError);
      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('generate', 'error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: dbError.message
      });
    });

    test('devrait gérer userId avec différents noms de propriété', async () => {
      req.query = { level: 'lycée', subject: 'mathématiques' };
      req.user = { id: 'user456' }; // Utilise 'id' au lieu de 'userId'
      
      const mockQuestions = [{ question: 'Test' }];
      const mockSavedQuiz = { _id: 'quiz123' };
      mockOpenAIService.generateQuiz.mockResolvedValue(mockQuestions);
      mockAxios.post.mockResolvedValue({ data: mockSavedQuiz });

      await generateQuizController(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          user_id: 'user456'
        })
      );
    });

    test('devrait gérer userId avec _id', async () => {
      req.query = { level: 'lycée', subject: 'mathématiques' };
      req.user = { _id: 'user789' }; // Utilise '_id'
      
      const mockQuestions = [{ question: 'Test' }];
      const mockSavedQuiz = { _id: 'quiz123' };
      mockOpenAIService.generateQuiz.mockResolvedValue(mockQuestions);
      mockAxios.post.mockResolvedValue({ data: mockSavedQuiz });

      await generateQuizController(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          user_id: 'user789'
        })
      );
    });
  });

  describe('correctQuizController', () => {
    test('devrait corriger un quiz avec succès', async () => {
      const mockQuiz = {
        _id: 'quiz123',
        questions: [
          {
            question: 'Quelle est la capitale de la France ?',
            options: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
            correctAnswer: 'Paris',
            type: 'qcm',
            weight: 2
          }
        ]
      };

      const mockResult = {
        totalQuestions: 1,
        averageScore: 1,
        percentage: '100.00',
        corrections: [
          {
            question: 'Quelle est la capitale de la France ?',
            userAnswer: 'Paris',
            correctAnswer: 'Paris',
            isCorrect: true,
            score: 1,
            feedback: 'Correct !'
          }
        ],
        feedback: 'Excellent ! Vous avez une excellente compréhension du sujet !'
      };

      req.body = {
        quizId: 'quiz123',
        answers: ['Paris'] // Format correct : tableau de chaînes
      };

      // Mock evaluateAnswer pour éviter l'erreur 500
      mockOpenAIService.evaluateAnswer.mockResolvedValue({
        isCorrect: true,
        score: 1,
        feedback: 'Correct !'
      });

      mockAxios.get.mockResolvedValue({ data: mockQuiz });
      mockAxios.post.mockResolvedValue({ data: mockResult });

      await correctQuizController(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/quizzes/quiz123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('devrait retourner une erreur si quizId manque', async () => {
      req.body = { answers: [] };

      await correctQuizController(req, res);

      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('correct', 'error_missing_params');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Quiz ID et réponses requis.' });
    });
  });

  describe('getQuizById', () => {
    test('devrait récupérer un quiz par ID', async () => {
      const mockQuiz = {
        _id: 'quiz123',
        level: 'lycée',
        subject: 'mathématiques',
        user_id: 'user123'
      };

      req.params = { quizId: 'quiz123' };
      req.user = { userId: 'user123' };
      mockAxios.get.mockResolvedValue({ data: mockQuiz });

      await getQuizById(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/quizzes/quiz123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockQuiz);
    });

    test('devrait retourner une erreur si utilisateur non autorisé', async () => {
      const mockQuiz = {
        _id: 'quiz123',
        user_id: 'other-user'
      };

      req.params = { quizId: 'quiz123' };
      req.user = { userId: 'user123' };
      mockAxios.get.mockResolvedValue({ data: mockQuiz });

      await getQuizById(req, res);

      expect(mockMetrics.recordQuizRequest).toHaveBeenCalledWith('get_by_id', 'error_unauthorized_access');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Accès non autorisé à ce quiz.' });
    });
  });

  describe('getQuizByUser', () => {
    test('devrait récupérer les quiz d\'un utilisateur', async () => {
      const mockQuizzes = [
        { _id: 'quiz1', subject: 'math' },
        { _id: 'quiz2', subject: 'français' }
      ];

      req.user = { userId: 'user123' };
      mockAxios.get.mockResolvedValue({ data: mockQuizzes });

      await getQuizByUser(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/quizzes/user/user123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockQuizzes);
    });
  });

  describe('getQuizBySubject', () => {
    test('devrait récupérer les quiz par matière', async () => {
      const mockQuizzes = [
        { _id: 'quiz1', subject: 'mathématiques' },
        { _id: 'quiz2', subject: 'mathématiques' }
      ];

      req.params = { subject: 'mathématiques' };
      mockAxios.get.mockResolvedValue({ data: mockQuizzes });

      await getQuizBySubject(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/quizzes/user/user123/subject/mathématiques'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockQuizzes);
    });
  });


});
