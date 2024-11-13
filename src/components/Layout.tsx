import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    const menuItems = [
        { label: '홈', path: '/' },
        { label: '플레이리스트', path: '/playlist' },
        { label: '앨범', path: '/albums' },
        { label: '다운로드', path: '/download' },
        { label: '설정', path: '/settings' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* 상단 AppBar */}
            <AppBar position="fixed">
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* 로고 및 제목 */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" noWrap component="div">
                            YouTube Music Player
                        </Typography>
                    </Box>

                    {/* 메뉴 항목 */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {menuItems.map((item, index) => (
                            <Button
                                key={index}
                                color="inherit"
                                onClick={() => navigate(item.path)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    {/* 다크 모드 토글 */}
                    <IconButton color="inherit">
                        {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* 메인 컨텐츠 */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    marginTop: '64px', // AppBar 높이 만큼 여백
                    padding: 3,
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
