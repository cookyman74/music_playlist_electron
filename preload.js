// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log("preload.js 로드 완료");

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => {
            ipcRenderer.removeAllListeners(channel); // 기존 리스너 제거로 중복 방지
            ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
        },
        once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(event, ...args)),
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
        removeListener: (channel, func) => ipcRenderer.removeListener(channel, func), // 누락된 메서드 추가
    },
    getPath: (name) => ipcRenderer.invoke('get-path', name),
    getAudioUrl: (filePath) => ipcRenderer.invoke('get-audio-url', filePath),
    // checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath)
});
