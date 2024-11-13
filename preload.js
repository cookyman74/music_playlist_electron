// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log("preload.js 로드 완료");

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
        once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(event, ...args)),
        removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),  // 추가
    },
    getPath: (name) => ipcRenderer.invoke('get-path', name),
});
