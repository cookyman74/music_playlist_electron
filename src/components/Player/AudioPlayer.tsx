import React, { useEffect } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeMute } from '@mui/icons-material';
import { Track } from '../../types';
import { formatDuration } from '../../utils/audioUtils';
import { usePlayerStore } from '../../store/playerStore';

interface AudioPlayerProps {
    track: Track;
    // onEnded?: () => void;
    onError?: (error: Error) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onError }) => {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playTrack,
        togglePlay,
        setVolume,
        toggleMute,
        seek
    } = usePlayerStore();

    // 초기 트랙 재생 로직
    useEffect(() => {
        if (!currentTrack) {
            playTrack(track).catch(onError);
        }
    }, []);

    const handlePlayClick = () => {
        togglePlay();
    };

    // useEffect(() => {
    //     const playNewTrack = async () => {
    //         if (currentTrack?.id !== track.id) {
    //             try {
    //                 await playTrack(track);
    //             } catch (error) {
    //                 onError?.(error as Error);
    //             }
    //         }
    //     };
    //
    //     playNewTrack();
    // }, [track.id]);

    // 시간 변경 핸들러 수정
    const handleTimeChange = (_: Event | React.SyntheticEvent, newValue: number | number[]) => {
        if (typeof newValue !== 'number') return;
        // 드래그 중에만 임시로 currentTime 업데이트
        usePlayerStore.setState({
            isSeeking: true,
            currentTime: newValue
        });
    };

    const handleTimeChangeCommitted = async (_: Event | React.SyntheticEvent, newValue: number | number[]) => {
        if (typeof newValue !== 'number') return;
        try {
            await seek(newValue);
        } catch (error) {
            console.error('Seek failed:', error);
        }
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
                    min={0}
                    max={duration || 1}
                    onChange={handleTimeChange}
                    onChangeCommitted={handleTimeChangeCommitted}
                    disabled={!currentTrack}  // seeking 중일 때는 비활성화
                    sx={{
                        color: 'primary.main',
                        '& .MuiSlider-thumb': {
                            width: 12,
                            height: 12,
                        },
                    }}
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
