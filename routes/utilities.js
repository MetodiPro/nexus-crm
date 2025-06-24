const express = require('express');
const router = express.Router();
const Client = require('../models/client');
const ElectricityUtility = require('../models/electricityUtility');
const GasUtility = require('../models/gasUtility');
// Middleware per verificare l'autenticazione - utilizziamo la logica di app.js
const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    if (req.method === 'GET' && !req.xhr) {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect('/login');
  }
  next();
};

// Middleware per tutte le route utenze
router.use(authMiddleware);

// GET /clients/:id/utilities - Pagina gestione utenze cliente
router.get('/clients/:id/utilities', (req, res) => {
  const clientId = req.params.id;
  
  // Ottieni cliente con tutte le utenze
  Client.getById(clientId, (err, client) => {
    if (err) {
      console.error('Errore nel recupero cliente:', err);
      return res.status(500).render('error', { 
        message: 'Errore nel recupero dati cliente',
        error: err 
      });
    }
    
    if (!client) {
      return res.status(404).render('error', { 
        message: 'Cliente non trovato',
        error: { status: 404 } 
      });
    }
    
    // Ottieni utenze elettriche
    ElectricityUtility.getByClientId(clientId, (err, electricityUtilities) => {
      if (err) {
        console.error('Errore nel recupero utenze elettriche:', err);
        return res.status(500).render('error', { 
          message: 'Errore nel recupero utenze elettriche',
          error: err 
        });
      }
      
      // Ottieni utenze gas
      GasUtility.getByClientId(clientId, (err, gasUtilities) => {
        if (err) {
          console.error('Errore nel recupero utenze gas:', err);
          return res.status(500).render('error', { 
            message: 'Errore nel recupero utenze gas',
            error: err 
          });
        }
        
        // Calcola statistiche consumi
        ElectricityUtility.getConsumptionStats(clientId, (err, electricityStats) => {
          if (err) electricityStats = {};
          
          GasUtility.getConsumptionStats(clientId, (err, gasStats) => {
            if (err) gasStats = {};
            
            res.render('utilities/manage', {
              title: `Gestione Utenze - ${client.name} ${client.surname}`,
              client,
              electricityUtilities: electricityUtilities || [],
              gasUtilities: gasUtilities || [],
              electricityStats: electricityStats[0] || {},
              gasStats: gasStats[0] || {},
              user: req.user
            });
          });
        });
      });
    });
  });
});

// GET /clients/:id/utilities/electric/new - Form nuova utenza elettrica
router.get('/clients/:id/utilities/electric/new', (req, res) => {
  const clientId = req.params.id;
  
  Client.getById(clientId, (err, client) => {
    if (err || !client) {
      return res.status(404).render('error', { 
        message: 'Cliente non trovato',
        error: { status: 404 } 
      });
    }
    
    res.render('utilities/electric-form', {
      title: 'Nuova Utenza Elettrica',
      client,
      utility: {},
      action: `/clients/${clientId}/utilities/electric`,
      user: req.user
    });
  });
});

// POST /clients/:id/utilities/electric - Crea nuova utenza elettrica
router.post('/clients/:id/utilities/electric', (req, res) => {
  const clientId = req.params.id;
  const utilityData = {
    client_id: clientId,
    ...req.body
  };
  
  // Validazione POD
  if (!ElectricityUtility.validatePod(utilityData.pod_code)) {
    req.session.error = 'Formato POD non valido. Formato corretto: IT001E10510063';
    return res.redirect(`/clients/${clientId}/utilities/electric/new`);
  }
  
  ElectricityUtility.create(utilityData, (err, utilityId) => {
    if (err) {
      console.error('Errore nella creazione utenza elettrica:', err);
      req.session.error = 'Errore nella creazione dell\'utenza elettrica';
      return res.redirect(`/clients/${clientId}/utilities/electric/new`);
    }
    
    req.session.success = 'Utenza elettrica creata con successo';
    res.redirect(`/clients/${clientId}/utilities`);
  });
});

// GET /utilities/electric/:id/edit - Form modifica utenza elettrica
router.get('/utilities/electric/:id/edit', (req, res) => {
  const utilityId = req.params.id;
  
  ElectricityUtility.getById(utilityId, (err, utility) => {
    if (err || !utility) {
      return res.status(404).render('error', { 
        message: 'Utenza elettrica non trovata',
        error: { status: 404 } 
      });
    }
    
    Client.getById(utility.client_id, (err, client) => {
      if (err || !client) {
        return res.status(404).render('error', { 
          message: 'Cliente non trovato',
          error: { status: 404 } 
        });
      }
      
      res.render('utilities/electric-form', {
        title: 'Modifica Utenza Elettrica',
        client,
        utility,
        action: `/utilities/electric/${utilityId}`,
        user: req.user
      });
    });
  });
});

