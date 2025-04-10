const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Pagina di login
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', { error: null });
});

// Elaborazione login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  User.authenticate(username, password, (err, user) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    if (!user) {
      return res.render('auth/login', { error: 'Credenziali non valide' });
    }
    
    // Salva l'utente nella sessione
    req.session.user = user;
    res.redirect('/');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;