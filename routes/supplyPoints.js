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
  
  // Determina se filtrare per consulente
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  console.log(`👤 Utente: ${req.session.user.username} (${req.session.user.role})`);
  console.log(`🔍 Filtro consulente: ${consultantId ? 'Sì (ID: ' + consultantId + ')' : 'No (Admin)'}`);
  
  // Recupera utenze elettriche filtrate per consulente
  ElectricityUtility.getAllByConsultant(consultantId, (err, electricityUtilities) => {
    if (err) {
      console.error('❌ Errore caricamento utenze elettriche:', err);
      electricityUtilities = [];
    }
    
    // Recupera utenze gas filtrate per consulente
    GasUtility.getAllByConsultant(consultantId, (err, gasUtilities) => {
      if (err) {
        console.error('❌ Errore caricamento utenze gas:', err);
        gasUtilities = [];
      }
      
      console.log(`⚡ Utenze elettriche (${req.session.user.role}): ${electricityUtilities.length}`);
      console.log(`🔥 Utenze gas (${req.session.user.role}): ${gasUtilities.length}`);
      
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
          code: utility.pod_code,
          client_id: utility.client_id,
          client_name: utility.client_name || `${client.name} ${client.surname}`,
          client_company: utility.client_company || client.company,
          supply_address: utility.utility_address,
          supply_city: utility.utility_city,
          supply_postal_code: utility.utility_postal_code,
          supply_province: utility.utility_province,
          annual_consumption: utility.annual_consumption_kwh,
          consumption_unit: 'kWh',
          current_supplier: utility.supplier,
          committed_power: utility.power_kw,
          activation_date: utility.contract_start_date,
          supply_type: 'Elettrica',
          rate_type: 'Mercato Libero'
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
          code: utility.pdr_code,
          client_id: utility.client_id,
          client_name: utility.client_name || `${client.name} ${client.surname}`,
          client_company: utility.client_company || client.company,
          supply_address: utility.utility_address,
          supply_city: utility.utility_city,
          supply_postal_code: utility.utility_postal_code,
          supply_province: utility.utility_province,
          annual_consumption: utility.annual_consumption_smc,
          consumption_unit: 'Smc',
          current_supplier: utility.supplier,
          committed_power: null,
          activation_date: utility.contract_start_date,
          supply_type: 'Gas',
          rate_type: 'Mercato Libero'
        });
      }
      checkComplete();
    });
  });
}

// Dettaglio singolo punto di fornitura
router.get('/view/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  if (type === 'electricity') {
    ElectricityUtility.getById(id, (err, utility) => {
      if (err || !utility) {
        return res.status(404).render('error', { message: 'Utenza elettrica non trovata' });
      }
      
      Client.getById(utility.client_id, (err, client) => {
        if (err || !client) {
          return res.status(404).render('error', { message: 'Cliente associato non trovato' });
        }
        
        // Verifica autorizzazione per consulenti
        if (consultantId && client.consultant_id !== consultantId) {
          return res.status(403).render('error', { 
            message: 'Non hai l\'autorizzazione per visualizzare questa utenza' 
          });
        }
        
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
        if (err || !client) {
          return res.status(404).render('error', { message: 'Cliente associato non trovato' });
        }
        
        // Verifica autorizzazione per consulenti
        if (consultantId && client.consultant_id !== consultantId) {
          return res.status(403).render('error', { 
            message: 'Non hai l\'autorizzazione per visualizzare questa utenza' 
          });
        }
        
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