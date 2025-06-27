#!/usr/bin/env node

/**
 * 🔍 Verifica completa sistema NEXUS CRM
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'data/nexus.db');

console.log('🔍 VERIFICA SISTEMA NEXUS CRM');
console.log('==============================\n');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database non trovato:', dbPath);
  console.log('💡 Esegui prima: node migrate-database.js\n');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

console.log('✅ Database trovato:', dbPath, '\n');

// Verifica tabelle esistenti
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Errore lettura tabelle:', err);
    return;
  }
  
  console.log('📋 TABELLE PRESENTI:');
  const tableNames = tables.map(t => t.name);
  tableNames.forEach(name => {
    console.log(`   ✅ ${name}`);
  });
  
  // Verifica tabelle richieste
  const requiredTables = [
    'users', 'clients', 'activities', 'contracts', 'products',
    'electricity_utilities', 'gas_utilities'
  ];
  
  console.log('\n🔍 VERIFICA TABELLE RICHIESTE:');
  const missingTables = requiredTables.filter(table => !tableNames.includes(table));
  
  if (missingTables.length > 0) {
    console.log('❌ Tabelle mancanti:');
    missingTables.forEach(table => {
      console.log(`   ❌ ${table}`);
    });
  } else {
    console.log('✅ Tutte le tabelle richieste sono presenti');
  }
  
  // Verifica campi notifiche
  console.log('\n🔔 VERIFICA CAMPI NOTIFICHE:');
  
  db.all("PRAGMA table_info(contracts)", (err, contractFields) => {
    if (err) {
      console.error('❌ Errore verifica contracts:', err);
      return;
    }
    
    const hasExpiryField = contractFields.some(f => f.name === 'expiry_notification_sent');
    console.log(`   contracts.expiry_notification_sent: ${hasExpiryField ? '✅' : '❌'}`);
    
    db.all("PRAGMA table_info(activities)", (err, activityFields) => {
      if (err) {
        console.error('❌ Errore verifica activities:', err);
        return;
      }
      
      const hasReminderField = activityFields.some(f => f.name === 'reminder_sent');
      console.log(`   activities.reminder_sent: ${hasReminderField ? '✅' : '❌'}`);
      
      db.all("PRAGMA table_info(users)", (err, userFields) => {
        if (err) {
          console.error('❌ Errore verifica users:', err);
          return;
        }
        
        const hasEmailField = userFields.some(f => f.name === 'email');
        const hasActiveField = userFields.some(f => f.name === 'is_active');
        console.log(`   users.email: ${hasEmailField ? '✅' : '❌'}`);
        console.log(`   users.is_active: ${hasActiveField ? '✅' : '❌'}`);
        
        // Verifica tabella notification_settings
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='notification_settings'", (err, row) => {
          console.log(`   notification_settings table: ${row ? '✅' : '❌'}`);
          
          // Verifica dati di esempio
          console.log('\n📊 DATI DI ESEMPIO:');
          
          db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
            console.log(`   Utenti: ${result ? result.count : 0}`);
            
            db.get("SELECT COUNT(*) as count FROM clients", (err, result) => {
              console.log(`   Clienti: ${result ? result.count : 0}`);
              
              db.get("SELECT COUNT(*) as count FROM activities", (err, result) => {
                console.log(`   Attività: ${result ? result.count : 0}`);
                
                db.get("SELECT COUNT(*) as count FROM contracts", (err, result) => {
                  console.log(`   Contratti: ${result ? result.count : 0}`);
                  
                  // Verifica configurazione
                  console.log('\n⚙️ CONFIGURAZIONE:');
                  console.log(`   .env file: ${fs.existsSync('.env') ? '✅' : '❌'}`);
                  console.log(`   Node modules: ${fs.existsSync('node_modules') ? '✅' : '❌'}`);
                  console.log(`   CSS compilato: ${fs.existsSync('public/css/styles.css') ? '✅' : '❌'}`);
                  
                  // Verifica dipendenze
                  console.log('\n📦 DIPENDENZE:');
                  try {
                    require('nodemailer');
                    console.log('   nodemailer: ✅');
                  } catch (e) {
                    console.log('   nodemailer: ❌');
                  }
                  
                  try {
                    require('node-cron');
                    console.log('   node-cron: ✅');
                  } catch (e) {
                    console.log('   node-cron: ❌');
                  }
                  
                  console.log('\n🎯 RIEPILOGO:');
                  if (missingTables.length === 0 && hasExpiryField && hasReminderField && hasEmailField) {
                    console.log('✅ Sistema pronto per Dashboard Analytics + Notifiche!');
                    console.log('\n🚀 PROSSIMI PASSI:');
                    console.log('   1. npm start');
                    console.log('   2. http://localhost:3000/dashboard');
                    console.log('   3. http://localhost:3000/notifications (admin)');
                  } else {
                    console.log('❌ Sistema non completo');
                    console.log('\n🔧 AZIONI RICHIESTE:');
                    if (missingTables.length > 0) {
                      console.log('   - Esegui migrazione database');
                    }
                    if (!hasExpiryField || !hasReminderField || !hasEmailField) {
                      console.log('   - Esegui: node scripts/add-notification-fields.js');
                    }
                  }
                  
                  db.close();
                });
              });
            });
          });
        });
      });
    });
  });
});