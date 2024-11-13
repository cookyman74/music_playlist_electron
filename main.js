const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs/promises');


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
  });

  mainWindow.loadURL(
      process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '/build/index.html')}`
  );

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 핸들러 설정
ipcMain.handle('get-path', (event, name) => {
  return app.getPath(name);
});

// 디렉토리 생성 핸들러 추가
ipcMain.handle('ensure-directory', async (event, directoryPath) => {
  try {
    await fs.mkdir(directoryPath, { recursive: true });
    return true;
  } catch (error) {
    console.error('디렉토리 생성 실패:', error);
    throw error;
  }
});

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

  // stderr 처리 - downloadProcess에 연결
  downloadProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    event.sender.send('download-error', {
      url,
      success: false,
      error: data.toString()
    });
  });

  // 프로세스 종료 처리 - downloadProcess에 연결
  downloadProcess.on('close', (code) => {
    console.log(`다운로드 프로세스 종료. 종료 코드: ${code}`);
    if (code === 0) {
      event.sender.send('download-complete', {
        url,
        success: true
      });
    } else {
      event.sender.send('download-complete', {
        url,
        success: false,
        error: `Process exited with code ${code}`
      });
    }
  });

  // 프로세스 에러 처리
  downloadProcess.on('error', (error) => {
    console.error('프로세스 실행 에러:', error);
    event.sender.send('error', {
      type: 'process_error',
      message: error.message
    });
  });
});
