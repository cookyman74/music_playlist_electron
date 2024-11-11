const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
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

// ipc 설정
ipcMain.on('download-playlist', (event, downloadConfig) => {

  // 실행파일 설정.
  const pythonScriptPath = path.join(__dirname, 'dist', 'pydownloader');
  // 실행파일관련 옵션 설정
  const { url, codec = 'mp3', quality = '192', directory = './downloads' } = downloadConfig;
  // 실행.
  const downloadProcess = spawn(pythonScriptPath, [url, codec, quality, directory]);
  //실행 프로세스 출력
  downloadProcess.stdout.on('data', (data) => {
    const message = data.toString();

    if (message.startsWith("progress:")) {
      const progress = parseFloat(message.replace("progress:", "").trim());
      event.sender.send('download-progress', { url, progress });
    } else if (message.trim() === "status:finished") {
      event.sender.send('download-complete', { url, success: true });
    }
  });

  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    event.sender.send('download-complete', { url, success: false });
  });

  process.on('close', (code) => {
    if (code !== 0) {
      event.sender.send('download-complete', { url, success: false });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
