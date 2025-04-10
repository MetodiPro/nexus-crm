const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Configurazione middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configurazione del motore di template EJS con layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Configurazione della sessione
app.use(session({
  secret: 'nexus-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1 ora
}));

// Middleware per verificare l'autenticazione
const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Middleware per verificare il ruolo admin
const adminMiddleware = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'administrator') {
    return res.status(403).render('error', { 
      message: 'Accesso negato. Richiesti privilegi di amministratore.'
    });
  }
  next();
};

// Inizializza il database
require('./config/database');

// Imposta le variabili globali per le viste
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Rotte di autenticazione
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Rotte per gli utenti (solo admin)
const userRoutes = require('./routes/users');
app.use('/users', authMiddleware, adminMiddleware, userRoutes);

// Rotte per i clienti
const clientRoutes = require('./routes/clients');
app.use('/clients', authMiddleware, clientRoutes);

// Rotte per le attività
const activityRoutes = require('./routes/activities');
app.use('/activities', authMiddleware, activityRoutes);

// Rotte per i contratti
const contractRoutes = require('./routes/contracts');
app.use('/contracts', authMiddleware, contractRoutes);

// Rotta homepage
app.get('/', authMiddleware, (req, res) => {
  res.render('dashboard');
});

// Gestione degli errori 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Pagina non trovata' });
});

// Avvio del server
app.listen(port, () => {
  console.log(`NEXUS CRM avviato su http://localhost:${port}`);
});