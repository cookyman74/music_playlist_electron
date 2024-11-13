// components/DefaultCover.tsx
import React from 'react';
import { Box } from '@mui/material';
import { Album } from '@mui/icons-material';

interface DefaultCoverProps {
    width?: number;
    height?: number;
}

const DefaultCover: React.FC<DefaultCoverProps> = ({ width = 200, height = 200 }) => {
    return (
        <Box
            sx={{
                width,
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'action.hover',
                borderRadius: 1,
            }}
        >
            <Album
                sx={{
                    width: width * 0.5,
                    height: height * 0.5,
                    color: 'action.active'
                }}
            />
        </Box>
    );
};

export default DefaultCover;
