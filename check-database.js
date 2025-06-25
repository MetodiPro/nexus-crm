#!/usr/bin/env node

/**
 * 🗄️ Script per verificare e correggere la struttura del database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/nexus.db');
console.log('🔍 Verifico struttura database:', dbPath);

const db = new sqlite3.Database(dbPath);

// Verifica struttura tabella clients
db.all("PRAGMA table_info(clients)", (err, columns) => {
  if (err) {
    console.error('❌ Errore verifica tabella clients:', err);
    return;
  }
  
  console.log('\n📋 Struttura tabella clients:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  // Verifica colonne necessarie
  const requiredColumns = [
    'name', 'surname', 'fiscal_code', 'birth_date', 'birth_place', 'gender',
    'company', 'vat_number', 'company_fiscal_code', 'company_legal_form',
    'address', 'city', 'postal_code', 'province',
    'legal_address', 'legal_city', 'legal_postal_code', 'legal_province',
    'billing_address', 'billing_city', 'billing_postal_code', 'billing_province',
    'phone', 'email', 'pec_email', 'website', 'reference_person',
    'client_status', 'acquisition_date', 'last_contact_date', 'notes', 'consultant_id'
  ];
  
  const existingColumns = columns.map(c => c.name);
  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
  
  console.log('\n❌ Colonne mancanti:', missingColumns);
  
  if (missingColumns.length > 0) {
    console.log('\n🔧 È necessario aggiornare la struttura della tabella!');
    console.log('Esegui: npm run update-database');
  } else {
    console.log('\n✅ Struttura tabella clients OK');
  }
  
  // Verifica tabelle utenze
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='electricity_utilities'", (err, row) => {
    if (row) {
      console.log('✅ Tabella electricity_utilities presente');
    } else {
      console.log('❌ Tabella electricity_utilities mancante');
    }
    
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='gas_utilities'", (err, row) => {
      if (row) {
        console.log('✅ Tabella gas_utilities presente');
      } else {
        console.log('❌ Tabella gas_utilities mancante');
      }
      
      db.close();
    });
  });
});
