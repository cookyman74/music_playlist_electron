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
        let mounted = true;

        const initAudio = async () => {
            try {
                // 파일 경로 체크
                const filePath = track.absolute_file_path || track.file_path;
                if (!filePath) {
                    throw new Error('재생할 수 있는 오디오 파일이 없습니다.');
                }

                // Electron을 통해 오디오 URL 가져오기
                const audioUrl = await window.electron.getAudioUrl(filePath);
                if (!mounted) return;

                // 기존 오디오 정리
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                }

                // 새 오디오 인스턴스 생성 및 설정
                const audio = new Audio(audioUrl);
                audioRef.current = audio;

                // 오디오 이벤트 리스너 설정
                const setupAudioListeners = () => {
                    audio.addEventListener('loadedmetadata', () => {
                        if (mounted) {
                            setDuration(audio.duration);
                        }
                    });

                    audio.addEventListener('timeupdate', () => {
                        if (mounted) {
                            setCurrentTime(audio.currentTime);
                        }
                    });

                    audio.addEventListener('ended', () => {
                        if (mounted) {
                            setIsPlaying(false);
                            if (onEnded) onEnded();
                        }
                    });

                    audio.addEventListener('error', (e) => {
                        if (!mounted) return;
                        console.error('Audio error:', e);

                        const errorMessage = audio.error
                            ? `오디오 재생 오류 (${audio.error.code}): ${filePath}`
                            : '알 수 없는 오디오 재생 오류';

                        if (onError) onError(new Error(errorMessage));
                    });
                };

                setupAudioListeners();
                audio.volume = volume;

                console.log('Audio initialized with URL:', audioUrl);

            } catch (error) {
                console.error('Audio initialization error:', error);
                if (mounted && onError) {
                    onError(error instanceof Error ? error : new Error('오디오 초기화 실패'));
                }
            }
        };

        initAudio();

        return () => {
            mounted = false;
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
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
