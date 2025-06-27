const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/product');

// Configurazione Multer per upload PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/product-attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Genera nome file unico con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}.pdf`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo file PDF sono ammessi'), false);
    }
  }
});

// Lista prodotti
router.get('/', (req, res) => {
  Product.getAll((err, products) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    res.render('products/index', { products: products || [] });
  });
});

// Form per nuovo prodotto
router.get('/new', (req, res) => {
  res.render('products/form', { 
    product: {
      is_active: true,
      service_type: '',
      additional_cost1_unit: '€/mese',
      additional_cost2_unit: '€/mese',
      additional_cost3_unit: '€/mese'
    }, 
    action: '/products/new',
    title: 'Nuovo Prodotto/Servizio'
  });
});

// Crea nuovo prodotto
router.post('/new', upload.single('pdf_attachment'), (req, res) => {
  const productData = {
    name: req.body.name,
    service_type: req.body.service_type,
    supplier_operator: req.body.supplier_operator,
    description_notes: req.body.description_notes,
    
    // Campi energia elettrica
    electricity_fixed_rate: req.body.electricity_fixed_rate ? parseFloat(req.body.electricity_fixed_rate) : null,
    electricity_variable_spread: req.body.electricity_variable_spread ? parseFloat(req.body.electricity_variable_spread) : null,
    electricity_other_rate_notes: req.body.electricity_other_rate_notes,
    
    // Campi gas naturale
    gas_fixed_rate: req.body.gas_fixed_rate ? parseFloat(req.body.gas_fixed_rate) : null,
    gas_variable_spread: req.body.gas_variable_spread ? parseFloat(req.body.gas_variable_spread) : null,
    gas_other_rate_notes: req.body.gas_other_rate_notes,
    
    // Costi aggiuntivi
    additional_cost1_description: req.body.additional_cost1_description,
    additional_cost1_value: req.body.additional_cost1_value ? parseFloat(req.body.additional_cost1_value) : null,
    additional_cost1_unit: req.body.additional_cost1_unit,
    
    additional_cost2_description: req.body.additional_cost2_description,
    additional_cost2_value: req.body.additional_cost2_value ? parseFloat(req.body.additional_cost2_value) : null,
    additional_cost2_unit: req.body.additional_cost2_unit,
    
    additional_cost3_description: req.body.additional_cost3_description,
    additional_cost3_value: req.body.additional_cost3_value ? parseFloat(req.body.additional_cost3_value) : null,
    additional_cost3_unit: req.body.additional_cost3_unit,
    
    // File PDF
    pdf_attachment_filename: req.file ? req.file.originalname : null,
    pdf_attachment_path: req.file ? req.file.filename : null,
    pdf_upload_date: req.file ? new Date().toISOString() : null,
    
    is_active: req.body.is_active === 'on',
    created_by: req.session.user.id
  };
  
  Product.create(productData, (err, productId) => {
    if (err) {
      console.error('Errore creazione prodotto:', err);
      return res.status(500).render('error', { message: 'Errore nella creazione del prodotto' });
    }
    res.redirect('/products');
  });
});

// Visualizza dettagli prodotto
router.get('/view/:id', (req, res) => {
  Product.getById(req.params.id, (err, product) => {
    if (err || !product) {
      return res.status(404).render('error', { message: 'Prodotto non trovato' });
    }
    res.render('products/view', { product });
  });
});

// Form per modifica prodotto
router.get('/edit/:id', (req, res) => {
  Product.getById(req.params.id, (err, product) => {
    if (err || !product) {
      return res.status(404).render('error', { message: 'Prodotto non trovato' });
    }
    res.render('products/form', { 
      product, 
      action: `/products/edit/${product.id}`,
      title: 'Modifica Prodotto/Servizio'
    });
  });
});

