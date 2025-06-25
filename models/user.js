const db = require('../config/database');
const bcrypt = require('bcrypt');
const { loggers } = require('../config/logger');

class User {
  // Ottieni tutti gli utenti
  static getAll(callback) {
    const query = "SELECT id, username, role, name, email, last_login, failed_login_attempts, account_locked, created_at FROM users ORDER BY created_at DESC";
    
    db.all(query, (err, rows) => {
      if (err) {
        loggers.dbError('Errore nel recupero degli utenti', err, query);
        return callback(err);
      }
      callback(null, rows || []);
    });
  }
  
  // Ottieni un utente per ID (senza password)
  static getById(id, callback) {
    const query = "SELECT id, username, role, name, email, last_login, failed_login_attempts, account_locked, created_at FROM users WHERE id = ?";
    
    db.get(query, [id], (err, row) => {
      if (err) {
        loggers.dbError('Errore nel recupero utente per ID', err, query, [id]);
        return callback(err);
      }
      callback(null, row);
    });
  }
  
  // Ottieni un utente per username (con password per autenticazione)
  static getByUsername(username, callback) {
    const query = "SELECT * FROM users WHERE LOWER(username) = LOWER(?)";
    
    db.get(query, [username], (err, row) => {
      if (err) {
        loggers.dbError('Errore nel recupero utente per username', err, query, [username]);
        return callback(err);
      }
      callback(null, row);
    });
  }
  
  // Verifica se un username esiste già
  static usernameExists(username, excludeId = null, callback) {
    let query = "SELECT id FROM users WHERE LOWER(username) = LOWER(?)";
    let params = [username];
    
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    
    db.get(query, params, (err, row) => {
      if (err) {
        loggers.dbError('Errore nella verifica username esistente', err, query, params);
        return callback(err);
      }
      callback(null, !!row);
    });
  }
  
  // Crea un nuovo utente
  static create(userData, callback) {
    // Verifica se lo username esiste già
    this.usernameExists(userData.username, null, (err, exists) => {
      if (err) return callback(err);
      
      if (exists) {
        const error = new Error('Username già esistente');
        error.code = 'USERNAME_EXISTS';
        loggers.warn('Tentativo di creazione utente con username esistente', {
          username: userData.username
        });
        return callback(error);
      }
      
      // Hash della password
      const salt = bcrypt.genSaltSync(12); // Aumento la complessità
      const hashedPassword = bcrypt.hashSync(userData.password, salt);
      
      const query = `INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)`;
      const params = [userData.username.toLowerCase(), hashedPassword, userData.role, userData.name, userData.email];
      
      db.run(query, params, function(err) {
        if (err) {
          loggers.dbError('Errore nella creazione utente', err, query, params);
          return callback(err);
        }
        
        // Usa una query separata per ottenere l'ultimo ID inserito
        db.get('SELECT last_insert_rowid() as lastID', [], (err, row) => {
          if (err) {
            loggers.dbError('Errore nel recupero ID utente creato', err);
            return callback(err);
          }
          
          const newUserId = row.lastID;
          loggers.info('Nuovo utente creato', {
            userId: newUserId,
            username: userData.username,
            role: userData.role,
            name: userData.name
          });
          
          callback(null, newUserId);
        });
      });
    });
  }
  
  // Aggiorna un utente
  static update(id, userData, callback) {
    // Verifica se lo username esiste già (escludendo l'utente corrente)
    this.usernameExists(userData.username, id, (err, exists) => {
      if (err) return callback(err);
      
      if (exists) {
        const error = new Error('Username già esistente');
        error.code = 'USERNAME_EXISTS';
        loggers.warn('Tentativo di aggiornamento con username esistente', {
          userId: id,
          username: userData.username
        });
        return callback(error);
      }
      
      let query, params;
      
      // Se è inclusa la password, aggiornala
      if (userData.password && userData.password.trim() !== '') {
        const salt = bcrypt.genSaltSync(12);
        const hashedPassword = bcrypt.hashSync(userData.password, salt);
        
        query = `UPDATE users SET username = ?, password = ?, role = ?, name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        params = [userData.username.toLowerCase(), hashedPassword, userData.role, userData.name, userData.email, id];
        
        loggers.info('Aggiornamento utente con cambio password', {
          userId: id,
          username: userData.username
        });
      } else {
        query = `UPDATE users SET username = ?, role = ?, name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        params = [userData.username.toLowerCase(), userData.role, userData.name, userData.email, id];
        
        loggers.info('Aggiornamento utente senza cambio password', {
          userId: id,
          username: userData.username
        });
      }
      
      db.run(query, params, function(err) {
        if (err) {
          loggers.dbError('Errore nell\'aggiornamento utente', err, query, params);
          return callback(err);
        }
        callback(null);
      });
    });
  }
  
