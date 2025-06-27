#!/usr/bin/env node

/**
 * 🚀 Setup Completo NEXUS CRM - Dashboard Analytics + Sistema Notifiche
 */

console.log('🚀 NEXUS CRM - Setup Dashboard Analytics + Sistema Notifiche');
console.log('================================================================\n');

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function createEnvFile() {
  const envContent = `# NEXUS CRM - Configurazione Ambiente

# Database
DATABASE_PATH=./data/nexus.db

# Sessioni
SESSION_SECRET=nexus-crm-secret-key-change-this-in-production

# Email SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@nexus-crm.it
FROM_NAME=NEXUS CRM

# App URL
APP_URL=http://localhost:3000

# Scheduler (true per abilitare in sviluppo)
ENABLE_SCHEDULER=false

# Ambiente
NODE_ENV=development
`;

  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envContent);
    console.log('✅ File .env creato con configurazione di default');
  } else {
    console.log('ℹ️ File .env già esistente');
  }
}

async function main() {
  try {
    console.log('📋 Fase 1: Installazione Dipendenze');
    await executeCommand('npm', ['install', 'nodemailer@6.9.8', 'node-cron@3.0.3'], 'Installazione dipendenze email e scheduler');
    
    console.log('📋 Fase 2: Setup Database');
    await executeCommand('node', ['scripts/add-notification-fields.js'], 'Aggiunta campi notifiche al database');
    
    console.log('📋 Fase 3: Compilazione Assets');
    await executeCommand('npm', ['run', 'build:css'], 'Compilazione CSS Tailwind');
    
    console.log('📋 Fase 4: Configurazione Ambiente');
    createEnvFile();
    
    console.log('🎉 SETUP COMPLETATO CON SUCCESSO!');
    console.log('=====================================\n');
    
    console.log('📊 NUOVE FUNZIONALITÀ DISPONIBILI:');
    console.log('├── 📈 Dashboard Analytics con KPI e grafici interattivi');
    console.log('├── 🔔 Sistema notifiche email automatiche');
    console.log('├── ⏰ Scheduler per controlli programmati');
    console.log('├── 📧 Gestione email SMTP configurabile');
    console.log('├── 📅 Reminder appuntamenti e scadenze contratti');
    console.log('└── 📊 Digest settimanali per consulenti\n');
    
    console.log('🔧 CONFIGURAZIONE RICHIESTA:');
    console.log('1. Modifica il file .env con le tue credenziali SMTP');
    console.log('2. Per Gmail, crea una "App Password" nelle impostazioni Google');
    console.log('3. Aggiorna i campi email negli utenti esistenti\n');
    
    console.log('🚀 AVVIO APPLICAZIONE:');
    console.log('1. npm start');
    console.log('2. Vai su http://localhost:3000');
    console.log('3. Login e naviga alla nuova dashboard\n');
    
    console.log('📋 ENDPOINT NUOVI:');
    console.log('├── /dashboard - Dashboard Analytics');
    console.log('├── /notifications - Gestione Notifiche (solo admin)');
    console.log('├── /notifications/settings - Impostazioni utente');
    console.log('└── /dashboard/api/kpis - API per dati real-time\n');
    
    console.log('⚙️ CONFIGURAZIONE EMAIL:');
    console.log('Modifica le seguenti variabili nel file .env:');
    console.log('- SMTP_HOST (es: smtp.gmail.com)');
    console.log('- SMTP_USER (tua email)');
    console.log('- SMTP_PASS (app password)');
    console.log('- FROM_EMAIL (email mittente)\n');
    
    console.log('🎯 PER TESTARE:');
    console.log('1. Configura email in .env');
    console.log('2. Aggiungi email al tuo profilo utente');
    console.log('3. Vai su /notifications (come admin)');
    console.log('4. Testa invio email');
    console.log('5. Abilita scheduler con ENABLE_SCHEDULER=true\n');
    
  } catch (error) {
    console.error('❌ Errore durante il setup:', error.message);
    console.error('\n🔧 Possibili soluzioni:');
    console.error('1. Verifica la connessione internet');
    console.error('2. Controlla i permessi di scrittura');
    console.error('3. Assicurati che Node.js sia aggiornato');
    console.error('4. Riprova il comando manualmente');
    process.exit(1);
  }
}

main();