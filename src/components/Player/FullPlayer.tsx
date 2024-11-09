import React, {useEffect, useRef, useState} from 'react';
import {Box, Button, Typography} from "@mui/material";

interface Track {
    id: number;
    title: string;
    artist: string;
    src: string;
}

interface FullPlayerProps {
    track: Track;
}

const FullPlayer: React.FC<FullPlayerProps> = ({track}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    }, [track, isPlaying]);

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
                {track.artist} - {track.title}
            </Typography>
            <Button variant="contained" color="primary" onClick={handlePlayPause}>
                {isPlaying ? "일시정지" : "재생"}
            </Button>
            {/* 오디오 요소 */}
            <audio ref={audioRef} src={track.src} />
        </Box>
    );
}

export default FullPlayer;
