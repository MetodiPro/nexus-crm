#!/usr/bin/env node

/**
 * 🗄️ Script per creare le tabelle delle utenze nel database NEXUS CRM
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/nexus.db');

console.log('🗄️ Creazione tabelle utenze NEXUS CRM...');
console.log('📍 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Errore connessione database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connesso al database SQLite');
});

db.serialize(() => {
  // Verifica tabelle esistenti
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ Errore verifica tabelle:', err);
      return;
    }
    
    console.log('📋 Tabelle esistenti:', tables.map(t => t.name).join(', '));
    
    const hasElectricityUtilities = tables.some(t => t.name === 'electricity_utilities');
    const hasGasUtilities = tables.some(t => t.name === 'gas_utilities');
    
    if (hasElectricityUtilities && hasGasUtilities) {
      console.log('✅ Le tabelle delle utenze esistono già');
      db.close();
      return;
    }
    
    console.log('🔧 Creazione tabelle mancanti...');
    
    // Crea tabella electricity_utilities
    if (!hasElectricityUtilities) {
      db.run(`CREATE TABLE electricity_utilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        pod_code TEXT NOT NULL,
        utility_name TEXT,
        power_kw REAL,
        voltage TEXT CHECK(voltage IN ('BT', 'MT', 'AT')),
        meter_type TEXT,
        supplier TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        last_bill_date DATE,
        annual_consumption_kwh INTEGER,
        annual_consumption_year INTEGER,
        utility_address TEXT,
        utility_city TEXT,
        utility_postal_code TEXT,
        utility_province TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('❌ Errore creazione tabella electricity_utilities:', err.message);
        } else {
          console.log('✅ Tabella electricity_utilities creata');
        }
      });
    }
    
    // Crea tabella gas_utilities
    if (!hasGasUtilities) {
      db.run(`CREATE TABLE gas_utilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        pdr_code TEXT NOT NULL,
        utility_name TEXT,
        meter_type TEXT,
        remi_code TEXT,
        supplier TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        last_bill_date DATE,
        annual_consumption_smc INTEGER,
        annual_consumption_year INTEGER,
        utility_address TEXT,
        utility_city TEXT,
        utility_postal_code TEXT,
        utility_province TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('❌ Errore creazione tabella gas_utilities:', err.message);
        } else {
          console.log('✅ Tabella gas_utilities creata');
        }
        
        // Chiudi database dopo l'ultima operazione
        setTimeout(() => {
          db.close((err) => {
            if (err) {
              console.error('❌ Errore chiusura database:', err.message);
            } else {
              console.log('🎉 Setup database completato!');
              console.log('\n📋 Riepilogo:');
              console.log('   ✅ Tabella electricity_utilities configurata');
              console.log('   ✅ Tabella gas_utilities configurata');
              console.log('   ✅ Foreign keys e vincoli applicati');
              console.log('\n🚀 Ora puoi riavviare l\'applicazione e testare l\'import bollette!');
              console.log('\n📝 Prossimi passi:');
              console.log('   1. Riavvia: node app.js');
              console.log('   2. Vai su: http://localhost:3000');
              console.log('   3. Testa: Importa da Bolletta ENEL');
              console.log('   4. Testa: Menu → Punti di Fornitura');
            }
          });
        }, 100);
      });
    } else {
      // Se gas_utilities esiste, chiudi subito
      db.close();
    }
  });
});
