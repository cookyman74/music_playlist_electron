// utils/audioUtils.ts
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

export const validateAudioFile = async (filePath: string): Promise<boolean> => {
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
                this.onErrorCallback(new Error(`오디오 재생 오류: ${e.type}`));
            }
        });
    }

    public setSource(src: string) {
        this.audio.src = src;
        this.audio.load();
    }

    public async play() {
        try {
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
        if (time >= 0 && time <= this.audio.duration) {
            this.audio.currentTime = time;
        }
    }

    public getCurrentTime(): number {
        return this.audio.currentTime;
    }

    public getDuration(): number {
        return this.audio.duration;
    }

    public onEnded(callback: () => void) {
        this.onEndedCallback = callback;
    }

    public onError(callback: (error: Error) => void) {
        this.onErrorCallback = callback;
    }

    public cleanup() {
        this.audio.pause();
        this.audio.src = '';
        this.onEndedCallback = undefined;
        this.onErrorCallback = undefined;
    }
}
