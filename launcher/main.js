'use strict';

const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');

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
    exec('docker compose version', err => {
      _composeCmd = err ? ['docker-compose'] : ['docker', 'compose'];
      resolve(_composeCmd);
    });
  });
}

// ─── Docker state detection ────────────────────────────────────────────────

async function checkDocker() {
  return new Promise(resolve => {
    exec('docker info', (err, _stdout, stderr) => {
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
  return {
    ...process.env,
    DATA_DIR: config.dataDir,
    PORT: String(config.port),
    VAULT_ENCRYPTION_KEY: config.encryptionKey,
    SESSION_SECRET: config.sessionSecret,
  };
}

async function runCompose(args, config) {
  const cmd = await getDockerComposeCmd();
  const composePath = getComposePath();
  const fullArgs = [...cmd.slice(1), '-f', composePath, ...args];

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd[0], fullArgs, {
      env: buildEnv(config),
      stdio: 'pipe',
    });

    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `docker compose exited with code ${code}`));
    });
  });
}

async function startContainer(config) {
  await runCompose(['up', '-d'], config);
}

async function stopContainer(config) {
  await runCompose(['down'], config);
}

async function pullLatestImage(config) {
  await runCompose(['pull'], config);
  await runCompose(['up', '-d'], config);
}

// ─── Health polling ────────────────────────────────────────────────────────

let _currentStatus = 'stopped';
let _pollInterval = null;

function pollHealth(port, onStatusChange) {
  clearInterval(_pollInterval);
  _pollInterval = setInterval(() => {
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
  }, 10000);
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
    height: 520,
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

  // Notify renderer
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('status-change', status);
  }
}

// ─── Action handlers ───────────────────────────────────────────────────────

let _config = null;

async function handleStart() {
  _config = loadConfig();
  if (!_config) { showWindow(); return; }
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
    await pullLatestImage(_config);
    pollHealth(_config.port, status => updateTray(status, _config));
    dialog.showMessageBox({ type: 'info', title: 'Updated', message: 'ProjectBlackVault has been updated to the latest version.' });
  } catch (err) {
    dialog.showErrorBox('Update Failed', err.message);
    updateTray('stopped', _config);
  }
}

// ─── IPC handlers ──────────────────────────────────────────────────────────

ipcMain.handle('docker-check', async () => {
  return checkDocker();
});

ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', async (_event, cfg) => {
  // Generate secrets on first save
  if (!cfg.encryptionKey) cfg.encryptionKey = crypto.randomBytes(32).toString('hex');
  if (!cfg.sessionSecret) cfg.sessionSecret = crypto.randomBytes(32).toString('hex');
  saveConfig(cfg);
  _config = cfg;
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

// ─── App lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(async () => {
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

  // Auto-start container if configured
  _config = loadConfig();
  if (_config) {
    const docker = await checkDocker();
    if (docker.status === 'ready') {
      updateTray('starting', _config);
      try {
        await startContainer(_config);
        pollHealth(_config.port, status => updateTray(status, _config));
      } catch {
        updateTray('stopped', _config);
      }
    }
  }
});

app.on('window-all-closed', e => {
  // Keep running in tray — don't quit when all windows closed
  e.preventDefault();
});

app.on('before-quit', () => {
  // Allow real quit
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.removeAllListeners('close');
  }
});
