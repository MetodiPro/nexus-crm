const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔧 NEXUS CRM - Risoluzione Problemi Email');
console.log('==========================================\n');

// Importa il servizio email migliorato
const emailService = require('./services/emailService');

async function risolviProblemiEmail() {
  try {
    console.log('🩺 1. DIAGNOSTICA COMPLETA...\n');
    
    // Esegui diagnostica completa
    const diagnostics = await emailService.runDiagnostics();
    
    console.log('🔧 2. RIPARAZIONE AUTOMATICA...\n');
    
    // Forza re-inizializzazione
    console.log('   ↻ Re-inizializzazione servizio email...');
    await emailService.initializeTransporter();
    
    console.log('🧪 3. TEST INVIO EMAIL...\n');
    
    // Test email di verifica
    const testEmail = process.env.SMTP_USER || 'admin@nexus.it';
    console.log(`   📧 Invio email di test a: ${testEmail}`);
    
    try {
      const result = await emailService.sendTestEmail(testEmail);
      
      console.log('✅ EMAIL INVIATA CON SUCCESSO!');
      console.log(`   📨 Message ID: ${result.messageId}`);
      console.log('   🎉 Sistema email funzionante!\n');
      
      console.log('📋 RIEPILOGO RISOLUZIONE:');
      console.log('=========================');
      console.log('✅ Problemi risolti automaticamente');
      console.log('✅ Configurazione SMTP ottimizzata');
      console.log('✅ Email di test inviata con successo');
      console.log('✅ Sistema pronto per l\'uso\n');
      
      console.log('🚀 PROSSIMI PASSI:');
      console.log('   1. Riavvia l\'applicazione: npm start');
      console.log('   2. Vai su /notifications per gestire le notifiche');
      console.log('   3. Configura email per gli utenti in /users');
      
      return true;
      
    } catch (emailError) {
      console.log('❌ Test email fallito:', emailError.message);
      
      console.log('\n🔧 RISOLUZIONE MANUALE RICHIESTA:');
      console.log('==================================');
      
      // Controlla problemi comuni
      if (emailError.message.includes('Invalid login') || emailError.message.includes('Authentication failed')) {
        console.log('🔑 PROBLEMA: Credenziali di accesso non valide');
        console.log('   📝 SOLUZIONE:');
        console.log('   1. Verifica username/password nel pannello OVH');
        console.log('   2. Controlla che l\'account email sia attivo');
        console.log('   3. Aggiorna le credenziali nel file .env:');
        console.log('      SMTP_USER=tua-email@dominio.com');
        console.log('      SMTP_PASS=tua-password');
      }
      
      if (emailError.message.includes('Timeout') || emailError.message.includes('connection')) {
        console.log('🌐 PROBLEMA: Connessione al server SMTP');
        console.log('   📝 SOLUZIONE:');
        console.log('   1. Verifica connessione internet');
        console.log('   2. Controlla firewall/antivirus');
        console.log('   3. Prova configurazione alternativa:');
        console.log('      SMTP_HOST=smtp.gmail.com');
        console.log('      SMTP_PORT=587');
        console.log('      SMTP_SECURE=false');
      }
      
      if (emailError.message.includes('Missing credentials')) {
        console.log('📝 PROBLEMA: Credenziali mancanti');
        console.log('   📝 SOLUZIONE:');
        console.log('   Aggiungi al file .env:');
        console.log('   SMTP_USER=tua-email@dominio.com');
        console.log('   SMTP_PASS=tua-password');
        console.log('   FROM_EMAIL=tua-email@dominio.com');
      }
      
      // Suggerisci configurazioni alternative
      console.log('\n💡 CONFIGURAZIONI ALTERNATIVE:');
      console.log('===============================');
      
      console.log('🅰️ OPZIONE A - Gmail (Raccomandato):');
      console.log('   SMTP_HOST=smtp.gmail.com');
      console.log('   SMTP_PORT=587');
      console.log('   SMTP_SECURE=false');
      console.log('   SMTP_USER=tuo-gmail@gmail.com');
      console.log('   SMTP_PASS=app-password-generata');
      console.log('   📋 Guida: https://support.google.com/accounts/answer/185833');
      
      console.log('\n🅱️ OPZIONE B - OVH Alternative:');
      console.log('   SMTP_HOST=ssl0.ovh.net');
      console.log('   SMTP_PORT=587');
      console.log('   SMTP_SECURE=false');
      console.log('   SMTP_USER=nexus@metodi.pro');
      console.log('   SMTP_PASS=password-corretta');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Errore durante la risoluzione:', error.message);
    
    console.log('\n🆘 RISOLUZIONE DI EMERGENZA:');
    console.log('============================');
    console.log('1. 🔄 Riavvia l\'applicazione');
    console.log('2. 📝 Verifica file .env');
    console.log('3. 🌐 Controlla connessione internet');
    console.log('4. 🔧 Esegui di nuovo questo script');
    
    return false;
  }
}

// Funzione per verificare e correggere file .env
async function verificaConfigurazioneEnv() {
  const fs = require('fs');
  const envPath = path.join(__dirname, '.env');
  
  console.log('📋 Verifica configurazione .env...\n');
  
  try {
    if (!fs.existsSync(envPath)) {
      console.log('❌ File .env non trovato, creo configurazione di base...');
      
      const defaultEnv = `# NEXUS CRM - Configurazione Ambiente

# Database
DATABASE_PATH=./data/nexus.db

# Sessioni
SESSION_SECRET=nexus-crm-secret-key-change-this-in-production

# Email SMTP Configuration
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=nexus@metodi.pro
SMTP_PASS=Nexus112233!!
FROM_EMAIL=nexus@metodi.pro
FROM_NAME=NEXUS CRM

# App URL
APP_URL=http://localhost:3000

# Scheduler
ENABLE_SCHEDULER=true

# Ambiente
NODE_ENV=development
`;
      
      fs.writeFileSync(envPath, defaultEnv);
      console.log('✅ File .env creato con configurazione di base');
      
      // Ricarica variabili ambiente
      require('dotenv').config({ path: envPath });
    }
    
    // Verifica variabili critiche
    const criticalVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missing = criticalVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.log('⚠️  Variabili mancanti:', missing.join(', '));
      return false;
    }
    
    console.log('✅ Configurazione .env valida\n');
    return true;
    
  } catch (error) {
    console.error('❌ Errore verifica .env:', error.message);
    return false;
  }
}

