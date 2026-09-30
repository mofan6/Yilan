const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('captureOverlay', {
  complete: (payload) => ipcRenderer.invoke('capture:complete', payload),
  cancel: (payload) => ipcRenderer.invoke('capture:cancel', payload),
  onInit: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('capture-overlay:init', handler);
    return () => ipcRenderer.removeListener('capture-overlay:init', handler);
  }
});
