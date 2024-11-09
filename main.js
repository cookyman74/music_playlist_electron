const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  // preload.js 설정
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadURL(
      process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '/build/index.html')}`
  );
}

app.on('ready', createWindow);
