import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppBar, Button, Container, Toolbar } from "@mui/material";
import HomePage from "./pages/HomePage";
import PlaylistPage from "./pages/PlaylistPage";
import SettingsPage from "./pages/SettingsPage";
import DownloadButton from "./components/DownloadButton";
import { DatabaseError, initDB } from "./services/db-init";
import { DatabaseService } from "./services/db.service";

export const DatabaseContext = React.createContext<DatabaseService | null>(null);

const App: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [dbService, setDbService] = useState<DatabaseService | null>(null);

    useEffect(() => {
        const setupDatabase = async () => {
            try {
                const db = await initDB()
                const service = new DatabaseService(db)
                setDbService(service);
            } catch (err) {
                if (err instanceof DatabaseError) {
                    setError(err.message);
                } else {
                    setError("데이터베이스 초기화 중 알 수 없는 오류가 발생되었습니다.");
                }
                console.error("Database initialization error:", err);
            }
        };

        setupDatabase();
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!dbService) {
        return <div>Loading...</div>;
    }

    return (
        <DatabaseContext.Provider value={dbService}>
            <Router>
                <AppBar position="static">
                    <Toolbar>
                        <Button color="inherit" component={Link} to="/">
                            홈
                        </Button>
                        <Button color="inherit" component={Link} to="/playlist">
                            재생 목록
                        </Button>
                        <Button color="inherit" component={Link} to="/settings">
                            설정
                        </Button>
                        <Button color="inherit" component={Link} to="/download">
                            다운로드
                        </Button>
                    </Toolbar>
                </AppBar>
                <Container style={{ marginTop: '2rem' }}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/playlist" element={<PlaylistPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/download" element={<DownloadButton />} />
                    </Routes>
                </Container>
            </Router>
        </DatabaseContext.Provider>
    );
};

export default App;
