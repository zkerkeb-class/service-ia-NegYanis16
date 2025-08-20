import express from 'express';
import { register } from '../middlewares/metricsMiddleware.js';

const router = express.Router();

// Endpoint pour exposer les métriques Prometheus
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des métriques' });
  }
});

// Endpoint de santé pour vérifier que le service fonctionne
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});

export default router; 