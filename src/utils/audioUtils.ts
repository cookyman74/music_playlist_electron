// utils/audioUtils.ts
import { Track } from '../types';

export const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '--:--';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const getAudioFileType = (filePath: string): string | null => {
    if (!filePath) return null;
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'ogg':
            return 'audio/ogg';
        case 'm4a':
            return 'audio/mp4';
        default:
            return null;
    }
};

export const isPlayable = (track: Track): boolean => {
    return track.download_status === 'completed' &&
        (!!track.file_path || !!track.absolute_file_path);
};

export const getPlayablePath = (track: Track): string | null => {
    if (!isPlayable(track)) return null;
    return track.absolute_file_path || track.file_path || null;
};

export const validateAudioFile = async (filePath: string): Promise<boolean> => {
    if (!filePath) return false;

    try {
        const audio = new Audio();
        return new Promise((resolve) => {
            audio.onloadedmetadata = () => resolve(true);
            audio.onerror = () => resolve(false);
            audio.src = filePath;
        });
    } catch (error) {
        console.error('오디오 파일 검증 실패:', error);
        return false;
    }
};

export class AudioController {
    private audio: HTMLAudioElement;
    private onEndedCallback?: () => void;
    private onErrorCallback?: (error: Error) => void;
    private onPlayCallback?: () => void;
    private onPauseCallback?: () => void;

    constructor() {
        this.audio = new Audio();
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.audio.addEventListener('ended', () => {
            if (this.onEndedCallback) {
                this.onEndedCallback();
            }
        });

        this.audio.addEventListener('error', (e) => {
            if (this.onErrorCallback) {
                const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
                this.onErrorCallback(new Error(`오디오 재생 오류: ${errorMessage}`));
            }
        });

        this.audio.addEventListener('play', () => {
            if (this.onPlayCallback) this.onPlayCallback();
        });

        this.audio.addEventListener('pause', () => {
            if (this.onPauseCallback) this.onPauseCallback();
        });
    }

    public async setSource(track: Track) {
        if (!isPlayable(track)) {
            throw new Error('재생할 수 없는 트랙입니다.');
        }

        const path = getPlayablePath(track);
        if (!path) {
            throw new Error('오디오 파일 경로를 찾을 수 없습니다.');
        }

        this.audio.src = path;
        this.audio.load();
    }

    public async play() {
        try {
            if (!this.audio.src) {
                throw new Error('재생할 오디오 소스가 설정되지 않았습니다.');
            }
            await this.audio.play();
        } catch (error) {
            if (this.onErrorCallback) {
                this.onErrorCallback(error as Error);
            }
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

    public onEnded(callback: () => void) {
        this.onEndedCallback = callback;
    }

    public onError(callback: (error: Error) => void) {
        this.onErrorCallback = callback;
    }

    public onPlay(callback: () => void) {
        this.onPlayCallback = callback;
    }

    public onPause(callback: () => void) {
        this.onPauseCallback = callback;
    }

    public cleanup() {
        this.audio.pause();
        this.audio.src = '';
        this.onEndedCallback = undefined;
        this.onErrorCallback = undefined;
        this.onPlayCallback = undefined;
        this.onPauseCallback = undefined;
    }
}
