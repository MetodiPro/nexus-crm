# Test Flusso Import Bolletta → Cliente

## Flusso Aggiornato

1. **Import Bolletta** (`/clients/import-bill`)
   - Upload PDF bolletta
   - Parser estrae dati anagrafici 
   - Redirect a form precompilato

2. **Form Precompilato** (`/clients/new-from-bill`)
   - Mostra form con dati estratti evidenziati
   - Utente verifica/completa informazioni
   - Note: le utenze sono solo di riferimento

3. **Salvataggio Cliente** (`POST /clients/new`)
   - Crea cliente solo con dati anagrafici
   - Redirect a schermata cliente

4. **Schermata Cliente** (`/clients/view/:id`)
   - Mostra dati cliente
   - Pulsante "Gestisci Utenze" in alto
   - Inserimento manuale utenze

5. **Gestione Utenze** (`/clients/:id/utilities`)
   - Interfaccia per inserire POD/PDR manualmente
   - Lista utenze esistenti
   - Modifica/elimina utenze

## Modifiche Implementate

- ✅ Corretto errore `lastID` in `models/client.js`
- ✅ Aggiunta route `GET /clients/new-from-bill` 
- ✅ Aggiornato template `form-with-import.ejs`
- ✅ Rimossa creazione automatica utenze
- ✅ Verificata esistenza route utenze

## Test da Eseguire

1. Upload bolletta PDF
2. Verifica estrazione dati
3. Form precompilato corretto
4. Salvataggio cliente 
5. Accesso gestione utenze
6. Inserimento manuale POD/PDR
