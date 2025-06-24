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
    fiscal_code: req.body.fiscal_code,
    birth_date: req.body.birth_date,
    birth_place: req.body.birth_place,
    gender: req.body.gender,
    company: req.body.company,
    vat_number: req.body.vat_number,
    company_fiscal_code: req.body.company_fiscal_code,
    company_legal_form: req.body.company_legal_form,
    address: req.body.address,
    city: req.body.city,
    postal_code: req.body.postal_code,
    province: req.body.province,
    legal_address: req.body.legal_address,
    legal_city: req.body.legal_city,
    legal_postal_code: req.body.legal_postal_code,
    legal_province: req.body.legal_province,
    billing_address: req.body.billing_address,
    billing_city: req.body.billing_city,
    billing_postal_code: req.body.billing_postal_code,
    billing_province: req.body.billing_province,
    phone: req.body.phone,
    email: req.body.email,
    pec_email: req.body.pec_email,
    website: req.body.website,
    reference_person: req.body.reference_person,
    client_status: req.body.client_status || 'prospect',
    acquisition_date: req.body.acquisition_date,
    last_contact_date: req.body.last_contact_date,
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
        // Carica anche le utenze per il riepilogo
        const ElectricityUtility = require('../models/electricityUtility');
        const GasUtility = require('../models/gasUtility');
        
        ElectricityUtility.getByClientId(client.id, (err, electricityUtilities) => {
          if (err) electricityUtilities = [];
          
          GasUtility.getByClientId(client.id, (err, gasUtilities) => {
            if (err) gasUtilities = [];
            
            res.render('clients/view', { 
              client, 
              activities, 
              contracts,
              electricity_utilities: electricityUtilities,
              gas_utilities: gasUtilities
            });
          });
        });
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
    fiscal_code: req.body.fiscal_code,
    birth_date: req.body.birth_date,
    birth_place: req.body.birth_place,
    gender: req.body.gender,
    company: req.body.company,
    vat_number: req.body.vat_number,
    company_fiscal_code: req.body.company_fiscal_code,
    company_legal_form: req.body.company_legal_form,
    address: req.body.address,
    city: req.body.city,
    postal_code: req.body.postal_code,
    province: req.body.province,
    legal_address: req.body.legal_address,
    legal_city: req.body.legal_city,
    legal_postal_code: req.body.legal_postal_code,
    legal_province: req.body.legal_province,
    billing_address: req.body.billing_address,
    billing_city: req.body.billing_city,
    billing_postal_code: req.body.billing_postal_code,
    billing_province: req.body.billing_province,
    phone: req.body.phone,
    email: req.body.email,
    pec_email: req.body.pec_email,
    website: req.body.website,
    reference_person: req.body.reference_person,
    client_status: req.body.client_status,
    acquisition_date: req.body.acquisition_date,
    last_contact_date: req.body.last_contact_date,
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