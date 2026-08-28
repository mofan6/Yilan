const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('offlineTranslator', {
  startEngine: () => ipcRenderer.invoke('engine:start'),
  translate: (payload) => ipcRenderer.invoke('translate', payload),
  lookup: (word) => ipcRenderer.invoke('dictionary:lookup', word),
  wordAt: (payload) => ipcRenderer.invoke('dictionary:word-at', payload),
  tokenize: (text) => ipcRenderer.invoke('dictionary:tokenize', text),
  appInfo: () => ipcRenderer.invoke('app:info'),
  setTheme: (theme) => ipcRenderer.invoke('app:set-theme', theme),
  setAccent: (accent) => ipcRenderer.invoke('app:set-accent', accent),
  windowControl: (action) => ipcRenderer.invoke('window:control', action),
  openLog: () => ipcRenderer.invoke('app:open-log'),
  onWindowState: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('window-state', handler);
    return () => ipcRenderer.removeListener('window-state', handler);
  },
  onEngineStatus: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('engine-status', handler);
    return () => ipcRenderer.removeListener('engine-status', handler);
  }
});
