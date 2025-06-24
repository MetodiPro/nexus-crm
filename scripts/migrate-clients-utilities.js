const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { loggers } = require('../config/logger');

// Script di migrazione per gestire multiple utenze per cliente
function migrateClientsAndUtilities() {
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

        // Verifica quali colonne mancano (escludo fax e singoli campi utenze)
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
          'reference_person',
          'birth_date',
          'birth_place',
          'gender',
          'billing_address',
          'billing_city', 
          'billing_postal_code',
          'billing_province',
          'client_status',
          'acquisition_date',
          'last_contact_date',
          'province'
        ];

        const missingColumns = newColumns.filter(col => !existingColumns.includes(col));
        
        // Controlla se esistono già le tabelle utilities
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='electricity_utilities'", (err, row) => {
          if (err) {
            loggers.error('Errore controllo tabelle utilities', err);
            return reject(err);
          }

          const needsUtilitiesTables = !row;

          if (missingColumns.length === 0 && !needsUtilitiesTables) {
            loggers.info('Struttura database già aggiornata');
            db.close();
            return resolve('Database già aggiornato');
          }

          console.log('Colonne mancanti clients:', missingColumns);
          console.log('Tabelle utilities da creare:', needsUtilitiesTables);
          loggers.info('Inizio migrazione completa', { missingColumns, needsUtilitiesTables });

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

              // 4. Crea la nuova tabella clients (SENZA fax e SENZA campi singoli utenze)
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
                
                -- Contatti (SENZA fax)
                phone TEXT,
                email TEXT,
                pec_email TEXT,
                website TEXT,
                reference_person TEXT,
                
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

                console.log('Nuova tabella clients creata (senza fax e utenze singole)');

                // 5. Crea tabella utenze energia elettrica
                db.run(`CREATE TABLE IF NOT EXISTS electricity_utilities (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  client_id INTEGER NOT NULL,
                  
                  -- Identificazione utenza
                  pod_code TEXT NOT NULL,
                  utility_name TEXT, -- Nome descrittivo dell'utenza (es: "Sede principale", "Magazzino", etc.)
                  
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
                  annual_consumption_kwh INTEGER, -- Consumo annuale in kWh
                  annual_consumption_year INTEGER, -- Anno di riferimento del consumo
                  
                  -- Indirizzo specifico dell'utenza (se diverso dalla sede)
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
                    loggers.error('Errore nella creazione tabella electricity_utilities', err);
                    return reject(err);
                  }

                  console.log('Tabella electricity_utilities creata');

                  // 6. Crea tabella utenze gas
                  db.run(`CREATE TABLE IF NOT EXISTS gas_utilities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL,
                    
                    -- Identificazione utenza
                    pdr_code TEXT NOT NULL,
                    utility_name TEXT, -- Nome descrittivo dell'utenza
                    
                    -- Dati tecnici
                    meter_type TEXT,
                    remi_code TEXT,
                    
                    -- Fornitore
                    supplier TEXT,
                    contract_start_date DATE,
                    contract_end_date DATE,
                    last_bill_date DATE,
                    
                    -- Consumi annuali
                    annual_consumption_smc INTEGER, -- Consumo annuale in Standard Metro Cubo
                    annual_consumption_year INTEGER, -- Anno di riferimento del consumo
                    
                    -- Indirizzo specifico dell'utenza (se diverso dalla sede)
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
                      loggers.error('Errore nella creazione tabella gas_utilities', err);
                      return reject(err);
                    }

                    console.log('Tabella gas_utilities creata');

                    // 7. Migra i dati esistenti nella tabella clients
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

                        // 8. Migra eventuali dati utenze esistenti (se presenti nei vecchi campi)
                        migrateExistingUtilities(db, existingClients, () => {
                          // 9. Elimina la tabella di backup
                          db.run("DROP TABLE clients_backup", (err) => {
                            if (err) {
                              loggers.error('Errore nell\'eliminazione tabella backup', err);
                              // Non è critico, continuiamo
                            } else {
                              console.log('Tabella di backup eliminata');
                            }

                            loggers.info('Migrazione completa completata', {
                              migratedClients: existingClients.length,
                              addedClientColumns: missingColumns,
                              createdUtilitiesTables: needsUtilitiesTables
                            });

                            db.close();
                            resolve(`Migrazione completata: ${existingClients.length} clienti migrati, ${missingColumns.length} colonne aggiunte, tabelle utilities create`);
                          });
                        });
                      });
                    } else {
                      // Nessun dato da migrare
                      db.run("DROP TABLE clients_backup", (err) => {
                        if (err) {
                          loggers.error('Errore nell\'eliminazione tabella backup', err);
                        }

                        loggers.info('Migrazione completata', {
                          migratedClients: 0,
                          addedClientColumns: missingColumns,
                          createdUtilitiesTables: needsUtilitiesTables
                        });

                        db.close();
                        resolve(`Migrazione completata: 0 clienti esistenti, ${missingColumns.length} colonne aggiunte, tabelle utilities create`);
                      });
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Funzione helper per migrare eventuali utenze esistenti dai vecchi campi
function migrateExistingUtilities(db, existingClients, callback) {
  // Se esistevano campi electricity_pod o gas_pdr nei vecchi dati, li migriamo
  // Per ora assumiamo che non ci siano, ma la funzione è pronta per future migrazioni
  
  console.log('Controllo migrazione utenze esistenti...');
  
  // Qui potremmo aggiungere logica per migrare da eventuali campi precedenti
  // Per ora chiamiamo direttamente il callback
  callback();
}

// Esegui la migrazione se lo script viene chiamato direttamente
if (require.main === module) {
  migrateClientsAndUtilities()
    .then(result => {
      console.log('✅ Migrazione completata:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Errore durante la migrazione:', error);
      process.exit(1);
    });
}

module.exports = { migrateClientsAndUtilities };