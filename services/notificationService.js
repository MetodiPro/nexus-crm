const emailService = require('./emailService');
const db = require('../config/database');
const { loggers } = require('../config/logger');

class NotificationService {
  // Controlla scadenze contratti e invia notifiche
  async checkContractExpiries() {
    const query = `
      SELECT co.*, c.name as client_name, c.surname as client_surname, c.company,
             u.name as consultant_name, u.email as consultant_email
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
      JOIN users u ON c.consultant_id = u.id
      WHERE co.status = 'accepted' 
      AND co.end_date BETWEEN date('now') AND date('now', '+30 days')
      AND co.expiry_notification_sent IS NULL
    `;
    
    return new Promise((resolve, reject) => {
      db.all(query, [], async (err, contracts) => {
        if (err) {
          loggers.error('Errore verifica scadenze contratti:', err);
          return reject(err);
        }
        
        let notificationsSent = 0;
        
        for (const contract of contracts) {
          try {
            await emailService.sendContractExpiryNotification(
              { email: contract.consultant_email, name: contract.consultant_name },
              contract,
              { 
                name: contract.client_name, 
                surname: contract.client_surname, 
                company: contract.company 
              }
            );
            
            // Marca come notificato
            await this.markContractNotificationSent(contract.id);
            notificationsSent++;
            
            loggers.info('Notifica scadenza contratto inviata', {
              contractId: contract.id,
              consultant: contract.consultant_email,
              client: `${contract.client_name} ${contract.client_surname}`
            });
            
          } catch (error) {
            loggers.error('Errore invio notifica scadenza contratto:', error, {
              contractId: contract.id
            });
          }
        }
        
        resolve(notificationsSent);
      });
    });
  }
  
  // Controlla appuntamenti imminenti
  async checkUpcomingActivities() {
    const query = `
      SELECT a.*, c.name as client_name, c.surname as client_surname, c.company,
             c.phone as client_phone, c.email as client_email, c.address as client_address, c.city as client_city,
             u.name as consultant_name, u.email as consultant_email
      FROM activities a
      JOIN clients c ON a.client_id = c.id
      JOIN users u ON a.consultant_id = u.id
      WHERE a.status = 'pending' 
      AND date(a.activity_date) BETWEEN date('now') AND date('now', '+1 days')
      AND a.reminder_sent IS NULL
    `;
    
    return new Promise((resolve, reject) => {
      db.all(query, [], async (err, activities) => {
        if (err) {
          loggers.error('Errore verifica attività imminenti:', err);
          return reject(err);
        }
        
        let notificationsSent = 0;
        
        for (const activity of activities) {
          try {
            await emailService.sendUpcomingActivityNotification(
              { email: activity.consultant_email, name: activity.consultant_name },
              activity,
              { 
                name: activity.client_name, 
                surname: activity.client_surname,
                company: activity.company,
                phone: activity.client_phone,
                email: activity.client_email,
                address: activity.client_address,
                city: activity.client_city
              }
            );
            
            // Marca come notificato
            await this.markActivityReminderSent(activity.id);
            notificationsSent++;
            
            loggers.info('Reminder attività inviato', {
              activityId: activity.id,
              consultant: activity.consultant_email,
              client: `${activity.client_name} ${activity.client_surname}`
            });
            
          } catch (error) {
            loggers.error('Errore invio reminder attività:', error, {
              activityId: activity.id
            });
          }
        }
        
        resolve(notificationsSent);
      });
    });
  }
  
  // Digest settimanale (ogni lunedì)
  async sendWeeklyDigests() {
    const consultants = await this.getActiveConsultants();
    let digestsSent = 0;
    
    for (const consultant of consultants) {
      try {
        const weeklyData = await this.getWeeklyDataForConsultant(consultant.id);
        
        await emailService.sendWeeklyDigest(consultant, weeklyData);
        digestsSent++;
        
        loggers.info('Digest settimanale inviato', {
          consultantId: consultant.id,
          email: consultant.email
        });
        
      } catch (error) {
        loggers.error('Errore invio digest settimanale:', error, {
          consultantId: consultant.id
        });
      }
    }
    
    return digestsSent;
  }
  
