#!/usr/bin/env node

/**
 * 🔄 Script di migrazione sicura per aggiornare la struttura database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/nexus.db');
console.log('🔄 Migrazione database:', dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Backup dati esistenti
  console.log('💾 Backup dati clienti esistenti...');
  
  db.all("SELECT * FROM clients", (err, existingClients) => {
    if (err) {
      console.error('❌ Errore backup:', err);
      return;
    }
    
    console.log(`📦 Trovati ${existingClients.length} clienti da migrare`);
    
    // Rinomina tabella esistente
    db.run("ALTER TABLE clients RENAME TO clients_old", (err) => {
      if (err) {
        console.error('❌ Errore rinomina tabella:', err);
        return;
      }
      
      console.log('📂 Tabella clients rinominata in clients_old');
      
      // Crea nuova tabella con struttura completa
      const createTableSQL = `
        CREATE TABLE clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          
          -- Dati personali base
          name TEXT NOT NULL,
          surname TEXT NOT NULL,
          fiscal_code TEXT,
          birth_date DATE,
          birth_place TEXT,
          gender TEXT CHECK(gender IN ('M', 'F', 'Altro')),
          
          -- Dati aziendali
          company TEXT,
          vat_number TEXT,
          company_fiscal_code TEXT,
          company_legal_form TEXT,
          
          -- Indirizzi
          address TEXT,
          city TEXT,
          postal_code TEXT,
          province TEXT,
          legal_address TEXT,
          legal_city TEXT,
          legal_postal_code TEXT,
          legal_province TEXT,
          billing_address TEXT,
          billing_city TEXT,
          billing_postal_code TEXT,
          billing_province TEXT,
          
          -- Contatti
          phone TEXT,
          email TEXT,
          pec_email TEXT,
          website TEXT,
          reference_person TEXT,
          
          -- Gestione cliente
          client_status TEXT DEFAULT 'prospect' CHECK(client_status IN ('active', 'inactive', 'prospect', 'lost')),
          acquisition_date DATE,
          last_contact_date DATE,
          notes TEXT,
          consultant_id INTEGER,
          
          -- Timestamp
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          -- Foreign keys
          FOREIGN KEY (consultant_id) REFERENCES users (id)
        )
      `;
      
      db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ Errore creazione nuova tabella:', err);
          return;
        }
        
        console.log('✅ Nuova tabella clients creata');
        
        // Migra dati esistenti
        if (existingClients.length > 0) {
          console.log('🔄 Migrazione dati esistenti...');
          
          let migrated = 0;
          existingClients.forEach((client, index) => {
            const insertSQL = `
              INSERT INTO clients (
                id, name, surname, company, vat_number, address, city, postal_code, 
                phone, email, notes, consultant_id, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(insertSQL, [
              client.id,
              client.name,
              client.surname,
              client.company,
              client.vat_number,
              client.address,
              client.city,
              client.postal_code,
              client.phone,
              client.email,
              client.notes,
              client.consultant_id,
              client.created_at,
              client.updated_at
            ], function(err) {
              if (err) {
                console.error(`❌ Errore migrazione cliente ${client.id}:`, err);
              } else {
                migrated++;
                console.log(`✅ Cliente ${client.id} migrato (${migrated}/${existingClients.length})`);
              }
              
              // Se è l'ultimo cliente
              if (index === existingClients.length - 1) {
                setTimeout(() => {
                  // Elimina tabella di backup
                  db.run("DROP TABLE clients_old", (err) => {
                    if (err) {
                      console.error('⚠️ Avviso: impossibile eliminare tabella backup:', err);
                    } else {
                      console.log('🗑️ Tabella di backup eliminata');
                    }
                    
                    console.log(`\n🎉 Migrazione completata!`);
                    console.log(`📊 Risultato: ${migrated}/${existingClients.length} clienti migrati`);
                    console.log('✅ Database pronto per nuove funzionalità');
                    
                    db.close();
                  });
                }, 500);
              }
            });
          });
        } else {
          // Nessun dato da migrare
          db.run("DROP TABLE clients_old", (err) => {
            if (err) console.error('Avviso:', err);
            
            console.log('\n🎉 Migrazione completata!');
            console.log('📊 Nessun cliente esistente da migrare');
            console.log('✅ Database pronto per nuove funzionalità');
            
            db.close();
          });
        }
      });
    });
  });
});
