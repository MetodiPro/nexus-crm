const db = require('../config/database');
const Client = require('../models/client');
const Contract = require('../models/contract');
const Activity = require('../models/activity');
const Product = require('../models/product');
const ElectricityUtility = require('../models/electricityUtility');
const GasUtility = require('../models/gasUtility');

class AnalyticsService {
  // Dashboard KPI principali per consulente/admin
  static async getDashboardKPIs(consultantId = null) {
    return new Promise((resolve, reject) => {
      // Query clienti per stato
      const clientQuery = consultantId 
        ? "SELECT client_status, COUNT(*) as count FROM clients WHERE consultant_id = ? GROUP BY client_status"
        : "SELECT client_status, COUNT(*) as count FROM clients GROUP BY client_status";
      
      // Query contratti per stato corrente anno - RIMOSSO VALORE
      const contractQuery = consultantId
        ? `SELECT status, COUNT(*) as count
           FROM contracts WHERE consultant_id = ? AND strftime('%Y', created_at) = strftime('%Y', 'now') 
           GROUP BY status`
        : `SELECT status, COUNT(*) as count
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
      
      // NUOVA QUERY: Prodotti/Servizi per tipo (solo admin)
      const productsQuery = !consultantId
        ? `SELECT service_type, COUNT(*) as count, 
                  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count
           FROM products GROUP BY service_type`
        : null;
      
      // Esegui query in parallelo
      const queries = [
        this.executeQuery(clientQuery, consultantId ? [consultantId] : []),
        this.executeQuery(contractQuery, consultantId ? [consultantId] : []),
        this.executeQuery(activityQuery, consultantId ? [consultantId] : []),
        this.executeQuery(utilitiesQuery, consultantId ? [consultantId, consultantId] : [])
      ];
      
      if (productsQuery) {
        queries.push(this.executeQuery(productsQuery, []));
      }
      
      Promise.all(queries).then((results) => {
        const [clients, contracts, activities, utilities, products] = results;
        
        const kpis = {
          clients,
          contracts,
          activities,
          utilities,
          generated_at: new Date().toISOString()
        };
        
        // Aggiungi prodotti solo per admin
        if (products) {
          kpis.products = products;
        }
        
        resolve(kpis);
      }).catch(reject);
    });
  }
  
  // Trend ultimi 12 mesi per grafici - RIMOSSO VALORE
  static async getMonthlyTrends(consultantId = null) {
    const contractTrendQuery = consultantId
      ? `SELECT strftime('%Y-%m', created_at) as month, 
               COUNT(*) as contracts_count
         FROM contracts WHERE consultant_id = ? 
         AND created_at >= date('now', '-12 months')
         GROUP BY month ORDER BY month`
      : `SELECT strftime('%Y-%m', created_at) as month, 
               COUNT(*) as contracts_count
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
    
    // NUOVA QUERY: Prodotti creati ultimi 12 mesi (solo admin)
    const productTrendQuery = !consultantId
      ? `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as products_count
         FROM products 
         WHERE created_at >= date('now', '-12 months')
         GROUP BY month ORDER BY month`
      : null;
    
    const queries = [
      this.executeQuery(contractTrendQuery, consultantId ? [consultantId] : []),
      this.executeQuery(clientTrendQuery, consultantId ? [consultantId] : [])
    ];
    
    if (productTrendQuery) {
      queries.push(this.executeQuery(productTrendQuery, []));
    }
    
    return Promise.all(queries).then((results) => {
      const [contracts, clients, products] = results;
      const trends = { contracts, clients };
      
      if (products) {
        trends.products = products;
      }
      
      return trends;
    });
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
  
  // NUOVO: Statistiche dettagliate prodotti/servizi (solo admin)
  static async getProductsAnalytics() {
    const queries = [
      // Distribuzione per tipo servizio
      this.executeQuery(`
        SELECT service_type, COUNT(*) as total, 
               COUNT(CASE WHEN is_active = 1 THEN 1 END) as active
        FROM products GROUP BY service_type
      `),
      
      // Prodotti più utilizzati nei contratti
      this.executeQuery(`
        SELECT p.name, p.service_type, COUNT(c.id) as usage_count
        FROM products p
        LEFT JOIN contracts c ON p.id = c.product_id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY usage_count DESC
        LIMIT 10
      `),
      
      // Allegati PDF statistics
      this.executeQuery(`
        SELECT COUNT(*) as total_attachments,
               COUNT(DISTINCT product_id) as products_with_attachments
        FROM product_attachments
      `),
      
      // Fornitori più utilizzati
      this.executeQuery(`
        SELECT supplier_operator, COUNT(*) as count
        FROM products 
        WHERE is_active = 1 AND supplier_operator IS NOT NULL
        GROUP BY supplier_operator
        ORDER BY count DESC
        LIMIT 10
      `)
    ];
    
    return Promise.all(queries).then(([byType, mostUsed, attachments, suppliers]) => ({
      byType,
      mostUsed,
      attachments: attachments[0] || { total_attachments: 0, products_with_attachments: 0 },
      suppliers
    }));
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
  
  // Performance del mese (per consulenti) - RIMOSSO VALORE CONTRATTI
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
        `SELECT COUNT(*) as count FROM contracts 
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
      completed_activities: activities[0]?.count || 0
    }));
  }
}

module.exports = AnalyticsService;
