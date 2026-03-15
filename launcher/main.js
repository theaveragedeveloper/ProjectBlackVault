'use strict';

const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');

// ─── Single-instance lock ──────────────────────────────────────────────────

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// ─── Config ────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// ─── Docker compose path ───────────────────────────────────────────────────

function getComposePath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'docker-compose.yml')
    : path.join(__dirname, 'docker-compose.yml');
}

// ─── Docker Compose v1 / v2 detection ─────────────────────────────────────

let _composeCmd = null;

async function getDockerComposeCmd() {
  if (_composeCmd) return _composeCmd;
  return new Promise(resolve => {
    exec('docker compose version', { env: buildEnv(null) }, err => {
      _composeCmd = err ? ['docker-compose'] : ['docker', 'compose'];
      resolve(_composeCmd);
    });
  });
}

// ─── Docker state detection ────────────────────────────────────────────────

async function checkDocker() {
  return new Promise(resolve => {
    exec('docker info', { env: buildEnv(null) }, (err, _stdout, stderr) => {
      if (!err) {
        resolve({ status: 'ready' });
      } else if (stderr && (stderr.includes('Cannot connect') || stderr.includes('Is the docker daemon running'))) {
        resolve({ status: 'not-running' });
      } else {
        resolve({ status: 'not-installed' });
      }
    });
  });
}

// ─── Container management ──────────────────────────────────────────────────

function buildEnv(config) {
  // Augment PATH so Homebrew-installed Docker is found on macOS/Linux.
  const extraPaths = ['/usr/local/bin', '/opt/homebrew/bin', '/opt/local/bin'];
  const currentPath = process.env.PATH || '';
  const augmentedPath = [...extraPaths, currentPath].filter(Boolean).join(path.delimiter);

  const base = { ...process.env, PATH: augmentedPath };
  if (!config) return base;

  return {
    ...base,
    DATA_DIR: config.dataDir,
    PORT: String(config.port),
    VAULT_ENCRYPTION_KEY: config.encryptionKey,
    SESSION_SECRET: config.sessionSecret,
  };
}

async function runCompose(args, config, { onLog } = {}) {
  const cmd = await getDockerComposeCmd();
  const composePath = getComposePath();
  const fullArgs = [...cmd.slice(1), '-f', composePath, ...args];

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd[0], fullArgs, {
      env: buildEnv(config),
      stdio: 'pipe',
    });

    let stderr = '';
    proc.stderr.on('data', d => {
      const line = d.toString().trim();
      stderr += line + '\n';
      // Stream pull progress lines to the renderer
      if (onLog && line) {
        onLog(line);
      }
    });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `docker compose exited with code ${code}`));
    });
  });
}

async function startContainer(config) {
  await runCompose(['up', '-d'], config);
}

async function stopContainer(config) {
  await runCompose(['down'], config);
}

async function pullLatestImage(config, onLog) {
  await runCompose(['pull'], config, { onLog });
  await runCompose(['up', '-d'], config, { onLog });
}

// ─── Port conflict detection ───────────────────────────────────────────────

function isPortInUse(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => { server.close(); resolve(false); });
    server.listen(port, '127.0.0.1');
  });
}

// ─── Health polling ────────────────────────────────────────────────────────

let _currentStatus = 'stopped';
let _pollInterval = null;

function checkHealthOnce(port, onStatusChange) {
  const req = http.get(`http://localhost:${port}/api/health`, res => {
    const next = res.statusCode === 200 ? 'running' : 'starting';
    if (next !== _currentStatus) {
      _currentStatus = next;
      onStatusChange(next);
    }
  });
  req.on('error', () => {
    if (_currentStatus !== 'stopped') {
      _currentStatus = 'stopped';
      onStatusChange('stopped');
    }
  });
  req.setTimeout(5000, () => req.destroy());
}

function pollHealth(port, onStatusChange) {
  clearInterval(_pollInterval);
  // Fire once immediately to detect already-running container
  checkHealthOnce(port, onStatusChange);
  _pollInterval = setInterval(() => checkHealthOnce(port, onStatusChange), 10000);
}

function stopPolling() {
  clearInterval(_pollInterval);
  _pollInterval = null;
}

// ─── Window ────────────────────────────────────────────────────────────────

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 540,
    resizable: false,
    title: 'ProjectBlackVault',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    frame: true,
    skipTaskbar: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Hide instead of close
  mainWindow.on('close', e => {
    e.preventDefault();
    mainWindow.hide();
  });
}

