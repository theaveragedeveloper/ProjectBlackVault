'use strict';

// ─── View management ───────────────────────────────────────────────────────

const VIEWS = ['docker-missing', 'docker-not-running', 'docker-installing', 'setup', 'dashboard', 'installing'];
const DOCKER_DESKTOP_URL = 'https://www.docker.com/products/docker-desktop/';
const DOCKER_COMPOSE_INSTALL_URL = 'https://docs.docker.com/compose/install/';

const DEFAULT_DOCKER_MISSING_COPY = {
  name: 'Docker Required',
  subtitle: 'ProjectBlackVault needs Docker Desktop to run',
  cardTitle: 'Setup Required',
  description: 'Docker Desktop is a free tool that lets ProjectBlackVault run safely on your computer.',
  downloadLabel: 'Download Manually',
  hint: 'After installing Docker Desktop, make sure it\'s running (look for the Docker whale icon in your taskbar/menu bar) before clicking Check Again.',
};

function showView(name) {
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('active', v === name);
  });
}

// ─── Status display ────────────────────────────────────────────────────────

let _config = null;
let _status = 'stopped';
let _dockerIssueReason = null;

function applyDockerMissingCopy(copy) {
  const merged = { ...DEFAULT_DOCKER_MISSING_COPY, ...(copy || {}) };
  const nameEl = document.getElementById('docker-missing-name');
  const subtitleEl = document.getElementById('docker-missing-subtitle');
  const cardTitleEl = document.getElementById('docker-missing-card-title');
  const descriptionEl = document.getElementById('docker-missing-description');
  const downloadBtn = document.getElementById('btn-docker-download');
  const hintEl = document.getElementById('docker-missing-hint');
  const autoInstallBtn = document.getElementById('btn-docker-auto-install');

  if (nameEl) nameEl.textContent = merged.name;
  if (subtitleEl) subtitleEl.textContent = merged.subtitle;
  if (cardTitleEl) cardTitleEl.textContent = merged.cardTitle;
  if (descriptionEl) descriptionEl.textContent = merged.description;
  if (downloadBtn) downloadBtn.textContent = merged.downloadLabel;
  if (hintEl) hintEl.textContent = merged.hint;
  if (autoInstallBtn) autoInstallBtn.style.display = 'none';
}

function configureDockerMissingView(docker) {
  _dockerIssueReason = docker?.reason || 'docker_missing';

  if (_dockerIssueReason === 'compose_missing') {
    applyDockerMissingCopy({
      name: 'Docker Compose Required',
      subtitle: 'Docker is installed, but Docker Compose is missing',
      cardTitle: 'Install Docker Compose',
      description: 'ProjectBlackVault needs Docker Compose (`docker compose` or `docker-compose`) to start containers.',
      downloadLabel: 'Open Compose Install Guide',
      hint: docker?.hint || 'Install Docker Compose, then click Check Again.',
    });
    return;
  }

  applyDockerMissingCopy({
    hint: docker?.hint || DEFAULT_DOCKER_MISSING_COPY.hint,
    downloadLabel: 'Download Manually',
  });
}

function applyLauncherUpdateStatus(state) {
  const el = document.getElementById('launcher-update-status');
  if (!el || !state) return;

  const prefix = 'Launcher updates: ';
  if (state.status === 'available') {
    el.style.color = '#22c55e';
  } else if (state.status === 'error') {
    el.style.color = '#f59e0b';
  } else {
    el.style.color = '#888';
  }
  el.textContent = prefix + (state.message || 'Status unavailable.');
}

function applyStatus(status) {
  _status = status;

  const dot = document.getElementById('status-dot');
  const label = document.getElementById('status-label');
  const btnOpen = document.getElementById('btn-open');
  const btnStartStop = document.getElementById('btn-start-stop');

  if (!dot) return;

  dot.className = `status-dot ${status}`;
  label.className = `status-label ${status}`;

  const labels = { running: 'Running', starting: 'Starting...', stopped: 'Stopped' };
  label.textContent = labels[status] || status;

  btnOpen.disabled = status !== 'running';

  if (status === 'running') {
    btnStartStop.textContent = 'Stop';
    btnStartStop.className = 'btn btn-danger';
    btnStartStop.disabled = false;
  } else if (status === 'starting') {
    btnStartStop.textContent = 'Starting...';
    btnStartStop.className = 'btn btn-secondary';
    btnStartStop.disabled = true;
  } else {
    btnStartStop.textContent = 'Start';
    btnStartStop.className = 'btn btn-secondary';
    btnStartStop.disabled = false;
  }
}

