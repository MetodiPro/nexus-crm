const db = require('../config/database');
const Client = require('../models/client');
const Contract = require('../models/contract');
const Activity = require('../models/activity');
const ElectricityUtility = require('../models/electricityUtility');
const GasUtility = require('../models/gasUtility');

class AnalyticsService {
  // Dashboard KPI principali per consulente/admin
  static async getDashboardKPIs(consultantId = null) {
    return new Promise((resolve, reject) => {
      const queries = [];
      
      // Query clienti per stato
      const clientQuery = consultantId 
        ? "SELECT client_status, COUNT(*) as count FROM clients WHERE consultant_id = ? GROUP BY client_status"
        : "SELECT client_status, COUNT(*) as count FROM clients GROUP BY client_status";
      
      // Query contratti per stato corrente anno
      const contractQuery = consultantId
        ? `SELECT status, COUNT(*) as count, COALESCE(SUM(value), 0) as total_value 
           FROM contracts WHERE consultant_id = ? AND strftime('%Y', created_at) = strftime('%Y', 'now') 
           GROUP BY status`
        : `SELECT status, COUNT(*) as count, COALESCE(SUM(value), 0) as total_value 
           FROM contracts WHERE strftime('%Y', created_at) = strftime('%Y', 'now') 
           GROUP BY status`;
      
      // Query attività mese corrente
      const activityQuery = consultantId
        ? `SELECT status, COUNT(*) as count FROM activities 
           WHERE consultant_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') 
           GROUP BY status`
        : `SELECT status, COUNT(*) as count FROM activities 
           WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') 
           GROUP BY status`;
      
      // Query utenze per tipo
      const utilitiesQuery = consultantId
        ? `SELECT 'electricity' as type, COUNT(*) as count FROM electricity_utilities eu 
           JOIN clients c ON eu.client_id = c.id WHERE c.consultant_id = ? AND eu.is_active = 1
           UNION ALL
           SELECT 'gas' as type, COUNT(*) as count FROM gas_utilities gu 
           JOIN clients c ON gu.client_id = c.id WHERE c.consultant_id = ? AND gu.is_active = 1`
        : `SELECT 'electricity' as type, COUNT(*) as count FROM electricity_utilities WHERE is_active = 1
           UNION ALL
           SELECT 'gas' as type, COUNT(*) as count FROM gas_utilities WHERE is_active = 1`;
      
      const params = consultantId ? [consultantId, consultantId, consultantId, consultantId, consultantId] : [];
      
      // Esegui query in parallelo
      Promise.all([
        this.executeQuery(clientQuery, consultantId ? [consultantId] : []),
        this.executeQuery(contractQuery, consultantId ? [consultantId] : []),
        this.executeQuery(activityQuery, consultantId ? [consultantId] : []),
        this.executeQuery(utilitiesQuery, consultantId ? [consultantId, consultantId] : [])
      ]).then(([clients, contracts, activities, utilities]) => {
        resolve({
          clients,
          contracts,
          activities,
          utilities,
          generated_at: new Date().toISOString()
        });
      }).catch(reject);
    });
  }
  
  // Trend ultimi 12 mesi per grafici
  static async getMonthlyTrends(consultantId = null) {
    const contractTrendQuery = consultantId
      ? `SELECT strftime('%Y-%m', created_at) as month, 
               COUNT(*) as contracts_count,
               COALESCE(SUM(value), 0) as total_value
         FROM contracts WHERE consultant_id = ? 
         AND created_at >= date('now', '-12 months')
         GROUP BY month ORDER BY month`
      : `SELECT strftime('%Y-%m', created_at) as month, 
               COUNT(*) as contracts_count,
               COALESCE(SUM(value), 0) as total_value
         FROM contracts 
         WHERE created_at >= date('now', '-12 months')
         GROUP BY month ORDER BY month`;
    
    const clientTrendQuery = consultantId
      ? `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as clients_count
         FROM clients WHERE consultant_id = ? 
         AND created_at >= date('now', '-12 months')
         GROUP BY month ORDER BY month`
      : `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as clients_count
         FROM clients 
         WHERE created_at >= date('now', '-12 months')
         GROUP BY month ORDER BY month`;
    
    return Promise.all([
      this.executeQuery(contractTrendQuery, consultantId ? [consultantId] : []),
      this.executeQuery(clientTrendQuery, consultantId ? [consultantId] : [])
    ]).then(([contracts, clients]) => ({ contracts, clients }));
  }
  
  // Attività imminenti e scadenze
  static async getUpcomingItems(consultantId = null) {
    const upcomingActivitiesQuery = consultantId
      ? `SELECT a.*, c.name as client_name, c.surname as client_surname
         FROM activities a 
         JOIN clients c ON a.client_id = c.id
         WHERE a.consultant_id = ? AND a.status = 'pending' 
         AND a.activity_date BETWEEN date('now') AND date('now', '+7 days')
         ORDER BY a.activity_date ASC LIMIT 10`
      : `SELECT a.*, c.name as client_name, c.surname as client_surname
         FROM activities a 
         JOIN clients c ON a.client_id = c.id
         WHERE a.status = 'pending' 
         AND a.activity_date BETWEEN date('now') AND date('now', '+7 days')
         ORDER BY a.activity_date ASC LIMIT 10`;
    
    const expiringContractsQuery = consultantId
      ? `SELECT co.*, c.name as client_name, c.surname as client_surname
         FROM contracts co 
         JOIN clients c ON co.client_id = c.id
         WHERE co.consultant_id = ? AND co.status = 'accepted' 
         AND co.end_date BETWEEN date('now') AND date('now', '+30 days')
         ORDER BY co.end_date ASC LIMIT 10`
      : `SELECT co.*, c.name as client_name, c.surname as client_surname
         FROM contracts co 
         JOIN clients c ON co.client_id = c.id
         WHERE co.status = 'accepted' 
         AND co.end_date BETWEEN date('now') AND date('now', '+30 days')
         ORDER BY co.end_date ASC LIMIT 10`;
    
    return Promise.all([
      this.executeQuery(upcomingActivitiesQuery, consultantId ? [consultantId] : []),
      this.executeQuery(expiringContractsQuery, consultantId ? [consultantId] : [])
    ]).then(([activities, contracts]) => ({ activities, contracts }));
  }
  
  // Helper per eseguire query con Promise
  static executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  
  // Performance del mese (per consulenti)
  static async getMonthlyPerformance(consultantId) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const queries = [
      // Nuovi clienti questo mese
      this.executeQuery(
        `SELECT COUNT(*) as count FROM clients 
         WHERE consultant_id = ? AND strftime('%Y-%m', created_at) = ?`,
        [consultantId, currentMonth]
      ),
      // Contratti chiusi questo mese
      this.executeQuery(
        `SELECT COUNT(*) as count, COALESCE(SUM(value), 0) as total_value 
         FROM contracts 
         WHERE consultant_id = ? AND status = 'accepted' 
         AND strftime('%Y-%m', created_at) = ?`,
        [consultantId, currentMonth]
      ),
      // Attività completate questo mese
      this.executeQuery(
        `SELECT COUNT(*) as count FROM activities 
         WHERE consultant_id = ? AND status = 'completed' 
         AND strftime('%Y-%m', updated_at) = ?`,
        [consultantId, currentMonth]
      )
    ];
    
    return Promise.all(queries).then(([newClients, contracts, activities]) => ({
      new_clients: newClients[0]?.count || 0,
      closed_contracts: contracts[0]?.count || 0,
      contract_value: contracts[0]?.total_value || 0,
      completed_activities: activities[0]?.count || 0
    }));
  }
}

module.exports = AnalyticsService;