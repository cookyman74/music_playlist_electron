// src/utils/youtubeUtils.ts

/**
 * YouTube URL 타입 정의
 */
export type YouTubeURLType = 'playlist' | 'video' | 'invalid';

/**
 * YouTube URL 검증 결과 인터페이스
 */
export interface YouTubeURLValidationResult {
    isValid: boolean;
    type: YouTubeURLType;
    id?: string;
    error?: string;
}

/**
 * YouTube 재생목록 URL 검증
 */
export const isValidYoutubePlaylistUrl = (url: string): YouTubeURLValidationResult => {
    try {
        const urlObj = new URL(url);

        // YouTube 도메인 검증
        if (!urlObj.hostname.includes('youtube.com')) {
            return {
                isValid: false,
                type: 'invalid',
                error: 'YouTube URL이 아닙니다.'
            };
        }

        // 재생목록 ID 추출
        const playlistId = urlObj.searchParams.get('list');

        // 재생목록 패턴 검증
        if (urlObj.pathname === '/playlist' && playlistId) {
            const playlistPattern = /^PL[a-zA-Z0-9_-]{16,}$/;
            if (playlistPattern.test(playlistId)) {
                return {
                    isValid: true,
                    type: 'playlist',
                    id: playlistId
                };
            }
        }

        // 잘못된 재생목록 URL
        return {
            isValid: false,
            type: 'invalid',
            error: '올바른 YouTube 재생목록 URL이 아닙니다.'
        };

    } catch (error) {
        return {
            isValid: false,
            type: 'invalid',
            error: '올바르지 않은 URL 형식입니다.'
        };
    }
};

/**
 * YouTube URL에서 재생목록 ID 추출
 */
export const extractPlaylistId = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('list');
    } catch {
        return null;
    }
};

/**
 * YouTube 재생목록 URL 생성
 */
export const createPlaylistUrl = (playlistId: string): string => {
    return `https://www.youtube.com/playlist?list=${playlistId}`;
};

// 예시 사용:
// 올바른 재생목록 URL: https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxx
// 잘못된 URL: https://www.youtube.com/watch?v=xxxxx
