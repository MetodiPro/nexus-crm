@echo off
echo ====================================
echo   NEXUS CRM - Configurazione Gmail
echo ====================================
echo.

echo 📧 Configurazione Gmail per NEXUS CRM...
echo.

cd /d "C:\progetti\nexus-crm"

echo 📂 Directory corrente: %CD%
echo.

echo 💡 PASSAGGI PER CONFIGURARE GMAIL:
echo ===================================
echo 1. Genera App Password su Gmail
echo 2. Configura NEXUS CRM
echo 3. Testa l'invio email
echo.

echo 🔗 Link App Password Gmail:
echo https://myaccount.google.com/apppasswords
echo.

echo 🚀 Avvio configurazione...
echo.

node configura-gmail.js --interactive

echo.
echo ====================================
echo           COMPLETATO
echo ====================================
echo.

echo 🎯 PROSSIMI PASSI:
echo   1. Riavvia l'applicazione
echo   2. Testa email da /notifications
echo   3. Configura email utenti in /users
echo.

pause
