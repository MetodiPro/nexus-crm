/**
 * 📄 Route Import Bollette - Versione Semplificata
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage temporaneo in memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo file PDF supportati'), false);
    }
  }
});

// Middleware auth semplice
const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// GET - Pagina upload bolletta
router.get('/clients/import-bill', authMiddleware, (req, res) => {
  res.render('clients/import-bill', {
    title: 'Importa Cliente da Bolletta'
  });
});

// POST - Upload e processing
router.post('/clients/import-bill', authMiddleware, upload.single('billFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
    }

    // Per ora simuliamo l'estrazione con dati mock
    // In futuro qui useremo pdf-parse e il parser reale
    const mockData = {
      firstName: 'Mario',
      lastName: 'Rossi',
      fiscalCode: 'RSSMRA80A01H501X',
      address: 'Via Roma 123',
      city: 'Milano',
      province: 'MI',
      postalCode: '20100',
      pod: 'IT001E12345678',
      electricConsumption: 3500,
      supplier: 'ENEL ENERGIA'
    };

    res.json({
      success: true,
      message: 'Bolletta elaborata con successo',
      provider: 'ENEL',
      confidence: 85,
      data: mockData
    });

  } catch (error) {
    console.error('Errore processing bolletta:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'elaborazione'
    });
  }
});

// GET - Form precompilato
router.get('/clients/new-from-bill', authMiddleware, (req, res) => {
  res.render('clients/form-with-import', {
    title: 'Nuovo Cliente da Bolletta',
    csrfToken: req.session.csrfToken
  });
});

module.exports = router;
