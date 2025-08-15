# Backend Quiz Intelligent

## Installation

1. Clonez le repo et placez-vous dans le dossier :
   ```bash
   git clone <repo-url>
   cd Backend-cv
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Créez un fichier `.env` à la racine avec :
   ```env
   OPENAI_API_KEY=sk-xxxxxxx
   MONGODB_URI=mongodb://localhost:27017/quizdb
   PORT=5000
   ```
4. Lancez le serveur :
   ```bash
   node app.js
   ```

## Endpoint principal

- `GET /api/quiz/generate?subject=<matière>`
  - Authentification simulée (voir `authMiddleware`)
  - Le niveau scolaire est injecté via le token (simulé dans `req.user.level`)
  - Retourne un quiz généré par OpenAI et sauvegardé en base

## Structure des dossiers

- `models/Quiz.js` : Modèle Mongoose du quiz
- `services/openaiService.js` : Service d'appel à OpenAI
- `controllers/quizController.js` : Contrôleur principal
- `routes/quizRoutes.js` : Route Express
- `middlewares/authMiddleware.js` : Middleware d'authentification (exemple)

---

**N'oubliez pas de remplacer la clé OpenAI par la vôtre !** 