  // Elimina un utente
  static delete(id, callback) {
    // Prima verifica se l'utente esiste
    this.getById(id, (err, user) => {
      if (err) return callback(err);
      
      if (!user) {
        const error = new Error('Utente non trovato');
        error.code = 'USER_NOT_FOUND';
        return callback(error);
      }
      
      const query = "DELETE FROM users WHERE id = ?";
      
      db.run(query, [id], function(err) {
        if (err) {
          loggers.dbError('Errore nell\'eliminazione utente', err, query, [id]);
          return callback(err);
        }
        
        loggers.info('Utente eliminato', {
          userId: id,
          username: user.username,
          deletedRows: this.changes
        });
        
        callback(null);
      });
    });
  }
  
  // Verifica le credenziali di login - COMPATIBILITÀ CON VECCHIO E NUOVO SISTEMA
  static authenticate(username, password, ipAddress, userAgent, callback) {
    // Se è chiamata con il vecchio formato (solo 3 parametri)
    if (typeof ipAddress === 'function') {
      callback = ipAddress;
      ipAddress = 'unknown';
      userAgent = 'unknown';
    }
    
    this.getByUsername(username, (err, user) => {
      if (err) {
        loggers.error('Errore durante autenticazione', err, {
          username,
          ip: ipAddress
        });
        return callback(err);
      }
      
      if (!user) {
        loggers.warn('Tentativo di login con username inesistente', {
          username,
          ip: ipAddress,
          userAgent
        });
        return callback(null, false, 'USERNAME_NOT_FOUND');
      }
      
      // Verifica se l'account è bloccato
      if (user.account_locked) {
        loggers.warn('Tentativo di login su account bloccato', {
          userId: user.id,
          username: user.username,
          ip: ipAddress,
          userAgent
        });
        return callback(null, false, 'ACCOUNT_LOCKED');
      }
      
      // Verifica password
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          loggers.error('Errore nella verifica password', err, {
            userId: user.id,
            username: user.username,
            ip: ipAddress
          });
          return callback(err);
        }
        
        if (!result) {
          // Password errata - incrementa i tentativi falliti
          this.incrementFailedAttempts(user.id, (err) => {
            if (err) {
              loggers.error('Errore nell\'incremento tentativi falliti', err);
            }
          });
          
          loggers.warn('Tentativo di login con password errata', {
            userId: user.id,
            username: user.username,
            failedAttempts: user.failed_login_attempts + 1,
            ip: ipAddress,
            userAgent
          });
          
          return callback(null, false, 'INVALID_PASSWORD');
        }
        
        // Login riuscito - resetta i tentativi falliti e aggiorna last_login
        this.resetFailedAttempts(user.id, (err) => {
          if (err) {
            loggers.error('Errore nel reset tentativi falliti', err);
          }
        });
        
        this.updateLastLogin(user.id, (err) => {
          if (err) {
            loggers.error('Errore nell\'aggiornamento last_login', err);
          }
        });
        
        loggers.info('Login riuscito', {
          userId: user.id,
          username: user.username,
          role: user.role,
          ip: ipAddress,
          userAgent
        });
        
        // Rimuovi la password prima di restituire l'utente
        delete user.password;
        return callback(null, user, 'SUCCESS');
      });
    });
  }
  
  // Incrementa i tentativi di login falliti
  static incrementFailedAttempts(userId, callback) {
    const query = `
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          account_locked = CASE 
            WHEN failed_login_attempts + 1 >= 5 THEN 1 
            ELSE account_locked 
          END
      WHERE id = ?
    `;
    
    db.run(query, [userId], function(err) {
      if (err) {
        loggers.dbError('Errore nell\'incremento tentativi falliti', err, query, [userId]);
      }
      if (callback) callback(err);
    });
  }
  
  // Resetta i tentativi di login falliti
  static resetFailedAttempts(userId, callback) {
    const query = "UPDATE users SET failed_login_attempts = 0, account_locked = 0 WHERE id = ?";
    
    db.run(query, [userId], function(err) {
      if (err) {
        loggers.dbError('Errore nel reset tentativi falliti', err, query, [userId]);
      }
      if (callback) callback(err);
    });
  }
  
  // Aggiorna timestamp ultimo login
  static updateLastLogin(userId, callback) {
    const query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
    
    db.run(query, [userId], function(err) {
      if (err) {
        loggers.dbError('Errore nell\'aggiornamento last_login', err, query, [userId]);
      }
      if (callback) callback(err);
    });
  }
  
  // Sblocca account
  static unlockAccount(userId, callback) {
    const query = "UPDATE users SET account_locked = 0, failed_login_attempts = 0 WHERE id = ?";
    
    db.run(query, [userId], function(err) {
      if (err) {
        loggers.dbError('Errore nello sblocco account', err, query, [userId]);
        return callback(err);
      }
      
      loggers.info('Account sbloccato', { userId });
      callback(null);
    });
  }
  
  // Log sessione utente
  static logUserSession(userId, ipAddress, userAgent, callback) {
    const query = `
      INSERT INTO user_sessions (user_id, session_id, ip_address, user_agent, login_time)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    // Genera un session_id temporaneo (sarà sostituito dal session ID reale)
    const tempSessionId = require('crypto').randomBytes(16).toString('hex');
    
    // Usa il database direttamente senza il wrapper di logging per evitare problemi di contesto
    const sqlite3 = require('sqlite3');
    const path = require('path');
    const dbPath = path.resolve(__dirname, '../data/nexus.db');
    const directDb = new sqlite3.Database(dbPath);
    
    directDb.run(query, [userId, tempSessionId, ipAddress, userAgent], function(err) {
      if (err) {
        loggers.dbError('Errore nel log sessione utente', err, query, [userId, tempSessionId, ipAddress, userAgent]);
        directDb.close();
        if (callback) callback(err);
      } else {
        // Usa una query separata per ottenere l'ultimo ID inserito
        directDb.get('SELECT last_insert_rowid() as lastID', [], (err, row) => {
          if (err) {
            loggers.dbError('Errore nel recupero ID sessione', err);
            directDb.close();
            if (callback) callback(err);
          } else {
            const sessionLogId = row.lastID;
            loggers.info('Sessione utente loggata', {
              userId,
              sessionLogId: sessionLogId,
              ip: ipAddress
            });
            directDb.close();
            if (callback) callback(null, sessionLogId);
          }
        });
      }
    });
  }
  
  // Ottieni sessioni attive per un utente
  static getActiveSessions(userId, callback) {
    const query = `
      SELECT session_id, ip_address, user_agent, login_time, logout_time, is_active
      FROM user_sessions
      WHERE user_id = ? AND is_active = 1
      ORDER BY login_time DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
      if (err) {
        loggers.dbError('Errore nel recupero sessioni attive', err, query, [userId]);
        return callback(err);
      }
      callback(null, rows || []);
    });
  }
  
  // Aggiorna session ID reale
  static updateSessionId(sessionLogId, realSessionId, callback) {
    const query = "UPDATE user_sessions SET session_id = ? WHERE id = ?";
    
    db.run(query, [realSessionId, sessionLogId], function(err) {
      if (err) {
        loggers.dbError('Errore nell\'aggiornamento session ID', err, query, [realSessionId, sessionLogId]);
      } else {
        loggers.debug('Session ID aggiornato', {
          sessionLogId,
          realSessionId
        });
      }
      if (callback) callback(err);
    });
  }
  
  // Termina sessione
  static logoutSession(sessionId, callback) {
    const query = `
      UPDATE user_sessions 
      SET logout_time = CURRENT_TIMESTAMP, is_active = 0
      WHERE session_id = ?
    `;
    
    db.run(query, [sessionId], function(err) {
      if (err) {
        loggers.dbError('Errore nel logout sessione', err, query, [sessionId]);
      }
      if (callback) callback(err);
    });
  }
  
  // Cambia password (con verifica password attuale)
  static changePassword(userId, currentPassword, newPassword, callback) {
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
      if (err) return callback(err);
      if (!user) return callback(new Error('Utente non trovato'));
      
      bcrypt.compare(currentPassword, user.password, (err, result) => {
        if (err) return callback(err);
        if (!result) {
          const error = new Error('Password attuale non corretta');
          error.code = 'INVALID_CURRENT_PASSWORD';
          return callback(error);
        }
        
        // Password attuale corretta, aggiorna con la nuova
        const salt = bcrypt.genSaltSync(12);
        const hashedPassword = bcrypt.hashSync(newPassword, salt);
        
        const query = "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        
        db.run(query, [hashedPassword, userId], function(err) {
          if (err) {
            loggers.dbError('Errore nel cambio password', err, query);
            return callback(err);
          }
          
          loggers.info('Password cambiata', { userId, username: user.username });
          callback(null);
        });
      });
    });
  }
}

module.exports = User;