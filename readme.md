# NEXUS CRM - Sistema Gestionale per Consulenti Energetici

NEXUS CRM è un'applicazione web avanzata progettata per consulenti nel settore dell'energia elettrica e gas naturale. Offre una soluzione completa e sicura per la gestione di clienti, attività commerciali e contratti energetici con funzionalità enterprise-grade.

## 🌟 Caratteristiche Principali

### 🔐 Sicurezza Avanzata
- **Sistema di autenticazione a due livelli** (amministratore e consulente)
- **Gestione sessioni sicure** con timeout automatico e controlli IP
- **Protezione CSRF** con token di sicurezza
- **Rate limiting** per prevenire attacchi brute force
- **Gestione tentativi login falliti** con blocco automatico account
- **Password sicure** con validazione in tempo reale e hash bcrypt
- **Audit trail completo** di tutte le azioni utente

### 👥 Gestione Utenti Enterprise
- Profili utente personalizzabili con validazione avanzata
- Sistema di cambio password sicuro
- Monitoraggio sessioni attive in tempo reale
- Sblocco account amministrativo
- Logging completo delle attività utente

### 📊 Gestione Dati Completa
- **Gestione clienti** con informazioni dettagliate e storico delle interazioni
- **Pianificazione attività** con calendario e gestione appuntamenti
- **Gestione contratti energetici** (elettricità, gas, dual fuel)
- **Gestione prodotti** con listino prezzi e caratteristiche tecniche
- **Statistiche e reportistica** per monitorare le performance commerciali

### 🔍 Sistema di Logging Professionale
- **Logging centralizzato** con Winston e rotazione file giornaliera
- **Tre livelli di log**: generale, database e audit trail
- **Monitoraggio performance** con tracking durata richieste
- **Gestione errori avanzata** con stack trace dettagliati
- **Log strutturati** in formato JSON per analisi

### 🎨 Interfaccia Moderna
- Design responsive basato su **Tailwind CSS**
- Interfaccia utente intuitiva e professionale
- Validazione form in tempo reale
- Indicatori di sicurezza password
- Dashboard personalizzata per ruolo

## 🛠️ Tecnologie Utilizzate

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Database embedded
- **bcrypt** - Hashing password sicuro
- **Winston** - Sistema di logging professionale
- **express-validator** - Validazione input avanzata

### Frontend
- **EJS** - Template engine
- **Tailwind CSS** - Framework CSS utility-first
- **Font Awesome** - Icone professionali
- **JavaScript ES6+** - Interattività client-side

### Sicurezza
- **express-session** - Gestione sessioni sicure
- **CSRF Protection** - Token anti-falsificazione
- **Rate Limiting** - Protezione attacchi DDoS
- **Input Validation** - Sanitizzazione dati completa

## 📋 Requisiti di Sistema

- **Node.js** versione 14.x o superiore
- **NPM** versione 6.x o superiore
- **Spazio disco**: 100MB per l'applicazione + spazio per log e database
- **RAM**: Minimo 512MB consigliato

## 🚀 Installazione

### 1. Clona il repository
```bash
git clone https://github.com/tuoutente/nexus-crm.git
cd nexus-crm
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Compila il CSS di Tailwind
```bash
npm run build:css
```

### 4. Esegui le migrazioni database (se necessario)
```bash
# Migrazione contratti (se aggiornando da versione precedente)
node scripts/migrate-database.js

# Migrazione utenti (se aggiornando da versione precedente)
node scripts/migrate-users-table.js
```

### 5. Avvia l'applicazione
```bash
npm start
```

### 6. Accedi all'applicazione
- **URL**: http://localhost:3000
- **Credenziali predefinite**:
  - Username: `admin`
  - Password: `admin123`

⚠️ **IMPORTANTE**: Cambia la password di default al primo accesso!

## 💻 Sviluppo

### Modalità Sviluppo
Per avviare l'applicazione in modalità sviluppo con ricaricamento automatico:
```bash
npm run dev
```
Questo comando avvia:
- Server Node.js con nodemon (ricaricamento automatico)
- Compilatore Tailwind CSS in modalità watch

### Script Disponibili
```bash
npm start          # Avvia in produzione
npm run dev        # Avvia in sviluppo
npm run build:css  # Compila CSS Tailwind
npm run watch:css  # Compila CSS in modalità watch
```

## 📁 Struttura del Progetto

```
nexus-crm/
├── app.js                 # File principale dell'applicazione
├── package.json           # Dipendenze e configurazione npm
├── config/                # Configurazioni
│   ├── database.js        # Configurazione database SQLite
│   └── logger.js          # Configurazione sistema di logging
├── data/                  # Database e file dati
│   └── nexus.db          # Database SQLite
├── logs/                  # File di log (creati automaticamente)
│   ├── nexus-YYYY-MM-DD.log      # Log generale
│   ├── error-YYYY-MM-DD.log      # Log errori
│   ├── database-YYYY-MM-DD.log   # Log database
│   └── audit-YYYY-MM-DD.log      # Log audit trail
├── middleware/            # Middleware personalizzati
│   ├── logging.js         # Middleware logging richieste
│   ├── security.js        # Middleware sicurezza sessioni
│   └── validation.js      # Middleware validazione input
├── models/                # Modelli dati
│   ├── user.js           # Modello utenti
│   ├── client.js         # Modello clienti
│   ├── contract.js       # Modello contratti
│   ├── activity.js       # Modello attività
│   └── product.js        # Modello prodotti
├── routes/                # Gestione rotte
│   ├── auth.js           # Autenticazione e sicurezza
│   ├── users.js          # Gestione utenti
│   ├── clients.js        # Gestione clienti
│   ├── contracts.js      # Gestione contratti
│   ├── activities.js     # Gestione attività
│   └── products.js       # Gestione prodotti
├── scripts/               # Script di utilità
│   ├── migrate-database.js      # Migrazione database contratti
│   └── migrate-users-table.js   # Migrazione tabella utenti
├── public/                # File statici
│   ├── css/              # File CSS
│   ├── js/               # JavaScript client-side
│   └── images/           # Immagini e asset
└── views/                 # Template EJS
    ├── layout.ejs        # Layout principale
    ├── auth/             # Template autenticazione
    ├── users/            # Template gestione utenti
    ├── clients/          # Template gestione clienti
    ├── contracts/        # Template gestione contratti
    ├── activities/       # Template gestione attività
    └── products/         # Template gestione prodotti
