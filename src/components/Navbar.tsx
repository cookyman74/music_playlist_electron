import React, { useContext, useEffect, useState } from 'react';
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Collapse,
} from '@mui/material';
import {
    Home,
    PlaylistPlay,
    LibraryMusic,
    CloudDownload,
    Settings,
    ExpandLess,
    ExpandMore,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { DatabaseContext } from '../App';
import { Playlist } from '../types';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dbService = useContext(DatabaseContext);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [playlistOpen, setPlaylistOpen] = useState(true);

    const loadPlaylists = async () => {
        if (!dbService) return;
        try {
            const lists = await dbService.getAllPlaylists();
            setPlaylists(lists);
        } catch (error) {
            console.error('플레이리스트 로드 실패:', error);
        }
    };

    useEffect(() => {
        loadPlaylists();
    }, [dbService]);

    return (
        <List component="nav" sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {/* 홈 메뉴 */}
            <ListItemButton
                selected={location.pathname === '/'}
                onClick={() => navigate('/')}
            >
                <ListItemIcon><Home /></ListItemIcon>
                <ListItemText primary="홈" />
            </ListItemButton>

            {/* 플레이리스트 */}
            <ListItemButton onClick={() => setPlaylistOpen(!playlistOpen)}>
                <ListItemIcon><PlaylistPlay /></ListItemIcon>
                <ListItemText primary="플레이리스트" />
                {playlistOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={playlistOpen} timeout="auto" unmountOnExit>
                {playlists.map((playlist, index) => (
                    <ListItemButton
                        key={index}
                        selected={location.pathname === `/playlist/${playlist.id}`}
                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                        sx={{ pl: 4 }}
                    >
                        <ListItemText primary={playlist.title} />
                    </ListItemButton>
                ))}
            </Collapse>

            <Divider sx={{ my: 1 }} />

            {/* 앨범 */}
            <ListItemButton onClick={() => navigate('/albums')}>
                <ListItemIcon><LibraryMusic /></ListItemIcon>
                <ListItemText primary="앨범" />
            </ListItemButton>

            {/* 다운로드 */}
            <ListItemButton onClick={() => navigate('/download')}>
                <ListItemIcon><CloudDownload /></ListItemIcon>
                <ListItemText primary="다운로드" />
            </ListItemButton>

            {/* 설정 */}
            <ListItemButton onClick={() => navigate('/settings')}>
                <ListItemIcon><Settings /></ListItemIcon>
                <ListItemText primary="설정" />
            </ListItemButton>
        </List>
    );
};

export default Navbar;
