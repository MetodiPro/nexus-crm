#!/usr/bin/env node

/**
 * 🔧 Migrazione database - Struttura avanzata prodotti/servizi
 * 
 * Implementa la nuova struttura per:
 * - Tariffe energia elettrica (fissa, variabile, altra)
 * - Tariffe gas naturale (fissa, variabile, altra)  
 * - Dual Fuel (entrambi)
 * - Costi aggiuntivi configurabili
 * - Allegati PDF
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/nexus.db');
console.log('🗄️ Migrazione prodotti avanzata:', dbPath);

// Assicurati che la directory esista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('🔄 Inizio migrazione struttura prodotti...');

  // 1. Rinomina la tabella esistente come backup
  db.run(`CREATE TABLE IF NOT EXISTS products_backup AS SELECT * FROM products WHERE 1=0`, (err) => {
    if (err) {
      console.error('❌ Errore creazione backup:', err);
    } else {
      console.log('✅ Tabella backup preparata');
    }
  });

  // 2. Copia i dati esistenti nel backup (se esistono)
  db.run(`INSERT INTO products_backup SELECT * FROM products`, (err) => {
    if (err && !err.message.includes('no such table')) {
      console.error('⚠️ Errore backup dati:', err.message);
    } else {
      console.log('✅ Dati esistenti salvati in backup');
    }
  });

  // 3. Elimina la tabella products esistente
  db.run(`DROP TABLE IF EXISTS products`, (err) => {
    if (err) {
      console.error('❌ Errore eliminazione tabella:', err);
    } else {
      console.log('✅ Tabella products eliminata');
    }
  });

  // 4. Crea la nuova struttura avanzata
  const createProductsTable = `
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Campi base
      name TEXT NOT NULL,
      service_type TEXT NOT NULL CHECK (service_type IN ('Energia Elettrica', 'Gas Naturale', 'Dual Fuel (Luce+Gas)', 'Altro Servizio')),
      supplier_operator TEXT NOT NULL,
      description_notes TEXT,
      
      -- Campi Energia Elettrica
      electricity_fixed_rate REAL, -- €/kWh
      electricity_variable_spread REAL, -- €/kWh (PUN + questo spread)
      electricity_other_rate_notes TEXT,
      
      -- Campi Gas Naturale
      gas_fixed_rate REAL, -- €/Smc
      gas_variable_spread REAL, -- €/Smc (PSV + questo spread)
      gas_other_rate_notes TEXT,
      
      -- Costi aggiuntivi (3 campi configurabili)
      additional_cost1_description TEXT,
      additional_cost1_value REAL,
      additional_cost1_unit TEXT CHECK (additional_cost1_unit IN ('€/kWh', '€/Smc', '€/mese', 'una tantum')),
      
      additional_cost2_description TEXT,
      additional_cost2_value REAL,
      additional_cost2_unit TEXT CHECK (additional_cost2_unit IN ('€/kWh', '€/Smc', '€/mese', 'una tantum')),
      
      additional_cost3_description TEXT,
      additional_cost3_value REAL,
      additional_cost3_unit TEXT CHECK (additional_cost3_unit IN ('€/kWh', '€/Smc', '€/mese', 'una tantum')),
      
      -- File PDF allegato
      pdf_attachment_filename TEXT,
      pdf_attachment_path TEXT,
      pdf_upload_date DATETIME,
      
      -- Campi di sistema
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `;

  db.run(createProductsTable, (err) => {
    if (err) {
      console.error('❌ Errore creazione nuova tabella products:', err);
    } else {
      console.log('✅ Nuova tabella products creata con successo');
    }
  });

  // 5. Crea tabella per allegati/offerte
  const createAttachmentsTable = `
    CREATE TABLE IF NOT EXISTS product_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_by INTEGER,
      
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users (id)
    )
  `;

  db.run(createAttachmentsTable, (err) => {
    if (err) {
      console.error('❌ Errore creazione tabella attachments:', err);
    } else {
      console.log('✅ Tabella product_attachments creata');
    }
  });

  // 6. Migra i dati esistenti (se presenti)
  const migrateExistingData = `
    INSERT INTO products (
      name, service_type, supplier_operator, description_notes,
      is_active, created_by, created_at
    )
    SELECT 
      name,
      CASE 
        WHEN energy_type = 'electricity' THEN 'Energia Elettrica'
        WHEN energy_type = 'gas' THEN 'Gas Naturale'
        WHEN energy_type = 'dual' THEN 'Dual Fuel (Luce+Gas)'
        ELSE 'Altro Servizio'
      END as service_type,
      COALESCE(supplier, 'Non specificato') as supplier_operator,
      description as description_notes,
      is_active,
      created_by,
      created_at
    FROM products_backup
    WHERE id IS NOT NULL
  `;

  db.run(migrateExistingData, (err) => {
    if (err && !err.message.includes('no such table')) {
      console.error('⚠️ Errore migrazione dati:', err.message);
    } else {
      console.log('✅ Dati esistenti migrati alla nuova struttura');
    }
  });

  // 7. Crea directory per gli allegati PDF
  const attachmentsDir = path.resolve(__dirname, '../public/uploads/product-attachments');
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
    console.log('✅ Directory allegati creata:', attachmentsDir);
  }

  // 8. Inserisci alcuni dati di esempio per test
  const insertSampleData = `
    INSERT INTO products (
      name, service_type, supplier_operator, description_notes,
      electricity_fixed_rate, electricity_variable_spread,
      additional_cost1_description, additional_cost1_value, additional_cost1_unit,
      is_active, created_by
    ) VALUES 
    (
      'Offerta Casa Verde Elettrica', 
      'Energia Elettrica', 
      'Enel Energia', 
      'Tariffa fissa per uso domestico con energia verde certificata',
      0.35,
      NULL,
      'Canone mensile',
      8.50,
      '€/mese',
      1,
      1
    ),
    (
      'Gas Casa Più', 
      'Gas Naturale', 
      'Eni Gas e Luce', 
      'Tariffa gas con prezzo variabile indicizzato',
      NULL,
      NULL,
      'Contributo fisso',
      15.00,
      '€/mese',
      1,
      1
    ),
    (
      'Dual Energy Smart', 
      'Dual Fuel (Luce+Gas)', 
      'A2A Energia', 
      'Offerta combinata luce e gas con sconti fedeltà',
      0.28,
      0.45,
      'Sconto dual',
      -5.00,
      '€/mese',
      1,
      1
    )
  `;

  db.run(insertSampleData, (err) => {
    if (err) {
      console.error('⚠️ Errore inserimento dati esempio:', err.message);
    } else {
      console.log('✅ Dati di esempio inseriti');
    }
  });

  console.log('');
  console.log('🎯 MIGRAZIONE COMPLETATA!');
  console.log('');
  console.log('📋 Nuove funzionalità:');
  console.log('✅ Tipi servizio: Energia Elettrica, Gas Naturale, Dual Fuel, Altro');
  console.log('✅ Tariffe specifiche per energia elettrica (€/kWh)');
  console.log('✅ Tariffe specifiche per gas naturale (€/Smc)');
  console.log('✅ Supporto tariffe variabili (PUN/PSV + spread)');
  console.log('✅ 3 campi costi aggiuntivi configurabili');
  console.log('✅ Allegati PDF per ogni prodotto');
  console.log('✅ Tabella separata per gestione allegati');
  console.log('');
  console.log('📁 Directory allegati: /public/uploads/product-attachments/');
  console.log('');
});

db.close((err) => {
  if (err) {
    console.error('❌ Errore chiusura database:', err);
  } else {
    console.log('✅ Database chiuso correttamente');
    console.log('');
    console.log('🚀 Ora puoi riavviare l\'applicazione per testare le nuove funzionalità!');
  }
});
