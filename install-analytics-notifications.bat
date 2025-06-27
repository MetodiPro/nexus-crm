@echo off
echo.
echo 🚀 NEXUS CRM - Installazione Dipendenze
echo ========================================
echo.
echo 🔄 Installazione nodemailer e node-cron...
npm install nodemailer@6.9.8 node-cron@3.0.3

echo.
echo 🔄 Esecuzione migrazione database...
node scripts/add-notification-fields.js

echo.
echo 🔄 Compilazione CSS...
npm run build:css

echo.
echo ✅ Installazione completata!
echo.
echo 🚀 Avvia l'applicazione con: npm start
echo 📊 Dashboard: http://localhost:3000/dashboard
echo 🔔 Notifiche: http://localhost:3000/notifications
echo.
echo 💡 Ricorda di configurare SMTP nel file .env
echo.
pause