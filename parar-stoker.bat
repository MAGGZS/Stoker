@echo off
title Stoker - Parando servicos...

echo Encerrando processos do Stoker...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Pronto! Portas 3000 e 4000 liberadas.
timeout /t 2 >nul

