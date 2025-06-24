#!/usr/bin/env node

/**
 * 🚀 Quick Start - Avvia NEXUS CRM con gestione utenze
 */

console.log('🔥 NEXUS CRM - Avvio Rapido Sistema Utenze');
console.log('==========================================\n');

const { spawn } = require('child_process');

// Controlla se la migrazione è necessaria
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'nexus.db');
const migrationNeeded = !fs.existsSync(dbPath);

async function startApp() {
  if (migrationNeeded) {
    console.log('📋 Prima esecuzione - Migrazione database...');
    
    const migration = spawn('node', ['scripts/run-utilities-migration.js'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    migration.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Migrazione completata!\n');
        startServer();
      } else {
        console.error('❌ Errore nella migrazione');
        process.exit(1);
      }
    });
  } else {
    console.log('✅ Database già presente, avvio diretto...\n');
    startServer();
  }
}

function startServer() {
  console.log('🚀 Avvio server NEXUS CRM...');
  console.log('📍 URL: http://localhost:3000');
  console.log('👤 Login: admin / admin123\n');
  
  console.log('⚡ Nuove funzionalità gestione utenze:');
  console.log('   ├── 🏢 Multiple utenze per cliente');
  console.log('   ├── 📊 Tracking consumi annuali');
  console.log('   ├── 📍 Indirizzi specifici utenze');
  console.log('   ├── 📅 Monitoraggio scadenze contratti');
  console.log('   └── 🔍 Ricerca avanzata POD/PDR\n');
  
  const server = spawn('node', ['app.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  server.on('error', (err) => {
    console.error('❌ Errore avvio server:', err);
    process.exit(1);
  });
}

startApp();