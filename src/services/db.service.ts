// services/db.service.ts
import {Track, Playlist, Settings, Download, PlaylistInfo} from '../types';

export class DatabaseService {
    private db: IDBDatabase;

    constructor(db: IDBDatabase) {
        this.db = db;
    }

    // Playlist 관련 메서드
    // async addPlaylist(playlist: Omit<Playlist, 'id'>): Promise<number> {
    //     return new Promise((resolve, reject) => {
    //         const transaction = this.db.transaction(['playlists'], 'readwrite');
    //         const store = transaction.objectStore('playlists');
    //         const request = store.add(playlist);
    //
    //         request.onsuccess = () => resolve(request.result as number);
    //         request.onerror = () => reject(request.error);
    //     });
    // }

    async addTrack(track: Omit<Track, 'id'>): Promise<number> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.add(track);

            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async updateDownloadStatus(trackId: number, status: string, progress?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['downloads'], 'readwrite');
            const store = transaction.objectStore('downloads');
            const request = store.put({
                track_id: trackId,
                status,
                progress,
                updated_at: new Date()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSettings(): Promise<Settings> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.getAll();

            request.onsuccess = () => {
                const settingsArray = request.result;
                const settings = settingsArray.reduce((acc, curr) => ({
                    ...acc,
                    [curr.key]: curr.value
                }), {}) as Settings;

                // 기본값과 병합
                const defaultSettings: Settings = {
                    downloadPath: './downloads',
                    preferredCodec: 'mp3',
                    preferredQuality: '192',
                    autoDownload: false,
                    maxConcurrentDownloads: 3,
                    defaultPlaylistSource: 'youtube'
                };

                resolve({ ...defaultSettings, ...settings });
            };

            request.onerror = () => {
                reject(new Error('설정을 불러오는데 실패했습니다.'));
            };
        });
    }

    async updateSetting(key: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            // 기존 설정을 삭제하고 새로운 설정을 추가
            const request = store.put({ key, value });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`설정 "${key}" 업데이트 실패`));
        });
    }


    // 모든 Playlist 가져오기 메소드
    async getAllPlaylists(): Promise<Playlist[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result as Playlist[]);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Playlist 추가 또는 업데이트 메소드
    async setPlaylist(playlist: Playlist): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.put(playlist); // `put` 메소드는 기존 id가 있으면 업데이트, 없으면 추가

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async addPlaylist(playlistInfo: PlaylistInfo): Promise<number> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists', 'tracks'], 'readwrite');

            // 플레이리스트 저장
            const playlistStore = transaction.objectStore('playlists');
            const playlistRequest = playlistStore.add({
                playlist_id: playlistInfo.playlist_id,
                title: playlistInfo.title,
                uploader: playlistInfo.uploader,
                download_started_at: new Date(),
            });

            playlistRequest.onsuccess = async () => {
                const playlistId = playlistRequest.result as number;

                // 트랙 저장
                const trackStore = transaction.objectStore('tracks');
                const trackPromises = playlistInfo.tracks.map(track => {
                    return new Promise((resolveTrack, rejectTrack) => {
                        const trackRequest = trackStore.add({
                            playlist_id: playlistId,
                            track_id: track.id,
                            title: track.title,
                            duration: track.duration,
                            url: track.url,
                            download_status: 'pending',
                            created_at: new Date()
                        });

                        trackRequest.onsuccess = () => resolveTrack(true);
                        trackRequest.onerror = () => rejectTrack(trackRequest.error);
                    });
                });

                try {
                    await Promise.all(trackPromises);
                    resolve(playlistId);
                } catch (error) {
                    reject(error);
                }
            };

            playlistRequest.onerror = () => reject(playlistRequest.error);
        });
    }

    async updateTrackStatus(
        trackId: string,
        status: 'completed' | 'failed',
        filePath?: string | null,
        thumbnailPath?: string | null,
        error?: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const index = store.index('track_id');

            const request = index.get(trackId);

            request.onsuccess = () => {
                const track = request.result;
                if (track) {
                    const updatedTrack = {
                        ...track,
                        download_status: status,
                        file_path: filePath || track.file_path,
                        thumbnail_path: thumbnailPath || track.thumbnail_path,
                        error: error || null,
                        completed_at: new Date(),
                        updated_at: new Date()
                    };

                    const updateRequest = store.put(updatedTrack);

                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error(`Track not found with ID: ${trackId}`));
                }
            };

            request.onerror = () => reject(request.error);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Track 진행률 업데이트를 위한 새로운 메서드
    async updateTrackProgress(
        trackId: string,
        progress: number,
        status: 'downloading' = 'downloading'
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const index = store.index('track_id');

            const request = index.get(trackId);

            request.onsuccess = () => {
                const track = request.result;
                if (track) {
                    const updatedTrack = {
                        ...track,
                        download_status: status,
                        progress: progress,
                        updated_at: new Date()
                    };

                    const updateRequest = store.put(updatedTrack);

                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error(`Track not found with ID: ${trackId}`));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // 재생목록 다운로드 상태 조회 메서드 추가
    async getPlaylistDownloadStatus(playlistId: number): Promise<{
        total: number;
        completed: number;
        failed: number;
        downloading: number;
    }> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const index = store.index('playlist_id');
            const request = index.getAll(IDBKeyRange.only(playlistId));

            request.onsuccess = () => {
                const tracks = request.result;
                const status = {
                    total: tracks.length,
                    completed: tracks.filter(t => t.download_status === 'completed').length,
                    failed: tracks.filter(t => t.download_status === 'failed').length,
                    downloading: tracks.filter(t => t.download_status === 'downloading').length
                };
                resolve(status);
            };

            request.onerror = () => reject(request.error);
        });
    }
}
