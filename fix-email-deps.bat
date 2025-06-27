@echo off
echo ====================================
echo   NEXUS CRM - Fix Dipendenze Email  
echo ====================================
echo.

cd /d "C:\progetti\nexus-crm"

echo 📂 Directory: %CD%
echo.

echo 📦 Installazione dotenv...
npm install dotenv

echo.
echo ✅ Dipendenza installata!
echo.

echo 🧪 Test risoluzione email...
echo.

node risolvi-email.js

echo.
echo ====================================
echo           COMPLETATO
echo ====================================
echo.

pause
