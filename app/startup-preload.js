'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('yilanStartup', {
  ready: () => ipcRenderer.send('startup:ready'),
  onProgress: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('startup:progress', handler);
    return () => ipcRenderer.removeListener('startup:progress', handler);
  },
  onComplete: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('startup:complete', handler);
    return () => ipcRenderer.removeListener('startup:complete', handler);
  }
});
