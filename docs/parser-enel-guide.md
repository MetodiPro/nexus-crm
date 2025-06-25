# 📋 Parser Bollette ENEL - Documentazione

## Panoramica

Il sistema Nexus CRM include un parser automatico specializzato per l'estrazione di dati da bollette ENEL Energia. Questo strumento permette di importare automaticamente clienti e relative utenze semplicemente caricando una bolletta PDF.

## Funzionalità

### ✅ Dati Cliente Estratti
- **Nome e Cognome** separati automaticamente
- **Codice Fiscale** con validazione formato
- **Partita IVA** per clienti business
- **Indirizzo di fornitura** completo
- **Città, CAP e Provincia**
- **Numero Cliente ENEL**

### ⚡ Dati Utenza Estratti
- **Codice POD** (Punto di Prelievo energia elettrica)
- **Codice PDR** (Punto di Riconsegna gas)
- **Consumi annuali** stimati (kWh/Smc)
- **Potenza impegnata** (kW)
- **Tipologia uso** (domestico/business)

## Come Utilizzare

### 1. Accesso alla Funzione
- Dal menu laterale: **"Importa da Bolletta ENEL"**
- Dalla pagina Clienti: pulsante **"Importa da Bolletta ENEL"**

### 2. Caricamento File
1. Trascinare il file PDF nella zona di drop
2. Oppure cliccare **"Seleziona Bolletta ENEL"**
3. Selezionare il file PDF della bolletta ENEL
4. Attendere l'elaborazione (5-15 secondi)

### 3. Verifica Dati
- Controllo **punteggio di confidenza** (dovrebbe essere >70%)
- Verifica che il **fornitore sia identificato come ENEL**
- Revisione dei **campi estratti**

### 4. Creazione Cliente
- Cliccare **"Crea Cliente con Dati Estratti"**
- Verificare e completare i dati nel form
- Salvare per creare cliente e utenze

## Limitazioni e Note

### ⚠️ Funziona Solo con ENEL
Questo parser è ottimizzato specificatamente per bollette **ENEL Energia**. Per altri gestori:
- Inserire i dati manualmente
- Il parser generico potrebbe estrarre solo alcuni campi

### 📄 Formati Supportati
- **Solo file PDF**
- Dimensione massima: **10MB**
- Bollette in **italiano**
- Testo deve essere **selezionabile** (non scansione immagine)

### 🎯 Precisione
- **Confidenza >80%**: dati molto affidabili
- **Confidenza 50-80%**: verificare i dati estratti
- **Confidenza <50%**: controllo manuale necessario

## Pattern Riconosciuti

### Intestazione Cliente
```
Gentile [NOME COGNOME]
Cliente: [NOME COGNOME]
Intestatario: [NOME COGNOME]
```

### Codici Identificativi
```
Codice Fiscale: RSSMRA80A01H501X
POD: IT001E12345678
PDR: 12345678901234
```

### Indirizzo
```
Fornitura di energia elettrica presso:
Via Roma 123
20100 Milano (MI)
```

## Risoluzione Problemi

### ❌ Nessun Dato Estratto
- Verificare che sia una bolletta ENEL
- Controllare che il PDF contenga testo selezionabile
- Provare con bolletta più recente

### ⚠️ Dati Parziali
- Bolletta potrebbe essere di formato diverso
- Completare manualmente i campi mancanti
- Segnalare il problema per migliorare il parser

### 🔧 Errori di Upload
- Verificare connessione internet
- Controllare dimensione file (<10MB)
- Assicurarsi che sia un file PDF valido

## Sviluppo Futuro

### 🚀 Parser Aggiuntivi Pianificati
- **ENI Gas e Luce**
- **Edison Energia**
- **A2A Energia**
- **Sorgenia**

### 🔄 Miglioramenti in Corso
- Supporto bollette dual fuel (luce+gas)
- Estrazione dati fatturazione
- OCR per bollette scansionate

## API Tecnica

### Endpoint Principal
```
POST /api/test/test
Content-Type: multipart/form-data
```

### Risposta JSON
```json
{
  "success": true,
  "message": "PDF elaborato con successo! (Parser: ENEL_SPECIFIC)",
  "provider": "ENEL",
  "confidence": 85,
  "parserType": "ENEL_SPECIFIC",
  "data": {
    "firstName": "Mario",
    "lastName": "Rossi",
    "fiscalCode": "RSSMRA80A01H501X",
    "address": "Via Roma 123",
    "city": "Milano",
    "province": "MI",
    "postalCode": "20100",
    "pod": "IT001E12345678",
    "electricConsumption": 3500,
    "supplier": "ENEL ENERGIA"
  }
}
```

## File di Sistema

### Parser Principale
- `services/simpleBillParser.js` - Router principale
- `services/enelBillParser.js` - Parser specifico ENEL

### Route
- `routes/testUpload.js` - Gestione upload e processing
- `routes/billImportSimple.js` - Route interfaccia utente

### Viste
- `views/clients/import-bill.ejs` - Pagina upload
- `views/clients/form-with-import.ejs` - Form precompilato

---

**Versione:** 1.0  
**Ultimo aggiornamento:** Giugno 2025  
**Supporto:** Sistema interno Nexus CRM