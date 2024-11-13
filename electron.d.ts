// types/electron.d.ts
declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                send: (channel: string, data: any) => void;
                on: (channel: string, func: Function) => void;
                once: (channel: string, func: Function) => void;
                removeListener: (channel: string, func: Function) => void;
                invoke: (channel: string, ...args: any[]) => Promise<any>;  // 추가
            };
            getPath: (name: string) => Promise<string>;
            getAudioUrl: (filePath: string) => Promise<string>;
        };
    }
}

export {};
