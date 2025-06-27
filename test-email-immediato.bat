@echo off
echo ============================================
echo    NEXUS CRM - Test Immediato Email
echo ============================================
echo.

echo 🧪 Test rapido del sistema email...
echo.

cd /d "C:\progetti\nexus-crm"

echo 📂 Directory: %CD%
echo ⏰ Inizio: %date% %time%
echo.

echo 🚀 Esecuzione test...
echo.

node test-email-immediato.js

echo.
echo ============================================
echo               COMPLETATO
echo ============================================
echo.

if %ERRORLEVEL% EQU 0 (
    echo ✅ Test completato con SUCCESSO!
    echo    Il sistema email funziona correttamente
    echo.
    echo 🎯 Prossimi passi:
    echo    1. Riavvia l'applicazione
    echo    2. Testa dalla dashboard /notifications
) else (
    echo ❌ Test FALLITO!
    echo    Il sistema email richiede configurazione
    echo.
    echo 🔧 Azioni consigliate:
    echo    1. Esegui: risolvi-email.bat
    echo    2. Oppure: configura-gmail.bat
)

echo.
pause
