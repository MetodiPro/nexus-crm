NEXUS CRM - Sistema Gestionale per Consulenti Energetici

NEXUS CRM è un'applicazione web progettata per consulenti nel settore dell'energia elettrica e gas naturale. Offre una soluzione completa per la gestione di clienti, attività commerciali e contratti energetici.
Caratteristiche principali

🔐 Sistema di autenticazione a due livelli (amministratore e consulente)
👥 Gestione clienti con informazioni dettagliate e storico delle interazioni
📅 Pianificazione attività con calendario e gestione appuntamenti
📄 Gestione contratti energetici (elettricità, gas, dual fuel)
📊 Statistiche e reportistica per monitorare le performance commerciali
🎨 Interfaccia moderna con design responsive basato su Tailwind CSS

Requisiti di sistema

Node.js (versione 14.x o superiore)
NPM (versione 6.x o superiore)

Installazione

Clona il repository:
git clone https://github.com/tuoutente/nexus-crm.git
cd nexus-crm

Installa le dipendenze:
npm install

Compila il CSS di Tailwind:
npm run build:css

Avvia l'applicazione:
npm start

Accedi all'applicazione:

Apri il browser e vai a http://localhost:3000
Utilizza le credenziali predefinite:

Username: admin
Password: admin123

Sviluppo
Per avviare l'applicazione in modalità sviluppo con ricaricamento automatico:
npm run dev
Questo comando avvia sia il server Node.js (con nodemon) che il compilatore di Tailwind CSS in modalità watch.
Struttura del progetto
nexus-crm/
├── app.js              # File principale dell'applicazione
├── config/            
│   └── database.js     # Configurazione del database SQLite
├── data/               
│   └── nexus.db        # Database SQLite
├── models/             # Modelli per l'interazione con il database
├── public/             # File statici (CSS, JavaScript, immagini)
├── routes/             # Gestione delle rotte dell'applicazione
├── views/              # Template EJS per l'interfaccia utente
├── package.json        # Configurazione npm e dipendenze
└── README.md           # Documentazione
Utilizzo
Gestione utenti (solo amministratori)

Aggiunta, modifica ed eliminazione di utenti
Assegnazione di ruoli (amministratore/consulente)

Gestione clienti

Registrazione di nuovi clienti con informazioni dettagliate
Visualizzazione dello storico attività e contratti per ogni cliente
Ricerca e filtro clienti

Gestione attività

Creazione e pianificazione appuntamenti
Visualizzazione attività giornaliere tramite calendario
Monitoraggio stato attività (in attesa, completate, annullate)

Gestione contratti

Registrazione di nuovi contratti energetici
Tracciamento dello stato dei contratti
Analisi delle performance commerciali con statistiche

Tecnologie utilizzate

Backend: Node.js, Express.js
Database: SQLite
Frontend: HTML, JavaScript, Tailwind CSS
Template Engine: EJS
Autenticazione: Express-session, bcrypt

Sicurezza

Password crittografate con bcrypt
Sessioni protette con express-session
Controlli di accesso basati sui ruoli

Licenza
Questo progetto è distribuito con licenza ISC.
Contatti
Per domande o supporto, contattare: tuo@email.com

© 2025 NEXUS CRM. Tutti i diritti riservati.