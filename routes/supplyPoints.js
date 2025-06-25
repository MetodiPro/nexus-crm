/**
 * ⚡ Route Punti di Fornitura - NEXUS CRM
 * 
 * Gestisce la visualizzazione e gestione dei punti di fornitura (POD/PDR)
 */

const express = require('express');
const router = express.Router();
const ElectricityUtility = require('../models/electricityUtility');
const GasUtility = require('../models/gasUtility');
const Client = require('../models/client');

// Lista tutti i punti di fornitura
router.get('/', (req, res) => {
  console.log('📋 Caricamento punti di fornitura...');
  
  // Recupera tutte le utenze elettriche
  ElectricityUtility.getAll((err, electricityUtilities) => {
    if (err) {
      console.error('❌ Errore caricamento utenze elettriche:', err);
      electricityUtilities = [];
    }
    
    // Recupera tutte le utenze gas
    GasUtility.getAll((err, gasUtilities) => {
      if (err) {
        console.error('❌ Errore caricamento utenze gas:', err);
        gasUtilities = [];
      }
      
      console.log(`⚡ Utenze elettriche: ${electricityUtilities.length}`);
      console.log(`🔥 Utenze gas: ${gasUtilities.length}`);
      
      // Carica i dati dei clienti per ogni utenza
      loadClientsForUtilities(electricityUtilities, gasUtilities, (utilities) => {
        res.render('utilities/supply-points', { 
          title: 'Punti di Fornitura',
          utilities: utilities
        });
      });
    });
  });
});

/**
 * Carica i dati dei clienti per le utenze
 */
function loadClientsForUtilities(electricityUtilities, gasUtilities, callback) {
  const utilities = [];
  let processed = 0;
  const total = electricityUtilities.length + gasUtilities.length;
  
  if (total === 0) {
    return callback(utilities);
  }
  
  function checkComplete() {
    processed++;
    if (processed >= total) {
      // Ordina per cliente e poi per tipo
      utilities.sort((a, b) => {
        if (a.client_name !== b.client_name) {
          return a.client_name.localeCompare(b.client_name);
        }
        return a.type.localeCompare(b.type);
      });
      callback(utilities);
    }
  }
  
  // Processa utenze elettriche
  electricityUtilities.forEach(utility => {
    Client.getById(utility.client_id, (err, client) => {
      if (!err && client) {
        utilities.push({
          id: utility.id,
          type: 'Elettrica',
          type_icon: 'fas fa-bolt',
          type_color: 'yellow',
          code: utility.pod,
          client_id: utility.client_id,
          client_name: `${client.name} ${client.surname}`,
          client_company: client.company,
          supply_address: utility.supply_address,
          supply_city: utility.supply_city,
          supply_postal_code: utility.supply_postal_code,
          supply_province: utility.supply_province,
          annual_consumption: utility.annual_consumption,
          consumption_unit: 'kWh',
          current_supplier: utility.current_supplier,
          committed_power: utility.committed_power,
          activation_date: utility.activation_date,
          supply_type: utility.supply_type,
          rate_type: utility.rate_type
        });
      }
      checkComplete();
    });
  });
  
  // Processa utenze gas
  gasUtilities.forEach(utility => {
    Client.getById(utility.client_id, (err, client) => {
      if (!err && client) {
        utilities.push({
          id: utility.id,
          type: 'Gas',
          type_icon: 'fas fa-fire',
          type_color: 'orange',
          code: utility.pdr,
          client_id: utility.client_id,
          client_name: `${client.name} ${client.surname}`,
          client_company: client.company,
          supply_address: utility.supply_address,
          supply_city: utility.supply_city,
          supply_postal_code: utility.supply_postal_code,
          supply_province: utility.supply_province,
          annual_consumption: utility.annual_consumption,
          consumption_unit: 'Smc',
          current_supplier: utility.current_supplier,
          committed_power: null,
          activation_date: utility.activation_date,
          supply_type: utility.supply_type,
          rate_type: utility.rate_type
        });
      }
      checkComplete();
    });
  });
}

// Dettaglio singolo punto di fornitura
router.get('/view/:type/:id', (req, res) => {
  const { type, id } = req.params;
  
  if (type === 'electricity') {
    ElectricityUtility.getById(id, (err, utility) => {
      if (err || !utility) {
        return res.status(404).render('error', { message: 'Utenza elettrica non trovata' });
      }
      
      Client.getById(utility.client_id, (err, client) => {
        res.render('utilities/supply-point-detail', {
          title: 'Dettaglio Utenza Elettrica',
          utility,
          client,
          type: 'electricity'
        });
      });
    });
  } else if (type === 'gas') {
    GasUtility.getById(id, (err, utility) => {
      if (err || !utility) {
        return res.status(404).render('error', { message: 'Utenza gas non trovata' });
      }
      
      Client.getById(utility.client_id, (err, client) => {
        res.render('utilities/supply-point-detail', {
          title: 'Dettaglio Utenza Gas',
          utility,
          client,
          type: 'gas'
        });
      });
    });
  } else {
    res.status(404).render('error', { message: 'Tipo utenza non valido' });
  }
});

// Ricerca punti di fornitura
router.get('/search', (req, res) => {
  const searchTerm = req.query.term?.toLowerCase() || '';
  
  if (!searchTerm) {
    return res.redirect('/supply-points');
  }
  
  // Implementa la ricerca (da fare se necessario)
  res.redirect('/supply-points');
});

module.exports = router;