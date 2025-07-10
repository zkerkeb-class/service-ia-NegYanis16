import OpenAI from 'openai';
import 'dotenv/config';
import logger from '../config/logger.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuiz(level, subject) {
  try {
    const prompt = `Génère un quiz de niveau ${level} sur le sujet ${subject} avec 10 questions.
Le quiz doit contenir exactement 7 questions à choix multiples (QCM) et 3 questions ouvertes.
Chaque question doit avoir un champ "weight" (soit 1, soit 2) et jamais plus de 2 sinon ça ne marche pas. C'est un nombre qui indique son importance dans le calcul de la note finale. Les questions de poids 2 doivent être plus difficiles ou importantes.
La somme des champs "weight" de toutes les questions doit être exactement 20 (pour une note finale sur 20).
Le format doit être un tableau JSON strict d'objets avec la structure suivante :

[
  {
    "question": "Texte de la question",
    "options": ["option1", "option2", "option3", "option4"], // laisser ce tableau vide pour les questions ouvertes
    "correctAnswer": "La bonne réponse", // laisser ce champ vide pour les questions ouvertes
    "type": "qcm", // mettre 'qcm' si options non vide, 'ouverte' sinon
    "weight": 1
  }
]

Retourne uniquement ce tableau JSON, sans ajout de texte ou de balises markdown.`;

    logger.info(`Génération de quiz pour ${subject} niveau ${level} via OpenAI`);

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini"
    });

    let content = completion.choices[0].message.content;

    // 🔧 Nettoie les éventuelles balises markdown
    content = content.replace(/```(?:json)?\n?/, '').replace(/```$/, '').trim();

    logger.debug("Contenu nettoyé reçu d'OpenAI");

    const response = JSON.parse(content);
    logger.info(`Quiz généré avec succès: ${response.length} questions`);
    return response;
  } catch (error) {
    logger.error('Erreur lors de la génération du quiz:', error);
    throw error;
  }
}


export async function evaluateAnswer(question, userAnswer, correctAnswer, options = []) {
  try {
    // Cas QCM : comparaison directe
    if (options.length > 0) {
      const isCorrect = userAnswer === correctAnswer;
      logger.debug(`Évaluation QCM: ${isCorrect ? 'Correct' : 'Incorrect'}`);
      return {
        isCorrect,
        score: isCorrect ? 1 : 0, // Convertir isCorrect en score
        correctAnswer,
        feedback: isCorrect ? "Bonne réponse !" : `La bonne réponse était : ${correctAnswer}`
      };
    }

    logger.info("Évaluation d'une question ouverte via OpenAI");

    const prompt = `Tu es un professeur qui explique un concept à un élève en tenant compte de sa réponse.

Voici la question : ${question}
Réponse de l'élève : ${userAnswer}

1. Évalue d'abord la réponse de l'élève (correcte, partiellement correcte, incorrecte)
2. Ensuite, fournis une explication pédagogique concise du concept de la question, en adaptant ton explication à ce que l'élève a compris ou mal compris dans sa réponse.

Réponds dans ce format JSON strict :
{
  "isCorrect": true/false,
  "score": 1 | 0.5 | 0,
  "correctAnswer": "réponse attendue",
  "explanation": "explication pédagogique concise (max 300 caractères)"
}

Critères d'évaluation :
- 1 : réponse entièrement correcte
- 0.5 : réponse partiellement correcte (bonne idée mais incomplète ou avec erreurs)
- 0 : réponse incorrecte, hors sujet ou propos inappropriés

Pour l'explication (max 300 caractères) :
- Si la réponse est correcte : résume le concept clé et donne un exemple rapide
- Si la réponse est partiellement correcte : corrige l'erreur principale et complète le point manquant
- Si la réponse est incorrecte : explique le concept clé en une phrase simple
- Si la réponse contient des propos inappropriés : explique brièvement pourquoi et donne la bonne réponse

L'explication doit être courte, claire et directe.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 400
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    // Validation et nettoyage des valeurs
    const score = Math.max(0, Math.min(1, parseFloat(result.score) || 0));
    const isCorrect = Boolean(result.isCorrect);
    
    logger.debug(`Question ouverte évaluée: score ${score}, isCorrect ${isCorrect}`);

    return {
      isCorrect,
      score, // Score validé entre 0 et 1
      correctAnswer: result.correctAnswer || "",
      explanation: result.explanation || "",
      feedback: result.explanation || "Évaluation terminée"
    };

  } catch (error) {
    logger.error("Erreur lors de l'évaluation :", error);
    return {
      isCorrect: false,
      score: 0, // Score par défaut en cas d'erreur
      correctAnswer: "",
      explanation: "Impossible d'évaluer la réponse. Veuillez réessayer.",
      feedback: "Impossible d'évaluer la réponse. Veuillez réessayer."
    };
  }
}
