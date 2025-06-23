const { loggers } = require('../config/logger');

// Middleware per loggare tutte le richieste HTTP
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Intercetta la risposta per loggare anche il tempo di risposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log della richiesta con dettagli
    loggers.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.session?.user?.id,
      username: req.session?.user?.username,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: data ? Buffer.byteLength(data, 'utf8') : 0
    });
    
    // Chiama il metodo originale
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware per loggare errori non gestiti
const errorLogger = (err, req, res, next) => {
  loggers.error('Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.session?.user?.id,
    username: req.session?.user?.username,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(err);
};

// Middleware per audit trail delle azioni utente
const auditMiddleware = (action, resource) => {
  return (req, res, next) => {
    // Log dell'azione dopo che la richiesta è stata processata
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode < 400) { // Solo se l'operazione è riuscita
        loggers.userAction(
          req.session?.user?.id,
          action,
          resource,
          {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            data: {
              method: req.method,
              params: req.params,
              query: req.query,
              body: sanitizeBody(req.body)
            }
          }
        );
      }
      originalSend.call(this, data);
    };
    next();
  };
};

// Funzione per rimuovere dati sensibili dal body delle richieste
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  
  // Rimuovi password e altri dati sensibili
  const sensitiveFields = ['password', 'confirm_password', 'token', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Middleware per loggare le query del database
const dbQueryLogger = (originalMethod, methodName) => {
  return function(...args) {
    const query = args[0];
    const params = args[1] || [];
    const callback = args[args.length - 1];
    
    // Log della query prima dell'esecuzione
    loggers.dbQuery(query, params, { method: methodName });
    
    // Modifica il callback per loggare eventuali errori
    if (typeof callback === 'function') {
      args[args.length - 1] = function(err, ...results) {
        if (err) {
          loggers.dbError(`Database ${methodName} error`, err, query, params);
        }
        callback(err, ...results);
      };
    }
    
    return originalMethod.apply(this, args);
  };
};

module.exports = {
  requestLogger,
  errorLogger,
  auditMiddleware,
  dbQueryLogger,
  sanitizeBody
};