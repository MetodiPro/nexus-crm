const express = require('express');
const router = express.Router();
const Client = require('../models/client');
const Activity = require('../models/activity');
const Contract = require('../models/contract');

// Lista clienti
router.get('/', (req, res) => {
  // Se l'utente è admin, mostra tutti i clienti, altrimenti filtra per consulente
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  Client.getAll(consultantId, (err, clients) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    res.render('clients/index', { clients });
  });
});

// Form per nuovo cliente
router.get('/new', (req, res) => {
  res.render('clients/form', { client: {}, action: '/clients/new' });
});

// Crea nuovo cliente
router.post('/new', (req, res) => {
  const clientData = {
    name: req.body.name,
    surname: req.body.surname,
    company: req.body.company,
    vat_number: req.body.vat_number,
    address: req.body.address,
    city: req.body.city,
    postal_code: req.body.postal_code,
    phone: req.body.phone,
    email: req.body.email,
    notes: req.body.notes,
    consultant_id: req.session.user.id
  };
  
  Client.create(clientData, (err, clientId) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nella creazione del cliente' });
    }
    res.redirect('/clients');
  });
});

// Visualizza dettagli cliente
router.get('/view/:id', (req, res) => {
  Client.getById(req.params.id, (err, client) => {
    if (err || !client) {
      return res.status(404).render('error', { message: 'Cliente non trovato' });
    }
    
    // Carica attività e contratti del cliente
    Activity.getByClientId(client.id, (err, activities) => {
      Contract.getByClientId(client.id, (err, contracts) => {
        res.render('clients/view', { client, activities, contracts });
      });
    });
  });
});

// Form per modifica cliente
router.get('/edit/:id', (req, res) => {
  Client.getById(req.params.id, (err, client) => {
    if (err || !client) {
      return res.status(404).render('error', { message: 'Cliente non trovato' });
    }
    res.render('clients/form', { client, action: `/clients/edit/${client.id}` });
  });
});

// Aggiorna cliente
router.post('/edit/:id', (req, res) => {
  const clientData = {
    name: req.body.name,
    surname: req.body.surname,
    company: req.body.company,
    vat_number: req.body.vat_number,
    address: req.body.address,
    city: req.body.city,
    postal_code: req.body.postal_code,
    phone: req.body.phone,
    email: req.body.email,
    notes: req.body.notes
  };
  
  Client.update(req.params.id, clientData, (err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nell\'aggiornamento del cliente' });
    }
    res.redirect('/clients');
  });
});

// Elimina cliente
router.get('/delete/:id', (req, res) => {
  Client.delete(req.params.id, (err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nell\'eliminazione del cliente' });
    }
    res.redirect('/clients');
  });
});

// Ricerca clienti
router.get('/search', (req, res) => {
    const searchTerm = req.query.term;
    const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
    
    if (!searchTerm) {
      return res.redirect('/clients');
    }
    
    Client.search(searchTerm, consultantId, (err, clients) => {
      if (err) {
        return res.status(500).render('error', { message: 'Errore durante la ricerca' });
      }
      res.render('clients/index', { clients, searchTerm });
    });
  });
  
  module.exports = router;