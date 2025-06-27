const express = require('express');
const router = express.Router();

// Test invio email
router.post('/test-email', async (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  
  try {
    // Importazione dinamica per gestire errori
    let emailService;
    try {
      emailService = require('../services/emailService');
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Servizio email non disponibile. Esegui: npm install nodemailer node-cron' 
      });
    }
    
    const testEmail = req.body.email || req.session.user.email || 'test@example.com';
    
    await emailService.sendTestEmail(testEmail);
    
    res.json({ success: true, message: 'Email di test inviata con successo' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Errore invio email di test: ' + error.message 
    });
  }
});

// Verifica stato servizio email
router.get('/email-status', async (req, res) => {
  try {
    let emailService;
    try {
      emailService = require('../services/emailService');
      const isConnected = await emailService.verifyConnection();
      res.json({ 
        connected: isConnected,
        smtp_host: process.env.SMTP_HOST || 'Non configurato',
        from_email: process.env.FROM_EMAIL || 'Non configurato'
      });
    } catch (error) {
      res.json({ 
        connected: false, 
        error: 'Dipendenze email mancanti. Esegui: npm install nodemailer node-cron'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      connected: false, 
      error: error.message 
    });
  }
});

// Dashboard notifiche (solo admin) - Versione semplificata
router.get('/', (req, res) => {
  if (req.session.user.role !== 'administrator') {
    return res.status(403).render('error', { 
      message: 'Accesso negato. Solo gli amministratori possono gestire le notifiche.' 
    });
  }
  
  res.render('notifications/dashboard', {
    title: 'Gestione Notifiche',
    schedulerStatus: {
      hourlyChecks: { running: false },
      weeklyDigest: { running: false },
      dailyChecks: { running: false },
      logCleanup: { running: false }
    }
  });
});

// Impostazioni notifiche utente
router.get('/settings', (req, res) => {
  res.render('notifications/settings', {
    title: 'Impostazioni Notifiche',
    settings: []
  });
});

module.exports = router;