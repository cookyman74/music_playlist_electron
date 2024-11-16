import React, {memo, useEffect, useState} from 'react';
import { Box } from '@mui/material';
import { Track } from '../../../types';
import DefaultCoverComponent from './DefaultCoverComponent';

interface CoverImageProps {
    track?: Track;
    size?: number;
}

const CoverImage = memo(({ track, size = 200 }: CoverImageProps) => {
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>('');

    // electron의 file:// 프로토콜을 사용하여 로컬 파일 접근
    // const thumbnailPath = `file://${track.thumbnail_path.replace(/\\/g, '/')}`;

    useEffect(() => {
        const loadImage = async () => {
            if (track?.thumbnail_path) {
                try {
                    const url = `local-thumbnail://${track.thumbnail_path}`;
                    console.log("정상입니다.", url);
                    setImageUrl(url);
                    setImageError(false)
                } catch (error) {
                    console.error("썸네일 오류",error);
                    setImageError(true);
                }
            }
        };
        loadImage();
    }, [track?.thumbnail_path]);

    if (!track?.thumbnail_path || imageError) {
        return <DefaultCoverComponent width={size} height={size} />;
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
        src={imageUrl}
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
});

CoverImage.displayName = 'CoverImage';

export default CoverImage;
