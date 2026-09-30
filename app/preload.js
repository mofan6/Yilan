const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('offlineTranslator', {
  startEngine: () => ipcRenderer.invoke('engine:start'),
  translate: (payload) => ipcRenderer.invoke('translate', payload),
  translateSelection: (payload) => ipcRenderer.invoke('selection:translate', payload),
  lookup: (word) => ipcRenderer.invoke('dictionary:lookup', word),
  wordAt: (payload) => ipcRenderer.invoke('dictionary:word-at', payload),
  tokenize: (text) => ipcRenderer.invoke('dictionary:tokenize', text),
  appInfo: () => ipcRenderer.invoke('app:info'),
  getExperienceSettings: () => ipcRenderer.sendSync('app:experience-load'),
  setExperienceSettings: (patch) => ipcRenderer.invoke('app:experience-save', patch),
  setTheme: (theme) => ipcRenderer.invoke('app:set-theme', theme),
  setAccent: (accent) => ipcRenderer.invoke('app:set-accent', accent),
  rendererReady: () => ipcRenderer.send('renderer:ready'),
  setCapturePreferences: (payload) => ipcRenderer.invoke('capture:set-preferences', payload),
  startCapture: (payload) => ipcRenderer.invoke('capture:start', payload),
  processCaptureImage: (payload) => ipcRenderer.invoke('capture:image', payload),
  pickDocument: () => ipcRenderer.invoke('document:pick'),
  registerDocumentPath: (filePath) => ipcRenderer.invoke('document:register-path', filePath),
  readDocument: (token) => ipcRenderer.invoke('document:read', token),
  pathForFile: (file) => webUtils.getPathForFile(file),
  startDocumentTranslation: (payload) => ipcRenderer.invoke('document:start', payload),
  pauseDocumentTranslation: (id) => ipcRenderer.invoke('document:pause', id),
  resumeDocumentTranslation: (id) => ipcRenderer.invoke('document:resume', id),
  cancelDocumentTranslation: (id) => ipcRenderer.invoke('document:cancel', id),
  openDocumentOutput: (outputPath) => ipcRenderer.invoke('document:open-output', outputPath),
  showDocumentOutput: (outputPath) => ipcRenderer.invoke('document:show-output', outputPath),
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
  },
  onCaptureStatus: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('capture:status', handler);
    return () => ipcRenderer.removeListener('capture:status', handler);
  },
  onCaptureResult: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('capture:result', handler);
    return () => ipcRenderer.removeListener('capture:result', handler);
  },
  onCaptureError: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('capture:error', handler);
    return () => ipcRenderer.removeListener('capture:error', handler);
  },
  onCaptureShortcutStatus: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('capture:shortcut-status', handler);
    return () => ipcRenderer.removeListener('capture:shortcut-status', handler);
  },
  onDocumentProgress: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('document:progress', handler);
    return () => ipcRenderer.removeListener('document:progress', handler);
  }
});
