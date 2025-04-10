const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Ottieni tutti gli utenti
  static getAll(callback) {
    db.all("SELECT id, username, role, name, email, created_at FROM users", callback);
  }
  
  // Ottieni un utente per ID
  static getById(id, callback) {
    db.get("SELECT id, username, role, name, email, created_at FROM users WHERE id = ?", [id], callback);
  }
  
  // Ottieni un utente per username
  static getByUsername(username, callback) {
    db.get("SELECT * FROM users WHERE username = ?", [username], callback);
  }
  
  // Crea un nuovo utente
  static create(userData, callback) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(userData.password, salt);
    
    db.run(
      `INSERT INTO users (username, password, role, name, email) 
       VALUES (?, ?, ?, ?, ?)`,
      [userData.username, hashedPassword, userData.role, userData.name, userData.email],
      function(err) {
        callback(err, this.lastID);
      }
    );
  }
  
  // Aggiorna un utente
  static update(id, userData, callback) {
    let query, params;
    
    // Se è inclusa la password, aggiornala
    if (userData.password) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(userData.password, salt);
      
      query = `UPDATE users SET username = ?, password = ?, role = ?, name = ?, email = ? WHERE id = ?`;
      params = [userData.username, hashedPassword, userData.role, userData.name, userData.email, id];
    } else {
      query = `UPDATE users SET username = ?, role = ?, name = ?, email = ? WHERE id = ?`;
      params = [userData.username, userData.role, userData.name, userData.email, id];
    }
    
    db.run(query, params, callback);
  }
  
  // Elimina un utente
  static delete(id, callback) {
    db.run("DELETE FROM users WHERE id = ?", [id], callback);
  }
  
  // Verifica le credenziali di login
  static authenticate(username, password, callback) {
    this.getByUsername(username, (err, user) => {
      if (err) return callback(err);
      if (!user) return callback(null, false);
      
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) return callback(err);
        if (!result) return callback(null, false);
        
        // Rimuovi la password prima di restituire l'utente
        delete user.password;
        return callback(null, user);
      });
    });
  }
}

module.exports = User;