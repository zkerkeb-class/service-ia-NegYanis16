import Quiz from '../models/Quiz.js';
import { generateQuiz, evaluateAnswer } from '../services/openaiService.js';
import OpenAI from 'openai';
import Results from '../models/Results.js';
import logger from '../config/logger.js';
import { recordQuizRequest, recordQuizGenerationDuration, recordOpenAIRequest, recordOpenAIResponseTime } from '../middlewares/metricsMiddleware.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateQuizController(req, res) {
  const startTime = Date.now();
  try {
    const level = req.query.level;
    const subject = req.query.subject;
    
    if (!level || !subject) {
      recordQuizRequest('generate', 'error_missing_params');
      return res.status(400).json({ error: 'Niveau ou matière manquant.' });
    }

    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      logger.error('Tentative de génération sans authentification');
      recordQuizRequest('generate', 'error_unauthorized');
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      logger.error('ID utilisateur manquant dans le token:', req.user);
      recordQuizRequest('generate', 'error_missing_user_id');
      return res.status(400).json({ error: 'ID utilisateur manquant.' });
    }

    const openaiStartTime = Date.now();
    const questions = await generateQuiz(level, subject);
    const openaiDuration = (Date.now() - openaiStartTime) / 1000;
    
    // Enregistrer les métriques OpenAI
    recordOpenAIRequest('generate_quiz', 'success');
    recordOpenAIResponseTime('generate_quiz', openaiDuration);
    
    logger.info(`Questions générées pour ${subject} niveau ${level}: ${questions.length} questions pour l'utilisateur ${userId}`);
    
    // Création et sauvegarde du quiz en base de données
    const quiz = new Quiz({
      level,
      subject,
      user_id: userId,
      questions
    });

    const savedQuiz = await quiz.save();
    logger.info(`Quiz sauvegardé en base de données avec l'ID: ${savedQuiz._id} pour l'utilisateur ${userId}`);
    
    // Enregistrer le succès de la génération
    recordQuizRequest('generate', 'success');
    recordQuizGenerationDuration('quiz_generation', (Date.now() - startTime) / 1000);
    
    res.status(201).json(savedQuiz);
  } catch (error) {
    logger.error('Erreur lors de la génération du quiz:', error);
    recordQuizRequest('generate', 'error');
    recordOpenAIRequest('generate_quiz', 'error');
    res.status(500).json({ error: error.message });
  }
}


export async function correctQuizController(req, res) {
  const startTime = Date.now();
  try {
    const { quizId, answers } = req.body;

    if (!quizId || !answers) {
      recordQuizRequest('correct', 'error_missing_params');
      return res.status(400).json({ error: 'Quiz ID et réponses requis.' });
    }

    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      logger.error('Tentative de correction sans authentification');
      recordQuizRequest('correct', 'error_unauthorized');
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      logger.error('ID utilisateur manquant dans le token:', req.user);
      recordQuizRequest('correct', 'error_missing_user_id');
      return res.status(400).json({ error: 'ID utilisateur manquant.' });
    }

    // Récupérer le quiz depuis la base de données
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      recordQuizRequest('correct', 'error_quiz_not_found');
      return res.status(404).json({ error: 'Quiz non trouvé.' });
    }

    // Vérifier que l'utilisateur peut corriger ce quiz (optionnel - on peut permettre à tous les utilisateurs de corriger n'importe quel quiz)
    // Si tu veux restreindre, décommente les lignes suivantes :
    /*
    if (quiz.user_id.toString() !== userId) {
      logger.warn(`Tentative de correction non autorisée du quiz ${quizId} par l'utilisateur ${userId}`);
      return res.status(403).json({ error: 'Accès non autorisé à ce quiz.' });
    }
    */

    logger.info(`Correction du quiz ${quizId} avec ${answers.length} réponses pour l'utilisateur ${userId}`);

    // Évaluer chaque réponse avec l'IA
    const correctionsPromises = quiz.questions.map(async (question, index) => {
      const openaiStartTime = Date.now();
      const evaluation = await evaluateAnswer(
        question.question,
        answers[index],
        question.correctAnswer,
        question.options
      );
      const openaiDuration = (Date.now() - openaiStartTime) / 1000;
      
      // Enregistrer les métriques OpenAI pour chaque évaluation
      recordOpenAIRequest('evaluate_answer', 'success');
      recordOpenAIResponseTime('evaluate_answer', openaiDuration);

      return {
        question: question.question,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        feedback: evaluation.feedback
      };
    });

    const corrections = await Promise.all(correctionsPromises);

    // Calculer le score total
    const totalScore = corrections.reduce((sum, correction) => sum + correction.score, 0);
    const averageScore = totalScore / corrections.length;
    const percentage = (averageScore * 100).toFixed(2);

    // Sauvegarder le résultat dans Results
    const resultData = {
      matiere: quiz.subject,
      note: averageScore,
      coefficient: 1,
      user_id: userId,
      quiz_id: quiz._id
    };

    logger.info(`Sauvegarde du résultat:`, resultData);
    
    await Results.create(resultData);

    logger.info(`Résultat sauvegardé pour l'utilisateur ${userId}: ${percentage}%`);

    // Enregistrer le succès de la correction
    recordQuizRequest('correct', 'success');
    recordQuizGenerationDuration('quiz_correction', (Date.now() - startTime) / 1000);

    const result = {
      totalQuestions: quiz.questions.length,
      averageScore,
      percentage,
      corrections,
      feedback: percentage >= 90 
        ? "Excellent ! Vous avez une excellente compréhension du sujet !" 
        : percentage >= 70 
          ? "Bien ! Vous avez une bonne compréhension du sujet."
          : "Continuez à vous entraîner, vous allez y arriver !"
    };

    res.status(200).json(result);
  } catch (error) {
    logger.error('Erreur lors de la correction du quiz:', error);
    recordQuizRequest('correct', 'error');
    res.status(500).json({ error: error.message });
  }
}

