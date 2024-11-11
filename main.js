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

  // 개발 도구 열기 (디버깅용)
  // mainWindow.webContents.openDevTools();
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
    const lines = data.toString().split('\n');

    lines.forEach(line => {
      if (!line.trim()) return;

      console.log('Python 출력:', line);

      try {
        if (line.startsWith('progress:')) {
          const progressData = JSON.parse(line.replace('progress:', '').trim());
          event.sender.send('progress', progressData);
        }
        else if (line.startsWith('playlist_info:')) {
          const playlistInfo = JSON.parse(line.replace('playlist_info:', '').trim());
          event.sender.send('playlist_info', playlistInfo);
        }
        else if (line.startsWith('track_status:')) {
          const statusInfo = JSON.parse(line.replace('track_status:', '').trim());
          event.sender.send('track_status', statusInfo);
        }
      } catch (error) {
        console.error('메시지 파싱 에러:', error);
        console.error('원본 라인:', line);
      }
    });
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

  // 프로세스 에러 처리
  downloadProcess.on('error', (error) => {
    console.error('프로세스 실행 에러:', error);
    event.sender.send('error', error.message);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
