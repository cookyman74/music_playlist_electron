const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execFile } = require('child_process');


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

ipcMain.on('download-playlist', (event, url) => {
  const pythonScriptPath = path.join(__dirname, 'dist', 'pydownloader');  // Python 실행 파일 경로

  execFile(pythonScriptPath, [url], (error, stdout, stderr) => {
    if (error) {
      console.error(`다운로드 오류 발생: ${stderr}`);
      event.reply('download-status', '다운로드 실패');
      return;
    }
    console.log(`다운로드 성공: ${stdout}`);

    // 다운로드 완료 메시지를 프론트엔드로 전달
    event.reply('download-status', '다운로드 완료');

    // 다운로드 경로 추출 및 전달
    const downloadPath = path.join(__dirname, 'downloads');
    event.reply('download-path', downloadPath);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
