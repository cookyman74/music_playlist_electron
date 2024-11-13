// utils/youtubeUtils.ts
interface UrlValidation {
    isValid: boolean;
    error?: string;
}

export const isValidYoutubePlaylistUrl = (url: string): UrlValidation => {
    if (!url) {
        return {
            isValid: false,
            error: 'URL을 입력해주세요.'
        };
    }

    try {
        const urlObject = new URL(url);

        // YouTube 도메인 확인
        if (!urlObject.hostname.includes('youtube.com')) {
            return {
                isValid: false,
                error: 'YouTube URL이 아닙니다.'
            };
        }

        // 재생목록 URL 형식 확인
        if (!urlObject.pathname.includes('/playlist') && !url.includes('list=')) {
            return {
                isValid: false,
                error: '올바른 재생목록 URL이 아닙니다.'
            };
        }

        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: '올바른 URL 형식이 아닙니다.'
        };
    }
};
