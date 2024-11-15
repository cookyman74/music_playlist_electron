// store/playerStore.ts
import { create } from 'zustand';
import { Track } from '../types';

interface PlayerState {
    currentTrack: Track | null;
    queue: Track[];
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
    isSeeking: boolean; // Progress Bar 조작 여부 추가
    isLoadingTrack: boolean;
    repeat: 'none' | 'one' | 'all';
    shuffle: boolean;
    currentTime: number;
    duration: number;
    audioElement: HTMLAudioElement | null;

    // Actions
    initAudio: () => void;
    playTrack: (track: Track) => Promise<void>;
    togglePlay: () => void;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleShuffle: () => void;
    setRepeat: (mode: 'none' | 'one' | 'all') => void;
    addToQueue: (tracks: Track[]) => void;
    removeFromQueue: (trackId: number) => void;
    clearQueue: () => void;
    seek: (time: number) => void;
    updateTime: (time: number) => void;
    updateDuration: (duration: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    queue: [],
    isPlaying: false,
    volume: 1,
    isMuted: false,
    isSeeking: false,
    isLoadingTrack: false,
    repeat: 'none',
    shuffle: false,
    currentTime: 0,
    duration: 0,
    audioElement: null,

    initAudio: () => {
        return new Promise<void>((resolve) => {
            const state = get();
            if (state.audioElement) {
                resolve();
                return;
            }

            const audio = new Audio();
            audio.volume = state.volume;

            // 이벤트 리스너 추가
            audio.addEventListener('timeupdate', () => {
                if (!get().isSeeking) {
                    set({ currentTime: audio.currentTime });
                }
            });

            audio.addEventListener('loadedmetadata', () => {
                set({ duration: audio.duration });
            });

            audio.addEventListener('ended', async () => {
                const state = get();
                if (state.repeat === 'one') {
                    audio.currentTime = 0;
                    await audio.play();
                } else {
                    await state.nextTrack();
                }
            });

            // audioElement 상태 설정
            set({ audioElement: audio });
            resolve(); // audio 초기화 완료
        });
    },

    playTrack: async (track: Track) => {
        const state = get();

        // audioElement 초기화 확인
        if (!state.audioElement) {
            await state.initAudio(); // initAudio에서 Promise 반환
        }

        const audio = state.audioElement!;
        if (!audio) {
            console.error('audioElement가 초기화되지 않았습니다.');
            return;
        }

        // 같은 트랙 재생 시 토글만 수행
        if (state.currentTrack?.id === track.id) {
            if (!state.isPlaying) state.togglePlay();
            return;
        }

        try {
            const filePath = track.file_path || track.absolute_file_path;
            if (!filePath) {
                throw new Error('재생할 수 있는 오디오 파일이 없습니다.');
            }

            const audioUrl = await window.electron.getAudioUrl(filePath);

            // 새로운 오디오 소스 설정
            audio.src = audioUrl;
            audio.load();

            // 오디오 로드 완료 대기
            await new Promise<void>((resolve, reject) => {
                audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                audio.addEventListener('error', () => reject(audio.error), { once: true });
            });

            // 오디오 재생
            try {
                await audio.play();
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    console.warn('play()가 중단되었습니다:', error.message);
                } else {
                    throw error; // 예상치 못한 오류 처리
                }
            }

            // 상태 업데이트
            set({
                currentTrack: track,
                isPlaying: true,
                currentTime: 0,
            });
        } catch (error) {
            console.error('트랙 재생 실패:', error);
            set({ isPlaying: false });
        }
    },

    togglePlay: () => {
        const state = get();
        const audio = state.audioElement;

        if (!audio || !state.currentTrack) return;

        if (state.isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }

        set({ isPlaying: !state.isPlaying });
    },

    setVolume: (volume: number) => {
        const audio = get().audioElement;
        if (audio) {
            audio.volume = volume;
        }
        set({ volume, isMuted: volume === 0 });
    },

    toggleMute: () => {
        const state = get();
        const newMuted = !state.isMuted;
        const audio = state.audioElement;

        if (audio) {
            audio.volume = newMuted ? 0 : state.volume;
        }

        set({ isMuted: newMuted });
    },

    seek: (time: number) => {
        const state = get();
        if (state.audioElement && state.currentTrack) {
            state.audioElement.currentTime = time;
        }
        // Progress Bar 조작 완료 후 동기화
        set({ currentTime: time, isSeeking: false });
    },


    updateTime: (time: number) => {
        set({ currentTime: time });
    },

    updateDuration: (duration: number) => {
        set({ duration: duration });
    },

    toggleShuffle: () => set(state => ({ shuffle: !state.shuffle })),
    setRepeat: (mode) => set({ repeat: mode }),
    addToQueue: (tracks) => set(state => ({ queue: [...state.queue, ...tracks] })),
    removeFromQueue: (trackId) => set(state => ({
        queue: state.queue.filter(track => track.id !== trackId)
    })),
    clearQueue: () => set({ queue: [], currentTrack: null }),

    nextTrack: async () => {
        const state = get();
        const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);

        if (currentIndex === -1 || currentIndex === state.queue.length - 1) {
            if (state.repeat === 'all') {
                const firstTrack = state.queue[0];
                if (firstTrack) await state.playTrack(firstTrack);
            }
            return;
        }

        const nextTrack = state.queue[currentIndex + 1];
        if (nextTrack) {
            await state.playTrack(nextTrack);
        }
    },

    previousTrack: async () => {
        const state = get();
        const currentIndex = state.queue.findIndex(track => track.id === state.currentTrack?.id);

        if (currentIndex <= 0) {
            if (state.repeat === 'all') {
                await state.playTrack(state.queue[state.queue.length - 1]);
            }
            return;
        }

        await state.playTrack(state.queue[currentIndex - 1]);
    },
}));
