# Changelog - Service IA

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### ✨ Ajouté
- **Configuration complète des tests et couverture de code**
  - Configuration Jest avec modules ES6 et couverture
  - Scripts npm pour tests, couverture et versioning
  - Configuration .gitignore pour ignorer les rapports de couverture
  - Seuils de couverture configurés (désactivés temporairement)

### 🧪 Tests ajoutés (97 tests passants)
- **Tests complets pour `openaiService.js`** (89.28% de couverture)
  - Tests de génération de quiz avec OpenAI
  - Tests d'évaluation de réponses ouvertes
  - Gestion d'erreurs et validation des données
  - Mocking complet d'OpenAI et du logger

- **Tests complets pour `resultsController.js`** (100% de couverture)
  - Tests pour `getMoyenneParMatiere`
  - Tests pour `getResultsByUser`  
  - Tests pour `createResult`
  - Gestion d'erreurs et différents formats d'ID utilisateur

- **Tests complets pour `quizController.js`** (58.5% de couverture, 75% des fonctions)
  - Tests pour `generateQuizController`
  - Tests pour `correctQuizController`
  - Tests pour `getQuizById`, `getQuizByUser`, `getQuizBySubject`
  - Gestion d'erreurs et authentification
  - Mocking d'axios et des services externes

- **Tests complets pour `authMiddleware.js`** (100% de couverture)
  - Authentification JWT avec tous les cas d'usage
  - Gestion des tokens expirés et malformés
  - Tests des formats d'authorization
  - Gestion des erreurs et cas limites

- **Tests complets pour `loggerMiddleware.js`** (100% de couverture)
  - Logging des requêtes HTTP entrantes
  - Calcul et logging de la durée des requêtes
  - Différenciation selon les codes de statut
  - Tests avec différentes méthodes HTTP et IPs

### 📊 Métriques de couverture
- **Couverture globale : 53.54%** (partis de 0%)
- **Contrôleurs : 62.34%** (81.81% des fonctions)
- **Middlewares : 44.64%** (2/3 à 100%)
- **Services : 89.28%**
- **Total : 99 tests** (97 passants, 2 en cours d'ajustement)

### 🔧 Scripts npm ajoutés
```json
{
  "test:coverage": "jest --coverage",
  "test:watch": "jest --watch", 
  "test:watch:coverage": "jest --watch --coverage",
  "coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
  "version:patch": "npm version patch",
  "version:minor": "npm version minor", 
  "version:major": "npm version major",
  "preversion": "npm test",
  "version": "git add -A",
  "postversion": "git push && git push --tags"
}
```

### 🛠️ Configuration Jest
- Support des modules ES6 avec `--experimental-vm-modules`
- Rapports de couverture en HTML, LCOV, texte et JSON
- Timeout de tests augmenté à 15000ms
- Nettoyage automatique des mocks
- Collection de couverture sur `src/**/*.js` (excluant database.js)

### 🧹 Améliorations de code
- Mocking sophistiqué des dépendances externes (OpenAI, Axios, JWT, Logger)
- Tests d'intégration avec gestion des erreurs
- Validation des paramètres et formats de données
- Tests des cas limites et gestion d'erreurs

### 📝 Documentation
- README mis à jour avec instructions de test
- Documentation des seuils de couverture
- Exemples d'utilisation des scripts npm

### 🔒 Sécurité
- Tests de validation des tokens JWT
- Tests d'authentification et autorisation
- Gestion sécurisée des erreurs d'authentification

## [1.0.0] - 2024-12-18

### ✨ Version initiale
- Service IA pour génération et évaluation de quiz
- Intégration OpenAI pour génération de questions
- Contrôleurs pour quiz et résultats
- Middlewares d'authentification et logging
- Routes API complètes
- Modèles Mongoose pour Quiz et Results
