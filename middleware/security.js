const { loggers } = require('../config/logger');
const User = require('../models/user');

// Configurazione sicurezza sessioni
const sessionSecurity = {
  // Verifica se la sessione è valida
  validateSession: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }

    // Verifica se l'account è ancora attivo
    User.getById(req.session.user.id, (err, user) => {
      if (err) {
        loggers.error('Errore nella validazione sessione', err, {
          sessionUserId: req.session.user.id,
          ip: req.ip
        });
        return next();
      }

      if (!user) {
        // Utente eliminato - invalida la sessione
        loggers.warn('Sessione invalidata - utente eliminato', {
          sessionUserId: req.session.user.id,
          ip: req.ip
        });
        req.session.destroy();
        return res.redirect('/login');
      }

      if (user.account_locked) {
        // Account bloccato - invalida la sessione
        loggers.warn('Sessione invalidata - account bloccato', {
          userId: user.id,
          username: user.username,
          ip: req.ip
        });
        req.session.destroy();
        return res.redirect('/login?error=account_locked');
      }

      // Aggiorna i dati utente nella sessione se sono cambiati
      if (user.role !== req.session.user.role || 
          user.name !== req.session.user.name ||
          user.username !== req.session.user.username) {
        
        loggers.info('Aggiornamento dati utente in sessione', {
          userId: user.id,
          changes: {
            role: { old: req.session.user.role, new: user.role },
            name: { old: req.session.user.name, new: user.name },
            username: { old: req.session.user.username, new: user.username }
          }
        });

        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          loginTime: req.session.user.loginTime
        };
      }

      next();
    });
  },

  // Middleware per controllare la durata della sessione
  checkSessionTimeout: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }

    const now = Date.now();
    const loginTime = req.session.user.loginTime || now;
    const sessionDuration = now - loginTime;
    const maxSessionDuration = 8 * 60 * 60 * 1000; // 8 ore

    if (sessionDuration > maxSessionDuration) {
      loggers.info('Sessione scaduta per timeout', {
        userId: req.session.user.id,
        username: req.session.user.username,
        sessionDuration: `${Math.round(sessionDuration / 1000 / 60)} minuti`,
        ip: req.ip
      });

      req.session.destroy();
      return res.redirect('/login?error=session_expired');
    }

    next();
  },

  // Middleware per verificare IP (opzionale - per sicurezza extra)
  checkIpConsistency: (req, res, next) => {
    if (!req.session.user || !req.session.user.loginIp) {
      return next();
    }

    // In produzione potresti voler essere più flessibile con gli IP
    // per gestire NAT, proxy, ecc.
    if (process.env.NODE_ENV === 'production') {
      return next();
    }

    const currentIp = req.ip || req.connection.remoteAddress;
    if (currentIp !== req.session.user.loginIp) {
      loggers.warn('IP diverso per sessione esistente', {
        userId: req.session.user.id,
        username: req.session.user.username,
        loginIp: req.session.user.loginIp,
        currentIp,
        userAgent: req.get('User-Agent')
      });

      // In sviluppo, permetti comunque l'accesso ma logga l'evento
      // In produzione, potresti voler invalidare la sessione
    }

    next();
  },

  // Rate limiting per tentativi di login
  loginRateLimit: (() => {
    const attempts = new Map();
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minuti

    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (!attempts.has(ip)) {
        attempts.set(ip, { count: 0, firstAttempt: now, blocked: false });
      }

      const record = attempts.get(ip);

      // Reset se è passata la finestra temporale
      if (now - record.firstAttempt > windowMs) {
        record.count = 0;
        record.firstAttempt = now;
        record.blocked = false;
      }

      if (record.blocked) {
        const remainingTime = Math.ceil((windowMs - (now - record.firstAttempt)) / 1000 / 60);
        
        loggers.warn('Tentativo di accesso da IP bloccato per rate limiting', {
          ip,
          attempts: record.count,
          remainingTime: `${remainingTime} minuti`,
          userAgent: req.get('User-Agent')
        });

        return res.status(429).render('error', {
          message: `Troppi tentativi di login. Riprova tra ${remainingTime} minuti.`,
          statusCode: 429
        });
      }

      // Se è un tentativo di login POST, incrementa il contatore
      if (req.method === 'POST' && req.path === '/login') {
        record.count++;
        
        if (record.count >= maxAttempts) {
          record.blocked = true;
          
          loggers.warn('IP bloccato per troppi tentativi di login', {
            ip,
            attempts: record.count,
            userAgent: req.get('User-Agent')
          });
        }
      }

      next();
    };
  })(),

  // Middleware per logging delle attività utente
  logUserActivity: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }

    // Log solo per operazioni importanti (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const originalSend = res.send;
      res.send = function(data) {
        // Log solo se l'operazione è riuscita
        if (res.statusCode < 400) {
          loggers.userAction(
            req.session.user.id,
            `${req.method} ${req.route?.path || req.path}`,
            getResourceFromPath(req.path),
            {
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent'),
              data: {
                method: req.method,
                params: req.params,
                statusCode: res.statusCode
              }
            }
          );
        }
        originalSend.call(this, data);
      };
    }

    next();
  },

  // Genera un token CSRF
  generateCsrfToken: (req, res, next) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
  },

  // Verifica token CSRF
  verifyCsrfToken: (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const tokenFromForm = req.body._csrf || req.headers['x-csrf-token'];
    const tokenFromSession = req.session.csrfToken;

    if (!tokenFromForm || !tokenFromSession || tokenFromForm !== tokenFromSession) {
      loggers.warn('Token CSRF non valido', {
        userId: req.session?.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      return res.status(403).render('error', {
        message: 'Token di sicurezza non valido. Ricarica la pagina e riprova.',
        statusCode: 403
      });
    }

    next();
  }
};

// Funzione helper per determinare la risorsa dal path
function getResourceFromPath(path) {
  if (path.includes('/users')) return 'users';
  if (path.includes('/clients')) return 'clients';
  if (path.includes('/contracts')) return 'contracts';
  if (path.includes('/activities')) return 'activities';
  if (path.includes('/products')) return 'products';
  return 'general';
}

module.exports = sessionSecurity;