const { app, BrowserWindow, ipcMain, protocol, net, session } = require('electron');
const path = require('path');
const os = require('os');
const isDev = process.env.NODE_ENV === 'development';

const { spawn } = require('child_process');
const fs = require('fs');
const util = require('util');

// Promise 기반 fs 함수 변환
const access = util.promisify(fs.access);
const stat = util.promisify(fs.stat);

// 보안 관련 상수 정의
const ALLOWED_ORIGINS = ['http://localhost:8800', 'https://accounts.google.com'];
const ALLOWED_PROTOCOLS = ['media:', 'local-thumbnail:', 'audio:'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// 커스텀 프로토콜 권한 설정
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      stream: true,
      secure: true,
      corsEnabled: false
    }
  },
  {
    scheme: 'local-thumbnail',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      stream: true,
      secure: true,
      corsEnabled: false
    }
  }
]);

// 파일 경로 검증 함수
function validateFilePath(filePath) {
  // 경로 순회 공격 방지
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    throw new Error('Invalid file path');
  }
  
  // 허용된 디렉토리 내에 있는지 확인
  const allowedDirs = [
    app.getPath('userData'),
    app.getPath('downloads'),
    app.getPath('music')
  ];
  
  const isInAllowedDir = allowedDirs.some(dir => 
    normalizedPath.startsWith(dir)
  );
  
  if (!isInAllowedDir) {
    throw new Error('File path not in allowed directories');
  }
  
  return normalizedPath;
}

/**
 * 메인 윈도우 생성 함수
 */
