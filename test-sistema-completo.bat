@echo off
echo ====================================================
echo    NEXUS CRM - TEST COMPLETO SISTEMA AGGIORNATO
echo ====================================================
echo.

cd /d "C:\progetti\nexus-crm"

echo 🎯 SISTEMA PRODOTTI/SERVIZI AVANZATO IMPLEMENTATO!
echo.
echo 📋 MODIFICHE APPLICATE:
echo ✅ Nuova struttura database prodotti
echo ✅ Campi rinominati (Tipo Servizio, Fornitore/Operatore, Descrizione/Note)
echo ✅ Tariffe energia elettrica (€/kWh, PUN + spread)
echo ✅ Tariffe gas naturale (€/Smc, PSV + spread)
echo ✅ Dual Fuel con entrambe le tariffe
echo ✅ 3 costi aggiuntivi configurabili
echo ✅ Allegati PDF per ogni prodotto
echo ✅ Pagina centralizzata allegati offerte
echo ✅ Menu aggiornato con sottomenu
echo ✅ Link import bollette spostato in pagina clienti
echo ✅ Form contratti integrato con prodotti
echo.

echo 🔄 ESECUZIONE MIGRAZIONE DATABASE...
node scripts/migrate-products-enhanced.js

echo.
echo ✅ MIGRAZIONE COMPLETATA!
echo.

echo 🚀 AVVIO APPLICAZIONE...
echo.
echo 📊 DASHBOARDS DISPONIBILI:
echo - http://localhost:3000/dashboard (Dashboard Analytics)
echo - http://localhost:3000/products (Prodotti/Servizi)
echo - http://localhost:3000/products/attachments (Allegati Offerte)
echo - http://localhost:3000/contracts (Proposte/Contratti)
echo - http://localhost:3000/clients (Clienti con Import Bollette)
echo.

echo 🧪 GUIDA TEST RAPIDO:
echo.
echo "1. LOGIN AMMINISTRATORE:"
echo "   - Username: admin"
echo "   - Password: admin123"
echo.
echo "2. TEST PRODOTTI/SERVIZI:"
echo "   - Vai su Prodotti/Servizi"
echo "   - Clicca 'Nuovo Prodotto'"
echo "   - Seleziona 'Energia Elettrica' → Vedi sezione tariffe elettriche"
echo "   - Seleziona 'Dual Fuel' → Vedi entrambe le sezioni"
echo "   - Compila costi aggiuntivi"
echo "   - Carica file PDF"
echo "   - Salva prodotto"
echo.
echo "3. TEST ALLEGATI OFFERTE:"
echo "   - Dal menu Prodotti/Servizi → Allegati Offerte"
echo "   - Vedi lista centralizzata PDF"
echo "   - Testa filtri e ricerca"
echo "   - Scarica allegati"
echo.
echo "4. TEST INTEGRAZIONE CONTRATTI:"
echo "   - Vai su Proposte/Contratti → Nuovo"
echo "   - Seleziona cliente"
echo "   - Scegli prodotto dal dropdown"
echo "   - Verifica auto-compilazione campi"
echo "   - Vedi anteprima tariffe dinamica"
echo.
echo "5. TEST IMPORT BOLLETTE:"
echo "   - Vai su Clienti"
echo "   - Clicca 'Importa da Bolletta ENEL' (ora in pagina clienti)"
echo "   - Verifica rimozione dal menu laterale"
echo.

echo ⚙️ CONFIGURAZIONI IMPORTANTI:
echo - Directory allegati: /public/uploads/product-attachments/
echo - Max dimensione PDF: 10MB
echo - Tipi file supportati: Solo PDF
echo - Autorizzazioni: Admin gestisce prodotti, Consulenti li usano
echo.

echo 🎊 IMPLEMENTAZIONE COMPLETATA CON SUCCESSO!
echo.
echo "Ora avvio il server..."
echo.

npm start
