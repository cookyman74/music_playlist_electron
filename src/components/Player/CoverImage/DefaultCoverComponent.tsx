import React from 'react';
import { Box } from '@mui/material';
import { Album } from '@mui/icons-material';

interface DefaultCoverComponentProps {
    width?: number;
    height?: number;
}

const DefaultCoverComponent= ({ width = 200, height = 200 }:DefaultCoverComponentProps ) => {
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

export default DefaultCoverComponent;
