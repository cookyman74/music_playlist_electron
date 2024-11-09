// src/App.tsx

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppBar, Button, Container, Toolbar } from "@mui/material";
import HomePage from "./pages/HomePage";
import PlaylistPage from "./pages/PlaylistPage";
import SettingsPage from "./pages/SettingsPage";
import DownloadButton from "./components/DownloadButton";
import Converter from "./components/Converter";

const App: React.FC = () => {
    const [downloadPath, setDownloadPath] = useState<string | null>(null);

    return (
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
                    <Button color="inherit" component={Link} to="/convert">
                        변환
                    </Button>
                </Toolbar>
            </AppBar>
            <Container style={{ marginTop: '2rem' }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/playlist" element={<PlaylistPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/download" element={<DownloadButton onDownloadComplete={setDownloadPath} />} />
                    <Route path="/convert" element={<Converter downloadPath={downloadPath} />} />
                </Routes>
            </Container>
        </Router>
    );
};

export default App;
