'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vault', {
  dockerCheck:   ()    => ipcRenderer.invoke('docker-check'),
  getConfig:     ()    => ipcRenderer.invoke('get-config'),
  saveConfig:    (cfg) => ipcRenderer.invoke('save-config', cfg),
  start:         ()    => ipcRenderer.invoke('start'),
  stop:          ()    => ipcRenderer.invoke('stop'),
  update:        ()    => ipcRenderer.invoke('update'),
  getStatus:     ()    => ipcRenderer.invoke('get-status'),
  openDirDialog: ()    => ipcRenderer.invoke('open-dir-dialog'),
  openExternal:  (url) => ipcRenderer.invoke('open-external', url),
  onStatusChange: (cb) => ipcRenderer.on('status-change', (_event, status) => cb(status)),
});
