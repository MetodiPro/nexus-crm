const db = require('../config/database');

class ElectricityUtility {
  // Ottieni tutte le utenze elettriche di un cliente
  static getByClientId(clientId, callback) {
    db.all(`
      SELECT * FROM electricity_utilities 
      WHERE client_id = ? AND is_active = 1
      ORDER BY utility_name ASC, created_at ASC
    `, [clientId], callback);
  }
  
  // Ottieni una utenza per ID
  static getById(id, callback) {
    db.get("SELECT * FROM electricity_utilities WHERE id = ?", [id], callback);
  }
  
  // Crea una nuova utenza elettrica
  static create(utilityData, callback) {
    db.run(
      `INSERT INTO electricity_utilities (
        client_id, pod_code, utility_name, power_kw, voltage, meter_type,
        supplier, contract_start_date, contract_end_date, last_bill_date,
        annual_consumption_kwh, annual_consumption_year,
        utility_address, utility_city, utility_postal_code, utility_province,
        notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        utilityData.client_id,
        utilityData.pod_code,
        utilityData.utility_name || null,
        utilityData.power_kw || null,
        utilityData.voltage || null,
        utilityData.meter_type || null,
        utilityData.supplier || null,
        utilityData.contract_start_date || null,
        utilityData.contract_end_date || null,
        utilityData.last_bill_date || null,
        utilityData.annual_consumption_kwh || null,
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
  
  // Aggiorna una utenza elettrica
  static update(id, utilityData, callback) {
    db.run(
      `UPDATE electricity_utilities SET 
        pod_code = ?, utility_name = ?, power_kw = ?, voltage = ?, meter_type = ?,
        supplier = ?, contract_start_date = ?, contract_end_date = ?, last_bill_date = ?,
        annual_consumption_kwh = ?, annual_consumption_year = ?,
        utility_address = ?, utility_city = ?, utility_postal_code = ?, utility_province = ?,
        notes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        utilityData.pod_code,
        utilityData.utility_name,
        utilityData.power_kw,
        utilityData.voltage,
        utilityData.meter_type,
        utilityData.supplier,
        utilityData.contract_start_date,
        utilityData.contract_end_date,
        utilityData.last_bill_date,
        utilityData.annual_consumption_kwh,
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
      "UPDATE electricity_utilities SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
      callback
    );
  }
  
  // Elimina una utenza (hard delete)
  static delete(id, callback) {
    db.run("DELETE FROM electricity_utilities WHERE id = ?", [id], callback);
  }
  
  // Cerca utenze per POD
  static searchByPod(podCode, callback) {
    db.all(`
      SELECT eu.*, c.name as client_name, c.surname as client_surname, c.company
      FROM electricity_utilities eu
      JOIN clients c ON eu.client_id = c.id
      WHERE eu.pod_code LIKE ? AND eu.is_active = 1
    `, [`%${podCode}%`], callback);
  }
  
  // Ottieni statistiche consumi per cliente
  static getConsumptionStats(clientId, callback) {
    db.all(`
      SELECT 
        COUNT(*) as total_utilities,
        SUM(annual_consumption_kwh) as total_consumption,
        AVG(annual_consumption_kwh) as avg_consumption,
        MIN(annual_consumption_year) as oldest_year,
        MAX(annual_consumption_year) as newest_year
      FROM electricity_utilities 
      WHERE client_id = ? AND is_active = 1 AND annual_consumption_kwh IS NOT NULL
    `, [clientId], callback);
  }
  
  // Ottieni tutte le utenze con scadenza contratto vicina
  static getExpiringContracts(days = 90, callback) {
    db.all(`
      SELECT eu.*, c.name as client_name, c.surname as client_surname, c.company, c.phone, c.email
      FROM electricity_utilities eu
      JOIN clients c ON eu.client_id = c.id
      WHERE eu.contract_end_date IS NOT NULL 
        AND eu.contract_end_date <= date('now', '+${days} days')
        AND eu.contract_end_date >= date('now')
        AND eu.is_active = 1
      ORDER BY eu.contract_end_date ASC
    `, callback);
  }
  
  // Validazione POD
  static validatePod(podCode) {
    // Regex base per POD italiano (IT + codice distributore + identificativo)
    const podRegex = /^IT[0-9]{3}[A-Z][0-9]{8}$/;
    return podRegex.test(podCode?.toUpperCase());
  }
}

module.exports = ElectricityUtility;