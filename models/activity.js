const db = require('../config/database');

class Activity {
  // Ottieni tutte le attività
  static getAll(consultantId, callback) {
    let query = `
      SELECT a.*, c.name as client_name, c.surname as client_surname 
      FROM activities a
      JOIN clients c ON a.client_id = c.id
    `;
    let params = [];
    
    if (consultantId) {
      query += " WHERE a.consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY a.activity_date DESC";
    db.all(query, params, callback);
  }
  
  // Ottieni attività per ID
  static getById(id, callback) {
    db.get(`
      SELECT a.*, c.name as client_name, c.surname as client_surname 
      FROM activities a
      JOIN clients c ON a.client_id = c.id
      WHERE a.id = ?
    `, [id], callback);
  }
  
  // Ottieni attività per cliente
  static getByClientId(clientId, callback) {
    db.all(`
      SELECT * FROM activities 
      WHERE client_id = ?
      ORDER BY activity_date DESC
    `, [clientId], callback);
  }
  
  // Crea una nuova attività
  static create(activityData, callback) {
    db.run(
      `INSERT INTO activities (client_id, title, description, activity_date, status, consultant_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        activityData.client_id, 
        activityData.title, 
        activityData.description, 
        activityData.activity_date, 
        activityData.status, 
        activityData.consultant_id
      ],
      function(err) {
        callback(err, this.lastID);
      }
    );
  }
  
  // Aggiorna un'attività
  static update(id, activityData, callback) {
    db.run(
      `UPDATE activities SET 
        client_id = ?, 
        title = ?, 
        description = ?, 
        activity_date = ?, 
        status = ? 
       WHERE id = ?`,
      [
        activityData.client_id, 
        activityData.title, 
        activityData.description, 
        activityData.activity_date, 
        activityData.status, 
        id
      ],
      callback
    );
  }
  
  // Elimina un'attività
  static delete(id, callback) {
    db.run("DELETE FROM activities WHERE id = ?", [id], callback);
  }
  
  // Ottieni attività per data
  static getByDate(date, consultantId, callback) {
    let query = `
      SELECT a.*, c.name as client_name, c.surname as client_surname 
      FROM activities a
      JOIN clients c ON a.client_id = c.id
      WHERE date(a.activity_date) = date(?)
    `;
    
    let params = [date];
    
    if (consultantId) {
      query += " AND a.consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY a.activity_date ASC";
    db.all(query, params, callback);
  }
}

module.exports = Activity;