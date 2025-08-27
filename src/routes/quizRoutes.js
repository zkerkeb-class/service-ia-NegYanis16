import express from 'express';
import { generateQuizController, correctQuizController, getQuizById, getQuizByUser, getQuizBySubject } from '../controllers/quizController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/generate', authMiddleware, generateQuizController);
router.post('/correct', authMiddleware, correctQuizController);
router.get('/:quizId', authMiddleware, getQuizById);
router.get('/user', authMiddleware, getQuizByUser);
export default router; 