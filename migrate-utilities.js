#!/usr/bin/env node

/**
 * Script per aggiungere le tabelle delle utenze al database esistente
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/nexus.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Aggiunta tabelle utenze al database...');

db.serialize(() => {
  // Crea tabella utenze elettriche
  db.run(`CREATE TABLE IF NOT EXISTS electricity_utilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    
    -- Identificazione utenza
    pod_code TEXT NOT NULL,
    utility_name TEXT,
    
    -- Dati tecnici
    power_kw REAL,
    voltage TEXT CHECK(voltage IN ('BT', 'MT', 'AT')),
    meter_type TEXT,
    
    -- Fornitore
    supplier TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    last_bill_date DATE,
    
    -- Consumi annuali
    annual_consumption_kwh INTEGER,
    annual_consumption_year INTEGER,
    
    -- Indirizzo specifico dell'utenza
    utility_address TEXT,
    utility_city TEXT,
    utility_postal_code TEXT,
    utility_province TEXT,
    
    -- Note e stato
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Errore creazione tabella electricity_utilities:', err);
    } else {
      console.log('✅ Tabella electricity_utilities creata');
    }
  });

  // Crea tabella utenze gas
  db.run(`CREATE TABLE IF NOT EXISTS gas_utilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    
    -- Identificazione utenza
    pdr_code TEXT NOT NULL,
    utility_name TEXT,
    
    -- Dati tecnici
    meter_type TEXT,
    remi_code TEXT,
    
    -- Fornitore
    supplier TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    last_bill_date DATE,
    
    -- Consumi annuali
    annual_consumption_smc INTEGER,
    annual_consumption_year INTEGER,
    
    -- Indirizzo specifico dell'utenza
    utility_address TEXT,
    utility_city TEXT,
    utility_postal_code TEXT,
    utility_province TEXT,
    
    -- Note e stato
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Errore creazione tabella gas_utilities:', err);
    } else {
      console.log('✅ Tabella gas_utilities creata');
    }
    
    // Chiudi database alla fine
    db.close((err) => {
      if (err) {
        console.error('❌ Errore chiusura database:', err);
      } else {
        console.log('🎉 Migrazione completata con successo!');
        console.log('\n📋 Riepilogo:');
        console.log('   ✅ Tabella electricity_utilities aggiunta');
        console.log('   ✅ Tabella gas_utilities aggiunta');
        console.log('   ✅ Relazioni foreign key configurate');
        console.log('\n🚀 Ora puoi riavviare l\'applicazione e testare l\'import delle bollette!');
      }
    });
  });
});
