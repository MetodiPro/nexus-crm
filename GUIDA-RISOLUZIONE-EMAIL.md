# 📧 GUIDA RISOLUZIONE PROBLEMI EMAIL - NEXUS CRM

## 🚨 PROBLEMA RISCONTRATO

Dal log di errore fornito, il sistema NEXUS CRM presenta i seguenti problemi con il servizio email:

1. **Timeout connessione SMTP** - La connessione al server OVH non viene stabilita
2. **Missing credentials for "PLAIN"** - Le credenziali non vengono riconosciute
3. **Greeting never received** - Il server SMTP non risponde

## 🔧 SOLUZIONI IMPLEMENTATE

### 1. **EmailService Migliorato**
- ✅ Timeout personalizzabili per connessioni lente
- ✅ Retry automatico con configurazioni alternative
- ✅ Diagnostica completa del sistema
- ✅ Fallback automatico a configurazioni funzionanti
- ✅ Aggiornamento automatico del file .env

### 2. **Script di Risoluzione Automatica**
```bash
# Esecuzione automatica
risolvi-email.bat

# Oppure manuale
node risolvi-email.js
```

### 3. **Configurazione Gmail Alternativa**
```bash
# Configurazione assistita Gmail
configura-gmail.bat

# Oppure manuale
node configura-gmail.js --interactive
```

## 🎯 RISOLUZIONE IMMEDIATA

### **OPZIONE A: Risoluzione Automatica (Raccomandato)**

1. **Esegui script di risoluzione:**
   ```bash
   cd C:\progetti\nexus-crm
   risolvi-email.bat
   ```

2. **Lo script farà automaticamente:**
   - 🔍 Diagnostica completa del sistema
   - 🔧 Test configurazioni multiple
   - 📝 Aggiornamento file .env con configurazione funzionante
   - 📧 Test invio email per conferma

3. **Riavvia l'applicazione:**
   ```bash
   npm start
   ```

### **OPZIONE B: Configurazione Gmail (Più Affidabile)**

Se il server OVH continua a dare problemi, Gmail è più affidabile:

1. **Genera App Password Gmail:**
   - Vai su: https://myaccount.google.com/apppasswords
   - Genera password per "NEXUS CRM"
   - Copia la password (16 caratteri)

2. **Configura automaticamente:**
   ```bash
   cd C:\progetti\nexus-crm
   configura-gmail.bat
   ```

3. **Inserisci credenziali quando richiesto**

## 📋 VERIFICHE MANUALI

### **1. Controllo File .env**
```env
# Configurazione OVH (Attuale)
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=nexus@metodi.pro
SMTP_PASS=Nexus112233!!

# Configurazione Gmail (Alternativa)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tua-email@gmail.com
SMTP_PASS=app-password-16-caratteri
```

### **2. Test Connessione TCP**
```bash
# Test server OVH
telnet ssl0.ovh.net 465
telnet ssl0.ovh.net 587

# Test Gmail
telnet smtp.gmail.com 587
```

### **3. Verifica Credenziali**
- 🔑 Username: `nexus@metodi.pro`
- 🔒 Password: Verifica nel pannello OVH se è ancora valida
- 📧 Account attivo: Controlla che l'email non sia sospesa

## 🩺 DIAGNOSTICA AVANZATA

Il nuovo sistema include diagnostica automatica che verifica:

- ✅ Variabili ambiente
- ✅ Connessione TCP ai server SMTP
- ✅ Autenticazione credenziali
- ✅ Invio email di test
- ✅ Configurazioni alternative

Accedi a: `/notifications/diagnostics` (solo admin)

## 🔄 CONFIGURAZIONI TESTATE

### **Configurazione 1: OVH SSL 465**
```javascript
{
  host: 'ssl0.ovh.net',
  port: 465,
  secure: true,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000
}
```

### **Configurazione 2: OVH TLS 587**
```javascript
{
  host: 'ssl0.ovh.net',
  port: 587,
  secure: false,
  requireTLS: true,
  connectionTimeout: 30000
}
```

### **Configurazione 3: Gmail TLS 587 (Raccomandato)**
```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  connectionTimeout: 30000
}
```

## 🎯 PASSAGGI SPECIFICI PER IL TUO CASO

Basandomi sui log di errore forniti:

1. **Il problema principale è TIMEOUT della connessione**
   - Il server OVH non risponde entro i tempi previsti
   - Possibile problema di firewall/antivirus

2. **Credenziali non riconosciute**
   - Il server rifiuta le credenziali `nexus@metodi.pro`
   - Password potrebbe essere scaduta o account sospeso

### **Risoluzione Immediata:**

```bash
# 1. Vai nella directory del progetto
cd C:\progetti\nexus-crm

# 2. Esegui risoluzione automatica
risolvi-email.bat

# 3. Se OVH continua a fallire, usa Gmail
configura-gmail.bat

# 4. Riavvia applicazione
npm start

# 5. Testa da dashboard
# Vai su: http://localhost:3000/notifications
# Clicca "Test Email"
```

## 🆘 SE NULLA FUNZIONA

### **Controlli Finali:**

1. **Firewall/Antivirus:**
   - Disabilita temporaneamente
   - Aggiungi eccezione per Node.js

2. **Connessione Internet:**
   - Verifica connessione stabile
   - Prova da rete diversa

3. **Provider Email:**
   - Contatta supporto OVH
   - Verifica stato account

4. **Configurazione di Emergenza:**
   ```env
   # Usa Gmail temporaneamente
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tuo-gmail@gmail.com
   SMTP_PASS=app-password-generata
   ```

## 📞 SUPPORTO

Se il problema persiste dopo aver seguito questa guida:

1. **Esegui diagnostica completa:**
   ```bash
   node risolvi-email.js > diagnostica.txt
   ```

2. **Controlla log dettagliati:**
   ```bash
   tail -f logs/nexus-2025-06-27.log
   ```

3. **Verifica configurazione finale:**
   - File .env aggiornato
   - Credenziali corrette
   - Firewall configurato

## ✅ RISULTATO ATTESO

Dopo la risoluzione dovresti vedere:

```
✅ Email inviata con successo: <message-id>
✅ Connessione SMTP verificata con successo
✅ Sistema email operativo
```

E nella dashboard `/notifications`:
- 🟢 Status Email: Connesso
- 📧 Test Email: Funzionante
- ⚙️ Configurazione: Valida

---

**Aggiornato:** 27 Giugno 2025  
**Versione:** 2.0 - Enhanced Email Service  
**Supporto:** Sistema di risoluzione automatica integrato
