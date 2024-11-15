import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { Track } from '../../../types';
import CoverImage from './CoverImage';

interface TrackCellProps {
    track: Track;
    size: number;
}

const TrackCell = memo(({ track, size }: TrackCellProps) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CoverImage track={track} size={size} />
            <Typography sx={{ ml: 2 }}>{track.title}</Typography>
        </Box>
    );
});

TrackCell.displayName = 'TrackCell';

export default TrackCell;
