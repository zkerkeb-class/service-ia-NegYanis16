import express from 'express';
import { getMoyenneParMatiere, getResultsByUser } from '../controllers/resultsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/moyennes', authMiddleware, getMoyenneParMatiere);
router.get('/user', authMiddleware, getResultsByUser);
export default router;
