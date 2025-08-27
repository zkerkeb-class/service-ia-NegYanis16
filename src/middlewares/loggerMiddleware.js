import logger from '../config/logger.js';

export const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Log de la requête entrante
  logger.http(`${req.method} ${req.originalUrl} - ${req.ip}`);
  
  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    // Log selon le code de statut
    if (res.statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.http(logMessage);
    }
  });
  
  next();
}; 