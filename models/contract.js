const db = require('../config/database');

class Contract {
  // Ottieni tutti i contratti
  static getAll(consultantId, callback) {
    let query = `
      SELECT co.*, c.name as client_name, c.surname as client_surname 
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
    `;
    let params = [];
    
    if (consultantId) {
      query += " WHERE co.consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY co.created_at DESC";
    db.all(query, params, callback);
  }
  
  // Ottieni contratto per ID
  static getById(id, callback) {
    db.get(`
      SELECT co.*, c.name as client_name, c.surname as client_surname 
      FROM contracts co
      JOIN clients c ON co.client_id = c.id
      WHERE co.id = ?
    `, [id], callback);
  }
  
  // Ottieni contratti per cliente
  static getByClientId(clientId, callback) {
    db.all(`
      SELECT * FROM contracts 
      WHERE client_id = ?
      ORDER BY created_at DESC
    `, [clientId], callback);
  }
  
  // Crea un nuovo contratto
  static create(contractData, callback) {
    db.run(
      `INSERT INTO contracts (
        client_id, contract_type, energy_type, supplier, status, 
        value, start_date, end_date, notes, consultant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractData.client_id, 
        contractData.contract_type, 
        contractData.energy_type, 
        contractData.supplier, 
        contractData.status, 
        contractData.value, 
        contractData.start_date, 
        contractData.end_date, 
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
    db.run(
      `UPDATE contracts SET 
        client_id = ?, 
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
        contractData.contract_type, 
        contractData.energy_type, 
        contractData.supplier, 
        contractData.status, 
        contractData.value, 
        contractData.start_date, 
        contractData.end_date, 
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
}

module.exports = Contract;