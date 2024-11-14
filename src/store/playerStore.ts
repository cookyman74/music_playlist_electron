// store/playerStore.ts
import { create } from 'zustand';
import { Track } from '../types';

interface PlayerState {
    currentTrack: Track | null;
    queue: Track[];
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
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
    repeat: 'none',
    shuffle: false,
    currentTime: 0,
    duration: 0,
    audioElement: null,

    initAudio: () => {
        const audio = new Audio();
        audio.volume = get().volume;

        // 이벤트 리스너 설정
        audio.addEventListener('timeupdate', () => {
            set({ currentTime: audio.currentTime });
        });

        audio.addEventListener('loadedmetadata', () => {
            set({ duration: audio.duration });
        });

        audio.addEventListener('ended', () => {
            const state = get();
            if (state.repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                state.nextTrack();
            }
        });

        set({ audioElement: audio });
    },

    playTrack: async (track: Track) => {
        const state = get();
        if (state.currentTrack?.id === track.id) {
            state.togglePlay();
            return;
        }

        if (!state.audioElement) {
            state.initAudio();
        }

        try {
            const filePath = track.file_path || track.absolute_file_path;
            if (!filePath) {
                throw new Error('재생할 수 있는 오디오 파일이 없습니다.');
            }

            const audioUrl = await window.electron.getAudioUrl(filePath);
            const audio = state.audioElement!;

            audio.src = audioUrl;
            await audio.play();

            set({
                currentTrack: track,
                isPlaying: true,
                currentTime: 0
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
            set({ currentTime: time });
        }
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
                await state.playTrack(state.queue[0]);
            }
            return;
        }

        await state.playTrack(state.queue[currentIndex + 1]);
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
