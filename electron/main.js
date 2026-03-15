'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const net = require('net');
const http = require('http');
const { spawn } = require('child_process');

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_PORT = 3579;
const PORT_SCAN_RANGE = 20;
const HEALTH_POLL_MS = 500;
const HEALTH_TIMEOUT_MS = 60_000;

const isDev = !app.isPackaged;

// ── State ─────────────────────────────────────────────────────────────────────
let splashWin = null;
let mainWin = null;
let nextServer = null;
let selectedPort = null;

// ── Single-instance lock ──────────────────────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWin) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.focus();
  }
});

// ── Port detection ────────────────────────────────────────────────────────────
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findFreePort() {
  for (let p = BASE_PORT; p < BASE_PORT + PORT_SCAN_RANGE; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(`No free port found in range ${BASE_PORT}–${BASE_PORT + PORT_SCAN_RANGE - 1}`);
}

// ── Splash window ─────────────────────────────────────────────────────────────
function createSplash() {
  splashWin = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    center: true,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  splashWin.loadFile(path.join(__dirname, 'splash.html'), {
    query: { v: app.getVersion() },
  });
  splashWin.once('ready-to-show', () => splashWin.show());
}

// ── Main window ───────────────────────────────────────────────────────────────
function createMainWindow(port) {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Project Black Vault',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  mainWin.loadURL(`http://127.0.0.1:${port}`);

  mainWin.once('ready-to-show', () => {
    if (splashWin && !splashWin.isDestroyed()) {
      splashWin.destroy();
      splashWin = null;
    }
    mainWin.show();
    mainWin.focus();

    if (!isDev) {
      checkForUpdates();
    }
  });

  mainWin.on('closed', () => {
    mainWin = null;
  });

  // Open external links in system browser
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Next.js server ────────────────────────────────────────────────────────────
function resolveServerScript() {
  if (isDev) {
    return path.join(__dirname, '..', '.next', 'standalone', 'server.js');
  }
  return path.join(process.resourcesPath, 'app', 'server.js');
}

function spawnNextServer(port) {
  const serverScript = resolveServerScript();

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    NODE_ENV: 'production',
  };

  // In packaged builds, point Next.js at the bundled static assets
  if (!isDev) {
    env.NEXT_STATIC_DIR = path.join(process.resourcesPath, 'app', '.next', 'static');
    env.PUBLIC_DIR = path.join(process.resourcesPath, 'app', 'public');
  }

  nextServer = spawn(process.execPath, [serverScript], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  nextServer.stdout.on('data', (d) => {
    if (isDev) process.stdout.write(`[next] ${d}`);
  });

  nextServer.stderr.on('data', (d) => {
    if (isDev) process.stderr.write(`[next] ${d}`);
  });

  nextServer.on('error', (err) => {
    dialog.showErrorBox('Server Error', `Failed to start Next.js server:\n${err.message}`);
    app.quit();
  });

  nextServer.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      dialog.showErrorBox('Server Crashed', `The vault server exited with code ${code}.`);
      app.quit();
    }
  });
}

// ── Health polling ────────────────────────────────────────────────────────────
function waitForServer(port) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + HEALTH_TIMEOUT_MS;

    const check = () => {
      if (Date.now() > deadline) {
        return reject(new Error('Timed out waiting for vault server to start.'));
      }

      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(check, HEALTH_POLL_MS);
        }
        res.resume();
      });

      req.on('error', () => setTimeout(check, HEALTH_POLL_MS));
      req.setTimeout(2000, () => {
        req.destroy();
        setTimeout(check, HEALTH_POLL_MS);
      });
    };

    check();
  });
}

// ── Auto-updater ──────────────────────────────────────────────────────────────
function checkForUpdates() {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'theaveragedeveloper',
    repo: 'ProjectBlackVault',
  });

  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox(mainWin, {
        type: 'info',
        title: 'Update Available',
        message: `Version ${info.version} is available. It will be downloaded in the background.`,
        buttons: ['OK'],
      })
      .catch(() => {});
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWin, {
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart to apply the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      })
      .catch(() => {});
  });

  autoUpdater.on('error', (err) => {
    if (isDev) console.error('[updater]', err.message);
  });

  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('get-version', () => app.getVersion());

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    selectedPort = await findFreePort();
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.message);
    app.quit();
    return;
  }

  createSplash();
  spawnNextServer(selectedPort);

  try {
    await waitForServer(selectedPort);
  } catch (err) {
    dialog.showErrorBox('Startup Timeout', err.message);
    app.quit();
    return;
  }

  createMainWindow(selectedPort);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWin === null && selectedPort !== null) {
    createMainWindow(selectedPort);
  }
});

app.on('before-quit', () => {
  if (nextServer && !nextServer.killed) {
    nextServer.kill();
    nextServer = null;
  }
});
