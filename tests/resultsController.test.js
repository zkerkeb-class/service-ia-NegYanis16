import { jest } from '@jest/globals';

// Mock axios
const mockAxios = {
  get: jest.fn(),
  post: jest.fn()
};

// Setup mocks
jest.unstable_mockModule('axios', () => ({ default: mockAxios }));

const { getMoyenneParMatiere, getResultsByUser, createResult } = await import('../src/controllers/resultsController.js');

describe('ResultsController - Tests Complets', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        userId: 'user123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getMoyenneParMatiere', () => {
    test('devrait récupérer les moyennes par matière', async () => {
      const mockMoyennes = [
        { subject: 'mathématiques', moyenne: 15.5 },
        { subject: 'français', moyenne: 12.8 }
      ];

      req.user = { id: 'user123' };
      mockAxios.get.mockResolvedValue({ data: mockMoyennes });

      await getMoyenneParMatiere(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/results/moyenne/user123'
      );
      expect(res.json).toHaveBeenCalledWith(mockMoyennes);
    });

    test('devrait utiliser _id si id n\'est pas disponible', async () => {
      const mockMoyennes = [];
      req.user = { _id: 'user456' };
      mockAxios.get.mockResolvedValue({ data: mockMoyennes });

      await getMoyenneParMatiere(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/results/moyenne/user456'
      );
    });

    test('devrait gérer les erreurs', async () => {
      const error = new Error('Database error');
      mockAxios.get.mockRejectedValue(error);

      await getMoyenneParMatiere(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('getResultsByUser', () => {
    test('devrait récupérer les résultats d\'un utilisateur', async () => {
      const mockResults = [
        { _id: 'result1', score: 15, quiz_id: 'quiz1' },
        { _id: 'result2', score: 18, quiz_id: 'quiz2' }
      ];

      req.user = { userId: 'user123' };
      mockAxios.get.mockResolvedValue({ data: mockResults });

      await getResultsByUser(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/results/user/user123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    test('devrait utiliser id comme fallback', async () => {
      const mockResults = [];
      req.user = { id: 'user456' };
      mockAxios.get.mockResolvedValue({ data: mockResults });

      await getResultsByUser(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/results/user/user456'
      );
    });

    test('devrait utiliser _id comme fallback final', async () => {
      const mockResults = [];
      req.user = { _id: 'user789' };
      mockAxios.get.mockResolvedValue({ data: mockResults });

      await getResultsByUser(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/results/user/user789'
      );
    });

    test('devrait gérer les erreurs', async () => {
      const error = new Error('Network error');
      mockAxios.get.mockRejectedValue(error);

      await getResultsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('createResult', () => {
    test('devrait créer un nouveau résultat', async () => {
      const mockResult = {
        _id: 'result123',
        quiz_id: 'quiz123',
        user_id: 'user123',
        score: 16,
        answers: []
      };

      req.body = {
        quiz_id: 'quiz123',
        user_id: 'user123',
        score: 16,
        answers: []
      };

      mockAxios.post.mockResolvedValue({ data: mockResult });

      await createResult(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/results',
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('devrait gérer les erreurs de création', async () => {
      const error = new Error('Validation error');
      req.body = { invalid: 'data' };
      mockAxios.post.mockRejectedValue(error);

      await createResult(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    test('devrait passer toutes les données du body', async () => {
      const mockResult = { _id: 'result123' };
      const requestData = {
        quiz_id: 'quiz123',
        user_id: 'user123',
        score: 20,
        answers: [
          { questionIndex: 0, userAnswer: 'A', isCorrect: true, score: 2 }
        ],
        completedAt: new Date().toISOString()
      };

      req.body = requestData;
      mockAxios.post.mockResolvedValue({ data: mockResult });

      await createResult(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://bdd-services-staging-zvtp.onrender.com/api/v1/results',
        requestData
      );
    });
  });
});
