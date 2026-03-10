@echo off
echo ===========================================
echo INSTALLATION MANUELLE BALANCE AGENT SERVICE
echo ===========================================
echo.

REM Vérifier admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ EXÉCUTEZ EN ADMINISTRATEUR
    echo Clic droit → "Exécuter en tant qu'administrateur"
    pause
    exit /b 1
)

REM Chemin de l'exe
set EXE_PATH=%~dp0BalanceAgentService.exe

echo 📁 Chemin : %EXE_PATH%
echo.

echo [1/4] Création du service...
sc create BalanceAgentService binPath= "%EXE_PATH%" start= auto DisplayName= "Balance Agent Service RJ45"
if %errorLevel% neq 0 (
    echo ❌ Erreur création service
    pause
    exit /b 1
)

echo [2/4] Configuration description...
sc description BalanceAgentService "Service de lecture des balances RJ45 avec API HTTP sur port 5001"

echo [3/4] Configuration redémarrage...
sc failure BalanceAgentService reset= 86400 actions= restart/5000/restart/5000/restart/5000

echo [4/4] Démarrage...
sc start BalanceAgentService
if %errorLevel% neq 0 (
    echo ⚠️  Le service n'a pas pu démarrer
    echo Essayez manuellement : net start BalanceAgentService
)

echo.
echo 🔍 Vérification...
timeout /t 2 /nobreak >nul
sc query BalanceAgentService | find "STATE"

echo.
echo ✅ INSTALLATION TERMINÉE !
echo.
echo 🌐 Testez avec : http://localhost:5001/api/health
echo 📋 Logs : Observateur d'événements → Application
echo.
pause