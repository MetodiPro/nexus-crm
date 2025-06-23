const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Assicurati che la directory logs esista
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configurazione trasporti per log rotativi
const transport = new DailyRotateFile({
  filename: path.join(logDir, 'nexus-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const errorTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error'
});

// Logger principale
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (stack) {
        log += `\n${stack}`;
      }
      if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }
      return log;
    })
  ),
  defaultMeta: { service: 'nexus-crm' },
  transports: [
    transport,
    errorTransport
  ]
});

// Aggiungi console in sviluppo
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Logger specifico per il database
const dbLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'nexus-db' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'database-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '7d'
    })
  ]
});

// Logger per audit trail (azioni utenti)
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'nexus-audit' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: '90d' // Conserva audit per 3 mesi
    })
  ]
});

// Funzioni helper per logging strutturato
const loggers = {
  // Log generale
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, error = null, meta = {}) => {
    if (error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, meta);
    }
  },
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Log database
  dbQuery: (query, params = [], meta = {}) => {
    dbLogger.debug('Database query executed', {
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      ...meta
    });
  },
  dbError: (message, error, query = null, params = []) => {
    dbLogger.error(message, {
      error: error.message,
      stack: error.stack,
      query,
      params
    });
  },

  // Log audit trail
  userAction: (userId, action, resource, details = {}) => {
    auditLogger.info('User action', {
      userId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      ip: details.ip,
      userAgent: details.userAgent,
      details: details.data || {}
    });
  },

  // Log autenticazione
  login: (userId, username, success, ip, userAgent) => {
    auditLogger.info('Login attempt', {
      userId,
      username,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  logout: (userId, username, ip) => {
    auditLogger.info('User logout', {
      userId,
      username,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { logger, dbLogger, auditLogger, loggers };