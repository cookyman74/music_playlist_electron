const { app, BrowserWindow, ipcMain , protocol} = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const util = require('util');
const access = util.promisify(fs.access);
const stat = util.promisify(fs.stat);

// 커스텀 프로토콜 등록
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      stream: true,
      secure: true
    }
  }
]);

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

// 프로토콜 등록 함수
function registerAudioProtocol() {
  protocol.handle('audio', async (request) => {
    try {
      const filePath = decodeURI(request.url.slice('audio://'.length));

      // 파일 존재 및 접근 권한 확인
      await access(filePath, fs.constants.R_OK);
      const stats = await stat(filePath);

      if (!stats.isFile()) {
        throw new Error('Not a file');
      }

      return new Response(fs.createReadStream(filePath), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': stats.size.toString(),
          'Accept-Ranges': 'bytes'
        }
      });
    } catch (error) {
      console.error('Protocol error:', error);
      return new Response(null, {
        status: 404,
        statusText: 'Not Found'
      });
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  registerAudioProtocol();

  // 오디오 URL 생성 핸들러
  ipcMain.handle('get-audio-url', async (_, filePath) => {
    try {
      // 파일 존재 여부 확인
      await fs.promises.access(filePath, fs.constants.F_OK);

      // 경로에서 URL 생성
      const encodedPath = encodeURI(filePath).replace(/^\//, '');
      const mediaUrl = `media://${encodedPath}`;

      console.log('Audio URL created:', {
        original: filePath,
        mediaUrl: mediaUrl
      });

      return mediaUrl;
    } catch (error) {
      console.error('Error creating audio URL:', error);
      throw new Error(`Cannot access audio file: ${error.message}`);
    }
  });

  // 미디어 프로토콜 핸들러
  protocol.handle('media', async (request) => {
    try {
      const filePath = decodeURI(request.url.slice('media://'.length));
      const absolutePath = `/${filePath}`; // 앞에 슬래시 추가

      const stat = await fs.promises.stat(absolutePath);

      return new Response(fs.createReadStream(absolutePath), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': stat.size.toString()
        }
      });
    } catch (error) {
      console.error('Media protocol error:', error);
      return new Response('File not found', { status: 404 });
    }
  });
});

// 애플리케이션 경로 확인을 위한 디버깅 정보
console.log('Application paths:', {
  appPath: app.getAppPath(),
  cwd: process.cwd(),
  execPath: process.execPath,
  resourcePath: process.resourcesPath
});


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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 핸들러 추가
ipcMain.handle('get-audio-file', (event, filePath) => {
  return `localfile://${filePath}`;
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
