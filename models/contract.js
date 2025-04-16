const db = require('../config/database');

class Contract {
  // Ottieni tutti i contratti
  static getAll(consultantId, callback) {
    let query = `
      SELECT co.*, c.name as client_name, c.surname as client_surname, 
             p.name as product_name, p.supplier as product_supplier
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
      LEFT JOIN products p ON co.product_id = p.id
    `;
    let params = [];
    
    if (consultantId) {
      query += " WHERE co.consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY co.created_at DESC";
    
    // Funzione di callback modificata per gestire meglio gli errori
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Errore nella query contracts getAll:', err);
        return callback(err);
      }
      callback(null, rows || []);
    });
  }
  
  // Ottieni contratto per ID
  static getById(id, callback) {
    db.get(`
      SELECT co.*, c.name as client_name, c.surname as client_surname,
             p.name as product_name, p.supplier as product_supplier,
             p.base_price as product_base_price, p.description as product_description
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
      LEFT JOIN products p ON co.product_id = p.id
      WHERE co.id = ?
    `, [id], callback);
  }
  
  // Ottieni contratti per cliente
  static getByClientId(clientId, callback) {
    db.all(`
      SELECT co.*, p.name as product_name 
      FROM contracts co
      LEFT JOIN products p ON co.product_id = p.id
      WHERE co.client_id = ?
      ORDER BY co.created_at DESC
    `, [clientId], callback);
  }
  
  // Crea un nuovo contratto
  static create(contractData, callback) {
    // Gestione valori null o undefined
    const productId = contractData.product_id || null;
    const value = contractData.value || null;
    const startDate = contractData.start_date || null;
    const endDate = contractData.end_date || null;
    
    db.run(
      `INSERT INTO contracts (
        client_id, product_id, contract_type, energy_type, supplier, status, 
        value, start_date, end_date, notes, consultant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractData.client_id, 
        productId, 
        contractData.contract_type, 
        contractData.energy_type, 
        contractData.supplier, 
        contractData.status, 
        value, 
        startDate, 
        endDate, 
        contractData.notes, 
        contractData.consultant_id
      ],
      function(err) {
        callback(err, this.lastID);
      }
    );
  }
  
  // Aggiorna un contratto
  static update(id, contractData, callback) {
    // Gestione valori null o undefined
    const productId = contractData.product_id || null;
    const value = contractData.value || null;
    const startDate = contractData.start_date || null;
    const endDate = contractData.end_date || null;
    
    db.run(
      `UPDATE contracts SET 
        client_id = ?, 
        product_id = ?,
        contract_type = ?, 
        energy_type = ?, 
        supplier = ?, 
        status = ?, 
        value = ?, 
        start_date = ?, 
        end_date = ?, 
        notes = ? 
       WHERE id = ?`,
      [
        contractData.client_id,
        productId,
        contractData.contract_type, 
        contractData.energy_type, 
        contractData.supplier, 
        contractData.status, 
        value, 
        startDate, 
        endDate, 
        contractData.notes, 
        id
      ],
      callback
    );
  }
  
  // Elimina un contratto
  static delete(id, callback) {
    db.run("DELETE FROM contracts WHERE id = ?", [id], callback);
  }
  
  // Statistiche contratti per tipo energia
  static getStatsByEnergyType(consultantId, callback) {
    let query = `
      SELECT energy_type, COUNT(*) as count, SUM(value) as total_value
      FROM contracts
      WHERE status = 'accepted'
    `;
    
    let params = [];
    
    if (consultantId) {
      query += " AND consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " GROUP BY energy_type";
    db.all(query, params, callback);
  }
  
  // Filtra contratti per stato
  static getByStatus(status, consultantId, callback) {
    let query = `
      SELECT co.*, c.name as client_name, c.surname as client_surname, 
             p.name as product_name, p.supplier as product_supplier
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
      LEFT JOIN products p ON co.product_id = p.id
      WHERE co.status = ?
    `;
    
    let params = [status];
    
    if (consultantId) {
      query += " AND co.consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY co.created_at DESC";
    db.all(query, params, callback);
  }
  
  // Ottieni statistiche contratti per mese
  static getStatsByMonth(year, consultantId, callback) {
    let query = `
      SELECT 
        strftime('%m', start_date) as month,
        COUNT(*) as count,
        SUM(value) as total_value
      FROM contracts
      WHERE 
        status = 'accepted' AND
        strftime('%Y', start_date) = ?
    `;
    
    let params = [year];
    
    if (consultantId) {
      query += " AND consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " GROUP BY month ORDER BY month";
    db.all(query, params, callback);
  }
  
  // Ottieni i contratti più recenti
  static getRecent(limit, consultantId, callback) {
    let query = `
      SELECT co.*, c.name as client_name, c.surname as client_surname, 
             p.name as product_name
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
      LEFT JOIN products p ON co.product_id = p.id
    `;
    
    let params = [];
    
    if (consultantId) {
      query += " WHERE co.consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY co.created_at DESC LIMIT ?";
    params.push(limit);
    
    db.all(query, params, callback);
  }
  
  // Cerca contratti
  static search(term, consultantId, callback) {
    let query = `
      SELECT co.*, c.name as client_name, c.surname as client_surname, 
             p.name as product_name, p.supplier as product_supplier
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
      LEFT JOIN products p ON co.product_id = p.id
      WHERE (
        c.name LIKE ? OR 
        c.surname LIKE ? OR 
        c.company LIKE ? OR
        co.contract_type LIKE ? OR
        p.name LIKE ?
      )
    `;
    
    let params = [
      `%${term}%`, 
      `%${term}%`, 
      `%${term}%`,
      `%${term}%`,
      `%${term}%`
    ];
    
    if (consultantId) {
      query += " AND co.consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY co.created_at DESC";
    db.all(query, params, callback);
  }
}

module.exports = Contract;