function showWindow() {
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// ─── Tray ──────────────────────────────────────────────────────────────────

let tray = null;

function buildTrayMenu(status, config) {
  const port = config ? config.port : 3000;
  const isRunning = status === 'running';

  return Menu.buildFromTemplate([
    {
      label: 'Open ProjectBlackVault',
      click: () => shell.openExternal(`http://localhost:${port}`),
      enabled: isRunning,
    },
    { type: 'separator' },
    {
      label: 'Show Launcher',
      click: showWindow,
    },
    { type: 'separator' },
    isRunning
      ? { label: 'Stop', click: () => handleStop() }
      : { label: 'Start', click: () => handleStart() },
    {
      label: 'Check for Updates',
      click: () => handleUpdate(),
    },
    { type: 'separator' },
    {
      label: 'Launch on Startup',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: item => {
        app.setLoginItemSettings({ openAtLogin: item.checked });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        mainWindow?.destroy();
        app.quit();
      },
    },
  ]);
}

function updateTray(status, config) {
  if (!tray) return;
  const label = status === 'running' ? 'Running' : status === 'starting' ? 'Starting...' : 'Stopped';
  tray.setToolTip(`ProjectBlackVault — ${label}`);
  tray.setContextMenu(buildTrayMenu(status, config));

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('status-change', status);
  }
}

// ─── Backup reminder (one-time) ────────────────────────────────────────────

function showBackupReminder(config) {
  if (config.backupReminderShown) return;

  dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: 'Back Up Your Encryption Key',
    message: 'Your vault is encrypted with a key stored locally.',
    detail:
      `If you lose the config file at:\n${CONFIG_PATH}\n\nyour data cannot be recovered.\n\nMake a secure copy of this file now.`,
    buttons: ['Open Folder', 'I understand'],
    defaultId: 1,
    cancelId: 1,
  }).then(result => {
    if (result.response === 0) {
      shell.openPath(path.dirname(CONFIG_PATH));
    }
    config.backupReminderShown = true;
    saveConfig(config);
  });
}

// ─── Action handlers ───────────────────────────────────────────────────────

let _config = null;

function sendLog(line) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('install-log', line);
  }
}

async function handleStart() {
  _config = loadConfig();
  if (!_config) { showWindow(); return; }

  // Port conflict check
  const inUse = await isPortInUse(_config.port);
  if (inUse) {
    dialog.showErrorBox(
      'Port Already in Use',
      `Port ${_config.port} is already in use by another application.\n\nChange the port in the launcher setup and try again.`
    );
    return;
  }

  updateTray('starting', _config);
  try {
    await startContainer(_config);
    pollHealth(_config.port, status => updateTray(status, _config));
  } catch (err) {
    dialog.showErrorBox('Start Failed', err.message);
    updateTray('stopped', _config);
  }
}

async function handleStop() {
  _config = loadConfig();
  if (!_config) return;
  stopPolling();
  _currentStatus = 'stopped';
  updateTray('stopped', _config);
  try {
    await stopContainer(_config);
  } catch (err) {
    dialog.showErrorBox('Stop Failed', err.message);
  }
}

async function handleUpdate() {
  _config = loadConfig();
  if (!_config) { showWindow(); return; }
  stopPolling();
  updateTray('starting', _config);
  try {
    await pullLatestImage(_config, sendLog);
    pollHealth(_config.port, status => updateTray(status, _config));
    dialog.showMessageBox({ type: 'info', title: 'Updated', message: 'ProjectBlackVault has been updated to the latest version.' });
  } catch (err) {
    dialog.showErrorBox('Update Failed', err.message);
    updateTray('stopped', _config);
  }
}

// ─── Docker auto-install ───────────────────────────────────────────────────

/**
 * Attempt to install Docker Desktop automatically.
 * Returns { ok: true } on success or { ok: false, error: string } on failure.
 * Progress lines are streamed to the renderer via 'install-log' events.
 */
