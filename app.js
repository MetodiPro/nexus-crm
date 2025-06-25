const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

// Inizializza il sistema di logging
const { loggers } = require('./config/logger');
const { requestLogger, errorLogger } = require('./middleware/logging');
const sessionSecurity = require('./middleware/security');

const app = express();
const port = 3000;

// Log dell'avvio dell'applicazione
loggers.info('Avvio NEXUS CRM', { port, nodeEnv: process.env.NODE_ENV });

// Trust proxy per gestione corretta degli IP
app.set('trust proxy', 1);

// Middleware di logging delle richieste (deve essere uno dei primi)
app.use(requestLogger);

// Rate limiting per login
app.use('/login', sessionSecurity.loginRateLimit);

// Route upload bollette senza CSRF (PRIMA di tutti i middleware di sicurezza)
const billUploadRoutes = require('./routes/billUpload');
app.use('/api/upload-bill', billUploadRoutes);

// Route di test per debug
const testUploadRoutes = require('./routes/testUpload');
app.use('/api/test', testUploadRoutes);

// Configurazione middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configurazione del motore di template EJS con layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Configurazione della sessione sicura
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexus-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false, // Cambiato a false per sicurezza
  name: 'nexus_sid', // Nome custom per il cookie
  cookie: { 
    maxAge: 8 * 60 * 60 * 1000, // 8 ore
    httpOnly: true, // Impedisce accesso via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS in produzione
    sameSite: 'strict' // Protezione CSRF
  },
  rolling: true // Rinnova cookie ad ogni richiesta
}));

// Middleware di sicurezza sessioni
app.use(sessionSecurity.validateSession);
app.use(sessionSecurity.checkSessionTimeout);
app.use(sessionSecurity.checkIpConsistency);

// Generazione token CSRF
app.use(sessionSecurity.generateCsrfToken);

// Middleware per verificare l'autenticazione
const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    // Salva la URL richiesta per il redirect post-login
    if (req.method === 'GET' && !req.xhr) {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect('/login');
  }
  next();
};

// Middleware per verificare il ruolo admin
const adminMiddleware = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'administrator') {
    loggers.warn('Tentativo di accesso non autorizzato', {
      userId: req.session.user?.id,
      username: req.session.user?.username,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(403).render('error', { 
      message: 'Accesso negato. Richiesti privilegi di amministratore.'
    });
  }
  next();
};

// Inizializza il database
require('./config/database');

// Imposta le variabili globali per le viste
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.csrfToken = req.session.csrfToken || null;
  next();
});

// Middleware per logging delle attività utente
app.use(sessionSecurity.logUserActivity);

// Rotte di autenticazione (non richiedono autenticazione)
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Verifica CSRF per tutte le rotte protette (tranne GET)
app.use(authMiddleware);
app.use(sessionSecurity.verifyCsrfToken);

// Rotte per gli utenti (solo admin)
const userRoutes = require('./routes/users');
app.use('/users', adminMiddleware, userRoutes);

// Rotte per i clienti
const clientRoutes = require('./routes/clients');
app.use('/clients', clientRoutes);

// Rotte per le attività
const activityRoutes = require('./routes/activities');
app.use('/activities', activityRoutes);

// Rotte per i prodotti (solo admin)
const productRoutes = require('./routes/products');
app.use('/products', adminMiddleware, productRoutes);

// Rotte per i contratti
const contractRoutes = require('./routes/contracts');
app.use('/contracts', contractRoutes);

// Rotte per le utenze
const utilityRoutes = require('./routes/utilities');
app.use('/', utilityRoutes);

// Rotte per i punti di fornitura
const supplyPointsRoutes = require('./routes/supplyPoints');
app.use('/supply-points', supplyPointsRoutes);

// Rotte per l'import bollette (versione semplificata)
const billImportRoutes = require('./routes/billImportSimple');
app.use('/', billImportRoutes);

// Rotta homepage
app.get('/', (req, res) => {
  res.render('dashboard');
});

// Endpoint per monitoraggio salute dell'applicazione
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version
  });
});

// Middleware per gestione errori (deve essere uno degli ultimi)
app.use(errorLogger);

// Gestione degli errori 404
app.use((req, res) => {
  loggers.warn('Pagina non trovata', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.session?.user?.id,
    referer: req.get('Referer')
  });
  res.status(404).render('error', { 
    message: 'Pagina non trovata',
    statusCode: 404
  });
});

// Gestione errori generali
app.use((err, req, res, next) => {
  loggers.error('Errore non gestito nell\'applicazione', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.session?.user?.id,
    userAgent: req.get('User-Agent'),
    stack: err.stack
  });
  
  // Non esporre dettagli degli errori in produzione
  const message = process.env.NODE_ENV === 'production' 
    ? 'Si è verificato un errore interno del server' 
    : err.message;
  
  res.status(err.status || 500).render('error', { 
    message,
    statusCode: err.status || 500
  });
});

// Gestione graceful shutdown
const gracefulShutdown = (signal) => {
  loggers.info(`Ricevuto ${signal}, avvio spegnimento graceful...`);
  
  const server = app.listen(port);
  server.close(() => {
    loggers.info('Server HTTP chiuso');
    
    // Chiudi connessioni database e altre risorse
    const db = require('./config/database');
    db.close((err) => {
      if (err) {
        loggers.error('Errore chiusura database', err);
      } else {
        loggers.info('Database chiuso correttamente');
      }
      process.exit(0);
    });
  });

  // Forza chiusura dopo 10 secondi
  setTimeout(() => {
    loggers.error('Spegnimento forzato - timeout raggiunto');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestione errori non catturati
process.on('uncaughtException', (err) => {
  loggers.error('Uncaught Exception - Spegnimento applicazione', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  loggers.error('Unhandled Rejection', new Error(reason), {
    promise: promise.toString()
  });
  // In produzione, potresti voler spegnere l'applicazione
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Avvio del server
const server = app.listen(port, () => {
  const message = `NEXUS CRM avviato su http://localhost:${port}`;
  console.log(message);
  loggers.info('Server avviato con successo', { 
    port, 
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Gestione timeout connessioni
server.timeout = 30000; // 30 secondi

module.exports = app;