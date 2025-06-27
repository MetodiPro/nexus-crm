const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { loggers } = require('../config/logger');

class EmailService {
  constructor() {
    this.isInitialized = false;
    this.transporter = null;
    this.fromEmail = process.env.FROM_EMAIL || 'nexus@metodi.pro';
    this.fromName = process.env.FROM_NAME || 'NEXUS CRM';
    
    console.log('🔧 Inizializzazione Email Service...');
    console.log('📧 SMTP Host:', process.env.SMTP_HOST);
    console.log('🔌 SMTP Port:', process.env.SMTP_PORT);
    console.log('👤 SMTP User:', process.env.SMTP_USER);
    console.log('🔒 SMTP Secure:', process.env.SMTP_SECURE);
    
    this.initializeTransporter();
  }
  
  // Inizializzazione avanzata con fallback automatico
  async initializeTransporter() {
    try {
      console.log('🚀 Inizializzazione transporter SMTP...');
      
      // Controlla se le variabili ambiente sono presenti
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ Credenziali SMTP mancanti - usare configurazione predefinita');
        this.createFallbackTransporter();
        return;
      }
      
      // Configura trasportatore principale
      await this.createPrimaryTransporter();
      
      // Test automatico della connessione
      const isWorking = await this.verifyConnection();
      if (!isWorking) {
        console.log('🔄 Configurazione principale fallita, provo alternative...');
        await this.tryAlternativeConfigurations();
      }
      
    } catch (error) {
      console.error('❌ Errore inizializzazione EmailService:', error.message);
      this.createFallbackTransporter();
    }
  }
  
  // Crea transporter principale
  async createPrimaryTransporter() {
    console.log('📝 Creazione transporter principale...');
    
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'ssl0.ovh.net',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 30000, // 30 secondi
      greetingTimeout: 30000,   // 30 secondi
      socketTimeout: 60000,     // 60 secondi
      debug: process.env.NODE_ENV !== 'production',
      logger: process.env.NODE_ENV !== 'production',
      tls: {
        rejectUnauthorized: false,
        ciphers: 'HIGH:MEDIUM:!aNULL:!eNULL:@STRENGTH',
        secureProtocol: 'TLS_method'
      }
    };
    
    // Configurazione specifica per OVH
    if (smtpConfig.host === 'ssl0.ovh.net') {
      if (smtpConfig.port === 465) {
        smtpConfig.secure = true;
        smtpConfig.requireTLS = false;
      } else if (smtpConfig.port === 587) {
        smtpConfig.secure = false;
        smtpConfig.requireTLS = true;
        smtpConfig.tls.ciphers = 'HIGH:MEDIUM:!aNULL:!eNULL:@STRENGTH:!DH:!kEDH';
      }
    }
    
    console.log('⚙️ Configurazione SMTP:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user?.substring(0, 3) + '***',
      requireTLS: smtpConfig.requireTLS
    });
    
    this.transporter = nodemailer.createTransport(smtpConfig);
    return smtpConfig;
  }
  
  // Fallback per quando non ci sono credenziali
  createFallbackTransporter() {
    console.log('🆘 Creazione transporter fallback (solo test locale)...');
    
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      ignoreTLS: true,
      debug: true
    });
    
    this.isInitialized = false;
  }
  
  // Verifica connessione con timeout e retry
  async verifyConnection(retries = 3) {
    if (!this.transporter) {
      console.log('❌ Transporter non disponibile');
      return false;
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Verifica connessione SMTP (tentativo ${attempt}/${retries})...`);
        
        // Timeout personalizzato per la verifica
        const verifyPromise = this.transporter.verify();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout verifica connessione (15s)')), 15000);
        });
        
        await Promise.race([verifyPromise, timeoutPromise]);
        
        console.log('✅ Connessione SMTP verificata con successo');
        this.isInitialized = true;
        loggers.info('Connessione SMTP verificata con successo');
        return true;
        
      } catch (error) {
        console.log(`❌ Tentativo ${attempt} fallito:`, error.message);
        
        if (attempt === retries) {
          loggers.error('Errore connessione SMTP dopo tutti i tentativi:', error);
          this.isInitialized = false;
          return false;
        }
        
        // Aspetta prima del prossimo tentativo
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return false;
  }
  
  // Prova configurazioni alternative automaticamente
  async tryAlternativeConfigurations() {
    console.log('🧪 Test configurazioni alternative...');
    
    const configurations = [
      // Configurazione 1: OVH SSL 465 con opzioni estese
      {
        name: 'OVH SSL 465 (Enhanced)',
        config: {
          host: 'ssl0.ovh.net',
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          tls: {
            rejectUnauthorized: false,
            ciphers: 'HIGH:MEDIUM:!aNULL:!eNULL:@STRENGTH',
            secureProtocol: 'TLS_method'
          }
        }
      },
      // Configurazione 2: OVH TLS 587
      {
        name: 'OVH TLS 587',
        config: {
          host: 'ssl0.ovh.net',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          tls: {
            rejectUnauthorized: false,
            ciphers: 'HIGH:MEDIUM:!aNULL:!eNULL:@STRENGTH:!DH:!kEDH'
          }
        }
      },
      // Configurazione 3: OVH senza TLS (ultima spiaggia)
      {
        name: 'OVH Plain 25',
        config: {
          host: 'ssl0.ovh.net',
          port: 25,
          secure: false,
          ignoreTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          connectionTimeout: 30000
        }
      }
    ];
    
    for (const { name, config } of configurations) {
      try {
        console.log(`🔄 Testando: ${name}...`);
        
        const testTransporter = nodemailer.createTransport(config);
        
        // Test con timeout
        const verifyPromise = testTransporter.verify();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout 20s')), 20000);
        });
        
        await Promise.race([verifyPromise, timeoutPromise]);
        
        console.log(`✅ ${name} - FUNZIONA!`);
        
        // Sostituisci il transporter principale
        this.transporter = testTransporter;
        this.isInitialized = true;
        
        // Aggiorna file .env con la configurazione funzionante
        await this.updateEnvFile(config);
        
        loggers.info(`Configurazione email cambiata in: ${name}`);
        return { success: true, configuration: name };
        
      } catch (error) {
        console.log(`❌ ${name} fallito:`, error.message);
      }
    }
    
    console.log('❌ Tutte le configurazioni alternative fallite');
    this.isInitialized = false;
    return { success: false, error: 'Nessuna configurazione funzionante trovata' };
  }
  
  // Aggiorna il file .env con la configurazione funzionante
  async updateEnvFile(workingConfig) {
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Aggiorna le variabili SMTP
      envContent = envContent.replace(/SMTP_HOST=.*/g, `SMTP_HOST=${workingConfig.host}`);
      envContent = envContent.replace(/SMTP_PORT=.*/g, `SMTP_PORT=${workingConfig.port}`);
      envContent = envContent.replace(/SMTP_SECURE=.*/g, `SMTP_SECURE=${workingConfig.secure}`);
      
      fs.writeFileSync(envPath, envContent);
      console.log('📝 File .env aggiornato con configurazione funzionante');
      
    } catch (error) {
      console.error('❌ Errore aggiornamento .env:', error.message);
    }
  }
  
  // Invia email con retry automatico e fallback
  async sendEmail({ to, subject, htmlContent, textContent, attachments = [] }) {
    try {
      // Verifica che il servizio sia inizializzato
      if (!this.isInitialized) {
        console.log('🔄 Servizio non inizializzato, riprovo...');
        await this.initializeTransporter();
        
        if (!this.isInitialized) {
          throw new Error('Servizio email non configurato correttamente');
        }
      }
      
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html: htmlContent,
        text: textContent,
        attachments
      };
      
      console.log('📤 Invio email:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      // Prova l'invio con retry
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await this.transporter.sendMail(mailOptions);
          
          console.log('✅ Email inviata con successo:', result.messageId);
          loggers.info('Email inviata con successo', {
            to,
            subject,
            messageId: result.messageId
          });
          
          return { success: true, messageId: result.messageId };
          
        } catch (error) {
          lastError = error;
          console.log(`❌ Tentativo ${attempt} fallito:`, error.message);
          
          if (attempt < 3) {
            // Se è un errore di connessione, prova configurazioni alternative
            if (error.message.includes('SMTP') || error.message.includes('connection')) {
              console.log('🔄 Errore di connessione, provo configurazione alternativa...');
              await this.tryAlternativeConfigurations();
            }
            
            // Aspetta prima del prossimo tentativo
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      // Se arriviamo qui, tutti i tentativi sono falliti
      throw lastError;
      
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      };
      
      loggers.error('Errore invio email:', error, { to, subject });
      console.error('❌ Errore invio email:', errorDetails);
      
      throw error;
    }
  }
  
  // Diagnostica completa del sistema email
  async runDiagnostics() {
    console.log('\n🩺 DIAGNOSTICA SISTEMA EMAIL');
    console.log('================================');
    
    const diagnostics = {
      environment: {},
      connection: {},
      configuration: {},
      recommendations: []
    };
    
    // 1. Controlla variabili ambiente
    console.log('\n1. 📋 Variabili Ambiente:');
    diagnostics.environment = {
      SMTP_HOST: process.env.SMTP_HOST || 'MANCANTE',
      SMTP_PORT: process.env.SMTP_PORT || 'MANCANTE',
      SMTP_USER: process.env.SMTP_USER ? '✅ Presente' : '❌ MANCANTE',
      SMTP_PASS: process.env.SMTP_PASS ? '✅ Presente' : '❌ MANCANTE',
      SMTP_SECURE: process.env.SMTP_SECURE || 'MANCANTE',
      FROM_EMAIL: process.env.FROM_EMAIL || 'MANCANTE'
    };
    
    Object.entries(diagnostics.environment).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // 2. Test connessioni
    console.log('\n2. 🔌 Test Connessioni:');
    
    const testConfigs = [
      { name: 'OVH SSL 465', host: 'ssl0.ovh.net', port: 465 },
      { name: 'OVH TLS 587', host: 'ssl0.ovh.net', port: 587 },
      { name: 'Gmail SSL', host: 'smtp.gmail.com', port: 465 },
      { name: 'Gmail TLS', host: 'smtp.gmail.com', port: 587 }
    ];
    
    for (const { name, host, port } of testConfigs) {
      const isReachable = await this.testTCPConnection(host, port);
      console.log(`   ${name} (${host}:${port}): ${isReachable ? '✅' : '❌'}`);
      diagnostics.connection[name] = isReachable;
    }
    
    // 3. Raccomandazioni
    console.log('\n3. 💡 Raccomandazioni:');
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('   ❌ Configurare credenziali SMTP nel file .env');
      diagnostics.recommendations.push('Configurare SMTP_USER e SMTP_PASS');
    }
    
    if (!diagnostics.connection['OVH SSL 465'] && !diagnostics.connection['OVH TLS 587']) {
      console.log('   ❌ Server OVH non raggiungibile - verificare firewall');
      diagnostics.recommendations.push('Verificare connessione a ssl0.ovh.net');
    }
    
    if (diagnostics.connection['Gmail SSL'] || diagnostics.connection['Gmail TLS']) {
      console.log('   💡 Gmail raggiungibile - considerare come alternativa');
      diagnostics.recommendations.push('Configurare Gmail come alternativa');
    }
    
    console.log('\n================================\n');
    
    return diagnostics;
  }
  
  // Test connessione TCP raw
  async testTCPConnection(host, port, timeout = 5000) {
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
  
  // Template email base (invariato)
  getEmailTemplate(title, content, footerText = '') {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔥 NEXUS CRM</h1>
          <p>Sistema di Gestione Energetica</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>${footerText || 'Questo messaggio è stato generato automaticamente da NEXUS CRM'}</p>
          <p>© 2025 NEXUS CRM - Tutti i diritti riservati</p>
        </div>
      </div>
    </body>
    </html>`;
  }
  
  // Email di test avanzata
  async sendTestEmail(toEmail) {
    const diagnostics = await this.runDiagnostics();
    
    const content = `
      <h2>🧪 Test Email NEXUS CRM</h2>
      <div class="success">
        <p><strong>✅ Email di test inviata con successo!</strong></p>
        <p>Data: ${new Date().toLocaleString('it-IT')}</p>
      </div>
      
      <h3>📊 Diagnostica Sistema:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Host SMTP:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sicurezza:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${process.env.SMTP_SECURE === 'true' ? 'SSL' : 'TLS'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Utente:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${process.env.SMTP_USER}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Inizializzato:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.isInitialized ? '✅ Sì' : '❌ No'}</td>
        </tr>
      </table>
      
      <h3>🎯 Prossimi Passi:</h3>
      <ul>
        <li>✅ Sistema email configurato correttamente</li>
        <li>📧 Configura email per gli utenti</li>
        <li>🔔 Attiva notifiche automatiche</li>
        <li>⏰ Verifica scheduler per promemoria</li>
      </ul>
      
      ${diagnostics.recommendations.length > 0 ? `
      <h3>💡 Raccomandazioni:</h3>
      <ul>
        ${diagnostics.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
      ` : ''}
    `;
    
    return this.sendEmail({
      to: toEmail,
      subject: '🧪 Test Email - NEXUS CRM System (Enhanced)',
      htmlContent: this.getEmailTemplate('Test Email NEXUS CRM', content),
      textContent: `Test email da NEXUS CRM inviata il ${new Date().toLocaleString('it-IT')} via ${process.env.SMTP_HOST}`
    });
  }
  
  // Metodi per notifiche (invariati)
  async sendContractExpiryNotification(consultant, contract, client) {
    const daysToExpiry = Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    const content = `
      <h2>⚠️ Contratto in Scadenza</h2>
      <div class="alert">
        <p><strong>Attenzione!</strong> Un contratto scadrà tra ${daysToExpiry} giorni.</p>
      </div>
      
      <h3>Dettagli Contratto:</h3>
      <ul>
        <li><strong>Cliente:</strong> ${client.name} ${client.surname} ${client.company ? '(' + client.company + ')' : ''}</li>
        <li><strong>Tipo:</strong> ${contract.contract_type}</li>
        <li><strong>Energia:</strong> ${contract.energy_type}</li>
        <li><strong>Fornitore:</strong> ${contract.supplier}</li>
        <li><strong>Data Scadenza:</strong> ${new Date(contract.end_date).toLocaleDateString('it-IT')}</li>
        <li><strong>Valore:</strong> €${contract.value?.toLocaleString() || 'N/A'}</li>
      </ul>
    `;
    
    return this.sendEmail({
      to: consultant.email,
      subject: `🚨 Contratto in scadenza: ${client.name} ${client.surname} - ${daysToExpiry} giorni`,
      htmlContent: this.getEmailTemplate('Contratto in Scadenza', content),
      textContent: `Contratto in scadenza tra ${daysToExpiry} giorni per ${client.name} ${client.surname}`
    });
  }
  
  // Metodo per ottenere lo stato del servizio
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasTransporter: !!this.transporter,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? 'Configurato' : 'Mancante'
      }
    };
  }
}

module.exports = new EmailService();