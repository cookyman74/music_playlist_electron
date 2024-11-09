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
    if (!accessToken) throw new Error('로그인이 필요 합니다.');

    const response = await fetch("https//api.spotify.com/v1/me/playlist", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
    if (!response.ok) throw new Error("재생목록을 가져오는 데 실패했습니다.");
    return response.json();
    // 실제 API 요청이 필요한 경우, 아래 코드를 사용합니다.
    // const response = await fetch("https://example.com/api/playlist");
    // if (!response.ok) throw new Error("Failed to fetch playlist");
    // return await response.json();
};
