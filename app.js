import express from 'express';
import cors from 'cors';
import { connectDB } from './src/database.js';
import 'dotenv/config';
import indexRoutes from './src/routes/indexRoutes.js';
import metricsRoutes from './src/routes/metricsRoutes.js';
import logger from './src/config/logger.js';
import { loggerMiddleware } from './src/middlewares/loggerMiddleware.js';
import { metricsMiddleware } from './src/middlewares/metricsMiddleware.js';

const app = express();

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://front-staging-uncl.onrender.com'],
  credentials: true
}));

app.use(express.json());

// Middleware de logging
app.use(loggerMiddleware);

// Middleware de métriques (doit être placé avant les routes)
app.use(metricsMiddleware);

// Connexion à MongoDB
connectDB();

// Routes
app.use('/api', indexRoutes);

// Route de métriques Prometheus
app.use('/metrics', metricsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  logger.info(`📈 Métriques Prometheus disponibles sur: http://localhost:${PORT}/metrics`);
});