// Aggiorna prodotto
router.post('/edit/:id', upload.single('pdf_attachment'), (req, res) => {
  const productId = req.params.id;
  
  // Prima ottieni i dati esistenti per preservare l'allegato se non ne viene caricato uno nuovo
  Product.getById(productId, (err, existingProduct) => {
    if (err || !existingProduct) {
      return res.status(404).render('error', { message: 'Prodotto non trovato' });
    }
    
    const productData = {
      name: req.body.name,
      service_type: req.body.service_type,
      supplier_operator: req.body.supplier_operator,
      description_notes: req.body.description_notes,
      
      // Campi energia elettrica
      electricity_fixed_rate: req.body.electricity_fixed_rate ? parseFloat(req.body.electricity_fixed_rate) : null,
      electricity_variable_spread: req.body.electricity_variable_spread ? parseFloat(req.body.electricity_variable_spread) : null,
      electricity_other_rate_notes: req.body.electricity_other_rate_notes,
      
      // Campi gas naturale
      gas_fixed_rate: req.body.gas_fixed_rate ? parseFloat(req.body.gas_fixed_rate) : null,
      gas_variable_spread: req.body.gas_variable_spread ? parseFloat(req.body.gas_variable_spread) : null,
      gas_other_rate_notes: req.body.gas_other_rate_notes,
      
      // Costi aggiuntivi
      additional_cost1_description: req.body.additional_cost1_description,
      additional_cost1_value: req.body.additional_cost1_value ? parseFloat(req.body.additional_cost1_value) : null,
      additional_cost1_unit: req.body.additional_cost1_unit,
      
      additional_cost2_description: req.body.additional_cost2_description,
      additional_cost2_value: req.body.additional_cost2_value ? parseFloat(req.body.additional_cost2_value) : null,
      additional_cost2_unit: req.body.additional_cost2_unit,
      
      additional_cost3_description: req.body.additional_cost3_description,
      additional_cost3_value: req.body.additional_cost3_value ? parseFloat(req.body.additional_cost3_value) : null,
      additional_cost3_unit: req.body.additional_cost3_unit,
      
      // File PDF - mantieni quello esistente se non ne viene caricato uno nuovo
      pdf_attachment_filename: req.file ? req.file.originalname : existingProduct.pdf_attachment_filename,
      pdf_attachment_path: req.file ? req.file.filename : existingProduct.pdf_attachment_path,
      pdf_upload_date: req.file ? new Date().toISOString() : existingProduct.pdf_upload_date,
      
      is_active: req.body.is_active === 'on'
    };
    
    // Se è stato caricato un nuovo file, elimina quello vecchio
    if (req.file && existingProduct.pdf_attachment_path) {
      const oldFilePath = path.join(__dirname, '../public/uploads/product-attachments', existingProduct.pdf_attachment_path);
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error('Errore eliminazione file precedente:', err);
      });
    }
    
    Product.update(productId, productData, (err) => {
      if (err) {
        console.error('Errore aggiornamento prodotto:', err);
        return res.status(500).render('error', { message: 'Errore nell\'aggiornamento del prodotto' });
      }
      res.redirect('/products');
    });
  });
});

// Elimina prodotto
router.get('/delete/:id', (req, res) => {
  const productId = req.params.id;
  
  // Prima ottieni il prodotto per eliminare il file PDF
  Product.getById(productId, (err, product) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    
    if (product && product.pdf_attachment_path) {
      const filePath = path.join(__dirname, '../public/uploads/product-attachments', product.pdf_attachment_path);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Errore eliminazione file:', err);
      });
    }
    
    Product.delete(productId, (err) => {
      if (err) {
        return res.status(500).render('error', { message: 'Errore nell\'eliminazione del prodotto' });
      }
      res.redirect('/products');
    });
  });
});

// Download allegato PDF
router.get('/download/:id', (req, res) => {
  Product.getById(req.params.id, (err, product) => {
    if (err || !product || !product.pdf_attachment_path) {
      return res.status(404).render('error', { message: 'File non trovato' });
    }
    
    const filePath = path.join(__dirname, '../public/uploads/product-attachments', product.pdf_attachment_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).render('error', { message: 'File non trovato sul server' });
    }
    
    res.download(filePath, product.pdf_attachment_filename || 'allegato.pdf');
  });
});

// Pagina allegati/offerte
router.get('/attachments', (req, res) => {
  Product.getAllAttachments((err, attachments) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    res.render('products/attachments', { attachments: attachments || [] });
  });
});

// API per ottenere prodotti per tipo servizio (per AJAX)
router.get('/api/service-type/:type', (req, res) => {
  Product.getByServiceType(req.params.type, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    res.json(products);
  });
});

// API per statistiche prodotti
router.get('/api/stats', (req, res) => {
  Product.getStats((err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    res.json(stats);
  });
});

module.exports = router;
