# yt_player

> **유튜브 오디오 다운로드 및 재생을 위한 데스크탑 플레이어**
> 
> Electron + React 기반의 통합 플레이어로, Google OAuth2 인증, YouTube 오디오 스트리밍, 다운로드, FFmpeg 기반 변환, 사용자 설정 기능을 제공합니다.

---

## ✨ 프로젝트 개요

`yt_player`는 다음 기능을 통합하여 제공합니다:

- Google OAuth2를 통한 사용자 인증 (NestJS 기반 `iam-server` 연동)
    
- 사용자의 YouTube 플레이리스트를 조회 및 다운로드
    
- 오디오 파일 재생 (Howler.js)
    
- 다운로드 진행 상태 표시
    
- 사용자 설정 저장 및 적용 (음질, 코덱, 경로 등)
    
- FFmpeg를 이용한 오디오 포맷 변환
    
- Electron 기반의 데스크탑 앱으로 CORS 제약 없이 백엔드와 통신 가능
    

---

## 🚀 기술 스택

|Layer|기술|설명|
|---|---|---|
|Frontend|React, MUI, Zustand, TypeScript|상태관리(Zustand), 컴포넌트 UI, 테마 등|
|Backend|NestJS (`iam-server`)|OAuth2 인증 서버 (Google)|
|Electron|Electron 33+|데스크탑 앱 실행 및 IPC 처리|
|Python|`pydownloader`|YouTube 다운로드 및 FFmpeg 변환|
|FFmpeg|FFmpeg|오디오 다운로드 및 포맷 변환|

---

## 🛋️ 주요 기능

### 🌐 인증 및 사용자 정보 관리

- Google OAuth2 인증 연동
    
- 인증 후 `accessToken`을 상태에 저장 (Zustand)
    
- 인증 창은 Electron의 `BrowserWindow`로 팝업
    
- 인증 성공 후 `auth-success` IPC 이벤트로 렌더러에 전달
    

### 🎧 오디오 재생

- `howler` 기반의 트랙 재생 컨트롤러 (`AudioPlayer.tsx`)
    
- 탐색(Slider), 볼륨 제어, 재생/일시정지, 다음/이전 지원
    

### 📦 다운로드 기능

- `pydownloader` (Python 스크립트) 실행하여 다운로드 수행
    
- FFmpeg로 오디오 포맷/코덱/음질 선택 가능
    
- 다운로드 진행 상황을 `progress` 이벤트로 렌더러에 실시간 전송
    

### ⚙️ 사용자 설정 (SettingsForm.tsx)

- 다운로드 경로 지정
    
- 코덱 선택 (mp3, m4a, wav)
    
- 음질 선택 (128 / 192 / 320 kbps)
    
- 최대 동시 다운로드 수 설정 (1~5개)
    
- 설정은 DB 및 로컬에 저장됨
    

### 🌟 테마 및 레이아웃

- MUI ThemeProvider를 활용한 다크/라이트 모드 전환
    
- 레이아웃 상단에 메뉴바, 좌측에 플레이리스트 Drawer 구성
    

---

## 🚧 프로젝트 구조

```bash
yt_player/
├── build/                  # React 빌드 결과
├── dist/                   # Electron 패키징 결과
├── public/                # 정적 파일
├── src/
│   ├── components/
│   │   ├── Player/        # AudioPlayer, CoverImage 등
│   │   ├── Layout.tsx     # 공통 레이아웃
│   │   └── Navbar.tsx     # 사이드 네비게이션
│   ├── pages/             # PlaylistPage, LoginPage 등
│   ├── store/             # Zustand 전역 상태 관리
│   ├── utils/             # ffmpeg, 오디오, 인증 유틸리티
│   │   ├── pydownloader.py # YouTube 다운로드 스크립트
│   │   └── pydownloader.spec # PyInstaller 설정 파일
│   ├── types/             # 공통 타입 정의
│   └── scripts/           # FFmpeg 다운로드 스크립트 등
├── main.js                # Electron Main 프로세스
├── preload.js             # Electron Preload 스크립트
├── package.json
└── README.md
```

---

