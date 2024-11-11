import React, { useState, useContext, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Box,
    CircularProgress,
    Snackbar,
    Alert,
    SelectChangeEvent
} from '@mui/material';
import { DatabaseContext } from '../../App';
import { Settings, AudioCodec, AudioQuality } from '../../types';

const SettingsForm = () => {
    const dbService = useContext(DatabaseContext);
    const [isLoading, setIsLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const [settings, setSettings] = useState<Settings>({
        downloadPath: './downloads',
        preferredCodec: 'mp3',
        preferredQuality: '192',
        autoDownload: false,
        maxConcurrentDownloads: 3,
        defaultPlaylistSource: 'youtube'
    });

    // 코덱 변경 핸들러
    const handleCodecChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value as AudioCodec;
        setSettings(prev => ({
            ...prev,
            preferredCodec: value
        }));
    };

    // 음질 변경 핸들러
    const handleQualityChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value as AudioQuality;
        setSettings(prev => ({
            ...prev,
            preferredQuality: value
        }));
    };

    // 동시 다운로드 수 변경 핸들러
    const handleConcurrentDownloadsChange = (event: SelectChangeEvent<number>) => {
        const value = event.target.value as number;
        setSettings(prev => ({
            ...prev,
            maxConcurrentDownloads: value
        }));
    };

    useEffect(() => {
        const loadSettings = async () => {
            if (!dbService) return;

            try {
                setIsLoading(true);
                const savedSettings = await dbService.getSettings();
                if (savedSettings) {
                    setSettings(savedSettings);
                }
            } catch (error) {
                console.error('설정 로드 실패:', error);
                setSnackbar({
                    open: true,
                    message: '설정을 불러오는데 실패했습니다.',
                    severity: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [dbService]);

    const handleSave = async () => {
        if (!dbService) return;

        try {
            if (window.electron) {
                window.electron.ipcRenderer.send('save-settings', settings);
            }

            await Promise.all(
                Object.entries(settings).map(([key, value]) =>
                    dbService.updateSetting(key, value)
                )
            );

            setSnackbar({
                open: true,
                message: '설정이 성공적으로 저장되었습니다.',
                severity: 'success'
            });
        } catch (error) {
            console.error('설정 저장 실패:', error);
            setSnackbar({
                open: true,
                message: '설정 저장에 실패했습니다.',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    설정
                </Typography>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        label="다운로드 경로"
                        value={settings.downloadPath}
                        onChange={(e) => setSettings({...settings, downloadPath: e.target.value})}
                        variant="outlined"
                    />

                    <FormControl fullWidth>
                        <InputLabel>선호 코덱</InputLabel>
                        <Select
                            value={settings.preferredCodec}
                            label="선호 코덱"
                            onChange={handleCodecChange}
                        >
                            <MenuItem value="mp3">MP3</MenuItem>
                            <MenuItem value="m4a">M4A</MenuItem>
                            <MenuItem value="wav">WAV</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>음질</InputLabel>
                        <Select
                            value={settings.preferredQuality}
                            label="음질"
                            onChange={handleQualityChange}
                        >
                            <MenuItem value="128">128 kbps</MenuItem>
                            <MenuItem value="192">192 kbps</MenuItem>
                            <MenuItem value="320">320 kbps</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>최대 동시 다운로드 수</InputLabel>
                        <Select
                            value={settings.maxConcurrentDownloads}
                            label="최대 동시 다운로드 수"
                            onChange={handleConcurrentDownloadsChange}
                        >
                            <MenuItem value={1}>1개</MenuItem>
                            <MenuItem value={2}>2개</MenuItem>
                            <MenuItem value={3}>3개</MenuItem>
                            <MenuItem value={5}>5개</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        size="large"
                        sx={{ mt: 2 }}
                    >
                        설정 저장
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default SettingsForm;