```

## 👤 Utilizzo

### Gestione Utenti (Solo Amministratori)
- **Creazione utenti** con validazione avanzata
- **Assegnazione ruoli** (amministratore/consulente)
- **Gestione profili** con informazioni dettagliate
- **Monitoraggio sessioni** attive
- **Sblocco account** bloccati per tentativi falliti

### Gestione Clienti
- **Registrazione clienti** con informazioni complete
- **Storico attività** e contratti per ogni cliente
- **Ricerca e filtri** avanzati
- **Validazione dati** (email, telefono, P.IVA)

### Gestione Attività
- **Creazione appuntamenti** con pianificazione
- **Calendario attività** giornaliere
- **Stati attività** (in attesa, completate, annullate)
- **Notifiche scadenze** (in sviluppo)

### Gestione Contratti
- **Contratti energetici** completi (elettricità, gas, dual fuel)
- **Collegamento prodotti** dal listino
- **Tracciamento stati** contratto
- **Statistiche performance** commerciali

### Gestione Prodotti (Solo Amministratori)
- **Listino prodotti** energetici
- **Caratteristiche tecniche** dettagliate
- **Prezzi e fornitori**
- **Attivazione/disattivazione** prodotti

## 🔒 Sicurezza

### Autenticazione
- **Password hash bcrypt** con salt alto
- **Sessioni sicure** con cookie httpOnly
- **Timeout automatico** sessioni (8 ore)
- **Rigenerazione session ID** ad ogni login

### Protezione Attacchi
- **Rate limiting** tentativi login (5 tentativi per IP ogni 15 minuti)
- **Blocco account** automatico dopo 5 tentativi falliti
- **Protezione CSRF** con token su tutti i form
- **Validazione input** completa e sanitizzazione

### Audit e Monitoring
- **Log completo** di tutte le azioni utente
- **Tracking sessioni** con IP e User Agent
- **Monitoraggio errori** in tempo reale
- **Backup automatico** log con rotazione

## 📊 Logging e Monitoraggio

### Tipi di Log
- **Log Generale** (`nexus-YYYY-MM-DD.log`): Tutte le attività applicazione
- **Log Errori** (`error-YYYY-MM-DD.log`): Solo errori e warning
- **Log Database** (`database-YYYY-MM-DD.log`): Query e operazioni DB
- **Log Audit** (`audit-YYYY-MM-DD.log`): Azioni utenti e sicurezza

### Rotazione File
- **Rotazione giornaliera** automatica
- **Compressione** file vecchi
- **Retention policy**: 14 giorni log generale, 30 giorni errori, 90 giorni audit
- **Dimensione massima**: 20MB per file

## 🚀 Roadmap Future Features

### In Sviluppo (Fase 3)
- 📊 **Dashboard Analytics** con grafici interattivi
- 🔔 **Sistema Notifiche** in-app e email
- 🔍 **Ricerca Avanzata** globale
- 📎 **Gestione Documenti** con upload PDF
- 🔌 **API REST** complete

### Pianificate
- 📱 **Mobile App** (PWA)
- 🤖 **AI Assistant** per suggerimenti
- 💳 **Integrazione Pagamenti** (Stripe/PayPal)
- 🌍 **Geolocalizzazione** clienti
- 📧 **Sistema Email** integrato

## 🐛 Troubleshooting

### Problemi Comuni

**Errore "SQLITE_ERROR: no such column"**
```bash
# Esegui migrazione database
node scripts/migrate-database.js
node scripts/migrate-users-table.js
```

**Errore port 3000 già in uso**
```bash
# Cambia porta in app.js o killa processo
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

**CSS non caricato**
```bash
# Ricompila CSS Tailwind
npm run build:css
```

### Reset Completo
```bash
# Ferma applicazione
# Elimina database (ATTENZIONE: perdi tutti i dati!)
rm data/nexus.db
# Elimina log
rm -rf logs/*
# Riavvia
npm start
```

## 📞 Supporto

### Contatti
- **Email**: support@nexus-crm.it
- **Documentazione**: [Wiki del progetto]
- **Issues**: [GitHub Issues]

### Contributi
1. Fork del repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📄 Licenza

Questo progetto è distribuito con licenza **ISC**.

## 🙏 Ringraziamenti

- **Express.js** team per il framework
- **Tailwind CSS** per l'UI framework
- **Winston** per il sistema di logging
- **SQLite** per il database embedded

---

**© 2025 NEXUS CRM. Tutti i diritti riservati.**

> Sistema di gestione avanzato per consulenti nel settore dell'energia elettrica e gas naturale.