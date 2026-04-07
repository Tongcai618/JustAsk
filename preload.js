const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProxyPort: () => ipcRenderer.invoke('get-proxy-port'),
  loadConversations: () => ipcRenderer.invoke('load-conversations'),
  saveConversation: (conv) => ipcRenderer.invoke('save-conversation', conv),
  deleteConversation: (id) => ipcRenderer.invoke('delete-conversation', id),
});
