@echo off
title Stoker - Gerar Banco no Supabase

:: Node.js portatil exclusivo do Stoker
set "NODE_DIR=%USERPROFILE%\nodejs-portable\stoker"
set "PATH=%NODE_DIR%;%PATH%"

:: Isola cache e pacotes globais dentro da pasta portatil do Stoker
set "npm_config_cache=%NODE_DIR%\npm-cache"
set "npm_config_prefix=%NODE_DIR%\npm-global"

:: Pasta do projeto
set "PROJETO=%~dp0"

echo ============================================
echo    STOKER - Sincronizar Banco no Supabase
echo ============================================
echo.

:: Verifica se o Node.js portatil existe
if not exist "%NODE_DIR%\node.exe" (
    echo [ERRO] Node.js portatil do Stoker nao encontrado em:
    echo        %NODE_DIR%
    echo.
    pause
    exit /b 1
)

:: Garante sincronia do .env.local para .env
if exist "%PROJETO%backend\.env.local" (
    copy /y "%PROJETO%backend\.env.local" "%PROJETO%backend\.env" >nul
)

cd /d "%PROJETO%backend"

:: Verifica dependencias
if not exist "node_modules" (
    echo Instalando dependencias do Backend no Stoker...
    call npm install
    echo.
)

echo [1/3] Gerando Prisma Client...
call npx prisma generate
call npm run prisma:generate

echo.
echo [2/3] Aplicando tabelas no Supabase (prisma db push)...
call npx prisma db push

echo.
set /p SEED="Deseja popular o banco com dados de teste (seed)? (s/n): "
if /i "%SEED%"=="s" (
    echo.
    echo [3/3] Populando banco com dados de teste...
    call npm run seed
)

echo.
echo ============================================
echo    Concluido com sucesso!
echo ============================================
echo.
pause
