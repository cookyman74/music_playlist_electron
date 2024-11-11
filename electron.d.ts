// electron.d.ts
export {};

declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                send: (channel: string, data?: any) => void;
                once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
                on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
                removeListener: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
            };
        };
    }
}
