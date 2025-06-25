const express = require('express');
const router = express.Router();
const Client = require('../models/client');
const Activity = require('../models/activity');
const Contract = require('../models/contract');
const ElectricityUtility = require('../models/electricityUtility');
const GasUtility = require('../models/gasUtility');

/**
 * Crea automaticamente le utenze da dati estratti dalla bolletta
 */
function createUtilitiesFromExtractedData(clientId, extractedData, callback) {
  console.log('🔧 DEBUG: Inizio creazione utenze');
  console.log('📋 Client ID:', clientId);
  console.log('📊 Dati estratti completi:', JSON.stringify(extractedData, null, 2));
  
  let utilitiesCreated = 0;
  let totalUtilities = 0;
  
  // Conteggia utenze da creare
  if (extractedData.pod) {
    totalUtilities++;
    console.log('⚡ Utenza elettrica da creare - POD:', extractedData.pod);
  }
  if (extractedData.pdr) {
    totalUtilities++;
    console.log('🔥 Utenza gas da creare - PDR:', extractedData.pdr);
  }
  
  console.log(`📊 Totale utenze da creare: ${totalUtilities}`);
  
  if (totalUtilities === 0) {
    console.log('⚠️ Nessuna utenza da creare');
    return callback();
  }
  
  function checkComplete() {
    utilitiesCreated++;
    console.log(`✅ Utenza creata ${utilitiesCreated}/${totalUtilities}`);
    if (utilitiesCreated >= totalUtilities) {
      console.log('🎉 Tutte le utenze create!');
      callback();
    }
  }
  
  // Crea utenza elettrica se presente POD
  if (extractedData.pod) {
    const electricityData = {
      client_id: clientId,
      pod_code: extractedData.pod,
      utility_name: 'Utenza Principale',
      utility_address: extractedData.address || '',
      utility_city: extractedData.city || '',
      utility_postal_code: extractedData.postalCode || '',
      utility_province: extractedData.province || '',
      supplier: extractedData.supplier || extractedData.provider || 'ENEL ENERGIA',
      annual_consumption_kwh: extractedData.electricConsumption || extractedData.electricityConsumption || 0,
      annual_consumption_year: new Date().getFullYear(),
      power_kw: extractedData.powerCommitted || 0,
      voltage: 'BT',
      meter_type: 'Elettronico',
      is_active: 1,
      notes: `Utenza creata automaticamente da bolletta ${extractedData.provider || 'ENEL'}`
    };
    
    console.log('⚡ Creazione utenza elettrica:', electricityData);
    
    ElectricityUtility.create(electricityData, (err) => {
      if (err) {
        console.error('❌ Errore creazione utenza elettrica:', err);
      } else {
        console.log('✅ Utenza elettrica creata');
      }
      checkComplete();
    });
  }
  
  // Crea utenza gas se presente PDR
  if (extractedData.pdr) {
    const gasData = {
      client_id: clientId,
      pdr_code: extractedData.pdr,
      utility_name: 'Utenza Gas Principale',
      utility_address: extractedData.address || '',
      utility_city: extractedData.city || '',
      utility_postal_code: extractedData.postalCode || '',
      utility_province: extractedData.province || '',
      supplier: extractedData.supplier || extractedData.provider || 'ENEL ENERGIA',
      annual_consumption_smc: extractedData.gasConsumption || 0,
      annual_consumption_year: new Date().getFullYear(),
      meter_type: 'Elettronico',
      is_active: 1,
      notes: `Utenza creata automaticamente da bolletta ${extractedData.provider || 'ENEL'}`
    };
    
    console.log('🔥 Creazione utenza gas:', gasData);
    
    GasUtility.create(gasData, (err) => {
      if (err) {
        console.error('❌ Errore creazione utenza gas:', err);
      } else {
        console.log('✅ Utenza gas creata');
      }
      checkComplete();
    });
  }
}

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
      console.error('❌ Errore creazione cliente:', err);
      return res.status(500).render('error', { message: 'Errore nella creazione del cliente' });
    }
    
    console.log('✅ Cliente creato con ID:', clientId);
    
    // Verifica immediata che il cliente sia stato creato
    Client.getById(clientId, (err, createdClient) => {
      if (err) {
        console.error('❌ Errore verifica cliente creato:', err);
        return res.redirect('/clients');
      }
      
      if (!createdClient) {
        console.error('❌ Cliente non trovato subito dopo creazione, ID:', clientId);
        return res.redirect('/clients');
      }
      
      console.log('✅ Cliente verificato esistente:', createdClient.name, createdClient.surname);
      
      // Import bolletta serve solo per dati anagrafici
      // Le utenze vengono inserite manualmente
      console.log('✅ Cliente creato con dati anagrafici');
      if (req.body.extracted_utilities) {
        console.log('ℹ️ Dati utenze estratti ignorati - inserimento manuale richiesto');
      }
      
      console.log('🔄 Redirect a /clients/view/' + clientId);
      res.redirect(`/clients/view/${clientId}`);
    });
  });
});

// Visualizza dettagli cliente
router.get('/view/:id', (req, res) => {
  const clientId = req.params.id;
  console.log('📝 Richiesta visualizzazione cliente ID:', clientId);
  
  Client.getById(clientId, (err, client) => {
    if (err) {
      console.error('❌ Errore database getById:', err);
      return res.status(500).render('error', { message: 'Errore del database' });
    }
    
    if (!client) {
      console.error('❌ Cliente non trovato con ID:', clientId);
      return res.status(404).render('error', { message: 'Cliente non trovato' });
    }
    
    console.log('✅ Cliente trovato:', client.name, client.surname);
    
    // Carica attività e contratti del cliente
    Activity.getByClientId(client.id, (err, activities) => {
      if (err) {
        console.error('⚠️ Errore caricamento attività:', err);
        activities = [];
      }
      
      Contract.getByClientId(client.id, (err, contracts) => {
        if (err) {
          console.error('⚠️ Errore caricamento contratti:', err);
          contracts = [];
        }
        
        // Carica anche le utenze per il riepilogo
        const ElectricityUtility = require('../models/electricityUtility');
        const GasUtility = require('../models/gasUtility');
        
        ElectricityUtility.getByClientId(client.id, (err, electricityUtilities) => {
          if (err) {
            console.error('⚠️ Errore caricamento utenze elettriche:', err);
            electricityUtilities = [];
          }
          
          GasUtility.getByClientId(client.id, (err, gasUtilities) => {
            if (err) {
              console.error('⚠️ Errore caricamento utenze gas:', err);
              gasUtilities = [];
            }
            
            console.log('✅ Rendering vista cliente con', electricityUtilities.length, 'utenze elettriche e', gasUtilities.length, 'utenze gas');
            
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