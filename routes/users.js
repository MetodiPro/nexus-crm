const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Lista utenti
router.get('/', (req, res) => {
  User.getAll((err, users) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    res.render('users/index', { users });
  });
});

// Form per nuovo utente
router.get('/new', (req, res) => {
  res.render('users/form', { user: {}, action: '/users/new' });
});

// Crea nuovo utente
router.post('/new', (req, res) => {
  const userData = {
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
    name: req.body.name,
    email: req.body.email
  };
  
  User.create(userData, (err, userId) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nella creazione dell\'utente' });
    }
    res.redirect('/users');
  });
});

// Form per modifica utente
router.get('/edit/:id', (req, res) => {
  User.getById(req.params.id, (err, user) => {
    if (err || !user) {
      return res.status(404).render('error', { message: 'Utente non trovato' });
    }
    res.render('users/form', { user, action: `/users/edit/${user.id}` });
  });
});

// Aggiorna utente
router.post('/edit/:id', (req, res) => {
  const userData = {
    username: req.body.username,
    role: req.body.role,
    name: req.body.name,
    email: req.body.email
  };
  
  // Aggiungi la password solo se specificata
  if (req.body.password && req.body.password.trim() !== '') {
    userData.password = req.body.password;
  }
  
  User.update(req.params.id, userData, (err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nell\'aggiornamento dell\'utente' });
    }
    res.redirect('/users');
  });
});

// Elimina utente
router.get('/delete/:id', (req, res) => {
  User.delete(req.params.id, (err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nell\'eliminazione dell\'utente' });
    }
    res.redirect('/users');
  });
});

module.exports = router;