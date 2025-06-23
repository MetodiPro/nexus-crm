const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { validateLogin } = require('../middleware/validation');
const { loggers } = require('../config/logger');

// Pagina di login
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }

  const error = req.query.error;
  let errorMessage = null;

  switch (error) {
    case 'account_locked':
      errorMessage = 'Account bloccato per troppi tentativi di login falliti. Contatta l\'amministratore.';
      break;
    case 'session_expired':
      errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
      break;
    case 'invalid_credentials':
      errorMessage = 'Username o password non corretti.';
      break;
    case 'server_error':
      errorMessage = 'Si è verificato un errore del server. Riprova più tardi.';
      break;
  }

  res.render('auth/login', { 
    error: errorMessage,
    csrfToken: req.session.csrfToken 
  });
});

// Elaborazione login con sicurezza avanzata
router.post('/login', validateLogin, (req, res) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  User.authenticate(username, password, ipAddress, userAgent, (err, user, status) => {
    if (err) {
      loggers.error('Errore durante autenticazione', err, {
        username,
        ip: ipAddress,
        userAgent
      });
      return res.redirect('/login?error=server_error');
    }

    // Gestisci i diversi stati di autenticazione
    switch (status) {
      case 'USERNAME_NOT_FOUND':
      case 'INVALID_PASSWORD':
        return res.render('auth/login', { 
          error: 'Username o password non corretti.',
          csrfToken: req.session.csrfToken,
          username // Mantieni lo username nel form
        });

      case 'ACCOUNT_LOCKED':
        return res.render('auth/login', { 
          error: 'Account bloccato per troppi tentativi di login falliti. Contatta l\'amministratore.',
          csrfToken: req.session.csrfToken
        });

      case 'SUCCESS':
        // Login riuscito - configura la sessione
        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          loginTime: Date.now(),
          loginIp: ipAddress
        };

        // Regenera l'ID di sessione per sicurezza
        req.session.regenerate((err) => {
          if (err) {
            loggers.error('Errore nella rigenerazione sessione', err);
            return res.redirect('/login?error=server_error');
          }

          // Ripristina i dati utente dopo la rigenerazione
          req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            email: user.email,
            loginTime: Date.now(),
            loginIp: ipAddress
          };

          // Log sessione utente con session ID reale
          User.logUserSession(user.id, ipAddress, userAgent, (err, sessionLogId) => {
            if (!err && sessionLogId) {
              req.session.sessionLogId = sessionLogId;
              // Aggiorna con il session ID reale
              User.updateSessionId(sessionLogId, req.sessionID, (err) => {
                if (err) {
                  loggers.error('Errore nell\'aggiornamento session ID reale', err);
                }
              });
            }
          });

          loggers.info('Login completato con successo', {
            userId: user.id,
            username: user.username,
            role: user.role,
            ip: ipAddress,
            sessionId: req.sessionID
          });

          // Reindirizza alla pagina richiesta o alla dashboard
          const redirectTo = req.session.returnTo || '/';
          delete req.session.returnTo;
          res.redirect(redirectTo);
        });
        break;

      default:
        loggers.error('Stato di autenticazione sconosciuto', null, {
          username,
          status,
          ip: ipAddress
        });
        return res.redirect('/login?error=server_error');
    }
  });
});

// Logout sicuro
router.get('/logout', (req, res) => {
  if (req.session.user) {
    const userId = req.session.user.id;
    const username = req.session.user.username;
    const sessionLogId = req.session.sessionLogId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Log del logout
    loggers.logout(userId, username, ipAddress);

    // Aggiorna il log della sessione nel database
    if (sessionLogId) {
      User.logoutSession(req.sessionID, (err) => {
        if (err) {
          loggers.error('Errore nel log logout sessione', err);
        }
      });
    }

    // Distruggi la sessione
    req.session.destroy((err) => {
      if (err) {
        loggers.error('Errore nella distruzione sessione durante logout', err);
      }
      
      // Rimuovi il cookie di sessione
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  } else {
    res.redirect('/login');
  }
});

// Pagina di cambio password per utenti loggati
router.get('/change-password', (req, res) => {
  if (!req.session.user) {
    req.session.returnTo = '/change-password';
    return res.redirect('/login');
  }

  res.render('auth/change-password', {
    user: req.session.user,
    error: null,
    success: null,
    csrfToken: req.session.csrfToken
  });
});

// Elaborazione cambio password
router.post('/change-password', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  // Validazione base
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.render('auth/change-password', {
      user: req.session.user,
      error: 'Tutti i campi sono obbligatori.',
      success: null,
      csrfToken: req.session.csrfToken
    });
  }

  if (newPassword !== confirmPassword) {
    return res.render('auth/change-password', {
      user: req.session.user,
      error: 'Le nuove password non coincidono.',
      success: null,
      csrfToken: req.session.csrfToken
    });
  }

  if (newPassword.length < 8) {
    return res.render('auth/change-password', {
      user: req.session.user,
      error: 'La nuova password deve essere di almeno 8 caratteri.',
      success: null,
      csrfToken: req.session.csrfToken
    });
  }

  // Validazione password forte
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    return res.render('auth/change-password', {
      user: req.session.user,
      error: 'La password deve contenere almeno una lettera minuscola, una maiuscola e un numero.',
      success: null,
      csrfToken: req.session.csrfToken
    });
  }

  User.changePassword(userId, currentPassword, newPassword, (err) => {
    if (err) {
      let errorMessage = 'Errore interno del server.';
      
      if (err.code === 'INVALID_CURRENT_PASSWORD') {
        errorMessage = 'Password attuale non corretta.';
      }

      loggers.error('Errore nel cambio password', err, {
        userId,
        username: req.session.user.username
      });

      return res.render('auth/change-password', {
        user: req.session.user,
        error: errorMessage,
        success: null,
        csrfToken: req.session.csrfToken
      });
    }

    loggers.info('Password cambiata con successo', {
      userId,
      username: req.session.user.username,
      ip: req.ip
    });

    res.render('auth/change-password', {
      user: req.session.user,
      error: null,
      success: 'Password cambiata con successo!',
      csrfToken: req.session.csrfToken
    });
  });
});

// Endpoint per verificare lo stato della sessione (AJAX)
router.get('/session-status', (req, res) => {
  if (!req.session.user) {
    return res.json({ valid: false });
  }

  User.getById(req.session.user.id, (err, user) => {
    if (err || !user || user.account_locked) {
      return res.json({ valid: false });
    }

    res.json({ 
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  });
});

module.exports = router;