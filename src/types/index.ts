// types/index.ts

// 공통으로 사용될 타입
export type AudioCodec = 'mp3' | 'm4a' | 'wav';
export type AudioQuality = '128' | '192' | '320';

// 플레이리스트 타입
export interface Playlist {
    id?: number;                // autoIncrement이므로 선택적
    title: string;
    url: string;
    source: 'youtube' | 'spotify';
    createdAt: Date;
    updatedAt: Date;
}

// 트랙 타입
export interface Track {
    id?: number;                // autoIncrement이므로 선택적
    playlist_id: number;
    title: string;
    artist: string;
    url: string;
    file_path?: string;        // 다운로드 완료 후 설정
    duration?: number;         // 선택적 메타데이터
    thumbnail?: string;        // 선택적 메타데이터
    createdAt: Date;
    updatedAt: Date;
}

// 설정 타입
export interface Settings {
    downloadPath: string;
    preferredCodec: AudioCodec;
    preferredQuality: AudioQuality;
    autoDownload: boolean;
    maxConcurrentDownloads: number;
    defaultPlaylistSource: 'youtube' | 'spotify';
    [key: string]: any;        // 추가 설정을 위한 인덱스 시그니처
}

// 다운로드 상태 타입
export interface Download {
    id?: number;               // autoIncrement이므로 선택적
    track_id: number;
    status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
    progress: number;          // 0-100
    error?: string;           // 실패 시 에러 메시지
    startedAt: Date;
    completedAt?: Date;
    updatedAt: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// 다운로드 설정 타입
export interface DownloadConfig {
    url: string;
    codec: AudioCodec;
    quality: AudioQuality;
    directory: string;
}

// 사용자 타입 (향후 확장을 위해)
export interface User {
    id?: number;
    name: string;
    settings?: Partial<Settings>;
    createdAt: Date;
    updatedAt: Date;
}

export interface PlaylistInfo {
    playlist_id: string;
    title: string;
    uploader: string;
    tracks: TrackInfo[];
    download_started_at: Date;
    download_completed_at?: Date;
}

export interface TrackInfo {
    id: string;
    title: string;
    duration?: number;
    url: string;
    download_status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress?: number;
    error?: string;
    file_path?: string;
    started_at?: Date;
    completed_at?: Date;
}

export interface DownloadProgress {
    trackId: string;
    progress: number;
}

export interface DownloadResult {
    trackId: string;
    success: boolean;
    error?: string;
}
