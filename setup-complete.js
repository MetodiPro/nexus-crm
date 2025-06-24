#!/usr/bin/env node

/**
 * 🚀 NEXUS CRM - Avvio Completo Sistema Gestione Utenze
 * 
 * Questo script esegue la migrazione e avvia l'applicazione con tutte le nuove funzionalità
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔥 NEXUS CRM - Setup Completo Sistema Utenze');
console.log('================================================\n');

async function executeCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 ${description}...`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completato\n`);
        resolve();
      } else {
        console.error(`❌ Errore in ${description} (codice: ${code})\n`);
        reject(new Error(`${description} fallito`));
      }
    });
    
    child.on('error', (err) => {
      console.error(`❌ Errore nell'esecuzione di ${description}:`, err);
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('📋 Fase 1: Migrazione Database');
    console.log('   - Aggiornamento tabella clients');
    console.log('   - Creazione tabelle utilities (electricity + gas)');
    console.log('   - Rimozione campo fax');
    console.log('   - Aggiunta gestione consumi annuali\n');
    
    await executeCommand('node', ['scripts/run-utilities-migration.js'], 'Migrazione Database');
    
    console.log('🎨 Fase 2: Compilazione Assets');
    await executeCommand('npm', ['run', 'build:css'], 'Compilazione CSS Tailwind');
    
    console.log('🚀 Fase 3: Avvio Applicazione');
    console.log('   ✨ Nuove funzionalità disponibili:');
    console.log('   ├── 🏢 Multiple utenze per cliente');
    console.log('   ├── 📊 Tracking consumi annuali (kWh/Smc)');
    console.log('   ├── 📍 Indirizzi specifici per utenza');
    console.log('   ├── ⚡ Gestione separata elettrico/gas');
    console.log('   ├── 📅 Monitoraggio scadenze contratti');
    console.log('   ├── 🔍 Ricerca avanzata POD/PDR');
    console.log('   └── 📈 Statistiche consumi per cliente\n');
    
    console.log('🌐 Accesso applicazione:');
    console.log('   URL: http://localhost:3000');
    console.log('   Login: admin / admin123\n');
    
    console.log('📱 Nuove Route Disponibili:');
    console.log('   ├── GET  /clients/:id/utilities          → Gestione utenze cliente');
    console.log('   ├── GET  /clients/:id/utilities/electric/new → Nuova utenza elettrica');
    console.log('   ├── GET  /clients/:id/utilities/gas/new  → Nuova utenza gas');
    console.log('   ├── GET  /utilities/expiring-contracts   → Contratti in scadenza');
    console.log('   └── GET  /utilities/search               → Ricerca utenze\n');
    
    await executeCommand('npm', ['start'], 'Avvio Server NEXUS CRM');
    
  } catch (error) {
    console.error('\n💥 Errore durante il setup:', error.message);
    console.error('\n🔧 Possibili soluzioni:');
    console.error('   1. Verifica che Node.js sia installato correttamente');
    console.error('   2. Esegui "npm install" per installare le dipendenze');
    console.error('   3. Controlla che la porta 3000 sia libera');
    console.error('   4. Verifica i permessi di scrittura sulla cartella data/');
    console.error('\n📞 Per supporto, controlla i log in logs/');
    process.exit(1);
  }
}

// Banner di avvio
console.log('   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗');
console.log('   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝');
console.log('   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗');
console.log('   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║');
console.log('   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║');
console.log('   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝');
console.log('');
console.log('   🏢 Sistema CRM per Consulenti Energetici');
console.log('   ⚡ Gestione Multiple Utenze & Consumi');
console.log('   📊 Monitoraggio Contratti & Scadenze');
console.log('');

main();