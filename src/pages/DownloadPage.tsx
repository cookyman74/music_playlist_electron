// pages/DownloadPage.tsx
import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import DownloadButton from '../components/DownloadButton';

const DownloadPage: React.FC = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    YouTube 재생목록 다운로드
                </Typography>
                <Paper sx={{ p: 3, mt: 2 }}>
                    <Typography variant="body1" paragraph>
                        YouTube 재생목록 URL을 입력하여 음악을 다운로드하세요.
                        다운로드된 음악은 자동으로 라이브러리에 추가됩니다.
                    </Typography>
                    <DownloadButton />
                </Paper>
            </Box>
        </Container>
    );
};

export default DownloadPage;
