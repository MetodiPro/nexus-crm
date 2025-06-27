const fs = require('fs');
const path = require('path');

console.log('📧 NEXUS CRM - Configurazione Gmail');
console.log('====================================\n');

function configuraGmail() {
  const envPath = path.join(__dirname, '.env');
  
  console.log('💡 CONFIGURAZIONE GMAIL PER NEXUS CRM');
  console.log('=====================================\n');
  
  console.log('📋 PASSAGGI NECESSARI:');
  console.log('1. 🔐 Abilita autenticazione a 2 fattori su Gmail');
  console.log('2. 🔑 Genera App Password dedicata');
  console.log('3. 📝 Aggiorna configurazione NEXUS CRM\n');
  
  console.log('🔗 GUIDA DETTAGLIATA:');
  console.log('======================');
  console.log('1. Vai su: https://myaccount.google.com/security');
  console.log('2. Attiva "Verifica in due passaggi" se non già attiva');
  console.log('3. Vai su "App Password" (in fondo alla sezione sicurezza)');
  console.log('4. Genera nuova app password per "NEXUS CRM"');
  console.log('5. Copia la password generata (16 caratteri)\n');
  
  // Leggi configurazione attuale
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Esempio di configurazione Gmail
  const gmailConfig = `# NEXUS CRM - Configurazione Ambiente

# Database
DATABASE_PATH=./data/nexus.db

# Sessioni
SESSION_SECRET=nexus-crm-secret-key-change-this-in-production

# Email SMTP Configuration - GMAIL (CONFIGURAZIONE SICURA E AFFIDABILE)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tua-email@gmail.com
SMTP_PASS=app-password-generata-16-caratteri
FROM_EMAIL=tua-email@gmail.com
FROM_NAME=NEXUS CRM

# App URL
APP_URL=http://localhost:3000

# Scheduler
ENABLE_SCHEDULER=true

# Ambiente
NODE_ENV=development
`;

  // Salva file di esempio
  const examplePath = path.join(__dirname, '.env.gmail.example');
  fs.writeFileSync(examplePath, gmailConfig);
  
  console.log('📝 CONFIGURAZIONE GMAIL CREATA:');
  console.log('===============================');
  console.log(`✅ File salvato: ${examplePath}`);
  console.log('✅ Modifica i seguenti valori:');
  console.log('   - SMTP_USER: inserisci la tua email Gmail');
  console.log('   - SMTP_PASS: inserisci la app password generata');
  console.log('   - FROM_EMAIL: stessa email del SMTP_USER\n');
  
  console.log('🔄 DOPO LA CONFIGURAZIONE:');
  console.log('===========================');
  console.log('1. Rinomina .env.gmail.example in .env');
  console.log('2. Modifica i valori email e password');
  console.log('3. Esegui: node risolvi-email.js');
  console.log('4. Testa l\'invio email dalla dashboard\n');
  
  console.log('💡 VANTAGGI GMAIL:');
  console.log('==================');
  console.log('✅ Affidabilità superiore al 99.9%');
  console.log('✅ Sicurezza enterprise-grade');
  console.log('✅ Nessun problema di firewall');
  console.log('✅ Supporto completo TLS');
  console.log('✅ Monitoraggio anti-spam avanzato\n');
  
  console.log('⚠️  IMPORTANTE:');
  console.log('===============');
  console.log('- NON usare la password normale di Gmail');
  console.log('- USA SOLO la App Password generata');
  console.log('- La App Password ha 16 caratteri senza spazi');
  console.log('- Mantieni segreta la App Password\n');
  
  return examplePath;
}

// Test specifico per Gmail
async function testGmail(email, appPassword) {
  const nodemailer = require('nodemailer');
  
  console.log('🧪 Test configurazione Gmail...\n');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: email,
      pass: appPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Test connessione
    console.log('🔍 Verifico connessione Gmail...');
    await transporter.verify();
    console.log('✅ Connessione Gmail verificata!');
    
    // Test invio email
    console.log('📤 Invio email di test...');
    const result = await transporter.sendMail({
      from: `NEXUS CRM <${email}>`,
      to: email,
      subject: '🧪 Test Gmail - NEXUS CRM',
      html: `
        <h2>✅ Gmail Configurato Correttamente!</h2>
        <p>Questa email conferma che la configurazione Gmail per NEXUS CRM funziona perfettamente.</p>
        <p><strong>Data/Ora:</strong> ${new Date().toLocaleString('it-IT')}</p>
        <p><strong>Configurazione:</strong> smtp.gmail.com:587 (TLS)</p>
        <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="color: #065f46; margin: 0;"><strong>🎉 Sistema email pronto per l'uso!</strong></p>
        </div>
      `,
      text: `Test Gmail NEXUS CRM - ${new Date().toLocaleString('it-IT')}`
    });
    
    console.log(`✅ Email inviata! ID: ${result.messageId}`);
    console.log('🎉 Configurazione Gmail completata con successo!\n');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test Gmail fallito:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔑 PROBLEMA: Credenziali non valide');
      console.log('   📝 SOLUZIONE:');
      console.log('   1. Verifica che la email sia corretta');
      console.log('   2. Assicurati di usare App Password (non password normale)');
      console.log('   3. Rigenera App Password se necessario');
    }
    
    return false;
  }
}

// Aggiorna .env con configurazione Gmail
function aggiornaEnvConGmail(email, appPassword) {
  const envPath = path.join(__dirname, '.env');
  
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Aggiorna le configurazioni Gmail
    envContent = envContent.replace(/SMTP_HOST=.*/g, 'SMTP_HOST=smtp.gmail.com');
    envContent = envContent.replace(/SMTP_PORT=.*/g, 'SMTP_PORT=587');
    envContent = envContent.replace(/SMTP_SECURE=.*/g, 'SMTP_SECURE=false');
    envContent = envContent.replace(/SMTP_USER=.*/g, `SMTP_USER=${email}`);
    envContent = envContent.replace(/SMTP_PASS=.*/g, `SMTP_PASS=${appPassword}`);
    envContent = envContent.replace(/FROM_EMAIL=.*/g, `FROM_EMAIL=${email}`);
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ File .env aggiornato con configurazione Gmail');
    
  } catch (error) {
    console.error('❌ Errore aggiornamento .env:', error.message);
  }
}

// Configurazione interattiva (se eseguito direttamente)
async function configurazioneInterattiva() {
  const readline = require('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
  
  try {
    console.log('🔧 CONFIGURAZIONE INTERATTIVA GMAIL');
    console.log('===================================\n');
    
    const hasAppPassword = await question('Hai già generato una App Password Gmail? (s/n): ');
    
    if (hasAppPassword.toLowerCase() !== 's') {
      console.log('\n📋 GENERA APP PASSWORD PRIMA:');
      console.log('1. Vai su: https://myaccount.google.com/apppasswords');
      console.log('2. Genera password per "NEXUS CRM"');
      console.log('3. Torna qui con la password generata\n');
      
      rl.close();
      return;
    }
    
    const email = await question('📧 Inserisci la tua email Gmail: ');
    const appPassword = await question('🔑 Inserisci la App Password (16 caratteri): ');
    
    console.log('\n🧪 Test configurazione...\n');
    
    const testOk = await testGmail(email, appPassword);
    
    if (testOk) {
      const updateEnv = await question('\n💾 Aggiornare file .env con questa configurazione? (s/n): ');
      
      if (updateEnv.toLowerCase() === 's') {
        aggiornaEnvConGmail(email, appPassword);
        console.log('\n✅ Configurazione salvata!');
        console.log('🚀 Riavvia l\'applicazione per usare Gmail');
      }
    } else {
      console.log('\n❌ Configurazione non valida');
      console.log('🔄 Riprova dopo aver verificato credenziali');
    }
    
  } catch (error) {
    console.error('❌ Errore configurazione:', error.message);
  } finally {
    rl.close();
  }
}

// Esecuzione principale
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    configurazioneInterattiva();
  } else {
    configuraGmail();
  }
}

module.exports = { configuraGmail, testGmail, aggiornaEnvConGmail };
