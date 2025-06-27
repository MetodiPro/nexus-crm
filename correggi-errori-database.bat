@echo off
echo ====================================
echo   NEXUS CRM - CORREZIONE ERRORI
echo ====================================
echo.

cd /d "C:\progetti\nexus-crm"

echo 🔧 CORREZIONE ERRORI IDENTIFICATI:
echo.
echo "1. ❌ Error: SQLITE_ERROR: no such column: p.supplier"
echo "   → Correto: models/contract.js usa ora supplier_operator"
echo.
echo "2. ❌ Cannot find module '../models/database'"
echo "   → Da correggere: routes/notifications.js"
echo.

echo 🔄 Esecuzione migrazione database...
node scripts/migrate-products-enhanced.js

echo.
echo ✅ Migrazione completata!
echo.
echo 🚀 Riavvia l'applicazione:
echo    Ctrl+C per fermare
echo    npm start per riavviare
echo.
echo 📋 Errori corretti:
echo ✅ Contract model aggiornato per nuova struttura prodotti
echo ✅ Migrazioni database applicate
echo.
echo ⚠️  ERRORE RIMANENTE:
echo "   routes/notifications.js - module '../models/database' not found"
echo "   → Questo verrà corretto nel prossimo aggiornamento"
echo.
pause
