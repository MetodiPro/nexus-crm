# 🚀 GUIDA TEST COMPLETO - Dashboard Analytics + Notifiche Email

## ⚡ **INSTALLAZIONE RAPIDA**

### **Opzione 1 - Script Automatico:**
```cmd
cd C:\progetti\nexus-crm
node quick-fix.js
```

### **Opzione 2 - Comandi Manuali:**
```cmd
cd C:\progetti\nexus-crm
npm install nodemailer@6.9.8 node-cron@3.0.3
node scripts/add-notification-fields.js
npm run build:css
npm start
```

---

## 🔍 **VERIFICA PRE-AVVIO**

Prima di avviare, verifica lo stato del sistema:
```cmd
node verify-system.js
```

**Output atteso:**
```
✅ Database trovato
✅ Tutte le tabelle richieste sono presenti
✅ contracts.expiry_notification_sent: ✅
✅ activities.reminder_sent: ✅
✅ users.email: ✅
✅ nodemailer: ✅
✅ node-cron: ✅
✅ Sistema pronto per Dashboard Analytics + Notifiche!
```

---

## 🎯 **TEST DASHBOARD ANALYTICS**

### **1. Avvio e Accesso**
```cmd
npm start
```
- Vai su: `http://localhost:3000`
- Login con le tue credenziali
- Verifica reindirizzamento automatico a `/dashboard`

### **2. Funzionalità da Testare**

#### **📊 KPI Cards**
- ✅ **Clienti Totali** con breakdown per stato
- ✅ **Contratti Anno** con conteggio per stato
- ✅ **Valore Anno** con fatturato totale
- ✅ **Utenze Attive** elettriche e gas

#### **📈 Grafici Interattivi**
- ✅ **Trend Contratti** (linea + valore ultimi 12 mesi)
- ✅ **Nuovi Clienti** (barre ultimi 12 mesi)
- ✅ **Hover effects** sui grafici
- ✅ **Responsive design** su mobile

#### **⚡ Performance Consulenti** (solo per ruolo consulente)
- ✅ Nuovi clienti del mese
- ✅ Contratti chiusi del mese
- ✅ Valore generato del mese
- ✅ Attività completate del mese

#### **🔔 Prossimi Impegni**
- ✅ **Attività imminenti** (7 giorni)
- ✅ **Contratti in scadenza** (30 giorni)
- ✅ Link diretti alle schede

#### **🔄 Auto-refresh**
- ✅ Aggiornamento automatico ogni 5 minuti
- ✅ Timestamp ultimo aggiornamento

---

## 📧 **TEST SISTEMA NOTIFICHE EMAIL**

### **1. Configurazione Base**
- ✅ File `.env` configurato con OVH
- ✅ Credenziali: `nexus@metodi.pro` / `Nexus112233!!`
- ✅ Server: `ssl0.ovh.net:587`

### **2. Test Amministratore**

#### **Accesso Dashboard Notifiche:**
- Vai su: `http://localhost:3000/notifications` (come admin)
- Verifica sezioni:
  - ✅ **Stato Email Service** (connesso/disconnesso)
  - ✅ **Stato Scheduler** (attivo/fermo)
  - ✅ **Controlli Manuali**

#### **Test Connessione Email:**
- Clicca **"Invia Email di Test"**
- **Risultato atteso:** Email ricevuta su `nexus@metodi.pro`
- **Contenuto:** Template HTML con brand NEXUS CRM

#### **Test Controlli Manuali:**
- Clicca **"Controlla Scadenze"**
- Clicca **"Invia Digest"** 
- Clicca **"Esegui Tutto"**
- **Risultato:** Modal con risultati operazioni

### **3. Test Utente Standard**

#### **Impostazioni Personali:**
- Vai su: `http://localhost:3000/notifications/settings`
- Abilita/disabilita:
  - ✅ **Scadenze Contratti**
  - ✅ **Reminder Attività** 
  - ✅ **Digest Settimanale**
- Salva e verifica persistenza

### **4. Test Notifiche Automatiche**

#### **Scadenze Contratti:**
```cmd
# Crea contratto con scadenza entro 30 giorni
# Vai su /notifications → "Controlla Scadenze"
# Verifica email ricevuta con dettagli contratto
```

