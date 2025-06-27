const express = require('express');
const router = express.Router();

// Test invio email con diagnostica avanzata
router.post('/test-email', async (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  
  try {
    console.log('🧪 Richiesta test email da amministratore:', req.session.user.username);
    
    // Importazione dinamica per gestire errori
    let emailService;
    try {
      emailService = require('../services/emailService');
    } catch (error) {
      console.error('❌ Errore importazione emailService:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Servizio email non disponibile. Esegui: npm install nodemailer node-cron',
        details: error.message
      });
    }
    
    const testEmail = req.body.email || req.session.user.email || 'admin@nexus.it';
    console.log('📧 Invio email di test a:', testEmail);
    
    // Forza re-inizializzazione se necessario
    if (!emailService.isInitialized) {
      console.log('🔄 Servizio non inizializzato, forzando re-inizializzazione...');
      await emailService.initializeTransporter();
    }
    
    const result = await emailService.sendTestEmail(testEmail);
    
    console.log('✅ Test email completato con successo:', result.messageId);
    
    res.json({ 
      success: true, 
      message: 'Email di test inviata con successo',
      messageId: result.messageId,
      sentTo: testEmail
    });
    
  } catch (error) {
    console.error('❌ Errore test email:', error.message);
    
    // Analisi errore per fornire suggerimenti specifici
    let suggestion = '';
    if (error.message.includes('Invalid login') || error.message.includes('Authentication failed')) {
      suggestion = 'Verifica username e password SMTP nel file .env';
    } else if (error.message.includes('Timeout') || error.message.includes('connection')) {
      suggestion = 'Problema di connessione - verifica firewall e connessione internet';
    } else if (error.message.includes('Missing credentials')) {
      suggestion = 'Configura SMTP_USER e SMTP_PASS nel file .env';
    } else {
      suggestion = 'Esegui script di risoluzione: node risolvi-email.js';
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Errore invio email di test: ' + error.message,
      suggestion: suggestion,
      sentTo: req.body.email || req.session.user.email || 'admin@nexus.it'
    });
  }
});

// Verifica stato servizio email con diagnostica
router.get('/email-status', async (req, res) => {
  try {
    console.log('🔍 Richiesta stato email da:', req.session.user?.username || 'utente sconosciuto');
    
    let emailService;
    try {
      emailService = require('../services/emailService');
    } catch (error) {
      console.error('❌ EmailService non disponibile:', error.message);
      return res.json({ 
        connected: false, 
        error: 'Dipendenze email mancanti. Esegui: npm install nodemailer node-cron',
        status: 'service_unavailable'
      });
    }
    
    // Ottieni stato dettagliato
    const status = emailService.getStatus();
    const isConnected = await emailService.verifyConnection();
    
    const response = {
      connected: isConnected,
      initialized: status.initialized,
      hasTransporter: status.hasTransporter,
      config: {
        smtp_host: process.env.SMTP_HOST || 'Non configurato',
        smtp_port: process.env.SMTP_PORT || 'Non configurato',
        smtp_secure: process.env.SMTP_SECURE || 'Non configurato',
        smtp_user: process.env.SMTP_USER ? 'Configurato' : 'Non configurato',
        from_email: process.env.FROM_EMAIL || 'Non configurato'
      },
      timestamp: new Date().toISOString()
    };
    
    // Aggiungi suggerimenti se non connesso
    if (!isConnected) {
      response.suggestions = [
        'Verifica credenziali SMTP nel file .env',
        'Controlla connessione internet',
        'Esegui: node risolvi-email.js per diagnostica automatica'
      ];
    }
    
    console.log('📊 Stato email restituito:', { connected: isConnected, initialized: status.initialized });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Errore verifica stato email:', error.message);
    res.status(500).json({ 
      connected: false, 
      error: error.message,
      status: 'error'
    });
  }
});

