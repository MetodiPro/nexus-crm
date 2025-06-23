const express = require('express');
const router = express.Router();
const Contract = require('../models/contract');
const Client = require('../models/client');
const Product = require('../models/product');

// Lista contratti
router.get('/', (req, res) => {
  // Se l'utente è admin, mostra tutti i contratti, altrimenti filtra per consulente
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  // Gestione degli errori migliorata
  Contract.getAll(consultantId, (err, contracts) => {
    if (err) {
      console.error('Errore nel recupero dei contratti:', err);
      return res.status(500).render('error', { message: 'Errore del server durante il recupero dei contratti' });
    }
    
    // Assicurati che contracts sia sempre un array
    contracts = contracts || [];
    
    res.render('contracts/index', { contracts });
  });
});

// Form per nuovo contratto
router.get('/new', (req, res) => {
  const clientId = req.query.client_id || '';
  
  // Ottieni la lista dei clienti e dei prodotti attivi per i dropdown
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  Client.getAll(consultantId, (err, clients) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    
    Product.getActive((err, products) => {
      if (err) {
        return res.status(500).render('error', { message: 'Errore del server' });
      }
      
      res.render('contracts/form', { 
        contract: { 
          client_id: clientId, 
          start_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        }, 
        clients: clients || [],
        products: products || [],
        action: '/contracts/new' 
      });
    });
  });
});

// Crea nuovo contratto
router.post('/new', (req, res) => {
  const contractData = {
    client_id: req.body.client_id,
    product_id: req.body.product_id || null,
    contract_type: req.body.contract_type,
    energy_type: req.body.energy_type,
    supplier: req.body.supplier,
    status: req.body.status,
    value: req.body.value,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    notes: req.body.notes,
    consultant_id: req.session.user.id
  };
  
  Contract.create(contractData, (err, contractId) => {
    if (err) {
      console.error('Errore nella creazione del contratto:', err);
      return res.status(500).render('error', { message: 'Errore nella creazione del contratto' });
    }
    
    // Reindirizza alla pagina del cliente se specificato
    if (req.body.redirect_to_client) {
      return res.redirect(`/clients/view/${req.body.client_id}`);
    }
    
    res.redirect('/contracts');
  });
});

// Visualizza dettagli contratto
router.get('/view/:id', (req, res) => {
  Contract.getById(req.params.id, (err, contract) => {
    if (err) {
      console.error('Errore nel recupero del contratto:', err);
      return res.status(500).render('error', { message: 'Errore nel recupero del contratto' });
    }
    
    if (!contract) {
      return res.status(404).render('error', { message: 'Contratto non trovato' });
    }
    
    res.render('contracts/view', { contract });
  });
});

// Form per modifica contratto
router.get('/edit/:id', (req, res) => {
  Contract.getById(req.params.id, (err, contract) => {
    if (err) {
      console.error('Errore nel recupero del contratto:', err);
      return res.status(500).render('error', { message: 'Errore nel recupero del contratto' });
    }
    
    if (!contract) {
      return res.status(404).render('error', { message: 'Contratto non trovato' });
    }
    
    // Ottieni la lista dei clienti e dei prodotti per i dropdown
    const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
    
    Client.getAll(consultantId, (err, clients) => {
      if (err) {
        return res.status(500).render('error', { message: 'Errore del server' });
      }
      
      Product.getAll((err, products) => {
        if (err) {
          return res.status(500).render('error', { message: 'Errore del server' });
        }
        
        res.render('contracts/form', { 
          contract, 
          clients: clients || [],
          products: products || [],
          action: `/contracts/edit/${contract.id}` 
        });
      });
    });
  });
});

// Aggiorna contratto
router.post('/edit/:id', (req, res) => {
  const contractData = {
    client_id: req.body.client_id,
    product_id: req.body.product_id || null,
    contract_type: req.body.contract_type,
    energy_type: req.body.energy_type,
    supplier: req.body.supplier,
    status: req.body.status,
    value: req.body.value,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    notes: req.body.notes
  };
  
  Contract.update(req.params.id, contractData, (err) => {
    if (err) {
      console.error('Errore nell\'aggiornamento del contratto:', err);
      return res.status(500).render('error', { message: 'Errore nell\'aggiornamento del contratto' });
    }
    
    // Reindirizza alla pagina del cliente se specificato
    if (req.body.redirect_to_client) {
      return res.redirect(`/clients/view/${req.body.client_id}`);
    }
    
    res.redirect('/contracts');
  });
});

// Elimina contratto
router.get('/delete/:id', (req, res) => {
  Contract.getById(req.params.id, (err, contract) => {
    if (err) {
      console.error('Errore nel recupero del contratto:', err);
      return res.status(500).render('error', { message: 'Errore nel recupero del contratto' });
    }
    
    if (!contract) {
      return res.status(404).render('error', { message: 'Contratto non trovato' });
    }
    
    const clientId = contract.client_id;
    
    Contract.delete(req.params.id, (err) => {
      if (err) {
        console.error('Errore nell\'eliminazione del contratto:', err);
        return res.status(500).render('error', { message: 'Errore nell\'eliminazione del contratto' });
      }
      
      // Reindirizza alla pagina del cliente se viene da lì
      if (req.query.from_client) {
        return res.redirect(`/clients/view/${clientId}`);
      }
      
      res.redirect('/contracts');
    });
  });
});

// Statistiche contratti
router.get('/stats', (req, res) => {
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  Contract.getStatsByEnergyType(consultantId, (err, stats) => {
    if (err) {
      console.error('Errore nel recupero delle statistiche:', err);
      return res.status(500).render('error', { message: 'Errore nel recupero delle statistiche' });
    }
    
    res.render('contracts/stats', { stats: stats || [] });
  });
});

// API: Ottieni dettagli prodotto per autocompilazione
router.get('/api/product/:id', (req, res) => {
  Product.getById(req.params.id, (err, product) => {
    if (err) {
      console.error('Errore nel recupero del prodotto:', err);
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }
    
    res.json(product);
  });
});

module.exports = router;