export async function getQuizById(req, res) {
  try {
    const { quizId } = req.params;
    
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      logger.error('Tentative de récupération sans authentification');
      recordQuizRequest('get_by_id', 'error_unauthorized');
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      logger.error('ID utilisateur manquant dans le token:', req.user);
      recordQuizRequest('get_by_id', 'error_missing_user_id');
      return res.status(400).json({ error: 'ID utilisateur manquant.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      recordQuizRequest('get_by_id', 'error_quiz_not_found');
      return res.status(404).json({ error: 'Quiz non trouvé.' });
    }

    // Vérifier que l'utilisateur est le propriétaire du quiz
    if (quiz.user_id.toString() !== userId) {
      logger.warn(`Tentative d'accès non autorisé au quiz ${quizId} par l'utilisateur ${userId}`);
      recordQuizRequest('get_by_id', 'error_unauthorized_access');
      return res.status(403).json({ error: 'Accès non autorisé à ce quiz.' });
    }

    logger.info(`Quiz ${quizId} récupéré avec succès par l'utilisateur ${userId}`);
    recordQuizRequest('get_by_id', 'success');
    res.status(200).json(quiz);
  } catch (error) {
    logger.error('Erreur lors de la récupération du quiz:', error);
    recordQuizRequest('get_by_id', 'error');
    res.status(500).json({ error: error.message });
  }
}

export async function getQuizByUser(req, res) {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      logger.error('Tentative de récupération sans authentification');
      recordQuizRequest('get_by_user', 'error_unauthorized');
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      logger.error('ID utilisateur manquant dans le token:', req.user);
      recordQuizRequest('get_by_user', 'error_missing_user_id');
      return res.status(400).json({ error: 'ID utilisateur manquant.' });
    }

    const quizzes = await Quiz.find({ user_id: userId }).sort({ createdAt: -1 });
    logger.info(`${quizzes.length} quiz récupérés pour l'utilisateur ${userId}`);
    
    recordQuizRequest('get_by_user', 'success');
    res.status(200).json(quizzes);
  } catch (error) {
    logger.error('Erreur lors de la récupération des quiz:', error);
    recordQuizRequest('get_by_user', 'error');
    res.status(500).json({ error: error.message });
  }
}

export async function getQuizBySubject(req, res) {
  try {
    const { subject } = req.params;
    
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      logger.error('Tentative de récupération sans authentification');
      recordQuizRequest('get_by_subject', 'error_unauthorized');
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      logger.error('ID utilisateur manquant dans le token:', req.user);
      recordQuizRequest('get_by_subject', 'error_missing_user_id');
      return res.status(400).json({ error: 'ID utilisateur manquant.' });
    }

    const quizzes = await Quiz.find({ user_id: userId, subject }).sort({ createdAt: -1 });
    logger.info(`${quizzes.length} quiz de ${subject} récupérés pour l'utilisateur ${userId}`);
    
    recordQuizRequest('get_by_subject', 'success');
    res.status(200).json(quizzes);
  } catch (error) {
    logger.error('Erreur lors de la récupération des quiz par matière:', error);
    recordQuizRequest('get_by_subject', 'error');
    res.status(500).json({ error: error.message });
  }
}