## 📆 실행 방법

### 1. 설치

```bash
# 프로젝트 의존성 설치
yarn install

# Python 의존성 설치
pip install yt-dlp PyInstaller
```

### 2. pydownloader 빌드

```bash
# src/utils 디렉토리로 이동
cd src/utils

# PyInstaller로 pydownloader 실행 파일 빌드
python3 -m PyInstaller pydownloader.spec

# 빌드된 실행 파일을 프로젝트 루트로 복사
cp dist/pydownloader ../../
cd ../..

# 실행 권한 부여
chmod +x pydownloader
```

### 3. 개발 환경 실행

개발 환경에서는 React 개발 서버와 Electron을 별도의 터미널에서 실행해야 합니다:

```bash
# 터미널 1: React 개발 서버 실행 (Hot reload 지원)
yarn start

# 터미널 2: Electron 실행 (새 터미널에서)
yarn electron-start
```

> 개발 환경에서는 React 개발 서버가 먼저 실행되어 있어야 Electron이 정상적으로 동작합니다.

### 4. 프로덕션 빌드 및 실행

프로덕션 환경에서는 React 앱을 먼저 빌드한 후 Electron을 실행합니다:

```bash
# React 앱 빌드
yarn build

# Electron 실행 (빌드된 React 앱 사용)
yarn electron-start
```

### 5. 배포용 패키지 생성

```bash
# 모든 플랫폼용 패키지 생성
yarn dist

# 플랫폼별 패키지 생성
yarn dist:mac    # macOS
yarn dist:win    # Windows
yarn dist:linux  # Linux
```

> 빌드 결과는 `/release` 디렉토리에 생성됩니다.

---

## 🚀 OAuth 인증 흐름 (Google 기준)

1. 사용자: 로그인 버튼 클릭
    
2. `LoginPage.tsx`에서 `auth/google/url` 호출 (iam-server)
    
3. Electron 메인 프로세스에서 팝업 창 열기 (`BrowserWindow`)
    
4. 구글 OAuth 창에서 인증 진행
    
5. `redirectUri` 호출 시, `will-navigate` 이벤트에서 accessToken 추출
    
6. 렌더러로 `auth-success` 이벤트 전송
    
7. React에서 accessToken을 Zustand에 저장
    

---

## 🚀 상태 확인 방법 (Zustand)

```ts
const accessToken = useAuthStore(state => state.accessToken);
console.log("현재 AccessToken:", accessToken);
```

또는 개발자 도구 콘솔에서:

```ts
window.__zustandStore?.getState().accessToken
```

---

## 🛌 IAM-Server (인증 서버)

> NestJS 기반 OAuth 인증 서버로, `yt_player`와 별도 실행 필요

필수 엔드포인트:

- `GET /auth/google/url`
    
- `GET /auth/google/callback`
    
- `GET /auth/user`
    
- `POST /auth/refresh`
    

응답 형식은 `accessToken`, `refreshToken`, `expiresIn` 을 포함

---

## 🤖 협업을 위한 개발자 참고사항

- Electron의 `BrowserWindow`는 `nodeIntegration: false`, `contextIsolation: true` 권장
    
- IPC 통신은 `window.electron.ipcRenderer.on(...)`을 통해 수신
    
- OAuth 인증 완료 후 accessToken을 전역 상태에 저장해야 유튜브 API 사용 가능
    
- FFmpeg는 `/resources/ffmpeg/{platform}` 경로에 자동 포함됨
    
- `pydownloader`는 프로젝트 루트 디렉토리에 위치해야 하며, 실행 권한이 필요함
    
- Python 의존성(`yt-dlp`)은 반드시 설치되어 있어야 함
    

---

## ✅ TODO (기능 개선 계획)

-  리프레시 토큰 자동 갱신 로직 추가
    
-  다중 계정 지원
    
-  다운로드 진행 알림 팝업 UI 개선
    
-  검색 기반 YouTube 동영상 선택
    
-  최근 재생 목록 / 최근 다운로드 캐시 기능
-  Spotify 재생목록 연동
    

---

## 📄 라이선스

MIT License © 2025