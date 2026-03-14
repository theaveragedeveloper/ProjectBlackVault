'use strict';

// ─── View management ───────────────────────────────────────────────────────

const VIEWS = ['docker-missing', 'docker-not-running', 'setup', 'dashboard', 'installing'];

function showView(name) {
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('active', v === name);
  });
}

// ─── Status display ────────────────────────────────────────────────────────

let _config = null;
let _status = 'stopped';

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

// ─── Startup flow ──────────────────────────────────────────────────────────

async function init() {
  // 1. Check Docker
  const docker = await window.vault.dockerCheck();

  if (docker.status === 'not-installed') {
    showView('docker-missing');
    return;
  }

  if (docker.status === 'not-running') {
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

// ─── Docker missing view ───────────────────────────────────────────────────

document.getElementById('btn-docker-download').addEventListener('click', () => {
  window.vault.openExternal('https://www.docker.com/products/docker-desktop/');
});

document.getElementById('btn-docker-recheck').addEventListener('click', async () => {
  const docker = await window.vault.dockerCheck();
  if (docker.status === 'ready') {
    init();
  } else if (docker.status === 'not-running') {
    showView('docker-not-running');
  }
  // else stay on current view
});

// ─── Docker not running view ───────────────────────────────────────────────

document.getElementById('btn-docker-retry').addEventListener('click', async () => {
  const docker = await window.vault.dockerCheck();
  if (docker.status === 'ready') {
    init();
  }
  // else stay
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
  const errEl = document.getElementById('setup-error');

  errEl.style.display = 'none';

  if (!dataDir) {
    errEl.textContent = 'Please choose a data folder.';
    errEl.style.display = 'block';
    return;
  }

  const port = parseInt(portStr, 10);
  if (!port || port < 1024 || port > 65535) {
    errEl.textContent = 'Port must be between 1024 and 65535.';
    errEl.style.display = 'block';
    return;
  }

  showView('installing');

  const cfg = { dataDir, port, firstRunDone: true };
  await window.vault.saveConfig(cfg);
  _config = cfg;

  document.getElementById('install-msg').textContent = 'Downloading ProjectBlackVault...';

  try {
    await window.vault.start();
    showView('dashboard');
    populateDashboard(cfg);
    applyStatus('starting');
  } catch {
    showView('setup');
    errEl.textContent = 'Failed to start. Is Docker Desktop running?';
    errEl.style.display = 'block';
  }
});

// ─── Dashboard view ────────────────────────────────────────────────────────

document.getElementById('btn-open').addEventListener('click', () => {
  const port = _config ? _config.port : 3000;
  window.vault.openExternal(`http://localhost:${port}`);
});

document.getElementById('btn-start-stop').addEventListener('click', async () => {
  if (_status === 'running') {
    applyStatus('stopped');
    await window.vault.stop();
  } else if (_status === 'stopped') {
    applyStatus('starting');
    await window.vault.start();
  }
});

document.getElementById('btn-update').addEventListener('click', async () => {
  const btn = document.getElementById('btn-update');
  btn.disabled = true;
  btn.textContent = 'Updating...';
  await window.vault.update();
  btn.disabled = false;
  btn.textContent = 'Check for Updates';
});

// ─── Boot ──────────────────────────────────────────────────────────────────

init();