function showSetupError(message) {
  const errEl = document.getElementById('setup-error');
  if (!errEl) return;
  errEl.textContent = message;
  errEl.style.display = 'block';
}

function clearSetupError() {
  const errEl = document.getElementById('setup-error');
  if (!errEl) return;
  errEl.style.display = 'none';
}

function mapRuntimeError(result, fallbackMessage) {
  if (!result || result.ok) return fallbackMessage;

  if (result.code === 'DOCKER_NOT_INSTALLED') {
    return 'Docker is not installed. Install Docker Desktop and try again.';
  }
  if (result.code === 'COMPOSE_MISSING') {
    return 'Docker Compose is missing. Install the Compose plugin and try again.';
  }
  if (result.code === 'PORT_IN_USE') {
    return `Port conflict: ${result.message}`;
  }
  if (result.code === 'DOCKER_NOT_RUNNING') {
    return 'Docker is not running. Start Docker Desktop and try again.';
  }
  if (result.code === 'HEALTH_TIMEOUT') {
    return 'Container started but health check timed out. Check logs and retry.';
  }
  if (result.code === 'IMAGE_PULL_FAILED') {
    return 'Image pull failed. Check internet access and retry.';
  }
  if (result.code === 'STOP_FAILED') {
    return result.message || 'Unable to stop ProjectBlackVault. Check Docker and retry.';
  }

  return result.message || fallbackMessage;
}

// ─── Platform detection ────────────────────────────────────────────────────

let _platform = null;

async function getPlatform() {
  if (!_platform) _platform = await window.vault.getPlatform();
  return _platform;
}

// ─── Startup flow ──────────────────────────────────────────────────────────

async function init() {
  // 1. Check Docker
  const docker = await window.vault.dockerCheck();

  if (docker.reason === 'compose_missing') {
    configureDockerMissingView(docker);
    showView('docker-missing');
    return;
  }

  if (docker.status === 'not-installed') {
    configureDockerMissingView(docker);
    showView('docker-missing');
    // Show auto-install button on Windows and macOS
    const platform = await getPlatform();
    if ((platform === 'win32' || platform === 'darwin') && docker.reason !== 'compose_missing') {
      document.getElementById('btn-docker-auto-install').style.display = '';
      document.getElementById('btn-docker-download').textContent = 'Download Manually Instead';
    }
    return;
  }

  if (docker.status === 'not-running') {
    _dockerIssueReason = docker.reason || 'docker_not_running';
    showView('docker-not-running');
    return;
  }

  // 2. Check for saved config
  const config = await window.vault.getConfig();
  _config = config;

  if (!config) {
    // First run — show setup
    const defaultDir = getDefaultDataDir();
    document.getElementById('input-data-dir').value = defaultDir;
    showView('setup');
    return;
  }

  // 3. Already configured — show dashboard
  showView('dashboard');
  populateDashboard(config);

  // Get current status
  const currentStatus = await window.vault.getStatus();
  applyStatus(currentStatus);

  const launcherUpdateState = await window.vault.getLauncherUpdateStatus();
  applyLauncherUpdateStatus(launcherUpdateState);
}

function getDefaultDataDir() {
  // The main process passes the home dir via the title attribute of the body
  // (a safe channel for simple string data without extra IPC)
  return document.body.dataset.homedir
    ? `${document.body.dataset.homedir}/blackvault-data`
    : '~/blackvault-data';
}

function populateDashboard(config) {
  const port = config.port || 3000;
  document.getElementById('footer-info').textContent = `Port ${port}`;

  const linkDir = document.getElementById('link-data-dir');
  linkDir.textContent = 'Open data folder';
  linkDir.onclick = () => window.vault.openExternal(`file://${config.dataDir}`);
}

// ─── Status updates from main process ─────────────────────────────────────

window.vault.onStatusChange(status => {
  _status = status;
  // If we're on the dashboard, update it
  const dash = document.getElementById('view-dashboard');
  if (dash && dash.classList.contains('active')) {
    applyStatus(status);
  }
});

window.vault.onLauncherUpdateStatus(status => {
  applyLauncherUpdateStatus(status);
});

// ─── Docker missing view ───────────────────────────────────────────────────

