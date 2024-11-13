// types/index.ts
export type AudioCodec = 'mp3' | 'm4a' | 'wav';
export type AudioQuality = '128' | '192' | '320';

export interface Playlist {
    id: number;
    title: string;
    url: string;
    source: 'youtube' | 'spotify';
    createdAt: Date;
    updatedAt: Date;
}

export interface Track {
    id: number;
    playlist_id: number;
    title: string;
    artist: string;
    duration?: number;
    url: string;
    file_path?: string;
    absolute_file_path?: string;  // 추가: 절대 경로
    thumbnail_path?: string;
    absolute_thumbnail_path?: string;  // 추가: 썸네일 절대 경로
    is_favorite: boolean;
    download_status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress?: number;
    error?: string;
    created_at: Date;
    updated_at: Date;
    completed_at?: Date;
}

export interface Settings {
    downloadPath: string;
    preferredCodec: AudioCodec;
    preferredQuality: AudioQuality;
    autoDownload: boolean;
    maxConcurrentDownloads: number;
    defaultPlaylistSource: 'youtube' | 'spotify';
    [key: string]: any;
}

export interface Download {
    id?: number;
    track_id: number;
    status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
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
    absolute_file_path?: string;  // 추가
    thumbnail_path?: string;
    absolute_thumbnail_path?: string;  // 추가
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

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface DownloadConfig {
    url: string;
    codec: AudioCodec;
    quality: AudioQuality;
    directory: string;
}

export interface AudioPlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
}

export interface AudioPlayerControl {
    play: () => Promise<void>;
    pause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
}
