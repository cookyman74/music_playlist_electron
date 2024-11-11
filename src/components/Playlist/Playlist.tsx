import React, { useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, LinearProgress } from '@mui/material';
import { Track } from '../../services/api';

interface PlaylistProps {
    tracks: Track[];
    onSelectTrack: (track: Track) => void;
    onDownloadTrack: (trackId: number) => void;
    onCancelDownload: (trackId: number) => void;
    downloadingTracks: { [key: number]: number };
}

const Playlist: React.FC<PlaylistProps> = ({ tracks, onSelectTrack, onDownloadTrack, onCancelDownload, downloadingTracks }) => {

    useEffect(() => {
        const handleProgress = (event: any, { url, progress }: any) => {
            console.log(`Progress for ${url}: ${progress}%`);
        };

        const handleComplete = (event: any, { url, success }: any) => {
            console.log(`Download ${success ? 'completed' : 'failed'} for ${url}`);
        };

        if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.on('download-progress', handleProgress);
            window.electron.ipcRenderer.on('download-complete', handleComplete);
        }

        return () => {
            if (window.electron && window.electron.ipcRenderer) {
                window.electron.ipcRenderer.removeListener('download-progress', handleProgress);
                window.electron.ipcRenderer.removeListener('download-complete', handleComplete);
            }
        };
    }, []);

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
                            color={downloadingTracks[track.id] !== undefined ? "warning" : "primary"}
                            onClick={() => downloadingTracks[track.id] !== undefined ? onCancelDownload(track.id) : onDownloadTrack(track.id)}>
                            {downloadingTracks[track.id] !== undefined ? "취소" : "다운로드"}
                        </Button>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default Playlist;
