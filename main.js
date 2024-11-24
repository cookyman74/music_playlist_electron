const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

const { spawn } = require('child_process');
const fs = require('fs');
const util = require('util');

// Promise 기반 fs 함수 변환
const access = util.promisify(fs.access);
const stat = util.promisify(fs.stat);

// 커스텀 프로토콜 권한 설정
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

/**
 * 메인 윈도우 생성 함수
 */
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

  // 개발/프로덕션 환경에 따른 URL 로드
  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // production 환경에서는 빌드된 파일 로드
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  // 개발/프로덕션 환경에 따른 URL 로드
  mainWindow.loadURL(
      process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '/build/index.html')}`
  );

  // 개발 환경에서 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * 오디오 파일 스트리밍을 위한 프로토콜 등록
 */
function registerAudioProtocol() {
  protocol.handle('audio', async (request) => {
    try {
      const filePath = decodeURI(request.url.slice('audio://'.length));
      await access(filePath, fs.constants.R_OK);
      const stats = await stat(filePath);

      if (!stats.isFile()) throw new Error('Not a file');

      return new Response(fs.createReadStream(filePath), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': stats.size.toString(),
          'Accept-Ranges': 'bytes'
        }
      });
    } catch (error) {
      console.error('Protocol error:', error);
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }
  });
}

// 앱 초기화 시 실행되는 메인 로직
app.whenReady().then(() => {
  createWindow();
  registerAudioProtocol();

  // 이미지 URL 생성 핸들러
  ipcMain.handle('get-image-url', async (_, filePath) => {
    try {
      // 보안을 위한 경로 검증
      if (!filePath.includes('thumbnails')) {
        throw new Error('Invalid path');
      }

      await fs.promises.access(filePath, fs.constants.F_OK);
      const encodedPath = encodeURI(filePath).replace(/^\//, '');
      const imageUrl = `local-thumbnail://${encodedPath}`;

      console.log('Image URL created:', {
        original: filePath,
        imageUrl: imageUrl
      });

      return imageUrl;
    } catch (error) {
      console.error('Error creating image URL:', error);
      throw new Error(`Cannot access image file: ${error.message}`);
    }
  });

  // 썸네일 이미지 로딩을 위한 프로토콜 핸들러
  protocol.handle('local-thumbnail', async (request) => {
    try {
      const filePath = decodeURI(request.url.replace('local-thumbnail://', ''));
      console.log('Attempting to load image:', { filePath });

      if (!fs.existsSync(filePath)) throw new Error('File not found');

      const fileData = await fs.promises.readFile(filePath);
      return new Response(fileData, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Image loading error:', error);
      return new Response('Not Found', { status: 404 });
    }
  });

  // 미디어 프로토콜 핸들러 (오디오 스트리밍)
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

  // 미디어 프로토콜 핸들러 (오디오 스트리밍)
  protocol.handle('media', async (request) => {
    try {
      const filePath = decodeURI(request.url.slice('media://'.length));
      const absolutePath = `/${filePath}`;
      const stats = await fs.promises.stat(absolutePath);

      return new Response(fs.createReadStream(absolutePath), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': stats.size.toString()
        }
      });
    } catch (error) {
      console.error('Media protocol error:', error);
      return new Response('File not found', { status: 404 });
    }
  });
});

// 애플리케이션 라이프사이클 이벤트 핸들러
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC 통신 핸들러
ipcMain.handle('get-audio-file', (_, filePath) => `localfile://${filePath}`);
ipcMain.handle('get-path', (_, name) => app.getPath(name));

// 디렉토리 생성 핸들러
ipcMain.handle('ensure-directory', async (_, directoryPath) => {
  try {
    await fs.mkdir(directoryPath, { recursive: true });
    return true;
  } catch (error) {
    console.error('디렉토리 생성 실패:', error);
    throw error;
  }
});

// pydownloader 경로 설정
function getPydownloaderPath() {
  let pythonScriptPath;
  if (isDev) {
    pythonScriptPath = path.join(app.getAppPath(), 'src', 'utils', 'dist', 'pydownloader');
  } else {
    const contentsPath = path.dirname(process.resourcesPath); // Contents 디렉토리
    pythonScriptPath = path.join(contentsPath, 'pydownloader');
  }

  // 디버깅 정보 출력
  console.log('Environment:', isDev ? 'development' : 'production');
  console.log('App path:', app.getAppPath());
  console.log('Resources path:', process.resourcesPath);
  console.log('Pydownloader path:', pythonScriptPath);
  console.log('Path exists:', fs.existsSync(pythonScriptPath));

  // 디렉토리 내용 확인
  try {
    const dirPath = path.dirname(pythonScriptPath);
    console.log('Directory contents:', fs.readdirSync(dirPath));
  } catch (error) {
    console.error('Error reading directory:', error);
  }

  return pythonScriptPath;
}

/**
 * 플레이리스트 다운로드 핸들러
 * Python 스크립트를 실행하여 유튜브 플레이리스트 다운로드
 */
ipcMain.on('download-playlist', (event, downloadConfig) => {
  const pythonScriptPath = getPydownloaderPath();

  if (!fs.existsSync(pythonScriptPath)) {
    console.error('Pydownloader not found at:', pythonScriptPath);
    // 상위 디렉토리 내용도 확인
    try {
      const parentDir = path.dirname(path.dirname(pythonScriptPath));
      console.log('Parent directory contents:', fs.readdirSync(parentDir));
    } catch (error) {
      console.error('Error reading parent directory:', error);
    }

    event.sender.send('error', {
      type: 'process_error',
      message: `Pydownloader executable not found at ${pythonScriptPath}`
    });
    return;
  }

  // 실행 권한 확인 및 설정 (macOS/Linux)
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(pythonScriptPath, '755');
    } catch (error) {
      console.error('Error setting executable permissions:', error);
    }
  }

  const { url, codec = 'mp3', quality = '192', directory = './downloads' } = downloadConfig;

  const downloadProcess = spawn(pythonScriptPath, [url, codec, quality, directory]);

  // Python 프로세스 출력 처리
  downloadProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (!line.trim()) return;

      console.log('Python 출력:', line);
      try {
        if (line.startsWith('progress:')) {
          event.sender.send('progress', JSON.parse(line.replace('progress:', '').trim()));
        } else if (line.startsWith('playlist_info:')) {
          event.sender.send('playlist_info', JSON.parse(line.replace('playlist_info:', '').trim()));
        } else if (line.startsWith('track_status:')) {
          event.sender.send('track_status', JSON.parse(line.replace('track_status:', '').trim()));
        }
      } catch (error) {
        console.error('메시지 파싱 에러:', error);
        console.error('원본 라인:', line);
      }
    });
  });

  // 에러 및 종료 처리
  downloadProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    event.sender.send('download-error', { url, success: false, error: data.toString() });
  });

  downloadProcess.on('close', (code) => {
    console.log(`다운로드 프로세스 종료. 종료 코드: ${code}`);
    event.sender.send('download-complete', {
      url,
      success: code === 0,
      error: code !== 0 ? `Process exited with code ${code}` : undefined
    });
  });

  downloadProcess.on('error', (error) => {
    console.error('프로세스 실행 에러:', error);
    event.sender.send('error', { type: 'process_error', message: error.message });
  });
});

// 디버깅을 위한 애플리케이션 경로 정보 출력
console.log('Application paths:', {
  appPath: app.getAppPath(),
  cwd: process.cwd(),
  execPath: process.execPath,
  resourcePath: process.resourcesPath
});
