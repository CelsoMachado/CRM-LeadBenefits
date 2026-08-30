@echo off
cd /d C:\LeadBenefits

set PORT=3020
start "LeadBenefits Importacao" /min "C:\Program Files\nodejs\node.exe" ".\crm_importacao_empresas\backend\server.js"

timeout /t 3 /nobreak >nul

start "" "http://localhost:3020"

exit
