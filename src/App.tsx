// src/App.tsx
import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { DatabaseService } from './services/db.service';
import { initDB, DatabaseError } from './services/db-init';
import Layout from './components/Layout';
import PlaylistPage from './pages/PlaylistPage';
import DownloadPage from './pages/DownloadPage';
import SettingsPage from './pages/SettingsPage';

export const DatabaseContext = createContext<DatabaseService | null>(null);
export const ThemeContext = createContext({ toggleColorMode: () => {} });

function App() {
    const [dbService, setDbService] = useState<DatabaseService | null>(null);
    const [mode, setMode] = useState<'light' | 'dark'>('light');

    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        [],
    );

    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode],
    );

    useEffect(() => {
        const initializeDb = async () => {
            try {
                const db = await initDB();
                const baseDirectory = await window.electron?.getPath('userData') || './downloads';
                const service = new DatabaseService(db, baseDirectory);
                setDbService(service);
            } catch (err) {
                if (err instanceof DatabaseError) {
                    console.error('데이터베이스 초기화 실패:', err.message);
                } else {
                    console.error('알 수 없는 오류:', err);
                }
            }
        };

        initializeDb();
    }, []);

    return (
        <DatabaseContext.Provider value={dbService}>
            <ThemeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Router>
                        <Layout>
                            <Routes>
                                <Route path="/playlist" element={<PlaylistPage />} />
                                <Route path="/download" element={<DownloadPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                            </Routes>
                        </Layout>
                    </Router>
                </ThemeProvider>
            </ThemeContext.Provider>
        </DatabaseContext.Provider>
    );
}

export default App;