// POST /utilities/electric/:id - Aggiorna utenza elettrica
router.post('/utilities/electric/:id', (req, res) => {
  const utilityId = req.params.id;
  const utilityData = req.body;
  
  // Validazione POD
  if (!ElectricityUtility.validatePod(utilityData.pod_code)) {
    req.session.error = 'Formato POD non valido. Formato corretto: IT001E10510063';
    return res.redirect(`/utilities/electric/${utilityId}/edit`);
  }
  
  ElectricityUtility.update(utilityId, utilityData, (err) => {
    if (err) {
      console.error('Errore nell\'aggiornamento utenza elettrica:', err);
      req.session.error = 'Errore nell\'aggiornamento dell\'utenza elettrica';
      return res.redirect(`/utilities/electric/${utilityId}/edit`);
    }
    
    // Ottieni client_id per redirect
    ElectricityUtility.getById(utilityId, (err, utility) => {
      const clientId = utility ? utility.client_id : req.body.client_id;
      req.session.success = 'Utenza elettrica aggiornata con successo';
      res.redirect(`/clients/${clientId}/utilities`);
    });
  });
});

// GET /clients/:id/utilities/gas/new - Form nuova utenza gas
router.get('/clients/:id/utilities/gas/new', (req, res) => {
  const clientId = req.params.id;
  
  Client.getById(clientId, (err, client) => {
    if (err || !client) {
      return res.status(404).render('error', { 
        message: 'Cliente non trovato',
        error: { status: 404 } 
      });
    }
    
    res.render('utilities/gas-form', {
      title: 'Nuova Utenza Gas',
      client,
      utility: {},
      action: `/clients/${clientId}/utilities/gas`,
      user: req.user
    });
  });
});

// POST /clients/:id/utilities/gas - Crea nuova utenza gas
router.post('/clients/:id/utilities/gas', (req, res) => {
  const clientId = req.params.id;
  const utilityData = {
    client_id: clientId,
    ...req.body
  };
  
  // Validazione PDR
  if (!GasUtility.validatePdr(utilityData.pdr_code)) {
    req.session.error = 'Formato PDR non valido. Deve contenere 8-14 cifre';
    return res.redirect(`/clients/${clientId}/utilities/gas/new`);
  }
  
  GasUtility.create(utilityData, (err, utilityId) => {
    if (err) {
      console.error('Errore nella creazione utenza gas:', err);
      req.session.error = 'Errore nella creazione dell\'utenza gas';
      return res.redirect(`/clients/${clientId}/utilities/gas/new`);
    }
    
    req.session.success = 'Utenza gas creata con successo';
    res.redirect(`/clients/${clientId}/utilities`);
  });
});

// GET /utilities/gas/:id/edit - Form modifica utenza gas
router.get('/utilities/gas/:id/edit', (req, res) => {
  const utilityId = req.params.id;
  
  GasUtility.getById(utilityId, (err, utility) => {
    if (err || !utility) {
      return res.status(404).render('error', { 
        message: 'Utenza gas non trovata',
        error: { status: 404 } 
      });
    }
    
    Client.getById(utility.client_id, (err, client) => {
      if (err || !client) {
        return res.status(404).render('error', { 
          message: 'Cliente non trovato',
          error: { status: 404 } 
        });
      }
      
      res.render('utilities/gas-form', {
        title: 'Modifica Utenza Gas',
        client,
        utility,
        action: `/utilities/gas/${utilityId}`,
        user: req.user
      });
    });
  });
});

// POST /utilities/gas/:id - Aggiorna utenza gas
router.post('/utilities/gas/:id', (req, res) => {
  const utilityId = req.params.id;
  const utilityData = req.body;
  
  // Validazione PDR
  if (!GasUtility.validatePdr(utilityData.pdr_code)) {
    req.session.error = 'Formato PDR non valido. Deve contenere 8-14 cifre';
    return res.redirect(`/utilities/gas/${utilityId}/edit`);
  }
  
  GasUtility.update(utilityId, utilityData, (err) => {
    if (err) {
      console.error('Errore nell\'aggiornamento utenza gas:', err);
      req.session.error = 'Errore nell\'aggiornamento dell\'utenza gas';
      return res.redirect(`/utilities/gas/${utilityId}/edit`);
    }
    
    // Ottieni client_id per redirect
    GasUtility.getById(utilityId, (err, utility) => {
      const clientId = utility ? utility.client_id : req.body.client_id;
      req.session.success = 'Utenza gas aggiornata con successo';
      res.redirect(`/clients/${clientId}/utilities`);
    });
  });
});

