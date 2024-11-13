// src/types/path-browserify.d.ts
declare module 'path-browserify' {
    export interface PlatformPath {
        normalize(p: string): string;
        join(...paths: string[]): string;
        resolve(...pathSegments: string[]): string;
        isAbsolute(p: string): boolean;
        relative(from: string, to: string): string;
        dirname(p: string): string;
        basename(p: string, ext?: string): string;
        extname(p: string): string;
        parse(p: string): {
            root: string;
            dir: string;
            base: string;
            ext: string;
            name: string;
        };
        sep: string;
        delimiter: string;
    }

    const path: PlatformPath;
    export default path;
}
