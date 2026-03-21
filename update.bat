@echo off
setlocal EnableDelayedExpansion

echo ╔══════════════════════════════════════╗
echo ║ ProjectBlackVault Update Script      ║
echo ╚══════════════════════════════════════╝
echo.

docker compose version >nul 2>&1
if %errorlevel% neq 0 (
  docker-compose version >nul 2>&1
  if %errorlevel% neq 0 (
    echo ERROR: Docker with Compose is required.
    echo        Install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
  )
  set COMPOSE=docker-compose
) else (
  set COMPOSE=docker compose
)

set ENV_ARGS=
set PORT=3000
if exist ".blackvault.env" (
  set ENV_ARGS=--env-file .blackvault.env
  echo Using config from .blackvault.env
  for /f "usebackq tokens=1,* delims==" %%A in (".blackvault.env") do (
    if /i "%%A"=="PORT" set PORT=%%B
  )
)

echo.
echo Trying to pull latest image...
%COMPOSE% !ENV_ARGS! pull
if %errorlevel% neq 0 (
  echo Pull failed or skipped. Continuing with local build.
)

echo.
echo Restarting ProjectBlackVault...
%COMPOSE% !ENV_ARGS! up -d --build --remove-orphans

echo.
echo Checking health...
for /l %%I in (1,1,45) do (
  powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $r=Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:!PORT!/api/health' -TimeoutSec 4; if($r.status -eq 'ok'){exit 0} else {exit 1}" >nul 2>&1
  if !errorlevel! equ 0 (
    echo ProjectBlackVault is running and healthy.
    echo.
    echo Update complete.
    echo.
    pause
    exit /b 0
  )
  timeout /t 2 /nobreak >nul
)

echo.
echo ProjectBlackVault is still starting.
echo.
echo To check logs run:
echo   %COMPOSE% !ENV_ARGS! logs -f
echo.
pause
