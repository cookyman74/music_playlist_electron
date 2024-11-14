import {create} from "zustand";

interface GlobalState {
    theme: 'light' | 'dark';
    sidebar: {
        isOpen: boolean;
        width: number;
    };
    error: Error | null;

    setTheme: (theme: 'light' | 'dark') => void;
    toggleSidebar: () => void;
    setSidebarWidth: (width: number) => void;
    setError: (error: Error) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
    theme: 'light',
    sidebar: {
        isOpen: true,
        width: 240
    },
    error: null,

    setTheme: (theme) => set({ theme }),
    toggleSidebar: () => set((state) => ({
        sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen }
    })),
    setSidebarWidth: (width) => set((state) => ({
        sidebar: { ...state.sidebar, width }
    })),
    setError: (error) => set({ error })
}));
