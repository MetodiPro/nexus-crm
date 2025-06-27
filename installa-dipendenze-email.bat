@echo off
echo ====================================
echo   NEXUS CRM - Installazione Dipendenze
echo ====================================
echo.

echo 📦 Installazione dipendenze email mancanti...
echo.

cd /d "C:\progetti\nexus-crm"

echo 📂 Directory: %CD%
echo.

echo 🔧 Installazione moduli necessari...
echo.

npm install dotenv nodemailer

echo.
echo ✅ Dipendenze installate!
echo.

echo 🧪 Test immediato del sistema email...
echo.

node test-email-immediato.js

echo.
echo ====================================
echo           COMPLETATO
echo ====================================
echo.

pause