// Diagnostica completa del sistema email
router.get('/diagnostics', async (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  
  try {
    console.log('🩺 Richiesta diagnostica completa da:', req.session.user.username);
    
    let emailService;
    try {
      emailService = require('../services/emailService');
    } catch (error) {
      return res.status(500).json({ 
        error: 'Servizio email non disponibile',
        details: error.message
      });
    }
    
    const diagnostics = await emailService.runDiagnostics();
    
    res.json({
      success: true,
      diagnostics: diagnostics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Errore diagnostica:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Riparazione automatica
router.post('/auto-repair', async (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  
  try {
    console.log('🔧 Riparazione automatica richiesta da:', req.session.user.username);
    
    let emailService;
    try {
      emailService = require('../services/emailService');
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: 'Servizio email non disponibile',
        details: error.message
      });
    }
    
    // Forza re-inizializzazione
    await emailService.initializeTransporter();
    
    // Prova configurazioni alternative
    const result = await emailService.tryAlternativeConfigurations();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Configurazione riparata: ${result.configuration}`,
        configuration: result.configuration
      });
    } else {
      res.json({
        success: false,
        message: 'Nessuna configurazione funzionante trovata',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Errore riparazione automatica:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dashboard notifiche con controllo avanzato
router.get('/', async (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).render('error', { 
      message: 'Accesso negato. Solo gli amministratori possono gestire le notifiche.' 
    });
  }
  
  try {
    // Verifica stato del servizio email
    let emailStatus = {
      available: false,
      connected: false,
      error: null
    };
    
    try {
      const emailService = require('../services/emailService');
      emailStatus.available = true;
      emailStatus.connected = await emailService.verifyConnection();
      emailStatus.config = emailService.getStatus();
    } catch (error) {
      emailStatus.error = error.message;
    }
    
    // Verifica stato scheduler (se disponibile)
    let schedulerStatus = {
      available: false,
      running: false,
      jobs: {}
    };
    
    try {
      const scheduler = require('../services/scheduler');
      schedulerStatus.available = true;
      schedulerStatus.running = true;
      schedulerStatus.jobs = {
        hourlyChecks: { running: true, lastRun: 'N/A' },
        weeklyDigest: { running: true, lastRun: 'N/A' },
        dailyChecks: { running: true, lastRun: 'N/A' },
        logCleanup: { running: true, lastRun: 'N/A' }
      };
    } catch (error) {
      schedulerStatus.error = error.message;
    }
    
    res.render('notifications/dashboard', {
      title: 'Gestione Notifiche',
      emailStatus: emailStatus,
      schedulerStatus: schedulerStatus
    });
    
  } catch (error) {
    console.error('❌ Errore dashboard notifiche:', error.message);
    res.status(500).render('error', {
      message: 'Errore caricamento dashboard notifiche: ' + error.message
    });
  }
});

// Impostazioni notifiche utente
router.get('/settings', async (req, res) => {
  try {
    // Recupera impostazioni utente dal database - CORRETTO il percorso
    const db = require('../config/database');
    
    let userSettings = [];
    try {
      // Usiamo il metodo standard SQLite3 invece di prepare
      db.get(`
        SELECT notification_contracts, notification_activities, notification_digest, email
        FROM users 
        WHERE id = ?
      `, [req.session.user.id], (err, user) => {
        if (err) {
          console.error('❌ Errore query database:', err.message);
          userSettings = [
            {
              name: 'notification_contracts',
              label: 'Notifiche Contratti in Scadenza',
              enabled: false,
              description: 'Ricevi notifiche quando i contratti stanno per scadere'
            },
            {
              name: 'notification_activities',
              label: 'Promemoria Attività',
              enabled: false,
              description: 'Ricevi promemoria per le attività in programma'
            },
            {
              name: 'notification_digest',
              label: 'Digest Settimanale',
              enabled: false,
              description: 'Ricevi un riepilogo settimanale delle tue attività'
            }
          ];
        } else if (user) {
          userSettings = [
            {
              name: 'notification_contracts',
              label: 'Notifiche Contratti in Scadenza',
              enabled: user.notification_contracts === 1,
              description: 'Ricevi notifiche quando i contratti stanno per scadere'
            },
            {
              name: 'notification_activities',
              label: 'Promemoria Attività',
              enabled: user.notification_activities === 1,
              description: 'Ricevi promemoria per le attività in programma'
            },
            {
              name: 'notification_digest',
              label: 'Digest Settimanale',
              enabled: user.notification_digest === 1,
              description: 'Ricevi un riepilogo settimanale delle tue attività'
            }
          ];
        } else {
          // Utente non trovato, usa valori predefiniti
          userSettings = [
            {
              name: 'notification_contracts',
              label: 'Notifiche Contratti in Scadenza',
              enabled: false,
              description: 'Ricevi notifiche quando i contratti stanno per scadere'
            },
            {
              name: 'notification_activities',
              label: 'Promemoria Attività',
              enabled: false,
              description: 'Ricevi promemoria per le attività in programma'
            },
            {
              name: 'notification_digest',
              label: 'Digest Settimanale',
              enabled: false,
              description: 'Ricevi un riepilogo settimanale delle tue attività'
            }
          ];
        }
        
        res.render('notifications/settings', {
          title: 'Impostazioni Notifiche',
          settings: userSettings,
          userEmail: req.session.user.email || 'Non configurata'
        });
      });
      
    } catch (error) {
      console.error('❌ Errore recupero impostazioni:', error.message);
      
      // Fallback con impostazioni predefinite
      userSettings = [
        {
          name: 'notification_contracts',
          label: 'Notifiche Contratti in Scadenza',
          enabled: false,
          description: 'Ricevi notifiche quando i contratti stanno per scadere'
        },
        {
          name: 'notification_activities',
          label: 'Promemoria Attività',
          enabled: false,
          description: 'Ricevi promemoria per le attività in programma'
        },
        {
          name: 'notification_digest',
          label: 'Digest Settimanale',
          enabled: false,
          description: 'Ricevi un riepilogo settimanale delle tue attività'
        }
      ];
      
      res.render('notifications/settings', {
        title: 'Impostazioni Notifiche',
        settings: userSettings,
        userEmail: req.session.user.email || 'Non configurata'
      });
    }
    
  } catch (error) {
    console.error('❌ Errore impostazioni notifiche:', error.message);
    res.status(500).render('error', {
      message: 'Errore caricamento impostazioni: ' + error.message
    });
  }
});

// Aggiorna impostazioni notifiche utente
router.post('/settings', async (req, res) => {
  try {
    const db = require('../config/database'); // CORRETTO il percorso
    const { notification_contracts, notification_activities, notification_digest } = req.body;
    
    db.run(`
      UPDATE users 
      SET notification_contracts = ?, 
          notification_activities = ?, 
          notification_digest = ?
      WHERE id = ?
    `, [
      notification_contracts ? 1 : 0,
      notification_activities ? 1 : 0,
      notification_digest ? 1 : 0,
      req.session.user.id
    ], function(err) {
      if (err) {
        console.error('❌ Errore aggiornamento impostazioni:', err.message);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      
      console.log('✅ Impostazioni notifiche aggiornate per utente:', req.session.user.username);
      
      res.json({ 
        success: true, 
        message: 'Impostazioni aggiornate con successo' 
      });
    });
    
  } catch (error) {
    console.error('❌ Errore aggiornamento impostazioni:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Stato scheduler (se disponibile)
router.get('/scheduler-status', async (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  
  try {
    let schedulerStatus = {
      available: false,
      running: false,
      jobs: {},
      error: null
    };
    
    try {
      const scheduler = require('../services/scheduler');
      schedulerStatus.available = true;
      schedulerStatus.running = true;
      // Qui potresti aggiungere logica per verificare lo stato reale dei job
    } catch (error) {
      schedulerStatus.error = 'Scheduler non disponibile: ' + error.message;
    }
    
    res.json(schedulerStatus);
    
  } catch (error) {
    res.status(500).json({ 
      available: false, 
      error: error.message 
    });
  }
});

// Invia notifica manuale (solo admin)
router.post('/send-manual', async (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  
  try {
    const { to, subject, message, type } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parametri mancanti: to, subject, message richiesti' 
      });
    }
    
    const emailService = require('../services/emailService');
    
    const htmlContent = emailService.getEmailTemplate(
      subject,
      `
        <h2>📢 Notifica Manuale</h2>
        <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p><strong>Inviata da:</strong> ${req.session.user.name} ${req.session.user.surname} (${req.session.user.username})</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</p>
      `
    );
    
    const result = await emailService.sendEmail({
      to: to,
      subject: `[NEXUS CRM] ${subject}`,
      htmlContent: htmlContent,
      textContent: message
    });
    
    console.log('✅ Notifica manuale inviata da:', req.session.user.username, 'a:', to);
    
    res.json({
      success: true,
      message: 'Notifica inviata con successo',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('❌ Errore invio notifica manuale:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
