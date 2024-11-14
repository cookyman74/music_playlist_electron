import React, { useEffect } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeMute } from '@mui/icons-material';
import { Track } from '../../types';
import { formatDuration } from '../../utils/audioUtils';
import { usePlayerStore } from '../../store/playerStore';

interface AudioPlayerProps {
    track: Track;
    onEnded?: () => void;
    onError?: (error: Error) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onEnded, onError }) => {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        initAudio,
        playTrack,
        togglePlay,
        setVolume,
        toggleMute,
        seek
    } = usePlayerStore();

    useEffect(() => {
        if (!currentTrack) {
            playTrack(track).catch(onError);
        }
    }, []);

    const handlePlayClick = async () => {
        if (currentTrack?.id === track.id) {
            togglePlay();
        } else {
            await playTrack(track).catch(onError);
        }
    };

    useEffect(() => {
        const playNewTrack = async () => {
            if (currentTrack?.id !== track.id) {
                try {
                    await playTrack(track);
                } catch (error) {
                    onError?.(error as Error);
                }
            }
        };

        playNewTrack();
    }, [track.id]);

    const handleTimeChange = (_: Event, newValue: number | number[]) => {
        if (typeof newValue !== 'number') return;
        seek(newValue);
    };

    const handleVolumeChange = (_: Event, newValue: number | number[]) => {
        if (typeof newValue !== 'number') return;
        setVolume(newValue);
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={handlePlayClick}>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1 }}>
                    {formatDuration(currentTime)}
                </Typography>
                <Slider
                    value={currentTime}
                    max={duration || 0}
                    onChange={handleTimeChange}
                    sx={{ mx: 2 }}
                />
                <Typography variant="body2" sx={{ mx: 1 }}>
                    {formatDuration(duration)}
                </Typography>
                <IconButton onClick={toggleMute}>
                    {isMuted ? <VolumeMute /> : <VolumeUp />}
                </IconButton>
                <Slider
                    value={isMuted ? 0 : volume}
                    max={1}
                    step={0.01}
                    onChange={handleVolumeChange}
                    sx={{ width: 100, ml: 1 }}
                />
            </Box>
        </Box>
    );
};

export default AudioPlayer;
