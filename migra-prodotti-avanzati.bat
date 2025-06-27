@echo off
echo ======================================
echo   NEXUS CRM - Migrazione Prodotti
echo ======================================
echo.

cd /d "C:\progetti\nexus-crm"

echo 🔄 Esecuzione migrazione database prodotti...
node scripts/migrate-products-enhanced.js

echo.
echo ✅ Migrazione completata!
echo.
echo 📋 Modifiche applicate:
echo ✅ Nuova struttura prodotti/servizi
echo ✅ Campi tariffe energia elettrica e gas
echo ✅ Costi aggiuntivi configurabili
echo ✅ Supporto allegati PDF
echo ✅ Menu aggiornato nel layout
echo.
echo 🚀 Riavvia l'applicazione per testare:
echo    npm start
echo.
pause
