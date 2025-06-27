const cron = require('node-cron');
const notificationService = require('./notificationService');
const { loggers } = require('../config/logger');

class Scheduler {
  constructor() {
    this.jobs = new Map();
  }
  
  // Avvia tutti gli scheduler
  start() {
    loggers.info('Avvio scheduler notifiche NEXUS CRM');
    
    // Controlli notifiche ogni ora (durante orario lavorativo)
    this.scheduleHourlyChecks();
    
    // Digest settimanale ogni lunedì alle 08:00
    this.scheduleWeeklyDigest();
    
    // Controllo giornaliero alle 09:00
    this.scheduleDailyChecks();
    
    // Backup log ogni domenica alle 23:00
    this.scheduleLogCleanup();
    
    loggers.info('Tutti gli scheduler sono stati avviati');
  }
  
  // Controlli ogni ora (9-18, lun-ven)
  scheduleHourlyChecks() {
    const job = cron.schedule('0 9-18 * * 1-5', async () => {
      loggers.info('Esecuzione controlli notifiche orari');
      try {
        const result = await notificationService.runAllChecks();
        loggers.info('Controlli orari completati', result);
      } catch (error) {
        loggers.error('Errore controlli orari:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Rome"
    });
    
    this.jobs.set('hourlyChecks', job);
    job.start();
    loggers.info('✅ Scheduler controlli orari attivato (9-18, lun-ven)');
  }
  
  // Digest settimanale ogni lunedì alle 08:00
  scheduleWeeklyDigest() {
    const job = cron.schedule('0 8 * * 1', async () => {
      loggers.info('Invio digest settimanali');
      try {
        const digestsSent = await notificationService.sendWeeklyDigests();
        loggers.info(`Digest settimanali inviati: ${digestsSent}`);
      } catch (error) {
        loggers.error('Errore invio digest settimanali:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Rome"
    });
    
    this.jobs.set('weeklyDigest', job);
    job.start();
    loggers.info('✅ Scheduler digest settimanale attivato (lunedì 08:00)');
  }
  
  // Controllo giornaliero completo alle 09:00
  scheduleDailyChecks() {
    const job = cron.schedule('0 9 * * *', async () => {
      loggers.info('Controllo giornaliero completo');
      try {
        // Controlli notifiche
        const notificationResult = await notificationService.runAllChecks();
        
        // Verifica configurazione email
        const emailService = require('./emailService');
        const emailStatus = await emailService.verifyConnection();
        
        loggers.info('Controllo giornaliero completato', {
          notifications: notificationResult,
          emailService: emailStatus ? 'OK' : 'ERROR'
        });
        
        // Se email service non funziona, invia alert al log
        if (!emailStatus) {
          loggers.error('ALERT: Servizio email non funzionante!');
        }
        
      } catch (error) {
        loggers.error('Errore controllo giornaliero:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Rome"
    });
    
    this.jobs.set('dailyChecks', job);
    job.start();
    loggers.info('✅ Scheduler controllo giornaliero attivato (09:00)');
  }
  
  // Cleanup log ogni domenica alle 23:00
  scheduleLogCleanup() {
    const job = cron.schedule('0 23 * * 0', async () => {
      loggers.info('Pulizia log vecchi');
      try {
        // Questa funzione sarà implementata nel logger
        // await logCleanupService.cleanOldLogs();
        loggers.info('Pulizia log completata');
      } catch (error) {
        loggers.error('Errore pulizia log:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Rome"
    });
    
    this.jobs.set('logCleanup', job);
    job.start();
    loggers.info('✅ Scheduler pulizia log attivato (domenica 23:00)');
  }
  
  // Stop tutti gli scheduler
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      loggers.info(`Scheduler ${name} fermato`);
    });
    this.jobs.clear();
    loggers.info('Tutti gli scheduler sono stati fermati');
  }
  
  // Stato scheduler
  getStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running || false,
        nextRun: job.nextDates ? job.nextDates() : null
      };
    });
    return status;
  }
  
  // Esegui controllo manuale
  async runManualCheck(type = 'all') {
    loggers.info(`Esecuzione controllo manuale: ${type}`);
    
    try {
      switch (type) {
        case 'notifications':
          return await notificationService.runAllChecks();
        case 'digest':
          return await notificationService.sendWeeklyDigests();
        case 'all':
        default:
          const notifications = await notificationService.runAllChecks();
          return { notifications, type: 'manual_all' };
      }
    } catch (error) {
      loggers.error(`Errore controllo manuale ${type}:`, error);
      throw error;
    }
  }
}

module.exports = new Scheduler();