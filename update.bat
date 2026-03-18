@echo off
setlocal EnableDelayedExpansion

echo ╔══════════════════════════════════════╗
echo ║   BlackVault — Update Script         ║
echo ╚══════════════════════════════════════╝
echo.

:: ── Detect docker compose command ─────────────────────────────
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

:: ── Load config if present ─────────────────────────────────────
set ENV_ARGS=
if exist ".blackvault.env" (
  set ENV_ARGS=--env-file .blackvault.env
  echo Using config from .blackvault.env
)

:: ── Pull and restart ───────────────────────────────────────────
echo.
echo Pulling latest BlackVault image from registry...
%COMPOSE% !ENV_ARGS! pull

echo.
echo Restarting with updated image...
%COMPOSE% !ENV_ARGS! up -d

echo.
echo Update complete.
echo.
echo To check logs run:
echo   %COMPOSE% !ENV_ARGS! logs -f
echo.
pause
