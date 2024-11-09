import mockPlaylist from '../data/mockPlaylist.json';

export interface Track {
    id: number;
    title: string;
    artist: string;
    src: string;
}

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
}

// 재생 목록을 가져오는 함수
export const fetchPlaylist = async (): Promise<Track[]> => {
    // 실제 API 요청이 필요한 경우, 아래 코드를 사용합니다.
    // const response = await fetch("https://example.com/api/playlist");
    // if (!response.ok) throw new Error("Failed to fetch playlist");
    // return await response.json();

    // Mock 데이터 사용
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockPlaylist as Track[]), 500); // 0.5초 딜레이 후 데이터 반환
    });
};
