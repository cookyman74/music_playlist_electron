import React, { memo, useState } from 'react';
import { Box } from '@mui/material';
import { Track } from '../../../types';
import DefaultCoverComponent from './DefaultCoverComponent';

interface CoverImageProps {
    track?: Track;
    size?: number;
}

const CoverImage = memo(({ track, size = 200 }: CoverImageProps) => {
    const [imageError, setImageError] = useState(false);

    if (!track?.absolute_thumbnail_path || imageError) {
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
        src={track.absolute_thumbnail_path}
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
