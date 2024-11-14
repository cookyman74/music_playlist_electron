// utils/audioUtils.ts
import { Track } from '../types';

export const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const isPlayable = (track: Track): boolean => {
    return track.download_status === 'completed' &&
        (!!track.file_path || !!track.absolute_file_path);
};

export const getPlayablePath = (track: Track): string | null => {
    if (!isPlayable(track)) return null;
    return track.absolute_file_path || track.file_path || null;
};

export interface AudioEventHandlers {
    onEnded?: () => void;
    onError?: (error: Error) => void;
    onPlay?: () => void;
    onPause?: () => void;
    onTimeUpdate?: (currentTime: number) => void;
    onDurationChange?: (duration: number) => void;
}

export class AudioController {
    private audio: HTMLAudioElement;
    private handlers: AudioEventHandlers = {};

    constructor() {
        this.audio = new Audio();
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.audio.addEventListener('ended', () => this.handlers.onEnded?.());
        this.audio.addEventListener('play', () => this.handlers.onPlay?.());
        this.audio.addEventListener('pause', () => this.handlers.onPause?.());
        this.audio.addEventListener('timeupdate', () =>
            this.handlers.onTimeUpdate?.(this.audio.currentTime));
        this.audio.addEventListener('loadedmetadata', () =>
            this.handlers.onDurationChange?.(this.audio.duration));
        this.audio.addEventListener('error', (e) => {
            if (this.handlers.onError) {
                const error = e.currentTarget as HTMLAudioElement;
                const message = this.getErrorMessage(error.error, error.src);
                this.handlers.onError(new Error(message));
            }
        });
    }

    private getErrorMessage(error: MediaError | null, src: string): string {
        if (!error) return '알 수 없는 오디오 오류';

        switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED: return '재생이 중단되었습니다.';
            case MediaError.MEDIA_ERR_NETWORK: return '네트워크 오류가 발생했습니다.';
            case MediaError.MEDIA_ERR_DECODE: return '오디오 디코딩에 실패했습니다.';
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: return '오디오 형식이 지원되지 않습니다.';
            default: return `오디오 재생 오류 (${error.code}): ${src}`;
        }
    }

    public async setTrack(track: Track) {
        if (!isPlayable(track)) {
            throw new Error('재생할 수 없는 트랙입니다.');
        }

        const filePath = track.absolute_file_path || track.file_path;
        if (!filePath) {
            throw new Error('오디오 파일 경로를 찾을 수 없습니다.');
        }

        try {
            // 절대 경로로 변환
            const absolutePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
            // 중복된 경로 부분 제거
            const cleanPath = absolutePath.replace(/^\/+/, '/').replace(/^\/downloads\//, '/');

            const audioUrl = await window.electron.getAudioUrl(cleanPath);

            console.log('Audio URL created:', {
                original: filePath,
                cleaned: cleanPath,
                mediaUrl: audioUrl
            });

            this.audio.src = audioUrl;
            this.audio.load();
        } catch (error) {
            console.error('오디오 URL 생성 실패:', error);
            throw new Error('오디오 파일을 로드할 수 없습니다.');
        }
    }

    public setHandlers(handlers: AudioEventHandlers) {
        this.handlers = handlers;
    }

    public async play() {
        try {
            await this.audio.play();
        } catch (error) {
            this.handlers.onError?.(error as Error);
        }
    }

    public pause() {
        this.audio.pause();
    }

    public setVolume(volume: number) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    public seek(time: number) {
        if (this.audio.duration && time >= 0 && time <= this.audio.duration) {
            this.audio.currentTime = time;
        }
    }

    public getCurrentTime(): number {
        return this.audio.currentTime;
    }

    public getDuration(): number {
        return this.audio.duration;
    }

    public isPlaying(): boolean {
        return !this.audio.paused;
    }

    public cleanup() {
        this.audio.pause();
        this.audio.src = '';
        this.handlers = {};
    }
}
