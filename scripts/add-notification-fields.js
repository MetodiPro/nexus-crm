#!/usr/bin/env node

/**
 * Aggiunge campi per tracking notifiche
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/nexus.db');

console.log('🔄 Aggiunta campi notifiche...');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Aggiungi campo per tracking notifiche scadenza contratti
  db.run(`
    ALTER TABLE contracts 
    ADD COLUMN expiry_notification_sent DATETIME DEFAULT NULL
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Errore aggiunta campo expiry_notification_sent:', err.message);
    } else {
      console.log('✅ Campo expiry_notification_sent aggiunto alla tabella contracts');
    }
  });
  
  // Aggiungi campo per tracking reminder attività
  db.run(`
    ALTER TABLE activities 
    ADD COLUMN reminder_sent DATETIME DEFAULT NULL
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Errore aggiunta campo reminder_sent:', err.message);
    } else {
      console.log('✅ Campo reminder_sent aggiunto alla tabella activities');
    }
  });
  
  // Aggiungi campo email agli utenti se non presente
  db.run(`
    ALTER TABLE users 
    ADD COLUMN email VARCHAR(255) DEFAULT NULL
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Errore aggiunta campo email:', err.message);
    } else {
      console.log('✅ Campo email aggiunto alla tabella users');
    }
  });
  
  // Aggiungi campo is_active agli utenti se non presente
  db.run(`
    ALTER TABLE users 
    ADD COLUMN is_active INTEGER DEFAULT 1
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Errore aggiunta campo is_active:', err.message);
    } else {
      console.log('✅ Campo is_active aggiunto alla tabella users');
    }
  });
  
  // Crea tabella configurazioni notifiche
  db.run(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      notification_type VARCHAR(50) NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      frequency VARCHAR(20) DEFAULT 'daily',
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, notification_type)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Errore creazione tabella notification_settings:', err.message);
    } else {
      console.log('✅ Tabella notification_settings creata');
    }
  });
  
  // Inserisci impostazioni di default per utenti esistenti
  db.run(`
    INSERT OR IGNORE INTO notification_settings (user_id, notification_type, is_enabled)
    SELECT id, 'contract_expiry', 1 FROM users WHERE role IN ('consultant', 'administrator')
  `);
  
  db.run(`
    INSERT OR IGNORE INTO notification_settings (user_id, notification_type, is_enabled)
    SELECT id, 'activity_reminder', 1 FROM users WHERE role IN ('consultant', 'administrator')
  `);
  
  db.run(`
    INSERT OR IGNORE INTO notification_settings (user_id, notification_type, is_enabled)
    SELECT id, 'weekly_digest', 1 FROM users WHERE role = 'consultant'
  `);
  
  console.log('✅ Impostazioni notifiche di default create');
});

db.close((err) => {
  if (err) {
    console.error('❌ Errore chiusura database:', err.message);
  } else {
    console.log('🎉 Migrazione notifiche completata con successo!');
  }
});