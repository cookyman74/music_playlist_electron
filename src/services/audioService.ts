// src/services/audioService.ts

import { Howl, Howler } from 'howler';
import { Track } from '../types';

interface AudioState {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    seek: number;
    duration: number;
}

type AudioStateListener = (state: AudioState) => void;

// 오디오 파일을 로드하고 재생하는 서비스를 제공하는 클래스
class AudioService {
    private static instance: AudioService;
    private howl: Howl | null = null;
    private currentTrack: Track | null = null; // 현재 재생 중인 트랙 정보
    private listeners: AudioStateListener[] = []; // 상태 변화를 알릴 리스너들
    private volume: number = 1.0;
    private seekInterval: NodeJS.Timeout | null = null; // 현재 재생 위치를 주기적으로 확인하는 타이머

    private constructor() {
        // Singleton 패턴
        if (AudioService.instance) {
            return AudioService.instance;
        }
        AudioService.instance = this;
    }
    // 싱글톤 인스턴스를 반환하는 메서드
    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    // 모든 리스너들에게 현재 상태를 알림
    private notifyListeners() {
        const state: AudioState = {
            currentTrack: this.currentTrack,
            isPlaying: this.isPlaying(),
            volume: this.volume,
            seek: this.getSeek(),
            duration: this.getDuration()
        };
        this.listeners.forEach(listener => listener(state));
    }

    public addListener(listener: AudioStateListener) {
        this.listeners.push(listener);
    }

    public removeListener(listener: AudioStateListener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    // 트랙을 로드하여 준비
    public async loadTrack(track: Track): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.howl) {
                this.howl.unload();
            }

            if (!track.file_path) {
                reject(new Error('No file path provided'));
                return;
            }

            this.currentTrack = track;
            this.howl = new Howl({
                src: [track.file_path],
                html5: true,  // 대용량 파일을 위해 HTML5 Audio 사용
                format: ['mp3', 'wav'],  // 지원할 오디오 포맷
                onload: () => {
                    this.notifyListeners();
                    resolve();
                },
                onloaderror: (_, error) => {
                    reject(error);
                },
                onplay: () => this.startSeekInterval(),
                onpause: () => this.stopSeekInterval(),
                onstop: () => this.stopSeekInterval(),
                onend: () => {
                    this.stopSeekInterval();
                    this.notifyListeners();
                },
            });
        });
    }

    // 음악이 재생 중일 때 현재 위치를 계속 확인하여 업데이트
    private startSeekInterval() {
        if (this.seekInterval) {
            clearInterval(this.seekInterval); // 정상 작동
        }
        this.seekInterval = setInterval(() => {
            this.notifyListeners();
        }, 1000);
    }

    private stopSeekInterval() {
        if (this.seekInterval) {
            clearInterval(this.seekInterval); // 정상 작동
            this.seekInterval = null;
        }
    }

    public play() {
        this.howl?.play();
        this.notifyListeners();
    }

    public pause() {
        this.howl?.pause();
        this.notifyListeners();
    }

    public stop() {
        this.howl?.stop();
        this.notifyListeners();
    }

    public isPlaying(): boolean {
        return this.howl ? this.howl.playing() : false;
    }

    public setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.howl) {
            this.howl.volume(this.volume);
        }
        this.notifyListeners();
    }

    public getVolume(): number {
        return this.volume;
    }

    public seek(position: number) {
        if (this.howl) {
            this.howl.seek(position);
            this.notifyListeners();
        }
    }

    public getSeek(): number {
        return this.howl ? this.howl.seek() as number : 0;
    }

    public getDuration(): number {
        return this.howl ? this.howl.duration() : 0;
    }

    // 오디오 품질 설정
    // 오디오 품질 설정
    public setAudioQuality(quality: 'low' | 'medium' | 'high') {
        switch (quality) {
            case 'low':
                // 'mp3' 지원 여부 확인
                console.log('MP3 지원 여부:', Howler.codecs('mp3'));
                break;
            case 'medium':
                // 'mp3'와 'wav' 지원 여부 확인
                console.log('MP3 지원 여부:', Howler.codecs('mp3'));
                console.log('WAV 지원 여부:', Howler.codecs('wav'));
                break;
            case 'high':
                // 'wav'와 'flac' 지원 여부 확인
                console.log('WAV 지원 여부:', Howler.codecs('wav'));
                console.log('FLAC 지원 여부:', Howler.codecs('flac'));
                break;
        }
    }
}

export default AudioService.getInstance();
