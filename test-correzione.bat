@echo off
echo ====================================
echo   NEXUS CRM - Test Correzione Email
echo ====================================
echo.

cd /d "C:\progetti\nexus-crm"

echo 📂 Directory: %CD%
echo.

echo 🔧 Errore corretto: nodemailer.createTransporter -> createTransport
echo.

echo 🧪 Test risoluzione email corretta...
echo.

node risolvi-email.js

echo.
echo ====================================
echo           COMPLETATO
echo ====================================
echo.

pause
