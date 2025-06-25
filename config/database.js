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
      });
      
      // Tabella utenze elettriche
      db.run(`CREATE TABLE IF NOT EXISTS electricity_utilities (
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
        if (err) loggers.dbError('Errore creazione tabella electricity_utilities', err);
        else loggers.info('Tabella electricity_utilities verificata/creata');
      });
      
      // Tabella utenze gas
      db.run(`CREATE TABLE IF NOT EXISTS gas_utilities (
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
        if (err) loggers.dbError('Errore creazione tabella gas_utilities', err);
        else loggers.info('Tabella gas_utilities verificata/creata');
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