  // Ottieni consulenti attivi
  getActiveConsultants() {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT id, username, email, name FROM users WHERE role = 'consultant' AND is_active = 1 AND email IS NOT NULL",
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
  
  // Dati settimanali per consulente
  async getWeeklyDataForConsultant(consultantId) {
    const queries = {
      newClients: `
        SELECT COUNT(*) as count FROM clients 
        WHERE consultant_id = ? AND created_at >= date('now', '-7 days')
      `,
      upcomingActivities: `
        SELECT a.*, c.name as client_name, c.surname as client_surname
        FROM activities a 
        JOIN clients c ON a.client_id = c.id
        WHERE a.consultant_id = ? AND a.status = 'pending' 
        AND a.activity_date BETWEEN date('now') AND date('now', '+7 days')
        ORDER BY a.activity_date ASC
      `,
      expiringContracts: `
        SELECT co.*, c.name as client_name, c.surname as client_surname
        FROM contracts co 
        JOIN clients c ON co.client_id = c.id
        WHERE c.consultant_id = ? AND co.status = 'accepted' 
        AND co.end_date BETWEEN date('now') AND date('now', '+30 days')
        ORDER BY co.end_date ASC
      `,
      performance: `
        SELECT 
          (SELECT COUNT(*) FROM clients WHERE consultant_id = ? AND created_at >= date('now', '-7 days')) as newClients,
          (SELECT COUNT(*) FROM contracts co JOIN clients c ON co.client_id = c.id WHERE c.consultant_id = ? AND co.status = 'accepted' AND co.created_at >= date('now', '-7 days')) as closedContracts,
          (SELECT COALESCE(SUM(co.value), 0) FROM contracts co JOIN clients c ON co.client_id = c.id WHERE c.consultant_id = ? AND co.status = 'accepted' AND co.created_at >= date('now', '-7 days')) as revenue,
          (SELECT COUNT(*) FROM activities a JOIN clients c ON a.client_id = c.id WHERE a.consultant_id = ? AND a.status = 'completed' AND a.updated_at >= date('now', '-7 days')) as completedActivities
      `
    };
    
    const [newClients, upcomingActivities, expiringContracts, performance] = await Promise.all([
      this.executeQuery(queries.newClients, [consultantId]),
      this.executeQuery(queries.upcomingActivities, [consultantId]),
      this.executeQuery(queries.expiringContracts, [consultantId]),
      this.executeQuery(queries.performance, [consultantId, consultantId, consultantId, consultantId])
    ]);
    
    return {
      newClients: newClients[0]?.count || 0,
      upcomingActivities,
      expiringContracts,
      performance: performance[0] || {
        newClients: 0,
        closedContracts: 0,
        revenue: 0,
        completedActivities: 0
      }
    };
  }
  
  // Helper database
  executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  
  // Marca contratto come notificato
  markContractNotificationSent(contractId) {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE contracts SET expiry_notification_sent = CURRENT_TIMESTAMP WHERE id = ?",
        [contractId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  
  // Marca attività reminder inviato
  markActivityReminderSent(activityId) {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE activities SET reminder_sent = CURRENT_TIMESTAMP WHERE id = ?",
        [activityId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  
  // Esegui tutti i controlli notifiche
  async runAllChecks() {
    loggers.info('Avvio controlli notifiche automatiche');
    
    try {
      const [contractNotifications, activityReminders] = await Promise.all([
        this.checkContractExpiries(),
        this.checkUpcomingActivities()
      ]);
      
      loggers.info('Controlli notifiche completati', {
        contractNotifications,
        activityReminders
      });
      
      return {
        contractNotifications,
        activityReminders,
        success: true
      };
      
    } catch (error) {
      loggers.error('Errore durante controlli notifiche:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();