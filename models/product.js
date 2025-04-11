const db = require('../config/database');

class Product {
  // Ottieni tutti i prodotti
  static getAll(callback) {
    db.all(`
      SELECT * FROM products 
      ORDER BY name ASC
    `, callback);
  }
  
  // Ottieni prodotto per ID
  static getById(id, callback) {
    db.get(`
      SELECT * FROM products 
      WHERE id = ?
    `, [id], callback);
  }
  
  // Crea un nuovo prodotto
  static create(productData, callback) {
    db.run(
      `INSERT INTO products (
        name, description, energy_type, supplier, 
        base_price, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.name, 
        productData.description, 
        productData.energy_type, 
        productData.supplier, 
        productData.base_price, 
        productData.is_active ? 1 : 0, 
        productData.created_by
      ],
      function(err) {
        callback(err, this.lastID);
      }
    );
  }
  
  // Aggiorna un prodotto
  static update(id, productData, callback) {
    db.run(
      `UPDATE products SET 
        name = ?, 
        description = ?, 
        energy_type = ?, 
        supplier = ?, 
        base_price = ?, 
        is_active = ? 
       WHERE id = ?`,
      [
        productData.name, 
        productData.description, 
        productData.energy_type, 
        productData.supplier, 
        productData.base_price, 
        productData.is_active ? 1 : 0, 
        id
      ],
      callback
    );
  }
  
  // Elimina un prodotto
  static delete(id, callback) {
    db.run("DELETE FROM products WHERE id = ?", [id], callback);
  }
  
  // Ottieni prodotti attivi
  static getActive(callback) {
    db.all(`
      SELECT * FROM products 
      WHERE is_active = 1
      ORDER BY name ASC
    `, callback);
  }
  
  // Ottieni prodotti per tipo di energia
  static getByEnergyType(energyType, callback) {
    db.all(`
      SELECT * FROM products 
      WHERE energy_type = ? AND is_active = 1
      ORDER BY name ASC
    `, [energyType], callback);
  }
}

module.exports = Product;