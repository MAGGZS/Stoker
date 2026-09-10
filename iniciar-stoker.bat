@echo off
title Stoker - Sistema de Estoques

:: Configura o Node.js portatil exclusivo do Stoker
set "NODE_DIR=%USERPROFILE%\nodejs-portable\stoker"
set "PATH=%NODE_DIR%;%PATH%"

:: Isola cache e pacotes globais dentro da pasta portatil do Stoker
set "npm_config_cache=%NODE_DIR%\npm-cache"
set "npm_config_prefix=%NODE_DIR%\npm-global"

:: Pasta raiz do projeto
set "PROJETO=%~dp0"
cd /d "%PROJETO%"

:: Verifica se o Node.js portatil existe
if not exist "%NODE_DIR%\node.exe" (
    echo [ERRO] Node.js portatil do Stoker nao encontrado em:
    echo        %NODE_DIR%
    echo.
    pause
    exit /b 1
)

:: Limpa processos anteriores que possam ter ficado presos nas portas 3000 e 4000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

:: Garante arquivo .env no backend
if exist "%PROJETO%backend\.env.local" (
    if not exist "%PROJETO%backend\.env" (
        copy /y "%PROJETO%backend\.env.local" "%PROJETO%backend\.env" >nul
    )
)

:: Roda tudo diretamente nesta UNICA janela
node dev.js
