const { body, validationResult, query, param } = require('express-validator');
const { loggers } = require('../config/logger');

// Middleware per gestire gli errori di validazione
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    loggers.warn('Errori di validazione', {
      url: req.originalUrl,
      method: req.method,
      userId: req.session?.user?.id,
      errors: errorMessages,
      ip: req.ip
    });

    // Se è una richiesta AJAX/API, ritorna JSON
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({
        success: false,
        errors: errorMessages
      });
    }

    // Altrimenti, ritorna alla pagina con errori
    return res.status(400).render('error', {
      message: 'Dati non validi',
      errors: errorMessages
    });
  }
  next();
};

// Validazione per i clienti
const validateClient = [
  body('name')
    .notEmpty()
    .withMessage('Il nome è obbligatorio')
    .isLength({ min: 2, max: 50 })
    .withMessage('Il nome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'.-]+$/)
    .withMessage('Il nome può contenere solo lettere, spazi, apostrofi e trattini'),
  
  body('surname')
    .notEmpty()
    .withMessage('Il cognome è obbligatorio')
    .isLength({ min: 2, max: 50 })
    .withMessage('Il cognome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'.-]+$/)
    .withMessage('Il cognome può contenere solo lettere, spazi, apostrofi e trattini'),
  
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/)
    .withMessage('Numero di telefono non valido'),
  
  body('vat_number')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{11}$|^[0-9]{16}$/)
    .withMessage('Partita IVA deve essere di 11 o 16 cifre'),
  
  body('postal_code')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{5}$/)
    .withMessage('CAP deve essere di 5 cifre'),
  
  body('company')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Il nome dell\'azienda non può superare 100 caratteri'),
  
  handleValidationErrors
];

// Validazione per i contratti
const validateContract = [
  body('client_id')
    .notEmpty()
    .withMessage('Il cliente è obbligatorio')
    .isInt({ min: 1 })
    .withMessage('ID cliente non valido'),
  
  body('contract_type')
    .notEmpty()
    .withMessage('Il tipo di contratto è obbligatorio')
    .isIn(['standard', 'premium', 'enterprise', 'basic', 'pro'])
    .withMessage('Tipo di contratto non valido'),
  
  body('energy_type')
    .notEmpty()
    .withMessage('Il tipo di energia è obbligatorio')
    .isIn(['electricity', 'gas', 'dual'])
    .withMessage('Tipo di energia non valido'),
  
  body('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'expired', 'cancelled'])
    .withMessage('Stato contratto non valido'),
  
  body('value')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Il valore deve essere un numero positivo inferiore a 1.000.000'),
  
  body('start_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Data di inizio non valida')
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('La data di inizio non può essere nel passato');
      }
      return true;
    }),
  
  body('end_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Data di fine non valida')
    .custom((value, { req }) => {
      if (value && req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('La data di fine deve essere successiva alla data di inizio');
      }
      return true;
    }),
  
  body('supplier')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Il nome del fornitore non può superare 100 caratteri'),
  
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Le note non possono superare 500 caratteri'),
  
  handleValidationErrors
];

// Validazione per le attività
const validateActivity = [
  body('client_id')
    .notEmpty()
    .withMessage('Il cliente è obbligatorio')
    .isInt({ min: 1 })
    .withMessage('ID cliente non valido'),
  
  body('title')
    .notEmpty()
    .withMessage('Il titolo è obbligatorio')
    .isLength({ min: 3, max: 100 })
    .withMessage('Il titolo deve essere tra 3 e 100 caratteri')
    .trim(),
  
  body('activity_date')
    .notEmpty()
    .withMessage('La data è obbligatoria')
    .isISO8601()
    .withMessage('Data non valida'),
  
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled', 'in_progress'])
    .withMessage('Stato attività non valido'),
  
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('La descrizione non può superare 1000 caratteri'),
  
  handleValidationErrors
];

