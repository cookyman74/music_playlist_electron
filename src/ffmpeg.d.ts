// ffmpeg.d.ts
declare module '@ffmpeg/ffmpeg' {
    export function createFFmpeg(options?: any): any;
    export function fetchFile(url: string | File): Promise<Uint8Array>;
}
