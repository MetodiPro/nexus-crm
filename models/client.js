const db = require('../config/database');

class Client {
  // Ottieni tutti i clienti
  static getAll(consultantId, callback) {
    let query = `SELECT 
      id, name, surname, company, vat_number, fiscal_code, company_fiscal_code,
      phone, email, pec_email, city, province, client_status, 
      last_contact_date, created_at
    FROM clients`;
    let params = [];
    
    // Se è specificato un consulente, filtra i clienti
    if (consultantId) {
      query += " WHERE consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY name ASC, surname ASC";
    db.all(query, params, callback);
  }
  
  // Ottieni un cliente per ID con tutti i dettagli
  static getById(id, callback) {
    console.log('📎 DEBUG Client.getById chiamato con ID:', id);
    db.get("SELECT * FROM clients WHERE id = ?", [id], (err, row) => {
      if (err) {
        console.error('❌ DEBUG Client.getById errore DB:', err);
      } else if (row) {
        console.log('✅ DEBUG Client.getById trovato:', row.name, row.surname);
      } else {
        console.log('⚠️ DEBUG Client.getById nessun risultato per ID:', id);
      }
      callback(err, row);
    });
  }
  
  // Crea un nuovo cliente (SENZA fax e campi utenze singole)
  static create(clientData, callback) {
    console.log('📝 DEBUG Client.create chiamato con dati:', {
      name: clientData.name,
      surname: clientData.surname,
      fiscal_code: clientData.fiscal_code,
      consultant_id: clientData.consultant_id
    });
    
    db.run(
      `INSERT INTO clients (
        name, surname, fiscal_code, birth_date, birth_place, gender,
        company, vat_number, company_fiscal_code, company_legal_form,
        address, city, postal_code, province,
        legal_address, legal_city, legal_postal_code, legal_province,
        billing_address, billing_city, billing_postal_code, billing_province,
        phone, email, pec_email, website, reference_person,
        client_status, acquisition_date, last_contact_date, notes, consultant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientData.name || null,
        clientData.surname || null,
        clientData.fiscal_code || null,
        clientData.birth_date || null,
        clientData.birth_place || null,
        clientData.gender || null,
        clientData.company || null,
        clientData.vat_number || null,
        clientData.company_fiscal_code || null,
        clientData.company_legal_form || null,
        clientData.address || null,
        clientData.city || null,
        clientData.postal_code || null,
        clientData.province || null,
        clientData.legal_address || null,
        clientData.legal_city || null,
        clientData.legal_postal_code || null,
        clientData.legal_province || null,
        clientData.billing_address || null,
        clientData.billing_city || null,
        clientData.billing_postal_code || null,
        clientData.billing_province || null,
        clientData.phone || null,
        clientData.email || null,
        clientData.pec_email || null,
        clientData.website || null,
        clientData.reference_person || null,
        clientData.client_status || 'prospect',
        clientData.acquisition_date || null,
        clientData.last_contact_date || null,
        clientData.notes || null,
        clientData.consultant_id
      ],
      function(err) {
        if (err) {
          console.error('❌ DEBUG Client.create errore DB:', err);
          callback(err, null);
        } else {
          console.log('✅ DEBUG Client.create successo, ID generato:', this.lastID);
          callback(null, this.lastID);
        }
      }
    );
  }
  
  // Aggiorna un cliente (SENZA fax e campi utenze singole)
  static update(id, clientData, callback) {
    db.run(
      `UPDATE clients SET 
        name = ?, surname = ?, fiscal_code = ?, birth_date = ?, birth_place = ?, gender = ?,
        company = ?, vat_number = ?, company_fiscal_code = ?, company_legal_form = ?,
        address = ?, city = ?, postal_code = ?, province = ?,
        legal_address = ?, legal_city = ?, legal_postal_code = ?, legal_province = ?,
        billing_address = ?, billing_city = ?, billing_postal_code = ?, billing_province = ?,
        phone = ?, email = ?, pec_email = ?, website = ?, reference_person = ?,
        client_status = ?, acquisition_date = ?, last_contact_date = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        clientData.name,
        clientData.surname,
        clientData.fiscal_code,
        clientData.birth_date,
        clientData.birth_place,
        clientData.gender,
        clientData.company,
        clientData.vat_number,
        clientData.company_fiscal_code,
        clientData.company_legal_form,
        clientData.address,
        clientData.city,
        clientData.postal_code,
        clientData.province,
        clientData.legal_address,
        clientData.legal_city,
        clientData.legal_postal_code,
        clientData.legal_province,
        clientData.billing_address,
        clientData.billing_city,
        clientData.billing_postal_code,
        clientData.billing_province,
        clientData.phone,
        clientData.email,
        clientData.pec_email,
        clientData.website,
        clientData.reference_person,
        clientData.client_status,
        clientData.acquisition_date,
        clientData.last_contact_date,
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
  
  // Cerca clienti (ricerca estesa, SENZA POD/PDR dato che ora sono in tabelle separate)
  static search(term, consultantId, callback) {
    let query = `
      SELECT id, name, surname, company, vat_number, fiscal_code, company_fiscal_code,
             phone, email, pec_email, city, province, client_status
      FROM clients 
      WHERE (
        name LIKE ? OR surname LIKE ? OR company LIKE ? OR 
        email LIKE ? OR phone LIKE ? OR fiscal_code LIKE ? OR 
        vat_number LIKE ? OR company_fiscal_code LIKE ?
      )
    `;
    
    let params = [
      `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, 
      `%${term}%`, `%${term}%`, `%${term}%`
    ];
    
    if (consultantId) {
      query += " AND consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY name ASC, surname ASC";
    
    db.all(query, params, callback);
  }
  
  // Ottieni clienti per tipologia
  static getByStatus(status, consultantId, callback) {
    let query = "SELECT * FROM clients WHERE client_status = ?";
    let params = [status];
    
    if (consultantId) {
      query += " AND consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY last_contact_date DESC, name ASC";
    
    db.all(query, params, callback);
  }
  
  // Ottieni clienti che non hanno contatti da X giorni
  static getInactiveClients(days = 30, consultantId, callback) {
    let query = `
      SELECT * FROM clients 
      WHERE (
        last_contact_date IS NULL OR 
        last_contact_date < date('now', '-${days} days')
      ) AND client_status = 'active'
    `;
    let params = [];
    
    if (consultantId) {
      query += " AND consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " ORDER BY last_contact_date ASC";
    
    db.all(query, params, callback);
  }
  
  // Aggiorna solo la data ultimo contatto
  static updateLastContact(id, callback) {
    db.run(
      "UPDATE clients SET last_contact_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
      callback
    );
  }
  
  // Statistiche clienti per consulente
  static getStats(consultantId, callback) {
    let query = `
      SELECT 
        client_status,
        COUNT(*) as count
      FROM clients
    `;
    let params = [];
    
    if (consultantId) {
      query += " WHERE consultant_id = ?";
      params.push(consultantId);
    }
    
    query += " GROUP BY client_status";
    
    db.all(query, params, callback);
  }
  
  // Ottieni cliente con tutte le utenze associate
  static getWithUtilities(id, callback) {
    const ElectricityUtility = require('./electricityUtility');
    const GasUtility = require('./gasUtility');
    
    // Prima ottieni il cliente
    this.getById(id, (err, client) => {
      if (err) return callback(err);
      if (!client) return callback(null, null);
      
      // Poi ottieni le utenze elettriche
      ElectricityUtility.getByClientId(id, (err, electricityUtilities) => {
        if (err) return callback(err);
        
        // Poi ottieni le utenze gas
        GasUtility.getByClientId(id, (err, gasUtilities) => {
          if (err) return callback(err);
          
          // Combina tutto
          const result = {
            ...client,
            electricity_utilities: electricityUtilities || [],
            gas_utilities: gasUtilities || []
          };
          
          callback(null, result);
        });
      });
    });
  }
  
  // Ricerca avanzata che include anche POD/PDR dalle tabelle utilities
  static searchWithUtilities(term, consultantId, callback) {
    let baseQuery = `
      SELECT DISTINCT c.id, c.name, c.surname, c.company, c.vat_number, 
             c.fiscal_code, c.phone, c.email, c.client_status
      FROM clients c
      LEFT JOIN electricity_utilities eu ON c.id = eu.client_id AND eu.is_active = 1
      LEFT JOIN gas_utilities gu ON c.id = gu.client_id AND gu.is_active = 1
      WHERE (
        c.name LIKE ? OR c.surname LIKE ? OR c.company LIKE ? OR 
        c.email LIKE ? OR c.phone LIKE ? OR c.fiscal_code LIKE ? OR 
        c.vat_number LIKE ? OR c.company_fiscal_code LIKE ? OR
        eu.pod_code LIKE ? OR gu.pdr_code LIKE ?
      )
    `;
    
    let params = [
      `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, 
      `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`
    ];
    
    if (consultantId) {
      baseQuery += " AND c.consultant_id = ?";
      params.push(consultantId);
    }
    
    baseQuery += " ORDER BY c.name ASC, c.surname ASC";
    
    db.all(baseQuery, params, callback);
  }
  
  // Ottieni statistiche complete con utenze
  static getCompleteStats(consultantId, callback) {
    let clientQuery = `
      SELECT 
        client_status,
        COUNT(*) as count
      FROM clients
    `;
    let params = [];
    
    if (consultantId) {
      clientQuery += " WHERE consultant_id = ?";
      params.push(consultantId);
    }
    
    clientQuery += " GROUP BY client_status";
    
    db.all(clientQuery, params, (err, clientStats) => {
      if (err) return callback(err);
      
      // Statistiche utenze elettriche
      let electricityQuery = `
        SELECT 
          COUNT(DISTINCT eu.client_id) as clients_with_electricity,
          COUNT(eu.id) as total_electricity_utilities,
          SUM(eu.annual_consumption_kwh) as total_electricity_consumption
        FROM electricity_utilities eu
        JOIN clients c ON eu.client_id = c.id
        WHERE eu.is_active = 1
      `;
      let electricityParams = [];
      
      if (consultantId) {
        electricityQuery += " AND c.consultant_id = ?";
        electricityParams.push(consultantId);
      }
      
      db.get(electricityQuery, electricityParams, (err, electricityStats) => {
        if (err) return callback(err);
        
        // Statistiche utenze gas
        let gasQuery = `
          SELECT 
            COUNT(DISTINCT gu.client_id) as clients_with_gas,
            COUNT(gu.id) as total_gas_utilities,
            SUM(gu.annual_consumption_smc) as total_gas_consumption
          FROM gas_utilities gu
          JOIN clients c ON gu.client_id = c.id
          WHERE gu.is_active = 1
        `;
        let gasParams = [];
        
        if (consultantId) {
          gasQuery += " AND c.consultant_id = ?";
          gasParams.push(consultantId);
        }
        
        db.get(gasQuery, gasParams, (err, gasStats) => {
          if (err) return callback(err);
          
          callback(null, {
            clients: clientStats,
            electricity: electricityStats,
            gas: gasStats
          });
        });
      });
    });
  }
  
  // Validazione codice fiscale (base)
  static validateFiscalCode(fiscalCode) {
    // Regex base per codice fiscale italiano
    const fiscalCodeRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
    return fiscalCodeRegex.test(fiscalCode?.toUpperCase());
  }
  
  // Validazione partita IVA
  static validateVAT(vatNumber) {
    // Regex base per partita IVA italiana
    const vatRegex = /^[0-9]{11}$/;
    return vatRegex.test(vatNumber);
  }
}

module.exports = Client;