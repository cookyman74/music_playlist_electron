import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Box, CssBaseline } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../store/globalStore'; // Zustand store 가져오기

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { theme: globalTheme, setTheme } = useGlobalStore(); // Zustand에서 테마 상태와 상태 변경 함수 가져오기
    const navigate = useNavigate();

    // MUI의 다크/라이트 테마 설정
    const theme = createTheme({
        palette: {
            mode: globalTheme, // Zustand에서 가져온 테마 상태(light 또는 dark) 사용
        },
    });

    const menuItems = [
        { label: '홈', path: '/' },
        { label: '플레이리스트', path: '/playlist' },
        { label: '앨범', path: '/albums' },
        { label: '다운로드', path: '/download' },
        { label: '설정', path: '/settings' },
    ];

    return (
        <ThemeProvider theme={theme}>
            {/* CssBaseline은 MUI 테마에 따라 기본 스타일을 설정 */}
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* 상단 AppBar */}
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
                        <IconButton
                            color="inherit"
                            onClick={() => setTheme(globalTheme === 'light' ? 'dark' : 'light')} // Zustand의 setTheme으로 테마 전환
                        >
                            {globalTheme === 'dark' ? <Brightness7 /> : <Brightness4 />}
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
        </ThemeProvider>
    );
};

export default Layout;
