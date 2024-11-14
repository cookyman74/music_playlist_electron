// services/db.service.ts
import { Track, Playlist, Settings, PlaylistInfo } from '../types';
import path from 'path-browserify';

export class DatabaseService {
    private db: IDBDatabase;
    private baseDirectory: string = './downloads'

    constructor(db: IDBDatabase) {
        this.db = db;
    }

    private getAbsolutePath(relativePath: string): string {
        const absolutePath = path.join(this.baseDirectory, relativePath);
        console.log(`Resolved Path: ${absolutePath}`); // 디버그 로그
        return absolutePath;
    }

    async addTrack(trackData: Omit<Track, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');

            const track = {
                ...trackData,
                is_favorite: false,
                created_at: new Date(),
                updated_at: new Date()
            };

            const request = store.add(track);

            request.onsuccess = () => {
                resolve(request.result as number);
            };

            request.onerror = () => {
                reject(new Error('트랙 추가 실패'));
            };
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
                    downloadPath: this.baseDirectory,
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


    // 모든 플레이리스트 가져오기
    async getAllPlaylists(): Promise<Playlist[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.getAll();

            request.onsuccess = () => {
                const playlists = request.result;
                // ID가 없는 플레이리스트는 필터링
                const validPlaylists = playlists.filter((playlist): playlist is Playlist =>
                    typeof playlist.id === 'number'
                );
                resolve(validPlaylists);
            };

            request.onerror = () => {
                reject(new Error('플레이리스트 로드 실패'));
            };
        });
    }

    // 특정 플레이리스트의 모든 트랙 가져오기
    async getTracksByPlaylistId(playlistId: number): Promise<Track[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const index = store.index('playlist_id');
            const request = index.getAll(IDBKeyRange.only(playlistId));

            request.onsuccess = () => {
                const tracks = request.result.map(track => ({
                    ...track,
                    file_path: track.file_path,
                    thumbnail_path: track.thumbnail_path
                }));
                resolve(tracks);
            };

            request.onerror = () => {
                reject(new Error('트랙 로드 실패'));
            };
        });
    }

    // 즐겨찾기 토글
    async toggleFavorite(trackId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.get(trackId);

            request.onsuccess = () => {
                const track = request.result;
                if (track) {
                    track.is_favorite = !track.is_favorite;
                    store.put(track);
                    resolve();
                } else {
                    reject(new Error('트랙을 찾을 수 없습니다.'));
                }
            };

            request.onerror = () => {
                reject(new Error('즐겨찾기 토글 실패'));
            };
        });
    }

    // 즐겨찾기된 트랙 가져오기
    async getFavorites(): Promise<Track[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const request = store.getAll();

            request.onsuccess = () => {
                const tracks = request.result;
                // ID가 있고 즐겨찾기된 트랙만 필터링
                const favorites = tracks.filter((track): track is Track =>
                    typeof track.id === 'number' && track.is_favorite
                );
                resolve(favorites);
            };

            request.onerror = () => {
                reject(new Error('즐겨찾기 목록 로드 실패'));
            };
        });
    }


    // 모든 Playlist 가져오기 메소드
    async getAllTracks(): Promise<Track[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(new Error('모든 트랙 로드 실패'));
            };
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
            // 'playlists'와 'tracks' 모두를 포함하는 트랜잭션 생성
            const transaction = this.db.transaction(['playlists', 'tracks'], 'readwrite');
            const playlistStore = transaction.objectStore('playlists');
            const trackStore = transaction.objectStore('tracks');

            // 트랜잭션 에러 처리
            transaction.onerror = () => {
                reject(new Error('Transaction failed: ' + transaction.error));
            };

            // 먼저 동일한 playlist_id가 있는지 확인
            const index = playlistStore.index('playlist_id');
            const checkRequest = index.get(playlistInfo.playlist_id);

            checkRequest.onsuccess = () => {
                if (checkRequest.result) {
                    // 이미 존재하는 플레이리스트면 기존 id 반환
                    resolve(checkRequest.result.id);
                    return;
                }

                // 새로운 플레이리스트 추가
                const addRequest = playlistStore.add({
                    playlist_id: playlistInfo.playlist_id,
                    title: playlistInfo.title,
                    uploader: playlistInfo.uploader,
                    source: 'youtube',
                    download_started_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date()
                });

                addRequest.onsuccess = () => {
                    const playlistId = addRequest.result as number;

                    // 트랙 추가
                    const trackPromises = playlistInfo.tracks.map(track => {
                        return new Promise<void>((resolveTrack, rejectTrack) => {
                            const trackRequest = trackStore.add({
                                playlist_id: playlistId,
                                track_id: track.id,
                                title: track.title,
                                duration: track.duration,
                                url: track.url,
                                download_status: 'pending',
                                is_favorite: false,
                                created_at: new Date(),
                                updated_at: new Date()
                            });

                            trackRequest.onsuccess = () => resolveTrack();
                            trackRequest.onerror = () => rejectTrack(trackRequest.error);
                        });
                    });

                    // 모든 트랙 추가 완료 대기
                    Promise.all(trackPromises)
                        .then(() => resolve(playlistId))
                        .catch(error => reject(error));
                };

                addRequest.onerror = () => {
                    reject(new Error('플레이리스트 추가 실패: ' + addRequest.error));
                };
            };

            checkRequest.onerror = () => {
                reject(new Error('플레이리스트 중복 확인 실패: ' + checkRequest.error));
            };
        });
    }

    // 플레이리스트 삭제
    async deletePlaylist(playlistId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists', 'tracks'], 'readwrite');

            // 플레이리스트 삭제
            const playlistStore = transaction.objectStore('playlists');
            playlistStore.delete(playlistId);

            // 관련 트랙들 삭제
            const trackStore = transaction.objectStore('tracks');
            const index = trackStore.index('playlist_id');
            const request = index.getAllKeys(IDBKeyRange.only(playlistId));

            request.onsuccess = () => {
                const trackKeys = request.result;
                trackKeys.forEach(key => {
                    trackStore.delete(key);
                });
                resolve();
            };

            request.onerror = () => {
                reject(new Error('플레이리스트 삭제 실패'));
            };
        });
    }

    // 플레이리스트 업데이트
    async updatePlaylist(playlistId: number, updates: Partial<Omit<Playlist, 'id'>>): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.get(playlistId);

            request.onsuccess = () => {
                const playlist = request.result;
                if (!playlist) {
                    reject(new Error('플레이리스트를 찾을 수 없습니다.'));
                    return;
                }

                const updatedPlaylist = {
                    ...playlist,
                    ...updates,
                    updated_at: new Date()
                };

                const putRequest = store.put(updatedPlaylist);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(new Error('플레이리스트 업데이트 실패'));
            };

            request.onerror = () => {
                reject(new Error('플레이리스트 조회 실패'));
            };
        });
    }

    // 트랙 정보 업데이트
    async updateTrack(trackId: number, updates: Partial<Track>): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const request = store.get(trackId);

            request.onsuccess = () => {
                const track = request.result;
                if (track) {
                    const updatedTrack = {
                        ...track,
                        ...updates,
                        updated_at: new Date()
                    };
                    store.put(updatedTrack);
                    resolve();
                } else {
                    reject(new Error('트랙을 찾을 수 없습니다.'));
                }
            };

            request.onerror = () => {
                reject(new Error('트랙 업데이트 실패'));
            };
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
                    // 파일 경로에 'downloads' 디렉토리를 포함하여 절대 경로 생성
                    const absoluteFilePath = filePath ? this.getAbsolutePath(filePath) : null;
                    const absoluteThumbnailPath = thumbnailPath ? this.getAbsolutePath(thumbnailPath) : null;

                    const updatedTrack = {
                        ...track,
                        download_status: status,
                        file_path: filePath,
                        absolute_file_path: absoluteFilePath,
                        thumbnail_path: thumbnailPath,
                        absolute_thumbnail_path: absoluteThumbnailPath,
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
