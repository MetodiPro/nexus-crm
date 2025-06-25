/**
 * 📄 Route Upload Bollette - Bypass CSRF
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Upload in memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  }
});

// POST - Upload senza verifica CSRF ma con auth manuale
router.post('/', upload.single('billFile'), async (req, res) => {
  try {
    // Verifica autenticazione manuale (senza CSRF)
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autenticato'
      });
    }
    console.log('📄 Upload bolletta ricevuto:', req.file ? req.file.originalname : 'Nessun file');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
    }

    // Simula elaborazione con dati mock
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

    console.log('✅ Dati estratti (mock):', mockData);

    res.json({
      success: true,
      message: 'Bolletta elaborata con successo (DEMO)',
      provider: 'ENEL',
      confidence: 85,
      data: mockData
    });

  } catch (error) {
    console.error('❌ Errore processing:', error);
    res.status(500).json({
      success: false,
      message: 'Errore elaborazione: ' + error.message
    });
  }
});

module.exports = router;
