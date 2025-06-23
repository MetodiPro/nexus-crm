const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { loggers } = require('../config/logger');

// Script di migrazione per aggiungere la colonna product_id alla tabella contracts
function migrateDatabase() {
  const dbPath = path.resolve(__dirname, '../data/nexus.db');
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Verifica se la colonna product_id esiste già
      db.all("PRAGMA table_info(contracts)", (err, columns) => {
        if (err) {
          loggers.error('Errore nel controllo struttura tabella contracts', err);
          return reject(err);
        }

        const hasProductId = columns.some(col => col.name === 'product_id');

        if (hasProductId) {
          loggers.info('La colonna product_id esiste già nella tabella contracts');
          db.close();
          return resolve('Colonna già presente');
        }

        loggers.info('Inizio migrazione: aggiunta colonna product_id alla tabella contracts');

        // 2. Backup dei dati esistenti
        db.all("SELECT * FROM contracts", (err, existingContracts) => {
          if (err) {
            loggers.error('Errore nel backup dei contratti esistenti', err);
            return reject(err);
          }

          loggers.info(`Backup di ${existingContracts.length} contratti esistenti`);

          // 3. Rinomina la tabella esistente
          db.run("ALTER TABLE contracts RENAME TO contracts_backup", (err) => {
            if (err) {
              loggers.error('Errore nel rinominare la tabella contracts', err);
              return reject(err);
            }

            // 4. Crea la nuova tabella con la struttura corretta
            db.run(`CREATE TABLE contracts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              client_id INTEGER NOT NULL,
              product_id INTEGER,
              contract_type TEXT NOT NULL,
              energy_type TEXT NOT NULL,
              supplier TEXT,
              status TEXT DEFAULT 'pending',
              value REAL,
              start_date DATE,
              end_date DATE,
              notes TEXT,
              consultant_id INTEGER NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (client_id) REFERENCES clients (id),
              FOREIGN KEY (product_id) REFERENCES products (id),
              FOREIGN KEY (consultant_id) REFERENCES users (id)
            )`, (err) => {
              if (err) {
                loggers.error('Errore nella creazione della nuova tabella contracts', err);
                return reject(err);
              }

              // 5. Reinserisci i dati esistenti
              if (existingContracts.length > 0) {
                const insertPromises = existingContracts.map(contract => {
                  return new Promise((resolveInsert, rejectInsert) => {
                    db.run(`INSERT INTO contracts (
                      id, client_id, product_id, contract_type, energy_type, 
                      supplier, status, value, start_date, end_date, notes, 
                      consultant_id, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                      contract.id,
                      contract.client_id,
                      null, // product_id inizialmente null per i contratti esistenti
                      contract.contract_type,
                      contract.energy_type,
                      contract.supplier,
                      contract.status,
                      contract.value,
                      contract.start_date,
                      contract.end_date,
                      contract.notes,
                      contract.consultant_id,
                      contract.created_at,
                      contract.updated_at || contract.created_at
                    ], (err) => {
                      if (err) {
                        rejectInsert(err);
                      } else {
                        resolveInsert();
                      }
                    });
                  });
                });

                Promise.all(insertPromises)
                  .then(() => {
                    // 6. Elimina la tabella di backup
                    db.run("DROP TABLE contracts_backup", (err) => {
                      if (err) {
                        loggers.warn('Impossibile eliminare la tabella di backup', err);
                      } else {
                        loggers.info('Tabella di backup eliminata');
                      }

                      loggers.info(`Migrazione completata con successo. ${existingContracts.length} contratti migrati.`);
                      db.close();
                      resolve('Migrazione completata');
                    });
                  })
                  .catch((err) => {
                    loggers.error('Errore nel reinserimento dei dati', err);
                    reject(err);
                  });
              } else {
                // Nessun dato da migrare
                db.run("DROP TABLE contracts_backup", () => {
                  loggers.info('Migrazione completata - nessun dato da migrare');
                  db.close();
                  resolve('Migrazione completata - tabella vuota');
                });
              }
            });
          });
        });
      });
    });
  });
}

// Esecuzione dello script
if (require.main === module) {
  console.log('Avvio migrazione database...');
  migrateDatabase()
    .then((result) => {
      console.log('✅ Migrazione completata:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Errore durante la migrazione:', error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };