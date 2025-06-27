#!/usr/bin/env node

/**
 * 🧪 Test specifico configurazione email OVH
 */

console.log('🧪 TEST CONFIGURAZIONE EMAIL OVH');
console.log('==================================\n');

// Verifica variabili ambiente
console.log('📧 VARIABILI AMBIENTE:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NON IMPOSTATO'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'NON IMPOSTATO'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NON IMPOSTATO'}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***IMPOSTATA***' : 'NON IMPOSTATA'}`);
console.log('');

// Test configurazioni multiple
async function testOVHConfigurations() {
  const nodemailer = require('nodemailer');
  
  const configurations = [
    {
      name: '🔒 OVH SSL (465) - Raccomandato',
      config: {
        host: 'ssl0.ovh.net',
        port: 465,
        secure: true,
        auth: {
          user: 'nexus@metodi.pro',
          pass: 'Nexus112233!!'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
      }
    },
    {
      name: '🔐 OVH TLS (587) - Alternativo',
      config: {
        host: 'ssl0.ovh.net',
        port: 587,
        secure: false,
        auth: {
          user: 'nexus@metodi.pro',
          pass: 'Nexus112233!!'
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000
      }
    },
    {
      name: '📧 OVH Standard (25) - Fallback',
      config: {
        host: 'ssl0.ovh.net',
        port: 25,
        secure: false,
        auth: {
          user: 'nexus@metodi.pro',
          pass: 'Nexus112233!!'
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    }
  ];
  
  console.log('🔄 TEST CONFIGURAZIONI SMTP:\n');
  
  for (const { name, config } of configurations) {
    try {
      console.log(`⏳ Testando: ${name}`);
      console.log(`   Host: ${config.host}:${config.port}`);
      console.log(`   Sicurezza: ${config.secure ? 'SSL' : 'TLS/STARTTLS'}`);
      console.log(`   Utente: ${config.auth.user}`);
      
      const transporter = nodemailer.createTransport(config);
      
      // Test connessione con timeout
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout 15s')), 15000);
      });
      
      await Promise.race([verifyPromise, timeoutPromise]);
      
      console.log(`   ✅ ${name} - SUCCESSO!\n`);
      
      // Se funziona, aggiorna .env
      updateEnvFile(config);
      
      // Test invio email reale
      console.log('📤 Test invio email reale...');
      const testResult = await transporter.sendMail({
        from: 'NEXUS CRM <nexus@metodi.pro>',
        to: 'nexus@metodi.pro',
        subject: `🧪 Test NEXUS CRM - ${name}`,
        html: `
          <h2>✅ Test Email Configurazione Riuscito!</h2>
          <p><strong>Configurazione:</strong> ${name}</p>
          <p><strong>Data/Ora:</strong> ${new Date().toLocaleString('it-IT')}</p>
          <p><strong>Host:</strong> ${config.host}:${config.port}</p>
          <p><strong>Sicurezza:</strong> ${config.secure ? 'SSL' : 'TLS'}</p>
          <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="color: #065f46; margin: 0;"><strong>🎉 NEXUS CRM Email Service Operativo!</strong></p>
          </div>
        `,
        text: `Test NEXUS CRM - ${name} - ${new Date().toLocaleString('it-IT')}`
      });
      
      console.log(`   📧 Email inviata con ID: ${testResult.messageId}`);
      console.log(`   🎯 CONFIGURAZIONE VINCENTE: ${name}\n`);
      
      return { success: true, config, name, messageId: testResult.messageId };
      
    } catch (error) {
      console.log(`   ❌ ${name} - Fallito: ${error.message}\n`);
    }
  }
  
  console.log('❌ TUTTE LE CONFIGURAZIONI FALLITE');
  console.log('\n🔧 POSSIBILI CAUSE:');
  console.log('   1. Password errata o scaduta');
  console.log('   2. Account email bloccato/sospeso');
  console.log('   3. Restrizioni firewall/antivirus');
  console.log('   4. Servizio OVH temporaneamente non disponibile');
  console.log('   5. Autenticazione a due fattori attiva');
  
  return { success: false };
}

function updateEnvFile(config) {
  const fs = require('fs');
  
  const envContent = `# NEXUS CRM - Configurazione Ambiente

# Database
DATABASE_PATH=./data/nexus.db

# Sessioni
SESSION_SECRET=nexus-crm-secret-key-change-this-in-production

# Email SMTP Configuration - OVH (CONFIGURAZIONE TESTATA E FUNZIONANTE)
SMTP_HOST=${config.host}
SMTP_PORT=${config.port}
SMTP_SECURE=${config.secure}
SMTP_USER=${config.auth.user}
SMTP_PASS=${config.auth.pass}
FROM_EMAIL=${config.auth.user}
FROM_NAME=NEXUS CRM

# App URL
APP_URL=http://localhost:3000

# Scheduler (true per abilitare in sviluppo)
ENABLE_SCHEDULER=true

# Ambiente
NODE_ENV=development
`;

  fs.writeFileSync('.env', envContent);
  console.log('   📝 File .env aggiornato con configurazione vincente');
}

// Test credenziali dirette
async function testCredentialsOnly() {
  console.log('\n🔐 TEST CREDENZIALI DIRETTE:\n');
  
  const { execSync } = require('child_process');
  
  try {
    console.log('⏳ Test connessione TCP a ssl0.ovh.net:465...');
    // Test connessione TCP di base
    const result = await testTCPConnection('ssl0.ovh.net', 465);
    console.log(result ? '✅ Connessione TCP riuscita' : '❌ Connessione TCP fallita');
  } catch (error) {
    console.log('❌ Test TCP fallito:', error.message);
  }
}

function testTCPConnection(host, port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(5000);
    
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

// Esecuzione test
async function main() {
  // Test configurazioni
  const result = await testOVHConfigurations();
  
  if (result.success) {
    console.log('🎉 CONFIGURAZIONE EMAIL COMPLETATA!');
    console.log('=====================================');
    console.log(`✅ Configurazione vincente: ${result.name}`);
    console.log(`📧 Email di test inviata: ${result.messageId}`);
    console.log('📝 File .env aggiornato automaticamente');
    console.log('\n🚀 PROSSIMI PASSI:');
    console.log('   1. Riavvia l\'applicazione: npm start');
    console.log('   2. Vai su /notifications per testare');
    console.log('   3. Invia email di test dalla dashboard admin');
  } else {
    console.log('\n🔧 AZIONI CORRETTIVE SUGGERITE:');
    console.log('================================');
    console.log('1. 🔍 Verifica credenziali nel pannello OVH');
    console.log('2. 🔒 Controlla se l\'account email è attivo');
    console.log('3. 📧 Prova a inviare email manualmente via webmail');
    console.log('4. 🛡️ Disabilita temporaneamente firewall/antivirus');
    console.log('5. 📞 Contatta supporto OVH se problema persiste');
    
    await testCredentialsOnly();
  }
}

main().catch(console.error);