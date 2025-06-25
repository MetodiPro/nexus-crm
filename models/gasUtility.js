const db = require('../config/database');

class GasUtility {
  // Ottieni tutte le utenze gas
  static getAll(callback) {
    db.all(`
      SELECT gu.*, c.name as client_name, c.surname as client_surname, c.company
      FROM gas_utilities gu
      JOIN clients c ON gu.client_id = c.id
      WHERE gu.is_active = 1
      ORDER BY c.name ASC, c.surname ASC, gu.utility_name ASC
    `, callback);
  }
  
  // Ottieni tutte le utenze gas di un cliente
  static getByClientId(clientId, callback) {
    db.all(`
      SELECT * FROM gas_utilities 
      WHERE client_id = ? AND is_active = 1
      ORDER BY utility_name ASC, created_at ASC
    `, [clientId], callback);
  }
  
  // Ottieni una utenza per ID
  static getById(id, callback) {
    db.get("SELECT * FROM gas_utilities WHERE id = ?", [id], callback);
  }
  
  // Crea una nuova utenza gas
  static create(utilityData, callback) {
    db.run(
      `INSERT INTO gas_utilities (
        client_id, pdr_code, utility_name, meter_type, remi_code,
        supplier, contract_start_date, contract_end_date, last_bill_date,
        annual_consumption_smc, annual_consumption_year,
        utility_address, utility_city, utility_postal_code, utility_province,
        notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        utilityData.client_id,
        utilityData.pdr_code,
        utilityData.utility_name || null,
        utilityData.meter_type || null,
        utilityData.remi_code || null,
        utilityData.supplier || null,
        utilityData.contract_start_date || null,
        utilityData.contract_end_date || null,
        utilityData.last_bill_date || null,
        utilityData.annual_consumption_smc || null,
        utilityData.annual_consumption_year || new Date().getFullYear(),
        utilityData.utility_address || null,
        utilityData.utility_city || null,
        utilityData.utility_postal_code || null,
        utilityData.utility_province || null,
        utilityData.notes || null,
        utilityData.is_active !== undefined ? utilityData.is_active : 1
      ],
      function(err) {
        callback(err, this?.lastID);
      }
    );
  }
  
  // Aggiorna una utenza gas
  static update(id, utilityData, callback) {
    db.run(
      `UPDATE gas_utilities SET 
        pdr_code = ?, utility_name = ?, meter_type = ?, remi_code = ?,
        supplier = ?, contract_start_date = ?, contract_end_date = ?, last_bill_date = ?,
        annual_consumption_smc = ?, annual_consumption_year = ?,
        utility_address = ?, utility_city = ?, utility_postal_code = ?, utility_province = ?,
        notes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        utilityData.pdr_code,
        utilityData.utility_name,
        utilityData.meter_type,
        utilityData.remi_code,
        utilityData.supplier,
        utilityData.contract_start_date,
        utilityData.contract_end_date,
        utilityData.last_bill_date,
        utilityData.annual_consumption_smc,
        utilityData.annual_consumption_year,
        utilityData.utility_address,
        utilityData.utility_city,
        utilityData.utility_postal_code,
        utilityData.utility_province,
        utilityData.notes,
        utilityData.is_active,
        id
      ],
      callback
    );
  }
  
  // Disattiva una utenza (soft delete)
  static deactivate(id, callback) {
    db.run(
      "UPDATE gas_utilities SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
      callback
    );
  }
  
  // Elimina una utenza (hard delete)
  static delete(id, callback) {
    db.run("DELETE FROM gas_utilities WHERE id = ?", [id], callback);
  }
  
  // Cerca utenze per PDR
  static searchByPdr(pdrCode, callback) {
    db.all(`
      SELECT gu.*, c.name as client_name, c.surname as client_surname, c.company
      FROM gas_utilities gu
      JOIN clients c ON gu.client_id = c.id
      WHERE gu.pdr_code LIKE ? AND gu.is_active = 1
    `, [`%${pdrCode}%`], callback);
  }
  
  // Ottieni statistiche consumi per cliente
  static getConsumptionStats(clientId, callback) {
    db.all(`
      SELECT 
        COUNT(*) as total_utilities,
        SUM(annual_consumption_smc) as total_consumption,
        AVG(annual_consumption_smc) as avg_consumption,
        MIN(annual_consumption_year) as oldest_year,
        MAX(annual_consumption_year) as newest_year
      FROM gas_utilities 
      WHERE client_id = ? AND is_active = 1 AND annual_consumption_smc IS NOT NULL
    `, [clientId], callback);
  }
  
  // Ottieni tutte le utenze con scadenza contratto vicina
  static getExpiringContracts(days = 90, callback) {
    db.all(`
      SELECT gu.*, c.name as client_name, c.surname as client_surname, c.company, c.phone, c.email
      FROM gas_utilities gu
      JOIN clients c ON gu.client_id = c.id
      WHERE gu.contract_end_date IS NOT NULL 
        AND gu.contract_end_date <= date('now', '+${days} days')
        AND gu.contract_end_date >= date('now')
        AND gu.is_active = 1
      ORDER BY gu.contract_end_date ASC
    `, callback);
  }
  
  // Validazione PDR
  static validatePdr(pdrCode) {
    // Regex base per PDR italiano (8 cifre)
    const pdrRegex = /^[0-9]{8,14}$/;
    return pdrRegex.test(pdrCode);
  }
}

module.exports = GasUtility;