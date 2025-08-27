import express from 'express';
import resultsRoutes from './resultsRoutes.js';
import quizRoutes from './quizRoutes.js';
const router = express.Router();

router.use('/results', resultsRoutes);
router.use('/quiz', quizRoutes);
export default router;