async function installDocker() {
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows: use winget (available on Windows 10 1709+ / Windows 11)
    return new Promise(resolve => {
      const proc = spawn('winget', [
        'install', '--id', 'Docker.DockerDesktop',
        '--silent',
        '--accept-package-agreements',
        '--accept-source-agreements',
      ], { stdio: 'pipe', shell: true });

      proc.stdout.on('data', d => sendLog(d.toString().trim()));
      proc.stderr.on('data', d => sendLog(d.toString().trim()));

      proc.on('close', code => {
        if (code === 0) {
          // Attempt to launch Docker Desktop after install
          const dockerExe = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';
          if (fs.existsSync(dockerExe)) {
            spawn(dockerExe, [], { detached: true, stdio: 'ignore' }).unref();
          }
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: `winget exited with code ${code}` });
        }
      });

      proc.on('error', err => resolve({ ok: false, error: err.message }));
    });
  }

  if (platform === 'darwin') {
    // macOS: use Homebrew if available
    return new Promise(resolve => {
      exec('which brew', (err, stdout) => {
        if (err || !stdout.trim()) {
          // Homebrew not available — open download page
          shell.openExternal('https://www.docker.com/products/docker-desktop/');
          resolve({ ok: false, error: 'homebrew-not-found' });
          return;
        }

        sendLog('Installing Docker Desktop via Homebrew...');
        const proc = spawn('brew', ['install', '--cask', 'docker'], {
          stdio: 'pipe',
          env: buildEnv(null),
        });

        proc.stdout.on('data', d => sendLog(d.toString().trim()));
        proc.stderr.on('data', d => sendLog(d.toString().trim()));

        proc.on('close', code => {
          if (code === 0) {
            // Launch Docker Desktop
            spawn('open', ['-a', 'Docker'], { detached: true, stdio: 'ignore' }).unref();
            resolve({ ok: true });
          } else {
            // Fall back to download page
            shell.openExternal('https://www.docker.com/products/docker-desktop/');
            resolve({ ok: false, error: `brew exited with code ${code}` });
          }
        });

        proc.on('error', err => {
          shell.openExternal('https://www.docker.com/products/docker-desktop/');
          resolve({ ok: false, error: err.message });
        });
      });
    });
  }

  // Linux / unsupported: open download page
  shell.openExternal('https://docs.docker.com/engine/install/');
  return { ok: false, error: 'unsupported-platform' };
}

// ─── IPC handlers ──────────────────────────────────────────────────────────

ipcMain.handle('docker-check', async () => {
  return checkDocker();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('install-docker', async () => {
  return installDocker();
});

ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', async (_event, cfg) => {
  if (!cfg.encryptionKey) cfg.encryptionKey = crypto.randomBytes(32).toString('hex');
  if (!cfg.sessionSecret) cfg.sessionSecret = crypto.randomBytes(32).toString('hex');
  const isFirstRun = !loadConfig();
  saveConfig(cfg);
  _config = cfg;
  if (isFirstRun) {
    // Show backup reminder after a short delay so the dashboard loads first
    setTimeout(() => showBackupReminder(_config), 3000);
  }
  return { ok: true };
});

ipcMain.handle('start', async () => {
  await handleStart();
  return { ok: true };
});

ipcMain.handle('stop', async () => {
  await handleStop();
  return { ok: true };
});

ipcMain.handle('update', async () => {
  await handleUpdate();
  return { ok: true };
});

ipcMain.handle('get-status', () => {
  return _currentStatus;
});

ipcMain.handle('open-dir-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Data Folder',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('open-path', (_event, p) => {
  shell.openPath(p);
});

// ─── App lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('io.github.theaveragedeveloper.projectblackvault');
  }

  // macOS: hide from dock (tray-only app)
  app.dock?.hide();

  // Create tray
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('ProjectBlackVault');
  tray.on('click', showWindow);
  updateTray('stopped', null);

  // Create window
  createWindow();

  // Auto-updater (only in packaged builds — requires GH releases)
  if (app.isPackaged) {
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify();
      autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
          type: 'info',
          title: 'Launcher Update Ready',
          message: 'A new version of the launcher has been downloaded.',
          detail: 'It will be installed the next time you quit ProjectBlackVault.',
          buttons: ['Restart Now', 'Later'],
          defaultId: 1,
        }).then(result => {
          if (result.response === 0) autoUpdater.quitAndInstall();
        });
      });
    } catch {
      // electron-updater not available in dev
    }
  }

  // Auto-start container if configured
  _config = loadConfig();
  if (_config) {
    const docker = await checkDocker();
    if (docker.status === 'ready') {
      updateTray('starting', _config);
      try {
        await startContainer(_config);
      } catch {
        // Container may already be running — polling will detect state
      }
      // Immediate poll + interval — detects already-running container without waiting 10s
      pollHealth(_config.port, status => updateTray(status, _config));
    }
  }
});

app.on('window-all-closed', e => {
  e.preventDefault();
});

app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.removeAllListeners('close');
  }
});
