// src/components/Playlist/Playlist.tsx
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, LinearProgress } from '@mui/material';
import { Track } from '../../services/api';

interface PlaylistProps {
    tracks: Track[];
    onSelectTrack: (track: Track) => void;
    onDownloadTrack: (trackId: number) => void; // 다운로드 트리거
    onCancelDownload: (trackId: number) => void; // 다운로드 취소 트리거
    downloadingTracks: { [key: number]: number }; // 각 트랙의 진행률
}

const Playlist: React.FC<PlaylistProps> = ({ tracks, onSelectTrack, onDownloadTrack, onCancelDownload, downloadingTracks }) => {
    return (
        <Box>
            <Typography variant="h5">재생 목록</Typography>
            <List>
                {tracks.map((track) => (
                    <ListItem key={track.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <ListItemText primary={track.title} secondary={track.artist} onClick={() => onSelectTrack(track)} />
                        {downloadingTracks[track.id] !== undefined && (
                            <Box width="100%" ml={2}>
                                <LinearProgress variant="determinate" value={downloadingTracks[track.id]} />
                            </Box>
                        )}
                        <Button
                            variant="outlined"
                            color={downloadingTracks[track.id] !== undefined ? "warning" : "primary"} // 경고 색상 설정
                            onClick={() => onDownloadTrack(track.id) !== undefined ? onCancelDownload(track.id) : onDownloadTrack(track.id)}>
                            { downloadingTracks[track.id] !== undefined ? "취소" : "다운로드"}
                        </Button>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default Playlist;