document.getElementById('btn-docker-auto-install').addEventListener('click', async () => {
  showView('docker-installing');

  // Stream install logs to the docker-installing view
  const logEl = document.getElementById('docker-install-log');
  const msgEl = document.getElementById('docker-install-msg');

  if (logEl) logEl.textContent = '';
  if (msgEl) msgEl.textContent = 'Installing Docker Desktop...';

  const result = await window.vault.installDocker();

  if (result.ok) {
    msgEl.textContent = 'Docker Desktop installed! Waiting for it to start...';
    // Poll until Docker is ready
    const poll = setInterval(async () => {
      const docker = await window.vault.dockerCheck();
      if (docker.status === 'ready') {
        clearInterval(poll);
        init();
      } else if (docker.reason === 'compose_missing') {
        clearInterval(poll);
        configureDockerMissingView(docker);
        showView('docker-missing');
      } else if (docker.status === 'not-installed') {
        clearInterval(poll);
        configureDockerMissingView(docker);
        msgEl.textContent = 'Docker command is still unavailable. Complete manual setup, then click Check Again.';
        setTimeout(() => showView('docker-missing'), 2000);
      } else if (docker.status === 'not-running') {
        clearInterval(poll);
        msgEl.textContent = 'Docker is installed. Please start Docker Desktop and wait for it to be ready.';
        setTimeout(() => showView('docker-not-running'), 2000);
      }
    }, 5000);
  } else if (result.error === 'homebrew-not-found' || result.error === 'unsupported-platform') {
    // Already opened the download page, go back to missing view with explicit fallback guidance
    const hintEl = document.getElementById('docker-missing-hint');
    if (hintEl) {
      hintEl.textContent = 'Automatic install is unavailable on this host. Complete a manual Docker install, then click Check Again.';
    }
    showView('docker-missing');
  } else {
    // Install failed — show error and go back
    document.getElementById('docker-install-msg').textContent = `Automatic install failed: ${result.error}`;
    const hintEl = document.getElementById('docker-missing-hint');
    if (hintEl) {
      hintEl.textContent = 'Automatic install did not complete. Use manual install, then click Check Again.';
    }
    setTimeout(() => showView('docker-missing'), 3000);
  }
});

document.getElementById('btn-docker-download').addEventListener('click', () => {
  const url = _dockerIssueReason === 'compose_missing' ? DOCKER_COMPOSE_INSTALL_URL : DOCKER_DESKTOP_URL;
  window.vault.openExternal(url);
});

document.getElementById('btn-docker-recheck').addEventListener('click', async () => {
  await init();
});

// ─── Docker not running view ───────────────────────────────────────────────

document.getElementById('btn-docker-retry').addEventListener('click', async () => {
  await init();
});

// ─── Setup view ───────────────────────────────────────────────────────────

document.getElementById('btn-browse').addEventListener('click', async () => {
  const dir = await window.vault.openDirDialog();
  if (dir) {
    document.getElementById('input-data-dir').value = dir;
  }
});

document.getElementById('btn-install').addEventListener('click', async () => {
  const dataDir = document.getElementById('input-data-dir').value.trim();
  const portStr = document.getElementById('input-port').value.trim();
  clearSetupError();

  if (!dataDir) {
    showSetupError('Please choose a data folder.');
    return;
  }

  const port = parseInt(portStr, 10);
  if (!port || port < 1024 || port > 65535) {
    showSetupError('Port must be between 1024 and 65535.');
    return;
  }

  showView('installing');
  const installLog = document.getElementById('install-log');
  if (installLog) installLog.textContent = '';

  const cfg = { dataDir, port, firstRunDone: true };
  await window.vault.saveConfig(cfg);
  _config = cfg;

  document.getElementById('install-msg').textContent = 'Step 1/3: Starting ProjectBlackVault services...';

  const result = await window.vault.start();
  if (result?.ok) {
    document.getElementById('install-msg').textContent = 'Step 3/3: Health checks passed. Opening dashboard...';
    showView('dashboard');
    populateDashboard(cfg);
    applyStatus('running');
    return;
  }

  showView('setup');
  showSetupError(mapRuntimeError(result, 'Failed to start. Is Docker Desktop running?'));
});

function withButtonBusyState(btn, label, busyLabel) {
  btn.disabled = true;
  btn.dataset.prevLabel = label;
  btn.textContent = busyLabel;
}

