/**
 * 📄 NEXUS CRM - Route Import Bollette
 * 
 * Gestisce l'upload e l'elaborazione automatica delle bollette PDF
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const billOCRService = require('../services/billOCRService');
const { loggers } = require('../config/logger');

// Configurazione multer per upload PDF
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/bills');
    
    // Crea directory se non esiste
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Nome file univoco con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bill-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo file PDF sono supportati'), false);
    }
  }
});

// Middleware per verificare l'autenticazione
const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// GET /clients/import-bill - Pagina di upload bolletta
router.get('/clients/import-bill', authMiddleware, (req, res) => {
  res.render('clients/import-bill', {
    title: 'Importa Cliente da Bolletta',
    user: req.session.user
  });
});

// POST /clients/import-bill - Upload e elaborazione bolletta
router.post('/clients/import-bill', authMiddleware, upload.single('billFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
    }

    loggers.info('Avvio elaborazione bolletta', {
      filename: req.file.originalname,
      size: req.file.size,
      userId: req.session.user.id
    });

    // Leggi il file PDF
    const pdfBuffer = fs.readFileSync(req.file.path);

    // Estrai i dati usando il servizio OCR
    const extractionResult = await billOCRService.extractBillData(pdfBuffer, req.file.originalname);

    // Pulisci il file temporaneo
    fs.unlinkSync(req.file.path);

    if (!extractionResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'elaborazione della bolletta: ' + extractionResult.error
      });
    }

    // Log del successo
    loggers.info('Elaborazione bolletta completata', {
      provider: extractionResult.provider,
      confidence: extractionResult.confidence,
      fieldsFound: Object.keys(extractionResult.data).length,
      userId: req.session.user.id
    });

    // Restituisci i dati estratti
    res.json({
      success: true,
      message: `Bolletta elaborata con successo (Confidenza: ${extractionResult.confidence}%)`,
      provider: extractionResult.provider,
      confidence: extractionResult.confidence,
      data: extractionResult.data,
      rawTextPreview: extractionResult.rawText
    });

  } catch (error) {
    loggers.error('Errore nell\'upload/elaborazione bolletta', error, {
      userId: req.session.user.id,
      filename: req.file?.originalname
    });

    // Pulisci il file in caso di errore
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante l\'elaborazione'
    });
  }
});

// GET /clients/new-from-bill - Form precompilato da bolletta
router.get('/clients/new-from-bill', authMiddleware, (req, res) => {
  res.render('clients/form-with-import', {
    title: 'Nuovo Cliente da Bolletta',
    client: {},
    action: '/clients/new',
    isImport: true,
    user: req.session.user
  });
});

// POST /api/bills/parse-text - API per parsing diretto di testo (per testing)
router.post('/api/bills/parse-text', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Testo troppo breve per l\'analisi'
      });
    }

    // Simula l'estrazione usando solo il testo fornito
    const mockData = await billOCRService.parseProviderSpecificData(text, 'unknown');
    const validatedData = billOCRService.validateAndCleanData(mockData);
    const confidence = billOCRService.calculateConfidence(validatedData);

    res.json({
      success: true,
      confidence,
      data: validatedData,
      provider: billOCRService.identifyProvider(text)
    });

  } catch (error) {
    loggers.error('Errore nel parsing testo bolletta', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'analisi del testo'
    });
  }
});

module.exports = router;
