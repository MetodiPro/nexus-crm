/**
 * 🧪 Route di Test per Upload - Con gestione file
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configurazione multer per il test
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('📄 File ricevuto:', file.originalname, file.mimetype);
    cb(null, file.mimetype === 'application/pdf');
  }
});

// Test route semplice senza middleware
router.get('/test', (req, res) => {
  res.json({ message: 'Test route funziona!', timestamp: new Date() });
});

// Test POST con gestione file e parsing reale
router.post('/test', upload.single('billFile'), async (req, res) => {
  console.log('🧪 Test POST ricevuto');
  console.log('Session:', req.session ? 'Presente' : 'Assente');
  console.log('User:', req.session?.user ? req.session.user.username : 'Non loggato');
  console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'Nessun file');
  
  if (!req.file) {
    return res.json({
      success: false,
      message: 'Nessun file ricevuto',
      debug: 'File mancante'
    });
  }
  
  try {
    // Tenta di estrarre testo dal PDF
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(req.file.buffer);
    
    console.log('📄 Testo estratto dal PDF:', pdfData.text.substring(0, 200) + '...');
    
    // Usa il parser per estrarre i dati (ora con supporto ENEL specifico)
    const SimpleBillParser = require('../services/simpleBillParser');
    const EnelBillParser = require('../services/enelBillParser');
    
    const extractedData = SimpleBillParser.parseFromText(pdfData.text);
    
    // Calcola confidenza usando il parser appropriato
    let confidence;
    const isEnelBill = EnelBillParser.isEnelBill(pdfData.text);
    if (isEnelBill) {
      confidence = EnelBillParser.calculateConfidence(extractedData);
    } else {
      confidence = SimpleBillParser.calculateConfidence(extractedData);
    }
    
    console.log('✅ Dati estratti dal PDF:', extractedData);
    
    // Se non trova nulla, usa dati mock come fallback
    if (Object.keys(extractedData).length === 0) {
      console.log('⚠️ Nessun dato estratto, uso mock come fallback');
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
      
      return res.json({ 
        success: true, 
        message: 'PDF elaborato - Dati mock (parsing non riuscito)',
        provider: 'MOCK',
        confidence: 50,
        data: mockData,
        debug: {
          filename: req.file.originalname,
          size: req.file.size,
          extractedFields: 0,
          pdfTextPreview: pdfData.text.substring(0, 100)
        }
      });
    }
    
    // Determina il tipo di parser utilizzato
    const parserUsed = isEnelBill ? 'ENEL_SPECIFIC' : 'GENERIC';
    
    res.json({ 
      success: true, 
      message: `PDF elaborato con successo! (Parser: ${parserUsed})`,
      provider: extractedData.provider || 'SCONOSCIUTO',
      confidence: confidence,
      data: extractedData,
      parserType: parserUsed,
      debug: {
        filename: req.file.originalname,
        size: req.file.size,
        extractedFields: Object.keys(extractedData).length,
        pdfTextPreview: pdfData.text.substring(0, 100),
        enelDetected: isEnelBill
      }
    });
    
  } catch (error) {
    console.error('❌ Errore nel parsing PDF:', error);
    
    // Fallback ai dati mock in caso di errore
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
      message: 'Errore nel parsing - Dati mock di fallback',
      provider: 'ERROR_MOCK',
      confidence: 25,
      data: mockData,
      debug: {
        filename: req.file.originalname,
        size: req.file.size,
        error: error.message
      }
    });
  }
});

module.exports = router;