function createWindow() {
  if (BrowserWindow.getAllWindows().length > 0) return;
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true
    },
  });

  // CSP 헤더 설정
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "media-src 'self' media: local-thumbnail:; " +
          "connect-src 'self' https://www.googleapis.com https://accounts.google.com; " +
          "frame-src 'self' https://accounts.google.com;"
        ]
      }
    });
  });

  // 개발/프로덕션 환경에 따른 URL 로드
  mainWindow.loadURL(
      isDev
          ? process.env.ELECTRON_START_URL
          : `file://${path.join(__dirname, '/build/index.html')}`
  );
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
  // 개발 환경에서 보안 경고 비활성화
  if (isDev) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  }
  
  createWindow();
  // registerAudioProtocol();

  // 이미지 URL 생성 핸들러
  ipcMain.handle('get-image-url', async (_, filePath) => {
    try {
      const validatedPath = validateFilePath(filePath);
      
      // 보안을 위한 경로 검증
      if (!validatedPath.includes('thumbnails')) {
        throw new Error('Invalid path');
      }

      await fs.promises.access(validatedPath, fs.constants.F_OK);
      const encodedPath = encodeURI(validatedPath).replace(/^\//, '');
      const imageUrl = `local-thumbnail://${encodedPath}`;

      console.log('Image URL created:', {
        original: validatedPath,
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
      const validatedPath = validateFilePath(filePath);

      if (!fs.existsSync(validatedPath)) throw new Error('File not found');

      const stats = await fs.promises.stat(validatedPath);
      if (stats.size > MAX_FILE_SIZE) {
        throw new Error('File too large');
      }

      const fileData = await fs.promises.readFile(validatedPath);
      return new Response(fileData, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000'
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
      const validatedPath = validateFilePath(filePath);
      
      // 파일 존재 여부 확인
      await fs.promises.access(validatedPath, fs.constants.F_OK);

      // 경로에서 URL 생성
      const encodedPath = encodeURI(validatedPath).replace(/^\//, '');
      const mediaUrl = `media://${encodedPath}`;

      console.log('Audio URL created:', {
        original: validatedPath,
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
      const validatedPath = validateFilePath(filePath);
      
      const stats = await fs.promises.stat(validatedPath);
      if (stats.size > MAX_FILE_SIZE) {
        throw new Error('File too large');
      }

      return new Response(fs.createReadStream(validatedPath), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': stats.size.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000'
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
    // 개발 환경: 프로젝트 루트의 src/utils/dist/pydownloader 경로 사용
    pythonScriptPath = path.join(__dirname, 'src', 'utils', 'dist', 'pydownloader');
  } else {
    // 프로덕션 환경: build 디렉토리에서 pydownloader 찾기
    pythonScriptPath = path.join(__dirname, 'build', 'pydownloader');
    
    // build 디렉토리에 없으면 프로젝트 루트에서 찾기
    if (!fs.existsSync(pythonScriptPath)) {
      pythonScriptPath = path.join(__dirname, 'pydownloader');
    }
  }

  // FFmpeg 경로 설정
  const ffmpegPath = getFFmpegPath();
  process.env.FFMPEG_PATH = ffmpegPath;
  process.env.PATH = `${path.dirname(ffmpegPath)}${path.delimiter}${process.env.PATH}`;

  // 디버깅 정보 출력
  console.log('Environment:', isDev ? 'development' : 'production');
  console.log('App path:', app.getAppPath());
  console.log('Current directory:', __dirname);
  console.log('Pydownloader path:', pythonScriptPath);
  console.log('Path exists:', fs.existsSync(pythonScriptPath));
  console.log('FFmpeg path:', ffmpegPath);
  console.log('FFmpeg exists:', fs.existsSync(ffmpegPath));

  // 디렉토리 내용 확인
  try {
    const dirPath = path.dirname(pythonScriptPath);
    console.log('Directory contents:', fs.readdirSync(dirPath));
  } catch (error) {
    console.error('Error reading directory:', error);
  }

  return pythonScriptPath;
}

function getFFmpegPath() {
  const platform = os.platform();
  let ffmpegPath;

  if (isDev) {
    // 개발 환경에서는 시스템의 ffmpeg 전체 경로를 찾음
    if (platform === 'darwin') {
      ffmpegPath = '/opt/homebrew/bin/ffmpeg';  // M1 Mac
      if (!fs.existsSync(ffmpegPath)) {
        ffmpegPath = '/usr/local/bin/ffmpeg';  // Intel Mac
      }
    } else if (platform === 'win32') {
      // Windows의 경우 PATH에서 찾기
      const where = require('which');
      try {
        ffmpegPath = where.sync('ffmpeg.exe');
      } catch (e) {
        console.error('FFmpeg not found in PATH');
      }
    } else {
      // Linux
      ffmpegPath = '/usr/bin/ffmpeg';
    }
  } else {
    // 프로덕션 환경에서는 시스템 FFmpeg 사용
    if (platform === 'darwin') {
      ffmpegPath = '/opt/homebrew/bin/ffmpeg';  // M1 Mac
      if (!fs.existsSync(ffmpegPath)) {
        ffmpegPath = '/usr/local/bin/ffmpeg';  // Intel Mac
      }
    } else if (platform === 'win32') {
      // Windows의 경우 PATH에서 찾기
      const where = require('which');
      try {
        ffmpegPath = where.sync('ffmpeg.exe');
      } catch (e) {
        console.error('FFmpeg not found in PATH');
      }
    } else {
      // Linux
      ffmpegPath = '/usr/bin/ffmpeg';
    }
  }

  // FFmpeg 경로 확인 및 로깅
  console.log('FFmpeg path check:', {
    path: ffmpegPath,
    exists: fs.existsSync(ffmpegPath),
    permissions: fs.existsSync(ffmpegPath) ? fs.statSync(ffmpegPath).mode : null
  });

  return ffmpegPath;
}

/**
 * 플레이리스트 다운로드 핸들러
 * Python 스크립트를 실행하여 유튜브 플레이리스트 다운로드
 */
ipcMain.on('download-playlist', (event, downloadConfig) => {
  const pythonScriptPath = getPydownloaderPath();

  // pydownloader 존재 여부 확인
  if (!fs.existsSync(pythonScriptPath)) {
    console.error('Pydownloader not found at:', pythonScriptPath);
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

  // FFmpeg 경로 설정
  const ffmpegPath = getFFmpegPath();
  if (!ffmpegPath) {
    throw new Error('FFmpeg path not found. Please ensure FFmpeg is installed.');
  }
  const ffmpegDir = path.dirname(ffmpegPath);

  console.log('FFmpeg configuration:', {
    ffmpegPath,
    ffmpegDir,
    exists: fs.existsSync(ffmpegPath)
  });

  // 실행 권한 설정 (macOS/Linux)
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(pythonScriptPath, '755');
      if (fs.existsSync(ffmpegPath)) {
        fs.chmodSync(ffmpegPath, '755');
      }
    } catch (error) {
      console.error('Error setting executable permissions:', error);
    }
  }

  // 다운로드 설정
  const { url, codec = 'mp3', quality = '192', directory = app.getPath('downloads') } = downloadConfig;

  // 환경변수 설정
  const env = {
    ...process.env,
    FFMPEG_PATH: ffmpegPath
  };

  console.log('FFmpeg configuration:', {
    ffmpegPath,
    PATH: env.PATH
  });

  // 프로세스 실행
  const downloadProcess = spawn(pythonScriptPath, [url, codec, quality, directory], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

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

  // 에러 처리
  downloadProcess.stderr.on('data', (data) => {
    const errorMsg = data.toString().trim();
    console.error('Python stderr:', errorMsg);

    // 특정 키워드로 메시지를 구분
    if (errorMsg.startsWith('info:')) {
      console.log('Info:', errorMsg.substring(5)); // 상태 정보는 로그로 출력
      return;
    }

    if (errorMsg.startsWith('warning:')) {
      console.warn('Warning:', errorMsg.substring(8)); // 경고 메시지는 무시
      return;
    }

    if (errorMsg.startsWith('error:')) {
      console.error('Error:', errorMsg.substring(6)); // 실제 에러만 처리
      event.sender.send('download-error', {
        url,
        success: false,
        error: errorMsg.substring(6),
        path: directory,
      });
    }
  });

  // 프로세스 종료 처리
  downloadProcess.on('close', (code) => {
    console.log(`다운로드 프로세스 종료. 종료 코드: ${code}`);
    event.sender.send('download-complete', {
      url,
      success: code === 0,
      error: code !== 0 ? `Process exited with code ${code}` : undefined
    });
  });

  // 프로세스 에러 처리
  downloadProcess.on('error', (error) => {
    console.error('프로세스 실행 에러:', error);
    event.sender.send('error', {
      type: 'process_error',
      message: error.message,
      details: error.stack
    });
  });
});

// 디버깅을 위한 애플리케이션 경로 정보 출력
console.log('Application paths:', {
  appPath: app.getAppPath(),
  cwd: process.cwd(),
  execPath: process.execPath,
  resourcePath: process.resourcesPath
});

// 인증 창 생성 함수
function createAuthWindow(authUrl) {
  const authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // OAuth 콜백 URL 검증
  const isValidCallback = (url) => {
    try {
      const callbackUrl = new URL(url);
      return ALLOWED_ORIGINS.includes(callbackUrl.origin);
    } catch {
      return false;
    }
  };

  authWindow.loadURL(authUrl);

  // OAuth 콜백 처리
  authWindow.webContents.on('will-redirect', (event, url) => {
    if (!isValidCallback(url)) {
      event.preventDefault();
      return;
    }

    if (url.startsWith('http://localhost:8800/auth/google/callback')) {
      const urlParams = new URL(url).searchParams;
      const accessToken = urlParams.get('accessToken');

      if (accessToken) {
        BrowserWindow.getAllWindows()[0].webContents.send('auth-success', accessToken);
        authWindow.close();
      }
    }
  });

  // 인증 창이 닫힐 때 메인 창에 포커스 맞추기
  authWindow.on('closed', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) mainWindow.focus();
  });
}
