const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { loggers } = require('../config/logger');

// Script di migrazione per estendere la tabella clients con i nuovi campi
function migrateClientsTable() {
  const dbPath = path.resolve(__dirname, '../data/nexus.db');
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Verifica la struttura attuale della tabella clients
      db.all("PRAGMA table_info(clients)", (err, columns) => {
        if (err) {
          loggers.error('Errore nel controllo struttura tabella clients', err);
          return reject(err);
        }

        console.log('Struttura attuale tabella clients:', columns.map(c => c.name));

        // Verifica quali colonne mancano
        const existingColumns = columns.map(col => col.name);
        const newColumns = [
          'fiscal_code',
          'company_fiscal_code', 
          'company_legal_form',
          'legal_address',
          'legal_city',
          'legal_postal_code',
          'legal_province',
          'pec_email',
          'website',
          'fax',
          'reference_person',
          'birth_date',
          'birth_place',
          'gender',
          'electricity_pod',
          'electricity_power_kw',
          'electricity_voltage',
          'electricity_meter_type',
          'electricity_supplier',
          'electricity_last_bill_date',
          'gas_pdr',
          'gas_meter_type',
          'gas_supplier',
          'gas_last_bill_date',
          'gas_remi_code',
          'billing_address',
          'billing_city', 
          'billing_postal_code',
          'billing_province',
          'notes_electricity',
          'notes_gas',
          'client_status',
          'acquisition_date',
          'last_contact_date',
          'province'
        ];

        const missingColumns = newColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length === 0) {
          loggers.info('Tutte le colonne richieste sono già presenti nella tabella clients');
          db.close();
          return resolve('Tabella già aggiornata');
        }

        console.log('Colonne mancanti:', missingColumns);
        loggers.info('Inizio migrazione tabella clients', { missingColumns });

        // 2. Backup dei dati esistenti
        db.all("SELECT * FROM clients", (err, existingClients) => {
          if (err) {
            loggers.error('Errore nel backup dei clienti esistenti', err);
            return reject(err);
          }

          console.log(`Backup di ${existingClients.length} clienti esistenti`);

          // 3. Rinomina la tabella esistente
          db.run("ALTER TABLE clients RENAME TO clients_backup", (err) => {
            if (err) {
              loggers.error('Errore nel rinominare la tabella clients', err);
              return reject(err);
            }

            console.log('Tabella clients rinominata in clients_backup');

            // 4. Crea la nuova tabella con la struttura estesa
            db.run(`CREATE TABLE clients (
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
              fax TEXT,
              reference_person TEXT,
              
              -- Contatori energia elettrica
              electricity_pod TEXT,
              electricity_power_kw REAL,
              electricity_voltage TEXT,
              electricity_meter_type TEXT,
              electricity_supplier TEXT,
              electricity_last_bill_date DATE,
              notes_electricity TEXT,
              
              -- Contatori gas
              gas_pdr TEXT,
              gas_meter_type TEXT,
              gas_supplier TEXT,
              gas_last_bill_date DATE,
              gas_remi_code TEXT,
              notes_gas TEXT,
              
              -- Gestione cliente
              client_status TEXT DEFAULT 'active' CHECK(client_status IN ('active', 'inactive', 'prospect', 'lost')),
              acquisition_date DATE,
              last_contact_date DATE,
              notes TEXT,
              consultant_id INTEGER,
              
              -- Timestamp
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              
              -- Foreign keys
              FOREIGN KEY (consultant_id) REFERENCES users (id)
            )`, (err) => {
              if (err) {
                loggers.error('Errore nella creazione della nuova tabella clients', err);
                return reject(err);
              }

              console.log('Nuova tabella clients creata con struttura estesa');

              // 5. Migra i dati esistenti
              if (existingClients.length > 0) {
                const placeholders = existingClients.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
                const values = [];
                
                existingClients.forEach(client => {
                  values.push(
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
                  );
                });

                db.run(`INSERT INTO clients (
                  name, surname, company, vat_number, address, city, postal_code, 
                  phone, email, notes, consultant_id, created_at, updated_at
                ) VALUES ${placeholders}`, values, function(err) {
                  if (err) {
                    loggers.error('Errore nel ripristino dati clienti', err);
                    return reject(err);
                  }

                  console.log(`Migrati ${this.changes} clienti nella nuova struttura`);

                  // 6. Elimina la tabella di backup
                  db.run("DROP TABLE clients_backup", (err) => {
                    if (err) {
                      loggers.error('Errore nell\'eliminazione tabella backup', err);
                      // Non è critico, continuiamo
                    } else {
                      console.log('Tabella di backup eliminata');
                    }

                    loggers.info('Migrazione tabella clients completata', {
                      migratedClients: existingClients.length,
                      addedColumns: missingColumns
                    });

                    db.close();
                    resolve(`Migrazione completata: ${existingClients.length} clienti migrati, ${missingColumns.length} colonne aggiunte`);
                  });
                });
              } else {
                // Nessun dato da migrare, elimina solo la tabella backup
                db.run("DROP TABLE clients_backup", (err) => {
                  if (err) {
                    loggers.error('Errore nell\'eliminazione tabella backup', err);
                  }

                  loggers.info('Migrazione tabella clients completata', {
                    migratedClients: 0,
                    addedColumns: missingColumns
                  });

                  db.close();
                  resolve(`Migrazione completata: 0 clienti esistenti, ${missingColumns.length} colonne aggiunte`);
                });
              }
            });
          });
        });
      });
    });
  });
}

// Esegui la migrazione se lo script viene chiamato direttamente
if (require.main === module) {
  migrateClientsTable()
    .then(result => {
      console.log('✅ Migrazione completata:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Errore durante la migrazione:', error);
      process.exit(1);
    });
}

module.exports = { migrateClientsTable };