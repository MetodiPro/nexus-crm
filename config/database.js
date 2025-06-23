const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { loggers } = require('./logger');
const { dbQueryLogger } = require('../middleware/logging');

// Crea un'istanza del database
const dbPath = path.resolve(__dirname, '../data/nexus.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    loggers.error('Errore nella connessione al database', err, { dbPath });
  } else {
    loggers.info('Connesso al database SQLite', { dbPath });
    
    // Crea le tabelle se non esistono
    db.serialize(() => {
      // Tabella utenti
      db.run(`CREATE TABLE IF NOT EXISTS users (
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
        if (err) loggers.dbError('Errore creazione tabella users', err);
        else loggers.info('Tabella users verificata/creata');
      });
      
      // Tabella clienti
      db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        company TEXT,
        vat_number TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        phone TEXT,
        email TEXT,
        notes TEXT,
        consultant_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultant_id) REFERENCES users (id)
      )`, (err) => {
        if (err) loggers.dbError('Errore creazione tabella clients', err);
        else loggers.info('Tabella clients verificata/creata');
      });
      
      // Tabella attività/appuntamenti
      db.run(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        activity_date DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        consultant_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id),
        FOREIGN KEY (consultant_id) REFERENCES users (id)
      )`, (err) => {
        if (err) loggers.dbError('Errore creazione tabella activities', err);
        else loggers.info('Tabella activities verificata/creata');
      });
      
      // Tabella prodotti/servizi
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        energy_type TEXT NOT NULL,
        supplier TEXT,
        base_price REAL,
        is_active INTEGER DEFAULT 1,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`, (err) => {
        if (err) loggers.dbError('Errore creazione tabella products', err);
        else loggers.info('Tabella products verificata/creata');
      });
      
<<<<<<< HEAD
      // Tabella contratti/offerte
      db.run(`CREATE TABLE IF NOT EXISTS contracts (
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
        if (err) loggers.dbError('Errore creazione tabella contracts', err);
        else loggers.info('Tabella contracts verificata/creata');
      });
      
      // Tabella per logging delle sessioni utente
      db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        logout_time DATETIME,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`, (err) => {
        if (err) loggers.dbError('Errore creazione tabella user_sessions', err);
        else loggers.info('Tabella user_sessions creata');
=======
      // Verifica se la tabella dei contratti esiste e se ha la colonna product_id
      db.get("PRAGMA table_info(contracts)", (err, rows) => {
        if (err) {
          console.error('Errore nella verifica della tabella contracts:', err);
          return;
        }
        
        // Se non ci sono righe, la tabella non esiste ancora
        if (!rows) {
          console.log('Creazione della tabella contracts...');
          // Crea la tabella contratti con product_id
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
            FOREIGN KEY (client_id) REFERENCES clients (id),
            FOREIGN KEY (product_id) REFERENCES products (id),
            FOREIGN KEY (consultant_id) REFERENCES users (id)
          )`);
        } else {
          // La tabella esiste, verifichiamo se ha la colonna product_id
          db.all("PRAGMA table_info(contracts)", (err, columns) => {
            if (err) {
              console.error('Errore nel recupero delle colonne della tabella contracts:', err);
              return;
            }
            
            // Controlla se esiste la colonna product_id
            const hasProductId = columns.some(col => col.name === 'product_id');
            
            if (!hasProductId) {
              console.log('Migrazione della tabella contracts per aggiungere product_id...');
              
              // SQLite non supporta direttamente l'aggiunta di una colonna con una chiave esterna
              // Dobbiamo ricreare la tabella
              
              // 1. Rinomina la tabella esistente
              db.run("ALTER TABLE contracts RENAME TO contracts_old", (err) => {
                if (err) {
                  console.error('Errore nel rinominare la tabella contracts:', err);
                  return;
                }
                
                // 2. Crea la nuova tabella con la struttura corretta
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
                  FOREIGN KEY (client_id) REFERENCES clients (id),
                  FOREIGN KEY (product_id) REFERENCES products (id),
                  FOREIGN KEY (consultant_id) REFERENCES users (id)
                )`, (err) => {
                  if (err) {
                    console.error('Errore nella creazione della nuova tabella contracts:', err);
                    return;
                  }
                  
                  // 3. Copia i dati dalla vecchia tabella alla nuova
                  db.run(`INSERT INTO contracts (
                    id, client_id, contract_type, energy_type, supplier, status, 
                    value, start_date, end_date, notes, consultant_id, created_at
                  ) SELECT 
                    id, client_id, contract_type, energy_type, supplier, status, 
                    value, start_date, end_date, notes, consultant_id, created_at 
                  FROM contracts_old`, (err) => {
                    if (err) {
                      console.error('Errore nella copia dei dati nella nuova tabella contracts:', err);
                      return;
                    }
                    
                    // 4. Elimina la vecchia tabella
                    db.run("DROP TABLE contracts_old", (err) => {
                      if (err) {
                        console.error('Errore nell\'eliminazione della vecchia tabella contracts_old:', err);
                        return;
                      }
                      
                      console.log('Migrazione della tabella contracts completata con successo.');
                    });
                  });
                });
              });
            } else {
              console.log('La tabella contracts ha già la colonna product_id. Nessuna migrazione necessaria.');
            }
          });
        }
>>>>>>> 9601f413e09575b3b02b3d441c1b792776daef62
      });
      
      // Inserisci un utente admin di default se non esiste
      const bcrypt = require('bcrypt');
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('admin123', salt);
      
      db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
        if (err) {
          loggers.dbError('Errore controllo utente admin', err);
        } else if (!row) {
          db.run(`INSERT INTO users (username, password, role, name, email) 
                  VALUES ('admin', ?, 'administrator', 'Amministratore', 'admin@nexus.it')`, 
                  [hashedPassword], (err) => {
            if (err) {
              loggers.dbError('Errore creazione utente admin', err);
            } else {
              loggers.info('Utente admin creato con password: admin123');
            }
          });
        } else {
          loggers.info('Utente admin già esistente');
        }
      });
    });
  }
});

// Intercetta le query del database per il logging
const originalAll = db.all.bind(db);
const originalGet = db.get.bind(db);
const originalRun = db.run.bind(db);

db.all = dbQueryLogger(originalAll, 'all');
db.get = dbQueryLogger(originalGet, 'get');
db.run = dbQueryLogger(originalRun, 'run');

// Gestione graceful shutdown
process.on('SIGINT', () => {
  loggers.info('Ricevuto SIGINT, chiusura database...');
  db.close((err) => {
    if (err) {
      loggers.error('Errore chiusura database', err);
    } else {
      loggers.info('Database chiuso correttamente');
    }
    process.exit(0);
  });
});

module.exports = db;