// Validazione per i prodotti
const validateProduct = [
  body('name')
    .notEmpty()
    .withMessage('Il nome del prodotto è obbligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('Il nome deve essere tra 2 e 100 caratteri')
    .trim(),
  
  body('energy_type')
    .notEmpty()
    .withMessage('Il tipo di energia è obbligatorio')
    .isIn(['electricity', 'gas', 'dual'])
    .withMessage('Tipo di energia non valido'),
  
  body('base_price')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 9999.99 })
    .withMessage('Il prezzo base deve essere un numero positivo inferiore a 10.000'),
  
  body('supplier')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Il nome del fornitore non può superare 100 caratteri'),
  
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('La descrizione non può superare 500 caratteri'),
  
  handleValidationErrors
];

// Validazione per gli utenti
const validateUser = [
  body('username')
    .notEmpty()
    .withMessage('Lo username è obbligatorio')
    .isLength({ min: 3, max: 30 })
    .withMessage('Lo username deve essere tra 3 e 30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Lo username può contenere solo lettere, numeri e underscore')
    .trim()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('La password è obbligatoria')
    .isLength({ min: 8, max: 128 })
    .withMessage('La password deve essere tra 8 e 128 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La password deve contenere almeno una lettera minuscola, una maiuscola e un numero'),
  
  body('confirm_password')
    .notEmpty()
    .withMessage('La conferma password è obbligatoria')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Le password non coincidono');
      }
      return true;
    }),
  
  body('name')
    .notEmpty()
    .withMessage('Il nome è obbligatorio')
    .isLength({ min: 2, max: 50 })
    .withMessage('Il nome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'.-]+$/)
    .withMessage('Il nome può contenere solo lettere, spazi, apostrofi e trattini')
    .trim(),
  
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  
  body('role')
    .notEmpty()
    .withMessage('Il ruolo è obbligatorio')
    .isIn(['administrator', 'consultant'])
    .withMessage('Ruolo non valido'),
  
  handleValidationErrors
];

// Validazione per l'aggiornamento utente (senza password obbligatoria)
const validateUserUpdate = [
  body('username')
    .notEmpty()
    .withMessage('Lo username è obbligatorio')
    .isLength({ min: 3, max: 30 })
    .withMessage('Lo username deve essere tra 3 e 30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Lo username può contenere solo lettere, numeri e underscore')
    .trim()
    .toLowerCase(),
  
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 8, max: 128 })
    .withMessage('La password deve essere tra 8 e 128 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La password deve contenere almeno una lettera minuscola, una maiuscola e un numero'),
  
  body('confirm_password')
    .if(body('password').exists({ checkFalsy: true }))
    .notEmpty()
    .withMessage('La conferma password è obbligatoria quando si cambia la password')
    .custom((value, { req }) => {
      if (req.body.password && value !== req.body.password) {
        throw new Error('Le password non coincidono');
      }
      return true;
    }),
  
  body('name')
    .notEmpty()
    .withMessage('Il nome è obbligatorio')
    .isLength({ min: 2, max: 50 })
    .withMessage('Il nome deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'.-]+$/)
    .withMessage('Il nome può contenere solo lettere, spazi, apostrofi e trattini')
    .trim(),
  
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  
  body('role')
    .notEmpty()
    .withMessage('Il ruolo è obbligatorio')
    .isIn(['administrator', 'consultant'])
    .withMessage('Ruolo non valido'),
  
  handleValidationErrors
];

// Validazione per il login
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Lo username è obbligatorio')
    .trim()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('La password è obbligatoria'),
  
  handleValidationErrors
];

// Validazione per la ricerca
const validateSearch = [
  query('term')
    .notEmpty()
    .withMessage('Il termine di ricerca è obbligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('Il termine di ricerca deve essere tra 2 e 100 caratteri')
    .trim(),
  
  handleValidationErrors
];

// Validazione per gli ID nei parametri
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID non valido'),
  
  handleValidationErrors
];

module.exports = {
  validateClient,
  validateContract,
  validateActivity,
  validateProduct,
  validateUser,
  validateUserUpdate,
  validateLogin,
  validateSearch,
  validateId,
  handleValidationErrors
};