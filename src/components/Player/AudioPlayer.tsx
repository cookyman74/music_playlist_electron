import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeMute } from '@mui/icons-material';
import { Track } from '../../types';
import { AudioController, formatDuration } from '../../utils/audioUtils';

interface AudioPlayerProps {
    track: Track;
    onEnded?: () => void;
    onError?: (error: Error) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onEnded, onError }) => {
    const audioController = useRef<AudioController | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        audioController.current = new AudioController();

        audioController.current.setHandlers({
            onEnded,
            onError,
            onPlay: () => setIsPlaying(true),
            onPause: () => setIsPlaying(false),
            onTimeUpdate: setCurrentTime,
            onDurationChange: (newDuration) => {
                console.log('Duration changed:', newDuration);
                setDuration(newDuration);
            }
        });

        return () => {
            audioController.current?.cleanup();
            audioController.current = null;
        };
    }, []);

    useEffect(() => {
        const initializeTrack = async () => {
            if (!audioController.current) return;

            try {
                await audioController.current.setTrack(track);
                if (isPlaying) {
                    await audioController.current.play();
                }
            } catch (error) {
                console.error('트랙 초기화 실패:', error);
                onError?.(error as Error);
            }
        };

        initializeTrack();
    }, [track]);

    const togglePlay = async () => {
        if (!audioController.current) return;

        try {
            if (isPlaying) {
                audioController.current.pause();
            } else {
                await audioController.current.play();
            }
        } catch (error) {
            console.error('재생 토글 실패:', error);
            onError?.(error as Error);
        }
    };

    const handleTimeChange = (_: Event, newValue: number | number[]) => {
        if (!audioController.current || typeof newValue !== 'number') return;
        audioController.current.seek(newValue);
    };

    const handleVolumeChange = (_: Event, newValue: number | number[]) => {
        if (!audioController.current || typeof newValue !== 'number') return;
        setVolume(newValue);
        setIsMuted(newValue === 0);
        audioController.current.setVolume(newValue);
    };

    const toggleMute = () => {
        if (!audioController.current) return;
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        audioController.current.setVolume(newMuted ? 0 : volume);
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={togglePlay}>
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
