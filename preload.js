const { contextBridge } = require('electron');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');

contextBridge.exposeInMainWorld('ffmpeg', {
    createFFmpeg,
    fetchFile,
});
