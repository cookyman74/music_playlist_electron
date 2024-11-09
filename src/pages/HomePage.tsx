// src/components/Player/FullPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Track {
    id: number;
    title: string;
    artist: string;
    src: string;
}

interface FullPlayerProps {
    track?: Track; // track을 선택적 속성으로 설정
}

const FullPlayer: React.FC<FullPlayerProps> = ({ track }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const defaultTrack = {
        id: 0,
        title: '기본 노래',
        artist: '기본 아티스트',
        src: 'default.mp3'
    };

    const currentTrack = track || defaultTrack; // 전달된 track이 없으면 기본값 사용

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    }, [currentTrack, isPlaying]);

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" padding="1rem">
            <Typography variant="h5">현재 재생 중인 음악</Typography>
            <Typography variant="subtitle1" color="textSecondary">
                {currentTrack.artist} - {currentTrack.title}
            </Typography>
            <Button variant="contained" color="primary" onClick={handlePlayPause}>
                {isPlaying ? "일시정지" : "재생"}
            </Button>
            <audio ref={audioRef} src={currentTrack.src} />
        </Box>
    );
};

export default FullPlayer;
