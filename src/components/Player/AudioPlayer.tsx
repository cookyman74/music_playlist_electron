// components/AudioPlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeMute } from '@mui/icons-material';
import { Track } from '../../types';

interface AudioPlayerProps {
    track: Track;
    onEnded?: () => void;
    onError?: (error: Error) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onEnded, onError }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!track.file_path && !track.absolute_file_path) {
            if (onError) {
                onError(new Error('재생할 수 있는 오디오 파일이 없습니다.'));
            }
            return;
        }

        const audio = new Audio(track.absolute_file_path || track.file_path);
        audioRef.current = audio;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            if (onEnded) onEnded();
        };

        const handleError = (e: ErrorEvent) => {
            console.error('오디오 로드 실패:', e);
            if (onError) {
                onError(new Error(`오디오 파일 재생 실패: ${e.message}`));
            }
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audioRef.current = null;
        };
    }, [track.file_path, track.absolute_file_path]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(error => {
                if (onError) onError(error);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeChange = (event: Event, newValue: number | number[]) => {
        if (!audioRef.current || typeof newValue !== 'number') return;

        audioRef.current.currentTime = newValue;
        setCurrentTime(newValue);
    };

    const handleVolumeChange = (event: Event, newValue: number | number[]) => {
        if (!audioRef.current || typeof newValue !== 'number') return;

        audioRef.current.volume = newValue;
        setVolume(newValue);
        setIsMuted(newValue === 0);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;

        const newMuted = !isMuted;
        audioRef.current.volume = newMuted ? 0 : volume;
        setIsMuted(newMuted);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={togglePlay}>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1 }}>
                    {formatTime(currentTime)}
                </Typography>
                <Slider
                    value={currentTime}
                    max={duration}
                    onChange={handleTimeChange}
                    sx={{ mx: 2 }}
                />
                <Typography variant="body2" sx={{ mx: 1 }}>
                    {formatTime(duration)}
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
