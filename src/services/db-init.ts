// services/db-init.ts
import { Track, Playlist, Settings, Download } from '../types';

interface DBSchema extends IDBDatabase {
    transaction(storeNames: string[], mode?: IDBTransactionMode): IDBTransaction;
    createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore;
}

export class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export async function initDB(): Promise<DBSchema> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("musicAppDB", 3);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result as DBSchema;

            // 플레이리스트 스토어
            if (!db.objectStoreNames.contains("playlists")) {
                const playlistStore = db.createObjectStore("playlists", { keyPath: "id", autoIncrement: true });
                playlistStore.createIndex("title", "title", { unique: false });
                playlistStore.createIndex("url", "url", { unique: true });
                playlistStore.createIndex("source", "source", { unique: false });
                playlistStore.createIndex("createdAt", "createdAt", { unique: false });
            }

            // 트랙 스토어
            if (!db.objectStoreNames.contains("tracks")) {
                const trackStore = db.createObjectStore("tracks", { keyPath: "id", autoIncrement: true });
                trackStore.createIndex("playlist_id", "playlist_id", { unique: false });
                trackStore.createIndex("title", "title", { unique: false });
                trackStore.createIndex("artist", "artist", { unique: false });
                trackStore.createIndex("url", "url", { unique: false });
                trackStore.createIndex("file_path", "file_path", { unique: false });
                trackStore.createIndex("track_id", "track_id", { unique: false });  // track_id 인덱스 추가
                trackStore.createIndex("createdAt", "createdAt", { unique: false });
            }

            // 설정 스토어
            if (!db.objectStoreNames.contains("settings")) {
                const settingsStore = db.createObjectStore("settings", { keyPath: "key" });
                // 기본 설정 추가
                settingsStore.transaction.oncomplete = () => {
                    const settingsTransaction = db.transaction(["settings"], "readwrite");
                    const settingsStore = settingsTransaction.objectStore("settings");
                    const defaultSettings: Settings = {
                        downloadPath: './downloads',
                        preferredCodec: 'mp3',
                        preferredQuality: '192',
                        autoDownload: false,
                        maxConcurrentDownloads: 3,
                        defaultPlaylistSource: 'youtube'
                    };
                    Object.entries(defaultSettings).forEach(([key, value]) => {
                        settingsStore.add({ key, value });
                    });
                };
            }

            // 다운로드 상태 스토어
            if (!db.objectStoreNames.contains("downloads")) {
                const downloadStore = db.createObjectStore("downloads", { keyPath: "id", autoIncrement: true });
                downloadStore.createIndex("track_id", "track_id", { unique: true });
                downloadStore.createIndex("status", "status", { unique: false });
                downloadStore.createIndex("startedAt", "startedAt", { unique: false });
                downloadStore.createIndex("completedAt", "completedAt", { unique: false });
            }

            // 사용자 스토어
            // if (!db.objectStoreNames.contains("users")) {
            //     const userStore = db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
            //     userStore.createIndex("name", "name", { unique: true });
            //     userStore.createIndex("createdAt", "createdAt", { unique: false });
            // }

            console.log("데이터베이스 스키마가 성공적으로 초기화되었습니다.");
        };

        request.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result as DBSchema;
            console.log("데이터베이스 연결이 성공적으로 열렸습니다.");
            resolve(db);
        };

        request.onerror = (event: Event) => {
            const error = (event.target as IDBOpenDBRequest).error;
            console.error("데이터베이스 초기화 중 오류 발생:", error);
            reject(new DatabaseError(`데이터베이스 초기화 실패: ${error?.message}`));
        };
    });
}
