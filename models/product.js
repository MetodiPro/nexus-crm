const db = require('../config/database');

class Product {
  // Ottieni tutti i prodotti con informazioni complete
  static getAll(callback) {
    db.all(`
      SELECT p.*, u.name as created_by_name,
             COUNT(pa.id) as attachments_count
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN product_attachments pa ON p.id = pa.product_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `, callback);
  }
  
  // Ottieni prodotto per ID con allegati
  static getById(id, callback) {
    db.get(`
      SELECT p.*, u.name as created_by_name
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [id], (err, product) => {
      if (err) return callback(err);
      if (!product) return callback(null, null);
      
      // Ottieni anche gli allegati
      db.all(`
        SELECT * FROM product_attachments 
        WHERE product_id = ? 
        ORDER BY upload_date DESC
      `, [id], (err, attachments) => {
        if (err) return callback(err);
        product.attachments = attachments || [];
        callback(null, product);
      });
    });
  }
  
  // Crea un nuovo prodotto
  static create(productData, callback) {
    const sql = `
      INSERT INTO products (
        name, service_type, supplier_operator, description_notes,
        electricity_fixed_rate, electricity_variable_spread, electricity_other_rate_notes,
        gas_fixed_rate, gas_variable_spread, gas_other_rate_notes,
        additional_cost1_description, additional_cost1_value, additional_cost1_unit,
        additional_cost2_description, additional_cost2_value, additional_cost2_unit,
        additional_cost3_description, additional_cost3_value, additional_cost3_unit,
        pdf_attachment_filename, pdf_attachment_path, pdf_upload_date,
        is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      productData.name,
      productData.service_type,
      productData.supplier_operator,
      productData.description_notes || null,
      
      // Campi energia elettrica
      productData.electricity_fixed_rate || null,
      productData.electricity_variable_spread || null,
      productData.electricity_other_rate_notes || null,
      
      // Campi gas naturale
      productData.gas_fixed_rate || null,
      productData.gas_variable_spread || null,
      productData.gas_other_rate_notes || null,
      
      // Costi aggiuntivi
      productData.additional_cost1_description || null,
      productData.additional_cost1_value || null,
      productData.additional_cost1_unit || null,
      
      productData.additional_cost2_description || null,
      productData.additional_cost2_value || null,
      productData.additional_cost2_unit || null,
      
      productData.additional_cost3_description || null,
      productData.additional_cost3_value || null,
      productData.additional_cost3_unit || null,
      
      // PDF allegato
      productData.pdf_attachment_filename || null,
      productData.pdf_attachment_path || null,
      productData.pdf_upload_date || null,
      
      // Sistema
      productData.is_active ? 1 : 0,
      productData.created_by
    ];
    
    db.run(sql, params, function(err) {
      callback(err, this.lastID);
    });
  }
  
  // Aggiorna un prodotto
  static update(id, productData, callback) {
    const sql = `
      UPDATE products SET 
        name = ?, service_type = ?, supplier_operator = ?, description_notes = ?,
        electricity_fixed_rate = ?, electricity_variable_spread = ?, electricity_other_rate_notes = ?,
        gas_fixed_rate = ?, gas_variable_spread = ?, gas_other_rate_notes = ?,
        additional_cost1_description = ?, additional_cost1_value = ?, additional_cost1_unit = ?,
        additional_cost2_description = ?, additional_cost2_value = ?, additional_cost2_unit = ?,
        additional_cost3_description = ?, additional_cost3_value = ?, additional_cost3_unit = ?,
        pdf_attachment_filename = ?, pdf_attachment_path = ?, pdf_upload_date = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
    `;
    
    const params = [
      productData.name,
      productData.service_type,
      productData.supplier_operator,
      productData.description_notes || null,
      
      // Campi energia elettrica
      productData.electricity_fixed_rate || null,
      productData.electricity_variable_spread || null,
      productData.electricity_other_rate_notes || null,
      
      // Campi gas naturale
      productData.gas_fixed_rate || null,
      productData.gas_variable_spread || null,
      productData.gas_other_rate_notes || null,
      
      // Costi aggiuntivi
      productData.additional_cost1_description || null,
      productData.additional_cost1_value || null,
      productData.additional_cost1_unit || null,
      
      productData.additional_cost2_description || null,
      productData.additional_cost2_value || null,
      productData.additional_cost2_unit || null,
      
      productData.additional_cost3_description || null,
      productData.additional_cost3_value || null,
      productData.additional_cost3_unit || null,
      
      // PDF allegato
      productData.pdf_attachment_filename || null,
      productData.pdf_attachment_path || null,
      productData.pdf_upload_date || null,
      
      // Sistema
      productData.is_active ? 1 : 0,
      id
    ];
    
    db.run(sql, params, callback);
  }
  
  // Elimina un prodotto
  static delete(id, callback) {
    // Prima elimina gli allegati
    db.run("DELETE FROM product_attachments WHERE product_id = ?", [id], (err) => {
      if (err) return callback(err);
      
      // Poi elimina il prodotto
      db.run("DELETE FROM products WHERE id = ?", [id], callback);
    });
  }
  
  // Ottieni prodotti attivi
  static getActive(callback) {
    db.all(`
      SELECT * FROM products 
      WHERE is_active = 1
      ORDER BY name ASC
    `, callback);
  }
  
  // Ottieni prodotti per tipo di servizio
  static getByServiceType(serviceType, callback) {
    db.all(`
      SELECT * FROM products 
      WHERE service_type = ? AND is_active = 1
      ORDER BY name ASC
    `, [serviceType], callback);
  }
  
  // Aggiungi allegato a un prodotto
  static addAttachment(productId, attachmentData, callback) {
    const sql = `
      INSERT INTO product_attachments (
        product_id, original_filename, stored_filename, file_path,
        file_size, mime_type, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      productId,
      attachmentData.original_filename,
      attachmentData.stored_filename,
      attachmentData.file_path,
      attachmentData.file_size || null,
      attachmentData.mime_type || 'application/pdf',
      attachmentData.uploaded_by
    ], function(err) {
      callback(err, this.lastID);
    });
  }
  
  // Ottieni tutti gli allegati
  static getAllAttachments(callback) {
    db.all(`
      SELECT pa.*, p.name as product_name, u.name as uploaded_by_name
      FROM product_attachments pa
      JOIN products p ON pa.product_id = p.id
      LEFT JOIN users u ON pa.uploaded_by = u.id
      ORDER BY pa.upload_date DESC
    `, callback);
  }
  
  // Rimuovi allegato
  static removeAttachment(attachmentId, callback) {
    db.run("DELETE FROM product_attachments WHERE id = ?", [attachmentId], callback);
  }
  
  // Ottieni allegato per ID
  static getAttachmentById(attachmentId, callback) {
    db.get(`
      SELECT pa.*, p.name as product_name
      FROM product_attachments pa
      JOIN products p ON pa.product_id = p.id
      WHERE pa.id = ?
    `, [attachmentId], callback);
  }
  
  // Statistiche prodotti
  static getStats(callback) {
    const stats = {};
    
    // Conta per tipo di servizio
    db.all(`
      SELECT service_type, COUNT(*) as count
      FROM products
      WHERE is_active = 1
      GROUP BY service_type
    `, (err, typeStats) => {
      if (err) return callback(err);
      
      stats.byType = typeStats || [];
      
      // Conta totali
      db.get(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
          COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive
        FROM products
      `, (err, totals) => {
        if (err) return callback(err);
        
        stats.totals = totals || { total: 0, active: 0, inactive: 0 };
        
        // Conta allegati
        db.get(`
          SELECT COUNT(*) as total_attachments
          FROM product_attachments
        `, (err, attachments) => {
          if (err) return callback(err);
          
          stats.attachments = attachments?.total_attachments || 0;
          callback(null, stats);
        });
      });
    });
  }
}

module.exports = Product;
