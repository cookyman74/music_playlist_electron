// preload.js
const { contextBridge, ipcRenderer } = require('electron');
// const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');

console.log("preload.js 로드 완료"); // 로드 확인 메시지 추가

// `ffmpeg`와 `ipcRenderer`를 각각 별도의 네임스페이스로 노출
// contextBridge.exposeInMainWorld('ffmpeg', {
//     createFFmpeg,
//     fetchFile
// });

contextBridge.exposeInMainWorld('electron', {
    // ipcRenderer: {
    //     send: (channel, data) => ipcRenderer.send(channel, data),
    //     once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(event, ...args)),
    // },
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
        once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(event, ...args)),
        removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
    },
});
