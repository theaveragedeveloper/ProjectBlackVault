@echo off
setlocal EnableDelayedExpansion

echo ╔══════════════════════════════════════╗
echo ║   BlackVault — Update Script         ║
echo ╚══════════════════════════════════════╝
echo.

:: ── Docker check ─────────────────────────────────────────────
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
  docker-compose version >nul 2>&1
  if %errorlevel% neq 0 (
    echo ERROR: Docker with Compose is required.
    pause
    exit /b 1
  )
  set COMPOSE=docker-compose
) else (
  set COMPOSE=docker compose
)

:: ── Migrate .blackvault.env → .env ───────────────────────────
if not exist ".env" if exist ".blackvault.env" (
  echo Migrating .blackvault.env to .env ^(one-time^)...
  copy /Y .blackvault.env .env >nul
  echo Done. .blackvault.env kept as backup.
  echo.
)

:: ── Read DATA_DIR from .env ───────────────────────────────────
set ACTIVE_DATA_DIR=
if exist ".env" (
  for /f "eol=# tokens=1,* delims==" %%A in (.env) do (
    if "%%A"=="DATA_DIR" set ACTIVE_DATA_DIR=%%B
  )
)

:: ── Preflight: verify database exists ────────────────────────
if not "!ACTIVE_DATA_DIR!"=="" (
  if not exist "!ACTIVE_DATA_DIR!\db\vault.db" (
    echo WARNING: No database found at expected location:
    echo   !ACTIVE_DATA_DIR!\db\vault.db
    echo.
    set LEGACY_DB=
    if exist "data\db\vault.db" set LEGACY_DB=%CD%\data\db\vault.db
    if "!LEGACY_DB!"=="" if exist "%USERPROFILE%\.blackvault\db\vault.db" (
      set LEGACY_DB=%USERPROFILE%\.blackvault\db\vault.db
    )
    if not "!LEGACY_DB!"=="" (
      echo Data found at legacy location: !LEGACY_DB!
      echo Your .env DATA_DIR may be pointing to the wrong location.
      echo.
      echo To fix: edit DATA_DIR in .env, then re-run update.bat
      echo OR:     run install.bat to reconfigure
      pause
      exit /b 1
    ) else (
      echo No existing database found. This may be a fresh install — continuing.
    )
  ) else (
    echo Database verified at: !ACTIVE_DATA_DIR!\db\vault.db
  )
)

echo.

:: ── Pull latest code ─────────────────────────────────────────
git rev-parse --git-dir >nul 2>&1
if %errorlevel% equ 0 (
  echo Pulling latest updates from GitHub...
  git pull
  echo.
)

:: ── Rebuild and restart ───────────────────────────────────────
echo Rebuilding BlackVault image...
%COMPOSE% build --pull

echo.
echo Restarting...
%COMPOSE% up -d

echo.
echo Waiting for startup...
timeout /t 5 /nobreak >nul

:: ── Summary ───────────────────────────────────────────────────
echo.
echo ╔══════════════════════════════════════╗
echo ║   Update complete.                   ║
echo ╚══════════════════════════════════════╝
echo.
if not "!ACTIVE_DATA_DIR!"=="" (
  echo   Data:   !ACTIVE_DATA_DIR!
)
echo   URL:    http://localhost:3000
echo.
echo   To check logs: %COMPOSE% logs -f
echo.
pause