// Funzione per testare configurazioni email multiple
async function testConfigurazioniMultiple() {
  console.log('🧪 Test configurazioni email multiple...\n');
  
  const configurazioni = [
    {
      nome: 'OVH SSL 465 (Attuale)',
      config: {
        host: 'ssl0.ovh.net',
        port: 465,
        secure: true,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    {
      nome: 'OVH TLS 587',
      config: {
        host: 'ssl0.ovh.net',
        port: 587,
        secure: false,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    {
      nome: 'Gmail TLS 587',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  ];
  
  for (const { nome, config } of configurazioni) {
    try {
      console.log(`🔄 Testando: ${nome}...`);
      
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Test connessione
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout 15s')), 15000);
      });
      
      await Promise.race([verifyPromise, timeoutPromise]);
      
      console.log(`   ✅ ${nome} - FUNZIONA!`);
      
      // Se funziona, aggiorna .env
      await aggiornaEnvConConfigurazione(config);
      return { success: true, config, nome };
      
    } catch (error) {
      console.log(`   ❌ ${nome} - Fallito: ${error.message}`);
    }
  }
  
  return { success: false };
}

// Aggiorna file .env con configurazione funzionante
async function aggiornaEnvConConfigurazione(config) {
  const fs = require('fs');
  const envPath = path.join(__dirname, '.env');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(/SMTP_HOST=.*/g, `SMTP_HOST=${config.host}`);
    envContent = envContent.replace(/SMTP_PORT=.*/g, `SMTP_PORT=${config.port}`);
    envContent = envContent.replace(/SMTP_SECURE=.*/g, `SMTP_SECURE=${config.secure}`);
    
    fs.writeFileSync(envPath, envContent);
    console.log('   📝 File .env aggiornato con configurazione funzionante');
    
    // Ricarica variabili ambiente
    delete require.cache[require.resolve('dotenv')];
    require('dotenv').config({ path: envPath });
    
  } catch (error) {
    console.error('   ❌ Errore aggiornamento .env:', error.message);
  }
}

// Esecuzione principale
async function main() {
  console.log('🚀 Avvio risoluzione problemi email...\n');
  
  // 1. Verifica configurazione .env
  const envOk = await verificaConfigurazioneEnv();
  if (!envOk) {
    console.log('❌ Problemi con file .env - correggi e riprova');
    return;
  }
  
  // 2. Test configurazioni multiple
  console.log('🔄 Provo configurazioni alternative...\n');
  const testResult = await testConfigurazioniMultiple();
  
  if (testResult.success) {
    console.log(`✅ Configurazione funzionante trovata: ${testResult.nome}\n`);
  } else {
    console.log('❌ Nessuna configurazione funzionante trovata\n');
  }
  
  // 3. Risoluzione completa
  const risolto = await risolviProblemiEmail();
  
  if (risolto) {
    console.log('\n🎉 PROBLEMA RISOLTO CON SUCCESSO!');
    console.log('===================================');
    console.log('Il sistema email di NEXUS CRM è ora operativo.');
    console.log('Puoi riavviare l\'applicazione e testare le notifiche.');
  } else {
    console.log('\n⚠️  INTERVENTO MANUALE RICHIESTO');
    console.log('==================================');
    console.log('Seguire le istruzioni sopra per completare la configurazione.');
  }
}

// Gestione errori globali
process.on('uncaughtException', (error) => {
  console.error('\n❌ Errore non gestito:', error.message);
  console.log('\n🔧 Prova a:');
  console.log('1. Riavviare l\'applicazione');
  console.log('2. Verificare il file .env');
  console.log('3. Controllare la connessione internet');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Promise rifiutata:', error.message);
  console.log('\n🔧 Continuazione dello script...\n');
});

// Avvio
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Errore principale:', error.message);
    process.exit(1);
  });
}

module.exports = { risolviProblemiEmail, verificaConfigurazioneEnv, testConfigurazioniMultiple };
