const db = require('../config/database');

class Client {
  // Ottieni tutti i clienti
  static getAll(consultantId, callback) {
    let query = "SELECT * FROM clients";
    let params = [];
    
    // Se è specificato un consulente, filtra i clienti
    if (consultantId) {
      query += " WHERE consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY name ASC";
    db.all(query, params, callback);
  }
  
  // Ottieni un cliente per ID
  static getById(id, callback) {
    db.get("SELECT * FROM clients WHERE id = ?", [id], callback);
  }
  
  // Crea un nuovo cliente
  static create(clientData, callback) {
    db.run(
      `INSERT INTO clients (name, surname, company, vat_number, address, city, postal_code, phone, email, notes, consultant_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientData.name, 
        clientData.surname, 
        clientData.company, 
        clientData.vat_number, 
        clientData.address, 
        clientData.city, 
        clientData.postal_code, 
        clientData.phone, 
        clientData.email, 
        clientData.notes, 
        clientData.consultant_id
      ],
      function(err) {
        callback(err, this.lastID);
      }
    );
  }
  
  // Aggiorna un cliente
  static update(id, clientData, callback) {
    db.run(
      `UPDATE clients SET 
        name = ?, 
        surname = ?, 
        company = ?, 
        vat_number = ?, 
        address = ?, 
        city = ?, 
        postal_code = ?, 
        phone = ?, 
        email = ?, 
        notes = ? 
       WHERE id = ?`,
      [
        clientData.name, 
        clientData.surname, 
        clientData.company, 
        clientData.vat_number, 
        clientData.address, 
        clientData.city, 
        clientData.postal_code, 
        clientData.phone, 
        clientData.email, 
        clientData.notes, 
        id
      ],
      callback
    );
  }
  
  // Elimina un cliente
  static delete(id, callback) {
    db.run("DELETE FROM clients WHERE id = ?", [id], callback);
  }
  
  // Cerca clienti
  static search(term, consultantId, callback) {
    let query = `
      SELECT * FROM clients 
      WHERE (name LIKE ? OR surname LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ?)
    `;
    
    let params = [
      `%${term}%`, 
      `%${term}%`, 
      `%${term}%`, 
      `%${term}%`, 
      `%${term}%`
    ];
    
    if (consultantId) {
      query += " AND consultant_id = ?";
      params.push(consultantId);
    }
    
    db.all(query, params, callback);
  }
}

module.exports = Client;