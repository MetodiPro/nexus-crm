const { loggers } = require('../config/logger');

// Middleware per verificare l'autenticazione
const requireAuth = (req, res, next) => {
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
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      loggers.warn('Tentativo di accesso non autorizzato', {
        userId: req.session.user?.id,
        username: req.session.user?.username,
        role: req.session.user?.role,
        requiredRoles: allowedRoles,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).render('error', { 
        message: 'Accesso negato. Privilegi insufficienti.',
        statusCode: 403
      });
    }
    
    next();
  };
};

// Middleware per verificare che l'utente sia admin
const requireAdmin = requireRole(['administrator']);

// Middleware per verificare che l'utente sia admin o manager
const requireManager = requireRole(['administrator', 'manager']);

// Middleware per verificare che l'utente possa accedere ai propri dati o sia admin
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.params.id || req.params.userId;
  const isAdmin = req.session.user.role === 'administrator';
  const isOwner = req.session.user.id.toString() === userId;

  if (!isAdmin && !isOwner) {
    loggers.warn('Tentativo di accesso a dati di altro utente', {
      userId: req.session.user.id,
      username: req.session.user.username,
      attemptedUserId: userId,
      url: req.originalUrl,
      ip: req.ip
    });

    return res.status(403).render('error', { 
      message: 'Accesso negato. Puoi accedere solo ai tuoi dati.',
      statusCode: 403
    });
  }

  next();
};

// Middleware per filtrare i dati in base al ruolo
const filterByRole = (req, res, next) => {
  // Gli admin vedono tutto, gli altri vedono solo i propri dati
  if (req.session.user.role !== 'administrator') {
    req.consultantFilter = req.session.user.id;
  }
  next();
};

// Middleware per logging delle azioni utente
const logUserAction = (action, resource = null) => {
  return (req, res, next) => {
    if (req.session.user) {
      const originalSend = res.send;
      res.send = function(data) {
        // Log solo se l'operazione è riuscita
        if (res.statusCode < 400) {
          loggers.userAction(
            req.session.user.id,
            action,
            resource || getResourceFromPath(req.path),
            {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              params: req.params,
              statusCode: res.statusCode
            }
          );
        }
        originalSend.call(this, data);
      };
    }
    next();
  };
};

// Funzione helper per determinare la risorsa dal path
function getResourceFromPath(path) {
  if (path.includes('/users')) return 'users';
  if (path.includes('/clients')) return 'clients';
  if (path.includes('/contracts')) return 'contracts';
  if (path.includes('/activities')) return 'activities';
  if (path.includes('/products')) return 'products';
  if (path.includes('/utilities')) return 'utilities';
  return 'general';
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireManager,
  requireOwnerOrAdmin,
  filterByRole,
  logUserAction
};