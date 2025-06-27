@echo off
echo ====================================
echo    NEXUS CRM - Risoluzione Email
echo ====================================
echo.

echo 🔧 Risoluzione automatica problemi email...
echo.

cd /d "C:\progetti\nexus-crm"

echo 📂 Directory corrente: %CD%
echo 📋 Verifico file necessari...

if not exist "services\emailService.js" (
    echo ❌ File emailService.js non trovato!
    echo    Assicurati di essere nella directory corretta del progetto
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ File package.json non trovato!
    echo    Assicurati di essere nella directory corretta del progetto
    pause
    exit /b 1
)

echo ✅ File trovati
echo.

echo 🚀 Esecuzione script di risoluzione...
echo.

node risolvi-email.js

echo.
echo ====================================
echo           COMPLETATO
echo ====================================
echo.

echo 💡 Se il problema persiste:
echo    1. Verifica credenziali nel pannello OVH
echo    2. Controlla firewall/antivirus
echo    3. Prova configurazione Gmail alternativa
echo.

pause
