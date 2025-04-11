const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Lista prodotti
router.get('/', (req, res) => {
  Product.getAll((err, products) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    res.render('products/index', { products });
  });
});

// Form per nuovo prodotto
router.get('/new', (req, res) => {
  res.render('products/form', { 
    product: {
      is_active: true
    }, 
    action: '/products/new' 
  });
});

// Crea nuovo prodotto
router.post('/new', (req, res) => {
  const productData = {
    name: req.body.name,
    description: req.body.description,
    energy_type: req.body.energy_type,
    supplier: req.body.supplier,
    base_price: req.body.base_price,
    is_active: req.body.is_active === 'on',
    created_by: req.session.user.id
  };
  
  Product.create(productData, (err, productId) => {
    if (err) {
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
      action: `/products/edit/${product.id}` 
    });
  });
});

// Aggiorna prodotto
router.post('/edit/:id', (req, res) => {
  const productData = {
    name: req.body.name,
    description: req.body.description,
    energy_type: req.body.energy_type,
    supplier: req.body.supplier,
    base_price: req.body.base_price,
    is_active: req.body.is_active === 'on'
  };
  
  Product.update(req.params.id, productData, (err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nell\'aggiornamento del prodotto' });
    }
    res.redirect('/products');
  });
});

// Elimina prodotto
router.get('/delete/:id', (req, res) => {
  Product.delete(req.params.id, (err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nell\'eliminazione del prodotto' });
    }
    res.redirect('/products');
  });
});

// API per ottenere prodotti per tipo energia (per AJAX)
router.get('/api/energy-type/:type', (req, res) => {
  Product.getByEnergyType(req.params.type, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    res.json(products);
  });
});

module.exports = router;