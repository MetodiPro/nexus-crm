@echo off
echo.
echo 🧪 NEXUS CRM - Test Configurazione Email OVH
echo ===========================================
echo.
echo 🔄 Esecuzione test automatico configurazioni SMTP...
echo.

node test-email-ovh.js

echo.
echo ✅ Test completato!
echo.
echo 💡 Se il test è riuscito, l'applicazione è pronta
echo 🚀 Riavvia con: npm start
echo.
pause