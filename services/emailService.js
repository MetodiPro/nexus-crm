const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { loggers } = require('../config/logger');

class EmailService {
  constructor() {
    try {
      console.log('🔧 Configurazione Email Service...');
      console.log('📧 SMTP Host:', process.env.SMTP_HOST);
      console.log('🔌 SMTP Port:', process.env.SMTP_PORT);
      console.log('👤 SMTP User:', process.env.SMTP_USER);
      console.log('🔒 SMTP Secure:', process.env.SMTP_SECURE);
      
      // Configurazione SMTP OVH con multiple opzioni per debugging
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'ssl0.ovh.net',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT == '465', // true per 465, false per 587
        auth: {
          user: process.env.SMTP_USER || 'nexus@metodi.pro',
          pass: process.env.SMTP_PASS || 'password'
        },
        tls: {
          rejectUnauthorized: false, // Per server con certificati self-signed
          ciphers: 'SSLv3'
        },
        debug: process.env.NODE_ENV !== 'production', // Debug in sviluppo
        logger: process.env.NODE_ENV !== 'production' // Log in sviluppo
      };
      
      console.log('⚙️ Configurazione SMTP completa:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.auth.user
      });
      
      this.transporter = nodemailer.createTransport(smtpConfig);
      
      this.fromEmail = process.env.FROM_EMAIL || 'nexus@metodi.pro';
      this.fromName = process.env.FROM_NAME || 'NEXUS CRM';
      
      console.log('✅ EmailService inizializzato correttamente');
    } catch (error) {
      console.error('❌ Errore inizializzazione EmailService:', error);
    }
  }
  
  // Verifica configurazione email con debug esteso
  async verifyConnection() {
    try {
      console.log('🔍 Verifica connessione SMTP...');
      
      // Test di connessione con timeout
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout connessione SMTP')), 10000);
      });
      
      await Promise.race([verifyPromise, timeoutPromise]);
      
      loggers.info('Connessione SMTP verificata con successo');
      console.log('✅ Connessione SMTP verificata con successo');
      return true;
    } catch (error) {
      loggers.error('Errore connessione SMTP:', error);
      console.error('❌ Errore connessione SMTP:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      return false;
    }
  }
  
  // Verifica credenziali con metodi alternativi
  async testCredentials() {
    console.log('🧪 Test credenziali multiple configurazioni...');
    
    const configurations = [
      // Configurazione 1: SSL 465
      {
        name: 'OVH SSL 465',
        config: {
          host: 'ssl0.ovh.net',
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      },
      // Configurazione 2: TLS 587  
      {
        name: 'OVH TLS 587',
        config: {
          host: 'ssl0.ovh.net',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      // Configurazione 3: Standard 25
      {
        name: 'OVH Standard 25',
        config: {
          host: 'ssl0.ovh.net',
          port: 25,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    ];
    
    for (const { name, config } of configurations) {
      try {
        console.log(`🔄 Testando configurazione: ${name}`);
        const testTransporter = nodemailer.createTransport(config);
        await testTransporter.verify();
        console.log(`✅ ${name} - SUCCESSO!`);
        
        // Aggiorna configurazione principale
        this.transporter = testTransporter;
        return { success: true, configuration: name };
      } catch (error) {
        console.log(`❌ ${name} - Fallito:`, error.message);
      }
    }
    
    return { success: false, error: 'Tutte le configurazioni fallite' };
  }
  
  // Invia email generica
  async sendEmail({ to, subject, htmlContent, textContent, attachments = [] }) {
    try {
      // Prima verifica connessione
      const isConnected = await this.verifyConnection();
      if (!isConnected) {
        // Prova configurazioni alternative
        const testResult = await this.testCredentials();
        if (!testResult.success) {
          throw new Error('Impossibile stabilire connessione SMTP con nessuna configurazione');
        }
        console.log(`✅ Usando configurazione: ${testResult.configuration}`);
      }
      
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html: htmlContent,
        text: textContent,
        attachments
      };
      
      console.log('📤 Invio email con opzioni:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const result = await this.transporter.sendMail(mailOptions);
      
      loggers.info('Email inviata con successo', {
        to,
        subject,
        messageId: result.messageId
      });
      
      console.log('✅ Email inviata con successo:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      loggers.error('Errore invio email:', error, { to, subject });
      console.error('❌ Errore invio email dettagliato:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        stack: error.stack
      });
      throw error;
    }
  }
  
  // Template email base
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
  
  // Email di test con debug
  async sendTestEmail(toEmail) {
    const content = `
      <h2>✅ Test Email Riuscito!</h2>
      <p>Questa è un'email di test inviata da NEXUS CRM.</p>
      <p><strong>Data invio:</strong> ${new Date().toLocaleString('it-IT')}</p>
      <p><strong>Server SMTP:</strong> ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</p>
      <p><strong>Email mittente:</strong> ${process.env.FROM_EMAIL}</p>
      <p><strong>Configurazione:</strong> ${process.env.SMTP_SECURE === 'true' ? 'SSL' : 'TLS'}</p>
      <div class="success">
        <p>Il sistema di notifiche email funziona correttamente!</p>
      </div>
      <h3>🎯 Prossimi passi:</h3>
      <ul>
        <li>✅ Configura email negli utenti</li>
        <li>✅ Testa notifiche automatiche</li>
        <li>✅ Attiva scheduler per controlli</li>
      </ul>
      <h3>🔧 Configurazione Testata:</h3>
      <ul>
        <li><strong>Host:</strong> ${process.env.SMTP_HOST}</li>
        <li><strong>Porta:</strong> ${process.env.SMTP_PORT}</li>
        <li><strong>Sicurezza:</strong> ${process.env.SMTP_SECURE === 'true' ? 'SSL' : 'TLS'}</li>
        <li><strong>Utente:</strong> ${process.env.SMTP_USER}</li>
      </ul>
    `;
    
    return this.sendEmail({
      to: toEmail,
      subject: '🧪 Test Email - NEXUS CRM System (OVH Configuration)',
      htmlContent: this.getEmailTemplate('Test Email NEXUS CRM', content),
      textContent: `Test email da NEXUS CRM inviata il ${new Date().toLocaleString('it-IT')} via ${process.env.SMTP_HOST}`
    });
  }
  
  // Resto dei metodi rimane uguale...
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
}

module.exports = new EmailService();