#### **Reminder Attività:**
```cmd
# Crea attività per oggi/domani
# Vai su /notifications → "Controlla Scadenze" 
# Verifica email reminder con dettagli appuntamento
```

---

## 🤖 **TEST SCHEDULER AUTOMATICO**

### **Abilitazione Scheduler:**
```env
# Nel file .env
ENABLE_SCHEDULER=true
```

### **Restart Applicazione:**
```cmd
npm start
```

### **Verifica Log:**
- Cerca nel log: `"Scheduler notifiche avviato"`
- Verifica jobs attivi:
  - ✅ **Controlli orari** (9-18, lun-ven)
  - ✅ **Digest settimanale** (lunedì 8:00)
  - ✅ **Controllo giornaliero** (9:00)

---

## 🎨 **TEST INTERFACCIA UTENTE**

### **Menu Navigation:**
- ✅ **Dashboard** → `/dashboard`
- ✅ **Notifiche** → `/notifications/settings` (tutti)
- ✅ **Gestione Notifiche** → `/notifications` (solo admin)
- ✅ Link funzionanti e attivi

### **Responsive Design:**
- ✅ **Desktop** (1920x1080)
- ✅ **Tablet** (768x1024)
- ✅ **Mobile** (375x667)
- ✅ **Sidebar** collassabile su mobile

### **Temi e Colori:**
- ✅ **Brand NEXUS** (rosso #dc2626)
- ✅ **Consistency** colori in tutto il sito
- ✅ **Accessibility** contrasti adeguati

---

## 🔧 **TROUBLESHOOTING**

### **Dashboard non carica dati:**
```cmd
# Verifica database
node verify-system.js

# Controlla log
tail -f logs/nexus-*.log

# Verifica tabelle
node check-database.js
```

### **Email non funzionano:**
```cmd
# Test connessione
curl -v telnet://ssl0.ovh.net:587

# Verifica credenziali in .env
cat .env | grep SMTP

# Test diretto
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'ssl0.ovh.net',
  port: 587,
  auth: { user: 'nexus@metodi.pro', pass: 'Nexus112233!!' }
});
transport.verify().then(console.log).catch(console.error);
"
```

### **Scheduler non attivo:**
```bash
# Verifica variabile
echo $ENABLE_SCHEDULER

# Controlla log startup
grep "Scheduler" logs/nexus-*.log

# Force restart
pkill -f "node app.js"
npm start
```

---

## ✅ **CHECKLIST FINALE**

### **Dashboard Analytics:**
- [ ] KPI cards con dati reali
- [ ] Grafici trend funzionanti
- [ ] Performance tracking (consulenti)
- [ ] Prossimi impegni popolati
- [ ] Auto-refresh attivo
- [ ] Mobile responsive

### **Sistema Notifiche:**
- [ ] Email service connesso
- [ ] Test email ricevuta
- [ ] Notifiche scadenze funzionanti
- [ ] Reminder attività operativi
- [ ] Impostazioni utente salvate
- [ ] Scheduler attivo (opzionale)

### **Integrazione:**
- [ ] Menu aggiornato
- [ ] Navigation fluida
- [ ] Autorizzazioni corrette
- [ ] Log system funzionante
- [ ] Performance accettabili

---

## 🎉 **CONFERMA SUCCESSO**

Se tutti i test passano, il sistema è completamente operativo con:

✅ **Dashboard Analytics** completa e funzionale
✅ **Sistema Notifiche** email configurato 
✅ **Database** aggiornato con nuove tabelle
✅ **UI/UX** moderna e responsive
✅ **Scheduler** automatico (opzionale)
✅ **Logging** completo e tracciabile

**🚀 Fase 1 - Stabilizzazione COMPLETATA!**

---

## 📞 **SUPPORTO**

In caso di problemi:
1. **Verifica log:** `logs/nexus-*.log`
2. **Test sistema:** `node verify-system.js`
3. **Reset dipendenze:** `rm -rf node_modules && npm install`
4. **Reset database:** `rm data/nexus.db && node migrate-database.js`