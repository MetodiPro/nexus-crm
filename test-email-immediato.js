const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🧪 NEXUS CRM - Test Immediato Email');
console.log('====================================\n');

async function testImmediato() {
  try {
    console.log('📧 Test configurazione email corrente...\n');
    
    // 1. Verifica variabili ambiente
    console.log('📋 CONFIGURAZIONE ATTUALE:');
    console.log('==========================');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ NON CONFIGURATO');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ NON CONFIGURATO');
    console.log('SMTP_USER:', process.env.SMTP_USER || '❌ NON CONFIGURATO');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ CONFIGURATO' : '❌ NON CONFIGURATO');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL || '❌ NON CONFIGURATO');
    console.log('');
    
    // 2. Test servizio email
    console.log('🔧 CARICAMENTO SERVIZIO EMAIL...');
    console.log('=================================');
    
    let emailService;
    try {
      emailService = require('./services/emailService');
      console.log('✅ EmailService caricato correttamente');
    } catch (error) {
      console.log('❌ Errore caricamento EmailService:', error.message);
      console.log('\n🔧 SOLUZIONE:');
      console.log('   npm install nodemailer');
      console.log('   node risolvi-email.js');
      return false;
    }
    
    // 3. Test connessione
    console.log('\n🔍 TEST CONNESSIONE SMTP...');
    console.log('============================');
    
    const isConnected = await emailService.verifyConnection();
    
    if (isConnected) {
      console.log('✅ Connessione SMTP verificata con successo!');
    } else {
      console.log('❌ Connessione SMTP fallita');
      
      console.log('\n🔄 Provo configurazioni alternative...');
      const result = await emailService.tryAlternativeConfigurations();
      
      if (result.success) {
        console.log(`✅ Configurazione alternativa funzionante: ${result.configuration}`);
      } else {
        console.log('❌ Nessuna configurazione funzionante trovata');
        console.log('\n🆘 RISOLUZIONE NECESSARIA:');
        console.log('   1. Esegui: risolvi-email.bat');
        console.log('   2. Oppure: configura-gmail.bat');
        return false;
      }
    }
    
    // 4. Test invio email
    console.log('\n📤 TEST INVIO EMAIL...');
    console.log('=======================');
    
    const testEmail = process.env.SMTP_USER || 'test@example.com';
    console.log(`📧 Invio email di test a: ${testEmail}`);
    
    try {
      const result = await emailService.sendTestEmail(testEmail);
      
      console.log('🎉 EMAIL INVIATA CON SUCCESSO!');
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log(`📧 Destinatario: ${testEmail}`);
      
      console.log('\n✅ SISTEMA EMAIL COMPLETAMENTE OPERATIVO!');
      console.log('==========================================');
      console.log('🚀 Il sistema di notifiche NEXUS CRM è pronto');
      console.log('📧 Puoi configurare email per gli utenti');
      console.log('🔔 Le notifiche automatiche funzioneranno');
      
      return true;
      
    } catch (emailError) {
      console.log('❌ Test invio email fallito:', emailError.message);
      
      console.log('\n🔧 ANALISI ERRORE:');
      console.log('===================');
      
      if (emailError.message.includes('Invalid login')) {
        console.log('🔑 Problema: Credenziali non valide');
        console.log('   📝 Verifica username/password OVH');
        console.log('   🔄 Oppure passa a Gmail: configura-gmail.bat');
      } else if (emailError.message.includes('Timeout')) {
        console.log('⏱️ Problema: Timeout connessione');
        console.log('   🌐 Verifica connessione internet');
        console.log('   🛡️ Controlla firewall/antivirus');
      } else {
        console.log('❓ Errore generico:', emailError.message);
        console.log('   🔄 Esegui: risolvi-email.bat');
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    
    console.log('\n🆘 RISOLUZIONE DI EMERGENZA:');
    console.log('============================');
    console.log('1. 📝 Verifica file .env esistente');
    console.log('2. 📦 Installa dipendenze: npm install');
    console.log('3. 🔧 Esegui risoluzione: risolvi-email.bat');
    
    return false;
  }
}

// Diagnostica rapida
async function diagnosticaRapida() {
  console.log('🩺 DIAGNOSTICA RAPIDA...\n');
  
  const fs = require('fs');
  
  // Verifica file .env
  const envExists = fs.existsSync('.env');
  console.log('.env file:', envExists ? '✅ Presente' : '❌ Mancante');
  
  // Verifica node_modules
  const nodeModulesExists = fs.existsSync('node_modules');
  console.log('node_modules:', nodeModulesExists ? '✅ Presente' : '❌ Mancante');
  
  // Verifica emailService
  const emailServiceExists = fs.existsSync('services/emailService.js');
  console.log('emailService.js:', emailServiceExists ? '✅ Presente' : '❌ Mancante');
  
  // Test connettività TCP base
  console.log('\n🌐 TEST CONNETTIVITA TCP...');
  console.log('============================');
  
  const testPorts = [
    { host: 'ssl0.ovh.net', port: 465, name: 'OVH SSL' },
    { host: 'ssl0.ovh.net', port: 587, name: 'OVH TLS' },
    { host: 'smtp.gmail.com', port: 587, name: 'Gmail' },
    { host: 'google.com', port: 80, name: 'Internet' }
  ];
  
  for (const { host, port, name } of testPorts) {
    const isReachable = await testTCPConnection(host, port);
    console.log(`${name} (${host}:${port}):`, isReachable ? '✅ Raggiungibile' : '❌ Non raggiungibile');
  }
  
  console.log('');
}

// Test connessione TCP
function testTCPConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// Suggerimenti basati sui risultati
function suggerimenti(testResult) {
  console.log('\n💡 SUGGERIMENTI BASATI SUI RISULTATI:');
  console.log('=====================================');
  
  if (testResult) {
    console.log('🎉 Tutto funziona perfettamente!');
    console.log('');
    console.log('🚀 PROSSIMI PASSI:');
    console.log('   1. Riavvia l\'applicazione: npm start');
    console.log('   2. Vai su /notifications per testare');
    console.log('   3. Configura email utenti in /users');
    console.log('   4. Attiva notifiche automatiche');
  } else {
    console.log('🔧 Sistema email non funzionante');
    console.log('');
    console.log('🛠️ AZIONI CONSIGLIATE (in ordine):');
    console.log('   1. Esegui: risolvi-email.bat (risoluzione automatica)');
    console.log('   2. Se fallisce: configura-gmail.bat (alternativa Gmail)');
    console.log('   3. Verifica firewall/antivirus');
    console.log('   4. Controlla connessione internet');
    console.log('');
    console.log('📚 DOCUMENTAZIONE:');
    console.log('   - Guida completa: GUIDA-RISOLUZIONE-EMAIL.md');
    console.log('   - Dashboard test: http://localhost:3000/notifications');
  }
}

// Test veloce configurazioni email
async function testConfigurazioniVeloci() {
  console.log('⚡ TEST VELOCE CONFIGURAZIONI...\n');
  
  const configurazioni = [
    {
      nome: 'OVH SSL 465',
      host: 'ssl0.ovh.net',
      port: 465,
      secure: true
    },
    {
      nome: 'OVH TLS 587',
      host: 'ssl0.ovh.net',
      port: 587,
      secure: false
    },
    {
      nome: 'Gmail TLS 587',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    }
  ];
  
  for (const config of configurazioni) {
    try {
      const isReachable = await testTCPConnection(config.host, config.port, 3000);
      console.log(`${config.nome}:`, isReachable ? '🟢 Raggiungibile' : '🔴 Non raggiungibile');
    } catch (error) {
      console.log(`${config.nome}: ❌ Errore`);
    }
  }
  
  console.log('');
}

// Controllo file di log recenti
function controllaLogRecenti() {
  console.log('📝 CONTROLLO LOG RECENTI...\n');
  
  const fs = require('fs');
  const logDir = './logs';
  
  try {
    if (!fs.existsSync(logDir)) {
      console.log('❌ Directory logs non trovata');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const errorLogFile = `${logDir}/error-${today}.log`;
    const nexusLogFile = `${logDir}/nexus-${today}.log`;
    
    // Controlla errori recenti
    if (fs.existsSync(errorLogFile)) {
      const errorContent = fs.readFileSync(errorLogFile, 'utf8');
      const emailErrors = errorContent.split('\n').filter(line => 
        line.includes('SMTP') || line.includes('email') || line.includes('Email')
      ).slice(-5); // Ultimi 5 errori
      
      if (emailErrors.length > 0) {
        console.log('⚠️ ERRORI EMAIL RECENTI:');
        emailErrors.forEach(error => {
          if (error.trim()) {
            console.log(`   ${error.substring(0, 100)}...`);
          }
        });
      } else {
        console.log('✅ Nessun errore email recente nei log');
      }
    } else {
      console.log('📄 Log errori odierni non trovati');
    }
    
  } catch (error) {
    console.log('❌ Errore lettura log:', error.message);
  }
  
  console.log('');
}

// Esecuzione principale
async function main() {
  console.log('🏃‍♂️ Avvio test immediato...\n');
  
  // 1. Diagnostica rapida
  await diagnosticaRapida();
  
  // 2. Test configurazioni veloci
  await testConfigurazioniVeloci();
  
  // 3. Controllo log
  controllaLogRecenti();
  
  // 4. Test completo
  const risultato = await testImmediato();
  
  // 5. Suggerimenti finali
  suggerimenti(risultato);
  
  // 6. Riepilogo finale
  console.log('\n📊 RIEPILOGO TEST:');
  console.log('==================');
  console.log('Status:', risultato ? '✅ SUCCESSO' : '❌ FALLITO');
  console.log('Timestamp:', new Date().toLocaleString('it-IT'));
  console.log('Configurazione:', process.env.SMTP_HOST || 'Non configurata');
  
  if (!risultato) {
    console.log('\n🔄 RIPROVA DOPO:');
    console.log('   1. Aver eseguito risolvi-email.bat');
    console.log('   2. Aver configurato Gmail alternativo');
    console.log('   3. Aver verificato firewall/connessione');
  }
  
  return risultato;
}

// Gestione errori
process.on('uncaughtException', (error) => {
  console.error('\n❌ Errore critico:', error.message);
  console.log('\n🆘 Il sistema ha riscontrato un errore critico');
  console.log('🔧 Esegui: risolvi-email.bat per riparare');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n⚠️ Promise rifiutata:', error.message);
});

// Avvio se eseguito direttamente
if (require.main === module) {
  main().then(success => {
    if (success) {
      console.log('\n🎉 TEST COMPLETATO CON SUCCESSO!');
      process.exit(0);
    } else {
      console.log('\n⚠️ TEST FALLITO - AZIONE RICHIESTA');
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n❌ Errore test:', error.message);
    process.exit(1);
  });
}

module.exports = { testImmediato, diagnosticaRapida, testConfigurazioniVeloci };
