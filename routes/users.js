const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { validateUser, validateUserUpdate, validateId } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/logging');
const { loggers } = require('../config/logger');

// Lista utenti
router.get('/', auditMiddleware('LIST', 'users'), (req, res) => {
  User.getAll((err, users) => {
    if (err) {
      loggers.error('Errore nel recupero lista utenti', err, {
        adminUserId: req.session.user.id,
        ip: req.ip
      });
      return res.status(500).render('error', { message: 'Errore del server nel recupero degli utenti' });
    }
    
    res.render('users/index', { 
      users: users || [],
      csrfToken: req.session.csrfToken 
    });
  });
});

// Visualizza dettagli utente
router.get('/view/:id', validateId, auditMiddleware('VIEW', 'users'), (req, res) => {
  User.getById(req.params.id, (err, user) => {
    if (err) {
      loggers.error('Errore nel recupero dettagli utente', err, {
        targetUserId: req.params.id,
        adminUserId: req.session.user.id,
        ip: req.ip
      });
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    
    if (!user) {
      return res.status(404).render('error', { message: 'Utente non trovato' });
    }

    // Ottieni le sessioni attive per questo utente
    User.getActiveSessions(user.id, (err, sessions) => {
      if (err) {
        loggers.error('Errore nel recupero sessioni utente', err);
        sessions = [];
      }

      res.render('users/view', { 
        user, 
        sessions: sessions || [],
        csrfToken: req.session.csrfToken
      });
    });
  });
});

// Form per nuovo utente
router.get('/new', (req, res) => {
  console.log('📝 DEBUG /users/new - Utente in sessione:', {
    id: req.session.user?.id,
    username: req.session.user?.username,
    role: req.session.user?.role,
    name: req.session.user?.name,
    timestamp: new Date().toISOString()
  });
  
  res.render('users/form', { 
    user: {}, 
    action: '/users/new',
    isEdit: false,
    csrfToken: req.session.csrfToken,
    errors: []
  });
});

// Crea nuovo utente con validazione
router.post('/new', validateUser, auditMiddleware('CREATE', 'users'), (req, res) => {
  const userData = {
    username: req.body.username.toLowerCase().trim(),
    password: req.body.password,
    role: req.body.role,
    name: req.body.name.trim(),
    email: req.body.email ? req.body.email.toLowerCase().trim() : null
  };
  
  User.create(userData, (err, userId) => {
    if (err) {
      let errorMessage = 'Errore nella creazione dell\'utente';
      
      if (err.code === 'USERNAME_EXISTS') {
        errorMessage = 'Username già esistente';
        
        return res.status(400).render('users/form', {
          user: userData,
          action: '/users/new',
          isEdit: false,
          error: errorMessage,
          csrfToken: req.session.csrfToken,
          errors: [{ field: 'username', message: errorMessage }]
        });
      }

      loggers.error('Errore nella creazione utente', err, {
        userData: { ...userData, password: '[HIDDEN]' },
        adminUserId: req.session.user.id,
        ip: req.ip
      });

      return res.status(500).render('error', { message: errorMessage });
    }
    
    loggers.info('Nuovo utente creato', {
      newUserId: userId,
      username: userData.username,
      role: userData.role,
      createdBy: req.session.user.id,
      ip: req.ip
    });

    res.redirect('/users');
  });
});

// Form per modifica utente
router.get('/edit/:id', validateId, (req, res) => {
  const userId = parseInt(req.params.id);
  
  User.getById(userId, (err, user) => {
    if (err) {
      loggers.error('Errore nel recupero utente per modifica', err, {
        targetUserId: userId,
        adminUserId: req.session.user.id,
        ip: req.ip
      });
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    
    if (!user) {
      return res.status(404).render('error', { message: 'Utente non trovato' });
    }

    // Impedisci agli utenti di modificare se stessi (per evitare autolock)
    if (userId === req.session.user.id) {
      return res.redirect('/users/profile');
    }

    res.render('users/form', { 
      user, 
      action: `/users/edit/${user.id}`,
      isEdit: true,
      csrfToken: req.session.csrfToken,
      errors: []
    });
  });
});

// Aggiorna utente con validazione
router.post('/edit/:id', validateId, validateUserUpdate, auditMiddleware('UPDATE', 'users'), (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Impedisci agli utenti di modificare se stessi
  if (userId === req.session.user.id) {
    return res.status(403).render('error', { 
      message: 'Non puoi modificare il tuo stesso account da questa pagina. Usa il profilo utente.' 
    });
  }

  const userData = {
    username: req.body.username.toLowerCase().trim(),
    role: req.body.role,
    name: req.body.name.trim(),
    email: req.body.email ? req.body.email.toLowerCase().trim() : null
  };
  
  // Aggiungi la password solo se specificata
  if (req.body.password && req.body.password.trim() !== '') {
    userData.password = req.body.password;
  }
  
  User.update(userId, userData, (err) => {
    if (err) {
      let errorMessage = 'Errore nell\'aggiornamento dell\'utente';
      
      if (err.code === 'USERNAME_EXISTS') {
        errorMessage = 'Username già esistente';
        
        User.getById(userId, (getErr, user) => {
          if (getErr) {
            return res.status(500).render('error', { message: 'Errore del server' });
          }
          
          return res.status(400).render('users/form', {
            user: { ...user, ...userData },
            action: `/users/edit/${userId}`,
            isEdit: true,
            error: errorMessage,
            csrfToken: req.session.csrfToken,
            errors: [{ field: 'username', message: errorMessage }]
          });
        });
        return;
      }

      loggers.error('Errore nell\'aggiornamento utente', err, {
        targetUserId: userId,
        userData: { ...userData, password: userData.password ? '[HIDDEN]' : undefined },
        adminUserId: req.session.user.id,
        ip: req.ip
      });

      return res.status(500).render('error', { message: errorMessage });
    }
    
    loggers.info('Utente aggiornato', {
      targetUserId: userId,
      updatedFields: Object.keys(userData),
      updatedBy: req.session.user.id,
      ip: req.ip
    });

    res.redirect('/users');
  });
});

// Elimina utente
router.get('/delete/:id', validateId, auditMiddleware('DELETE', 'users'), (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Impedisci agli utenti di eliminare se stessi
  if (userId === req.session.user.id) {
    return res.status(403).render('error', { 
      message: 'Non puoi eliminare il tuo stesso account.' 
    });
  }

  User.delete(userId, (err) => {
    if (err) {
      let errorMessage = 'Errore nell\'eliminazione dell\'utente';
      
      if (err.code === 'USER_NOT_FOUND') {
        errorMessage = 'Utente non trovato';
        return res.status(404).render('error', { message: errorMessage });
      }

      loggers.error('Errore nell\'eliminazione utente', err, {
        targetUserId: userId,
        adminUserId: req.session.user.id,
        ip: req.ip
      });

      return res.status(500).render('error', { message: errorMessage });
    }
    
    loggers.info('Utente eliminato', {
      targetUserId: userId,
      deletedBy: req.session.user.id,
      ip: req.ip
    });

    res.redirect('/users');
  });
});

// Sblocca account utente
router.post('/unlock/:id', validateId, auditMiddleware('UNLOCK', 'users'), (req, res) => {
  const userId = parseInt(req.params.id);
  
  User.unlockAccount(userId, (err) => {
    if (err) {
      loggers.error('Errore nello sblocco account', err, {
        targetUserId: userId,
        adminUserId: req.session.user.id,
        ip: req.ip
      });
      
      if (req.xhr) {
        return res.status(500).json({ success: false, message: 'Errore del server' });
      }
      return res.status(500).render('error', { message: 'Errore nello sblocco dell\'account' });
    }
    
    loggers.info('Account sbloccato', {
      targetUserId: userId,
      unlockedBy: req.session.user.id,
      ip: req.ip
    });

    if (req.xhr) {
      return res.json({ success: true, message: 'Account sbloccato con successo' });
    }
    res.redirect(`/users/view/${userId}`);
  });
});

// Profilo utente corrente
router.get('/profile', (req, res) => {
  const userId = req.session.user.id;
  
  User.getById(userId, (err, user) => {
    if (err) {
      loggers.error('Errore nel recupero profilo utente', err, {
        userId,
        ip: req.ip
      });
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    
    if (!user) {
      // Questo non dovrebbe mai succedere, ma per sicurezza
      req.session.destroy();
      return res.redirect('/login');
    }

    // Ottieni le sessioni attive
    User.getActiveSessions(userId, (err, sessions) => {
      if (err) {
        loggers.error('Errore nel recupero sessioni utente per profilo', err);
        sessions = [];
      }

      res.render('users/profile', { 
        user,
        sessions: sessions || [],
        csrfToken: req.session.csrfToken,
        success: req.query.success,
        error: req.query.error
      });
    });
  });
});

// Aggiorna profilo utente corrente
router.post('/profile', (req, res) => {
  const userId = req.session.user.id;
  
  // Validazione base manuale per il profilo
  const errors = [];
  
  if (!req.body.name || req.body.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Il nome deve essere di almeno 2 caratteri' });
  }
  
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    errors.push({ field: 'email', message: 'Email non valida' });
  }

  if (errors.length > 0) {
    User.getById(userId, (err, user) => {
      if (err) {
        return res.status(500).render('error', { message: 'Errore del server' });
      }
      
      return res.render('users/profile', {
        user: { ...user, ...req.body },
        sessions: [],
        csrfToken: req.session.csrfToken,
        errors,
        error: 'Correggi gli errori nel form'
      });
    });
    return;
  }

  const userData = {
    username: req.session.user.username, // Non modificabile nel profilo
    role: req.session.user.role, // Non modificabile nel profilo
    name: req.body.name.trim(),
    email: req.body.email ? req.body.email.toLowerCase().trim() : null
  };
  
  User.update(userId, userData, (err) => {
    if (err) {
      loggers.error('Errore nell\'aggiornamento profilo', err, {
        userId,
        ip: req.ip
      });
      return res.redirect('/users/profile?error=Errore nell\'aggiornamento del profilo');
    }
    
    // Aggiorna i dati nella sessione
    req.session.user.name = userData.name;
    req.session.user.email = userData.email;
    
    loggers.info('Profilo utente aggiornato', {
      userId,
      updatedFields: ['name', 'email'],
      ip: req.ip
    });

    res.redirect('/users/profile?success=Profilo aggiornato con successo');
  });
});

module.exports = router;