// POST /utilities/electric/:id/deactivate - Disattiva utenza elettrica
router.post('/utilities/electric/:id/deactivate', (req, res) => {
  const utilityId = req.params.id;
  
  ElectricityUtility.getById(utilityId, (err, utility) => {
    if (err || !utility) {
      req.session.error = 'Utenza non trovata';
      return res.redirect('/clients');
    }
    
    ElectricityUtility.deactivate(utilityId, (err) => {
      if (err) {
        console.error('Errore nella disattivazione utenza elettrica:', err);
        req.session.error = 'Errore nella disattivazione dell\'utenza';
      } else {
        req.session.success = 'Utenza elettrica disattivata con successo';
      }
      
      res.redirect(`/clients/${utility.client_id}/utilities`);
    });
  });
});

// POST /utilities/gas/:id/deactivate - Disattiva utenza gas
router.post('/utilities/gas/:id/deactivate', (req, res) => {
  const utilityId = req.params.id;
  
  GasUtility.getById(utilityId, (err, utility) => {
    if (err || !utility) {
      req.session.error = 'Utenza non trovata';
      return res.redirect('/clients');
    }
    
    GasUtility.deactivate(utilityId, (err) => {
      if (err) {
        console.error('Errore nella disattivazione utenza gas:', err);
        req.session.error = 'Errore nella disattivazione dell\'utenza';
      } else {
        req.session.success = 'Utenza gas disattivata con successo';
      }
      
      res.redirect(`/clients/${utility.client_id}/utilities`);
    });
  });
});

// DELETE /utilities/electric/:id - Elimina utenza elettrica
router.delete('/utilities/electric/:id', (req, res) => {
  const utilityId = req.params.id;
  
  ElectricityUtility.getById(utilityId, (err, utility) => {
    if (err || !utility) {
      return res.status(404).json({ success: false, message: 'Utenza non trovata' });
    }
    
    ElectricityUtility.delete(utilityId, (err) => {
      if (err) {
        console.error('Errore nell\'eliminazione utenza elettrica:', err);
        return res.status(500).json({ success: false, message: 'Errore nell\'eliminazione' });
      }
      
      res.json({ success: true, message: 'Utenza elettrica eliminata con successo' });
    });
  });
});

// DELETE /utilities/gas/:id - Elimina utenza gas
router.delete('/utilities/gas/:id', (req, res) => {
  const utilityId = req.params.id;
  
  GasUtility.getById(utilityId, (err, utility) => {
    if (err || !utility) {
      return res.status(404).json({ success: false, message: 'Utenza non trovata' });
    }
    
    GasUtility.delete(utilityId, (err) => {
      if (err) {
        console.error('Errore nell\'eliminazione utenza gas:', err);
        return res.status(500).json({ success: false, message: 'Errore nell\'eliminazione' });
      }
      
      res.json({ success: true, message: 'Utenza gas eliminata con successo' });
    });
  });
});

// GET /utilities/search - Ricerca utenze per POD/PDR
router.get('/utilities/search', (req, res) => {
  const { q: searchTerm, type } = req.query;
  
  if (!searchTerm) {
    return res.json([]);
  }
  
  if (type === 'electric' || !type) {
    ElectricityUtility.searchByPod(searchTerm, (err, electricResults) => {
      if (err) electricResults = [];
      
      if (type === 'electric') {
        return res.json(electricResults.map(u => ({ ...u, utility_type: 'electric' })));
      }
      
      // Cerca anche gas se type non specificato
      GasUtility.searchByPdr(searchTerm, (err, gasResults) => {
        if (err) gasResults = [];
        
        const allResults = [
          ...electricResults.map(u => ({ ...u, utility_type: 'electric' })),
          ...gasResults.map(u => ({ ...u, utility_type: 'gas' }))
        ];
        
        res.json(allResults);
      });
    });
  } else if (type === 'gas') {
    GasUtility.searchByPdr(searchTerm, (err, gasResults) => {
      if (err) gasResults = [];
      res.json(gasResults.map(u => ({ ...u, utility_type: 'gas' })));
    });
  }
});

// GET /utilities/expiring-contracts - Contratti in scadenza
router.get('/utilities/expiring-contracts', (req, res) => {
  const days = req.query.days || 90;
  
  ElectricityUtility.getExpiringContracts(days, (err, electricExpiring) => {
    if (err) electricExpiring = [];
    
    GasUtility.getExpiringContracts(days, (err, gasExpiring) => {
      if (err) gasExpiring = [];
      
      res.render('utilities/expiring-contracts', {
        title: 'Contratti in Scadenza',
        electricExpiring: electricExpiring || [],
        gasExpiring: gasExpiring || [],
        days,
        user: req.user
      });
    });
  });
});

module.exports = router;