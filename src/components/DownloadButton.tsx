// components/DownloadButton.tsx
import React, { useState, useContext, useEffect } from "react";
import {
    Container,
    TextField,
    Button,
    Typography,
    LinearProgress,
    Alert,
    Box,
    List,
    ListItem,
    ListItemText,
    Paper
} from "@mui/material";
import { DatabaseContext } from "../App";
import { isValidYoutubePlaylistUrl } from "../utils/youtubeUtils";
import { PlaylistInfo, TrackInfo } from "../types";

interface DownloadStatus {
    isDownloading: boolean;
    currentTrack?: string;
    progress: number;
    message: string;
    error?: string;
}

const DownloadButton: React.FC = () => {
    const dbService = useContext(DatabaseContext);
    const [url, setUrl] = useState<string>("");
    const [urlError, setUrlError] = useState<string>("");
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({
        isDownloading: false,
        progress: 0,
        message: ""
    });
    const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistInfo | null>(null);
    const [tracks, setTracks] = useState<TrackInfo[]>([]);

    useEffect(() => {
        if (!window.electron) return;

        const handlePlaylistInfo = async (event: any, playlistInfo: PlaylistInfo) => {
            try {
                // 이미 다운로드 중인지 확인
                if (currentPlaylist?.playlist_id === playlistInfo.playlist_id) {
                    console.log('이미 다운로드 중인 플레이리스트입니다.');
                    return;
                }

                setCurrentPlaylist(playlistInfo);
                setTracks(playlistInfo.tracks.map(track => ({
                    ...track,
                    download_status: 'pending',
                    progress: 0
                })));

                if (dbService) {
                    await dbService.addPlaylist(playlistInfo);
                }
            } catch (error) {
                console.error('재생목록 정보 처리 실패:', error);
                setDownloadStatus(prev => ({
                    ...prev,
                    error: '재생목록 정보 처리 중 오류가 발생했습니다.'
                }));
            }
        };

        // 다운로드 진행상태 수신
        const handleProgress = async (event: any, progressData: any) => {
            try {
                const { track_id, progress } = progressData;

                // 트랙 진행상태 업데이트
                setTracks(prev => prev.map(track =>
                    track.id === track_id
                        ? {
                            ...track,
                            progress,
                            download_status: 'downloading'
                        }
                        : track
                ));

                // DB에 진행상태 저장
                if (dbService) {
                    await dbService.updateTrackProgress(track_id, progress);
                }

                setDownloadStatus(prev => ({
                    ...prev,
                    currentTrack: track_id,
                    progress: progress,
                    message: `다운로드 중: ${Math.round(progress)}%`
                }));
            } catch (error) {
                console.error('진행상태 업데이트 실패:', error);
            }
        };

        // 트랙 상태 업데이트 수신
        const handleTrackStatus = async (event: any, trackStatus: any) => {
            try {
                const { track_id, status, file_path, absolute_file_path, thumbnail_path, error } = trackStatus;

                // 트랙 상태 업데이트
                setTracks(prev => prev.map(track =>
                    track.id === track_id
                        ? {
                            ...track,
                            download_status: status === 'success' ? 'completed' : 'failed',
                            error: error,
                            file_path: file_path,
                            absolute_file_path: absolute_file_path,
                            thumbnail_path: thumbnail_path
                        }
                        : track
                ));

                // DB에 상태 저장
                if (dbService) {
                    await dbService.updateTrackStatus(
                        track_id,
                        status === 'success' ? 'completed' : 'failed',
                        file_path,
                        thumbnail_path,
                        error
                    );
                }
            } catch (error) {
                console.error('트랙 상태 업데이트 실패:', error);
            }
        };

        const handleDownloadError = (event: any, error: any) => {
            setDownloadStatus(prev => ({
                ...prev,
                isDownloading: false,
                error: error.message || '다운로드 중 오류가 발생했습니다.'
            }));
        };

        // 이벤트 리스너 등록
        window.electron.ipcRenderer.on("playlist_info", handlePlaylistInfo);
        window.electron.ipcRenderer.on("progress", handleProgress);
        window.electron.ipcRenderer.on("track_status", handleTrackStatus);
        window.electron.ipcRenderer.on("error", handleDownloadError);

        // 클린업 함수
        return () => {
            window.electron.ipcRenderer.removeListener("playlist_info", handlePlaylistInfo);
            window.electron.ipcRenderer.removeListener("progress", handleProgress);
            window.electron.ipcRenderer.removeListener("track_status", handleTrackStatus);
            window.electron.ipcRenderer.removeListener("error", handleDownloadError);
        };
    }, [dbService]);

    const handleDownload = async () => {
        // URL 검증
        const validation = isValidYoutubePlaylistUrl(url);

        if (!validation.isValid) {
            setUrlError(validation.error || "올바른 YouTube 재생목록 URL을 입력해주세요.");
            return;
        }

        if (!dbService) {
            setUrlError("데이터베이스 서비스를 사용할 수 없습니다.");
            return;
        }

        setUrlError("");
        setDownloadStatus({
            isDownloading: true,
            progress: 0,
            message: "다운로드 준비 중..."
        });

        try {
            const settings = await dbService.getSettings();

            if (window.electron) {
                window.electron.ipcRenderer.send("download-playlist", {
                    url: url,
                    codec: settings?.preferredCodec || 'mp3',
                    quality: settings?.preferredQuality || '192',
                    directory: settings?.downloadPath || './downloads'
                });
            } else {
                throw new Error("Electron 환경이 아닙니다.");
            }
        } catch (error) {
            setDownloadStatus(prev => ({
                ...prev,
                isDownloading: false,
                error: "다운로드 시작 중 오류가 발생했습니다."
            }));
            console.error("다운로드 오류:", error);
        }
    };

    return (
        <Container maxWidth="md">
            <Typography variant="h5" gutterBottom>
                유튜브 재생목록 다운로드
            </Typography>

            <TextField
                fullWidth
                label="유튜브 재생목록 URL"
                variant="outlined"
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError("");
                }}
                error={!!urlError}
                helperText={urlError || "YouTube 재생목록 URL을 입력하세요"}
                disabled={downloadStatus.isDownloading}
                margin="normal"
            />

            <Button
                variant="contained"
                color="primary"
                onClick={handleDownload}
                disabled={!url || downloadStatus.isDownloading}
                fullWidth
                sx={{ mt: 2, mb: 2 }}
            >
                {downloadStatus.isDownloading ? "다운로드 중..." : "다운로드 시작"}
            </Button>

            {downloadStatus.isDownloading && (
                <Box sx={{ mt: 2, mb: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={downloadStatus.progress}
                    />
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                        {downloadStatus.message}
                    </Typography>
                </Box>
            )}

            {downloadStatus.error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {downloadStatus.error}
                </Alert>
            )}

            {currentPlaylist && (
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h6">
                        {currentPlaylist.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        업로더: {currentPlaylist.uploader}
                    </Typography>

                    <List>
                        {tracks.map((track) => (
                            <ListItem key={track.id} divider>
                                <ListItemText
                                    primary={track.title}
                                    secondary={
                                        track.download_status === 'downloading'
                                            ? `다운로드 중: ${Math.round(track.progress || 0)}%`
                                            : track.download_status === 'completed'
                                                ? '다운로드 완료'
                                                : track.download_status === 'failed'
                                                    ? `다운로드 실패: ${track.error}`
                                                    : '대기 중'
                                    }
                                />
                                {track.download_status === 'downloading' && (
                                    <Box sx={{ width: '100px', ml: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={track.progress || 0}
                                        />
                                    </Box>
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Container>
    );
};

export default DownloadButton;
