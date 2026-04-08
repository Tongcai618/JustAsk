const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProxyPort: () => ipcRenderer.invoke('get-proxy-port'),
  loadConversations: () => ipcRenderer.invoke('load-conversations'),
  saveConversation: (conv) => ipcRenderer.invoke('save-conversation', conv),
  deleteConversation: (id) => ipcRenderer.invoke('delete-conversation', id),
  pullModel: (model) => ipcRenderer.invoke('pull-model', model),
  onPullProgress: (cb) => ipcRenderer.on('pull-progress', (_e, data) => cb(data)),
  pausePull: (model) => ipcRenderer.invoke('pause-pull', model),
  deleteModel: (model) => ipcRenderer.invoke('delete-model', model),
});
