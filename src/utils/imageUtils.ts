
export const checkImageExists = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url, {method: 'HEAD'});
        return response.ok;
    } catch {
        return false;
    }
};


export const getImageUrl = (path: string | undefined | null): string => {
    if (!path) return '';

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `${process.env.PUBLIC_URL}/${path}`;
}
