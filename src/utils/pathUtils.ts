// utils/pathUtils.ts
import path from 'path-browserify';

export const getDefaultBaseDirectory = async (): Promise<string> => {
    if (window.electron) {
        try {
            const userDataPath = await window.electron.getPath('userData');
            return path.join(userDataPath, 'downloads');
        } catch (error) {
            console.error('기본 다운로드 경로 가져오기 실패:', error);
            return './downloads';
        }
    }
    return './downloads';
};

export const sanitizeFilePath = (filePath: string): string => {
    // 윈도우에서 허용되지 않는 문자 제거
    const invalidChars = /[<>:"|?*]/g;
    let sanitized = filePath.replace(invalidChars, '');

    // 경로 길이 제한 (Windows MAX_PATH = 260)
    const MAX_PATH = 260;
    if (sanitized.length > MAX_PATH) {
        const ext = path.extname(sanitized);
        const base = path.basename(sanitized, ext);
        const dir = path.dirname(sanitized);
        const newBase = base.slice(0, MAX_PATH - dir.length - ext.length - 1);
        sanitized = path.join(dir, newBase + ext);
    }

    return sanitized;
};

export const ensureDirectoryExists = async (directoryPath: string): Promise<void> => {
    if (window.electron) {
        await window.electron.ipcRenderer.invoke('ensure-directory', directoryPath);
    }
};

export const getAbsolutePath = (relativePath: string, baseDirectory: string): string => {
    if (path.isAbsolute(relativePath)) {
        return relativePath;
    }
    return path.resolve(baseDirectory, relativePath);
};