function restoreButtonState(btn) {
  btn.disabled = false;
  if (btn.dataset.prevLabel) {
    btn.textContent = btn.dataset.prevLabel;
    delete btn.dataset.prevLabel;
  }
}

document.getElementById('btn-launcher-update-check').addEventListener('click', async () => {
  const btn = document.getElementById('btn-launcher-update-check');
  withButtonBusyState(btn, 'Check Launcher Update', 'Checking...');
  await window.vault.checkLauncherUpdates();
  restoreButtonState(btn);
});

document.getElementById('btn-start-stop').addEventListener('click', async () => {
  if (_status === 'running') {
    const btn = document.getElementById('btn-start-stop');
    withButtonBusyState(btn, 'Stop', 'Stopping...');
    const result = await window.vault.stop();
    restoreButtonState(btn);
    if (result?.ok) {
      applyStatus('stopped');
      return;
    }

    const refreshed = await window.vault.getStatus();
    applyStatus(refreshed || 'running');
    const message = mapRuntimeError(result, 'Unable to stop ProjectBlackVault.');
    const statusEl = document.getElementById('launcher-update-status');
    if (statusEl && message) {
      statusEl.style.color = '#f59e0b';
      statusEl.textContent = `Launcher updates: ${message}`;
    }
    return;
  }

  if (_status === 'stopped') {
    applyStatus('starting');
    const result = await window.vault.start();
    if (result?.ok) {
      if (result.code === 'ALREADY_RUNNING') {
        applyStatus('running');
      }
      return;
    }

    if (!result?.ok) {
      applyStatus('stopped');
      const message = mapRuntimeError(result, 'Unable to start ProjectBlackVault.');
      if (message) {
        const statusEl = document.getElementById('launcher-update-status');
        if (statusEl) {
          statusEl.style.color = '#f59e0b';
          statusEl.textContent = `Launcher updates: ${message}`;
        }
      }
    }
  }
});

document.getElementById('btn-update').addEventListener('click', async () => {
  const btn = document.getElementById('btn-update');
  withButtonBusyState(btn, 'Update Vault Image', 'Updating...');
  const result = await window.vault.update();
  if (!result?.ok) {
    const message = mapRuntimeError(result, 'Update failed.');
    const statusEl = document.getElementById('launcher-update-status');
    if (statusEl && message) {
      statusEl.style.color = '#f59e0b';
      statusEl.textContent = `Launcher updates: ${message}`;
    }
  }
  restoreButtonState(btn);
});

document.getElementById('btn-open').addEventListener('click', () => {
  const port = _config ? _config.port : 3000;
  window.vault.openExternal(`http://localhost:${port}`);
});

// ─── Install log streaming ────────────────────────────────────────────────

window.vault.onInstallLog(line => {
  const installLog = document.getElementById('install-log');
  if (installLog) {
    installLog.textContent += line + '\n';
    installLog.scrollTop = installLog.scrollHeight;
  }

  const dockerInstallLog = document.getElementById('docker-install-log');
  if (dockerInstallLog) {
    dockerInstallLog.textContent += line + '\n';
    dockerInstallLog.scrollTop = dockerInstallLog.scrollHeight;
  }
});

// ─── Restore existing vault button ────────────────────────────────────────

document.getElementById('btn-restore-mode').addEventListener('click', async () => {
  const dataDir = document.getElementById('input-data-dir').value.trim();
  const portStr = document.getElementById('input-port').value.trim();
  clearSetupError();

  if (!dataDir) {
    showSetupError('Please choose a data folder first.');
    return;
  }
  const port = parseInt(portStr, 10);
  if (!port || port < 1024 || port > 65535) {
    showSetupError('Port must be between 1024 and 65535.');
    return;
  }

  showView('installing');
  document.getElementById('install-msg').textContent = 'Starting ProjectBlackVault in restore mode...';
  const installLog = document.getElementById('install-log');
  if (installLog) installLog.textContent = '';

  const cfg = { dataDir, port, firstRunDone: true };
  await window.vault.saveConfig(cfg);
  _config = cfg;

  const result = await window.vault.start();
  if (!result?.ok) {
    showView('setup');
    showSetupError(mapRuntimeError(result, 'Failed to start restore mode.'));
    return;
  }

  window.vault.openExternal(`http://localhost:${port}/settings#backup`);
  showView('dashboard');
  populateDashboard(cfg);
  applyStatus('running');
});

// ─── Boot ──────────────────────────────────────────────────────────────────

init();
