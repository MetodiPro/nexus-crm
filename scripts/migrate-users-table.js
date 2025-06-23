const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { loggers } = require('../config/logger');

// Script di migrazione per aggiornare la tabella users con le nuove colonne
function migrateUsersTable() {
  const dbPath = path.resolve(__dirname, '../data/nexus.db');
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Verifica la struttura attuale della tabella users
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          loggers.error('Errore nel controllo struttura tabella users', err);
          return reject(err);
        }

        console.log('Struttura attuale tabella users:', columns.map(c => c.name));

        // Verifica quali colonne mancano
        const existingColumns = columns.map(col => col.name);
        const requiredColumns = [
          'last_login',
          'failed_login_attempts', 
          'account_locked',
          'updated_at'
        ];

        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length === 0) {
          loggers.info('Tutte le colonne richieste sono già presenti nella tabella users');
          db.close();
          return resolve('Tabella già aggiornata');
        }

        console.log('Colonne mancanti:', missingColumns);
        loggers.info('Inizio migrazione tabella users', { missingColumns });

        // 2. Backup dei dati esistenti
        db.all("SELECT * FROM users", (err, existingUsers) => {
          if (err) {
            loggers.error('Errore nel backup degli utenti esistenti', err);
            return reject(err);
          }

          console.log(`Backup di ${existingUsers.length} utenti esistenti`);

          // 3. Rinomina la tabella esistente
          db.run("ALTER TABLE users RENAME TO users_backup", (err) => {
            if (err) {
              loggers.error('Errore nel rinominare la tabella users', err);
              return reject(err);
            }

            console.log('Tabella users rinominata in users_backup');

            // 4. Crea la nuova tabella con la struttura completa
            db.run(`CREATE TABLE users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              role TEXT NOT NULL,
              name TEXT NOT NULL,
              email TEXT,
              last_login DATETIME,
              failed_login_attempts INTEGER DEFAULT 0,
              account_locked BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
              if (err) {
                loggers.error('Errore nella creazione della nuova tabella users', err);
                return reject(err);
              }

              console.log('Nuova tabella users creata');

              // 5. Reinserisci i dati esistenti
              if (existingUsers.length > 0) {
                const insertPromises = existingUsers.map(user => {
                  return new Promise((resolveInsert, rejectInsert) => {
                    db.run(`INSERT INTO users (
                      id, username, password, role, name, email, 
                      last_login, failed_login_attempts, account_locked, 
                      created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                      user.id,
                      user.username,
                      user.password,
                      user.role,
                      user.name,
                      user.email,
                      user.last_login || null,
                      user.failed_login_attempts || 0,
                      user.account_locked || 0,
                      user.created_at,
                      user.updated_at || user.created_at
                    ], (err) => {
                      if (err) {
                        console.error('Errore inserimento utente:', user.username, err);
                        rejectInsert(err);
                      } else {
                        console.log('Utente migrato:', user.username);
                        resolveInsert();
                      }
                    });
                  });
                });

                Promise.all(insertPromises)
                  .then(() => {
                    // 6. Elimina la tabella di backup
                    db.run("DROP TABLE users_backup", (err) => {
                      if (err) {
                        loggers.warn('Impossibile eliminare la tabella di backup', err);
                      } else {
                        console.log('Tabella di backup eliminata');
                      }

                      console.log(`✅ Migrazione completata con successo. ${existingUsers.length} utenti migrati.`);
                      loggers.info('Migrazione tabella users completata', {
                        migratedUsers: existingUsers.length,
                        addedColumns: missingColumns
                      });
                      
                      db.close();
                      resolve('Migrazione completata');
                    });
                  })
                  .catch((err) => {
                    loggers.error('Errore nel reinserimento dei dati utenti', err);
                    reject(err);
                  });
              } else {
                // Nessun dato da migrare
                db.run("DROP TABLE users_backup", () => {
                  console.log('✅ Migrazione completata - nessun dato da migrare');
                  loggers.info('Migrazione tabella users completata - tabella vuota');
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
  console.log('🔄 Avvio migrazione tabella users...');
  migrateUsersTable()
    .then((result) => {
      console.log('✅ Migrazione completata:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Errore durante la migrazione:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsersTable };