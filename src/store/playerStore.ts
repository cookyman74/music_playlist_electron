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
    playTrack: (track: Track, forcePlay?: boolean) => Promise<void>;
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
    selectAlbum: (albumTracks: Track[]) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    queue: [],
    isPlaying: false,
    volume: 1,
    isMuted: false,
    isSeeking: false,
    isLoadingTrack: false,
    repeat: 'all',
    shuffle: false,
    currentTime: 0,
    duration: 0,
    audioElement: null,

    initAudio: () => {
        return new Promise<void>((resolve) => {
            const state = get();
            if (state.audioElement) {
                console.log('audioElement가 이미 초기화되어 있습니다.');
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

            // seeking 시작 시
            audio.addEventListener('seeking', () => {
                set({ isSeeking: true });
            });

            // seeking 완료 시
            audio.addEventListener('seeked', () => {
                set({
                    isSeeking: false,
                    currentTime: audio.currentTime
                });
            });

            // 에러 발생 시
            audio.addEventListener('error', () => {
                set({ isSeeking: false });
                console.error('Audio error:', audio.error);
            });

            audio.addEventListener('loadedmetadata', () => {
                set({ duration: audio.duration });
            });

            // 종료 이벤트 리스너
            audio.addEventListener('ended', async () => {
                console.log('곡 종료 이벤트 발생');
                const state = get();

                if (state.repeat === 'one') {
                    console.log('반복 재생 설정: 동일한 트랙 재생');
                    audio.currentTime = 0;
                    await audio.play();
                } else {
                    console.log('다음 트랙으로 이동');

                    // 대기열 동기화
                    if (!state.queue.some((track) => track.id === state.currentTrack?.id)) {
                        console.warn('현재 트랙이 대기열에 없습니다. 동기화 중...');
                        if (state.currentTrack) {
                            set({ queue: [...state.queue, state.currentTrack] });
                        }
                    }

                    await state.nextTrack();
                }
            });

            // audioElement 상태 설정
            set({ audioElement: audio });
            resolve(); // audio 초기화 완료
        });
    },

    playTrack: async (track: Track, forcePlay = false) => {
        const state = get();

        // audioElement 초기화 확인
        if (!state.audioElement) {
            console.warn('audioElement가 초기화되지 않았습니다. 초기화 시작...');
            await state.initAudio();
        }

        const audio = get().audioElement; // 최신 상태 확인
        if (!audio) {
            console.error('audioElement가 초기화되지 않았습니다.');
            return;
        }

        // 같은 트랙 재생 시 강제로 재생 설정 (forcePlay)
        if (!forcePlay && state.currentTrack?.id === track.id) {
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
            await audio.play();

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
            set({
                currentTime: time,
                isSeeking: false
            });
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

    selectAlbum: async (albumTracks: Track[]) => {
        if (!albumTracks || albumTracks.length === 0) {
            console.warn('선택된 앨범에 트랙이 없습니다.');
            return;
        }

        console.log('앨범 선택: 대기열에 트랙 추가 중...');
        set({ queue: albumTracks });

        try {
            console.log('첫 번째 트랙 재생 시작:', albumTracks[0].title);
            await get().playTrack(albumTracks[0]);
        } catch (error) {
            console.error('앨범 트랙 재생 실패:', error);
        }
    },

    nextTrack: async () => {
        const state = get();

        // 현재 트랙이 대기열에 있는지 확인
        const currentIndex = state.queue.findIndex(
            (track) => track.id === state.currentTrack?.id
        );

        // 현재 트랙이 대기열에 없으면 동기화
        if (currentIndex === -1) {
            console.warn('현재 트랙이 대기열에 없습니다. 동기화 중...');
            const trackInQueue = state.queue.find(
                (track) => track.id === state.currentTrack?.id
            );
            if (trackInQueue) {
                set({ currentTrack: trackInQueue });
            } else {
                console.error('대기열에서 현재 트랙을 찾을 수 없습니다.');
                return;
            }
        }

        let nextIndex = currentIndex + 1;

        // 대기열 끝 처리
        if (nextIndex >= state.queue.length) {
            if (state.repeat === 'all') {
                console.log('반복 설정이 "all"입니다. 대기열의 처음으로 이동합니다.');
                nextIndex = 0;
            } else {
                console.log('대기열 끝입니다. 반복 설정이 없습니다.');
                set({ isPlaying: false });
                return;
            }
        }

        const nextTrack = state.queue[nextIndex];
        if (nextTrack) {
            console.log(`다음 트랙으로 이동: ${nextTrack.title}`);
            await state.playTrack(nextTrack);
        } else {
            console.warn('다음 트랙을 찾을 수 없습니다.');
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
