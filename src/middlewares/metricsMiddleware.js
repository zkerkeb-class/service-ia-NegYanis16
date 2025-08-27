import prometheus from 'prom-client';

// Configuration du registre Prometheus
const register = prometheus.register;

// Métriques HTTP de base
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Métriques spécifiques au backend CV/Quiz
const quizRequestsTotal = new prometheus.Counter({
  name: 'quiz_requests_total',
  help: 'Total number of quiz-related requests',
  labelNames: ['operation', 'status']
});

const quizGenerationDuration = new prometheus.Histogram({
  name: 'quiz_generation_duration_seconds',
  help: 'Duration of quiz generation operations in seconds',
  labelNames: ['type'],
  buckets: [1, 5, 10, 30, 60]
});

const openaiRequestsTotal = new prometheus.Counter({
  name: 'openai_requests_total',
  help: 'Total number of OpenAI API requests',
  labelNames: ['operation', 'status']
});

const openaiResponseTime = new prometheus.Histogram({
  name: 'openai_response_time_seconds',
  help: 'OpenAI API response time in seconds',
  labelNames: ['operation'],
  buckets: [0.5, 1, 2, 5, 10, 30]
});

// Métriques système
const processCpuUsage = new prometheus.Gauge({
  name: 'process_cpu_usage_percent',
  help: 'CPU usage percentage'
});

const processMemoryUsage = new prometheus.Gauge({
  name: 'process_memory_usage_bytes',
  help: 'Memory usage in bytes'
});

// Middleware pour collecter les métriques HTTP
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convertir en secondes
    const route = req.route ? req.route.path : req.path;
    
    // Enregistrer les métriques HTTP
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Fonction pour mettre à jour les métriques système
const updateSystemMetrics = () => {
  const usage = process.cpuUsage();
  const memUsage = process.memoryUsage();
  
  // CPU usage (approximation)
  processCpuUsage.set(usage.user / 1000000);
  
  // Memory usage
  processMemoryUsage.set(memUsage.heapUsed);
};

// Mettre à jour les métriques système toutes les 30 secondes
setInterval(updateSystemMetrics, 30000);

// Fonction pour enregistrer les requêtes de quiz
export const recordQuizRequest = (operation, status) => {
  quizRequestsTotal
    .labels(operation, status)
    .inc();
};

// Fonction pour mesurer la durée de génération de quiz
export const recordQuizGenerationDuration = (type, duration) => {
  quizGenerationDuration
    .labels(type)
    .observe(duration);
};

// Fonction pour enregistrer les requêtes OpenAI
export const recordOpenAIRequest = (operation, status) => {
  openaiRequestsTotal
    .labels(operation, status)
    .inc();
};

// Fonction pour mesurer le temps de réponse OpenAI
export const recordOpenAIResponseTime = (operation, duration) => {
  openaiResponseTime
    .labels(operation)
    .observe(duration);
};

export {
  register,
  httpRequestDurationMicroseconds,
  httpRequestTotal,
  quizRequestsTotal,
  quizGenerationDuration,
  openaiRequestsTotal,
  openaiResponseTime,
  processCpuUsage,
  processMemoryUsage
}; 