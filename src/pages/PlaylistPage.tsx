// pages/PlaylistPage.tsx (Part 1)
import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Drawer,
    Alert,
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    Shuffle,
    Star,
    StarBorder,
    Add,
    Download,
    PlaylistPlay,
    Favorite,
    QueueMusic,
} from '@mui/icons-material';
import { DatabaseContext } from '../App';
import { Track, Playlist } from '../types';
import DefaultCover from "../components/DefaultCover";
import AudioPlayer from '../components/Player/AudioPlayer';
import {formatDuration} from "../utils/audioUtils";

const ROOT_BOX_HEIGHT = 'calc(100vh - 64px)';
const drawerWidth = 240;

// 플레이리스트 타입 정의
type ViewType = 'all' | 'favorites' | 'playlist';

interface ViewState {
    type: ViewType;
    playlistId?: number;
    title: string;
}

const PlaylistPage: React.FC = () => {
    const dbService = useContext(DatabaseContext);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [viewState, setViewState] = useState<ViewState>({ type: 'all', title: '모든 음악' });
    const [tracks, setTracks] = useState<Track[]>([]);

    // 재생 관련 상태
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
    const [audioError, setAudioError] = useState<string | null>(null);

    // 트랙 로드 함수
    const loadTracks = async () => {
        if (!dbService) return;

        try {
            let loadedTracks: Track[] = [];

            switch (viewState.type) {
                case 'all':
                    loadedTracks = await dbService.getAllTracks();
                    break;
                case 'favorites':
                    loadedTracks = await dbService.getFavorites();
                    break;
                case 'playlist':
                    if (viewState.playlistId) {
                        loadedTracks = await dbService.getTracksByPlaylistId(viewState.playlistId);
                    }
                    break;
            }

            setTracks(loadedTracks);
        } catch (error) {
            console.error('트랙 로드 실패:', error);
        }
    };

    // 초기 데이터 로드
    useEffect(() => {
        const loadInitialData = async () => {
            if (!dbService) return;
            try {
                const loadedPlaylists = await dbService.getAllPlaylists();
                setPlaylists(loadedPlaylists);
                loadTracks();
            } catch (error) {
                console.error('초기 데이터 로드 실패:', error);
            }
        };

        loadInitialData();
    }, [dbService]);

    // viewState 변경 시 트랙 리로드
    useEffect(() => {
        loadTracks();
    }, [viewState]);

    // 뷰 변경 핸들러
    const handleViewChange = (newView: ViewState) => {
        setViewState(newView);
    };

    // 재생 관련 핸들러
    const handlePlayTrack = (track: Track) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
        }
    };

    const handleToggleFavorite = async (track: Track) => {
        if (!dbService || typeof track.id !== 'number') return;
        try {
            await dbService.toggleFavorite(track.id);
            loadTracks(); // 현재 뷰의 트랙 리스트 새로고침
        } catch (error) {
            console.error('즐겨찾기 토글 실패:', error);
        }
    };

    // 커버 이미지 렌더링 컴포넌트
    const CoverImage = ({ track, size = 200 }: { track?: Track; size?: number }) => {
        const [imageError, setImageError] = useState(false);

        if (!track?.absolute_thumbnail_path || imageError) {
            return <DefaultCover width={size} height={size} />;
        }

        return (
            <Box
                component="div"
                sx={{
                    width: size,
                    height: size,
                    overflow: 'hidden',
                    borderRadius: 1,
                    backgroundColor: '#e0e0e0',
                }}
            >
                <img
                    src={track.absolute_thumbnail_path}
                    alt="Cover"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    onError={() => setImageError(true)}
                />
            </Box>
        );
    };

    const handlePlayPlaylist = () => {
        if (tracks.length > 0) {
            handlePlayTrack(tracks[0]);
        }
    };

    const handleShufflePlaylist = () => {
        if (tracks.length > 0) {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            setShuffledTracks(shuffled);
            handlePlayTrack(shuffled[0]);
        }
    };

    const handleTrackEnded = () => {
        const currentList = shuffledTracks.length > 0 ? shuffledTracks : tracks;
        const currentIndex = currentList.findIndex(track => track.id === currentTrack?.id);

        if (currentIndex < currentList.length - 1) {
            handlePlayTrack(currentList[currentIndex + 1]);
        }
    };

    const handleAudioError = (error: Error) => {
        setAudioError(error.message);
        setIsPlaying(false);
    };

    return (
        <Box sx={{ display: 'flex', height: ROOT_BOX_HEIGHT, marginTop: '64px' }}>
            {/* 왼쪽 메뉴 */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        height: ROOT_BOX_HEIGHT,
                        top: '64px',
                    },
                }}
            >
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            selected={viewState.type === 'all'}
                            onClick={() => handleViewChange({ type: 'all', title: '모든 음악' })}
                        >
                            <ListItemIcon><QueueMusic /></ListItemIcon>
                            <ListItemText primary="모든 음악" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            selected={viewState.type === 'favorites'}
                            onClick={() => handleViewChange({ type: 'favorites', title: '즐겨찾기' })}
                        >
                            <ListItemIcon><Favorite /></ListItemIcon>
                            <ListItemText primary="즐겨찾기" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem>
                        <Typography variant="subtitle2" color="text.secondary">
                            플레이리스트
                        </Typography>
                    </ListItem>

                    {playlists.map((playlist) => (
                        <ListItem key={playlist.id} disablePadding>
                            <ListItemButton
                                selected={viewState.type === 'playlist' && viewState.playlistId === playlist.id}
                                onClick={() => handleViewChange({
                                    type: 'playlist',
                                    playlistId: playlist.id,
                                    title: playlist.title
                                })}
                            >
                                <ListItemIcon><PlaylistPlay /></ListItemIcon>
                                <ListItemText primary={playlist.title} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* 메인 컨텐츠 */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <CoverImage track={currentTrack || tracks[0]} />
                        </Grid>
                        <Grid item xs>
                            <Typography variant="h4">{viewState.title}</Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                {tracks.length} 트랙
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                                    onClick={handlePlayPlaylist}
                                    sx={{ mr: 1 }}
                                >
                                    {isPlaying ? '일시정지' : '재생'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Shuffle />}
                                    onClick={handleShufflePlaylist}
                                >
                                    셔플
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {currentTrack && (
                    <AudioPlayer
                        track={currentTrack}
                        onEnded={handleTrackEnded}
                        onError={handleAudioError}
                    />
                )}

                {audioError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {audioError}
                    </Alert>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox"></TableCell>
                                <TableCell>제목</TableCell>
                                <TableCell>아티스트</TableCell>
                                <TableCell>재생시간</TableCell>
                                <TableCell align="right">액션</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tracks.map((track) => (
                                <TableRow
                                    key={track.id}
                                    hover
                                    selected={currentTrack?.id === track.id}
                                >
                                    <TableCell padding="checkbox">
                                        <IconButton onClick={() => handlePlayTrack(track)}>
                                            {currentTrack?.id === track.id && isPlaying ?
                                                <Pause /> : <PlayArrow />}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CoverImage track={track} size={40} />
                                            <Typography sx={{ ml: 2 }}>{track.title}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{track.artist || 'Unknown'}</TableCell>
                                    <TableCell>{formatDuration(track.duration)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleToggleFavorite(track)}>
                                            {track.is_favorite ?
                                                <Star color="primary" /> : <StarBorder />}
                                        </IconButton>
                                        <IconButton disabled={!track.absolute_file_path}>
                                            {track.download_status === 'completed' ? (
                                                <Download color="success" />
                                            ) : track.download_status === 'downloading' ? (
                                                <Download color="action" />
                                            ) : (
                                                <Download />
                                            )}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default PlaylistPage;
