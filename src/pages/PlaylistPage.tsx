// src/pages/PlaylistPage.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Container } from '@mui/material';
import Playlist from '../components/Playlist/Playlist';
import FullPlayer from '../components/Player/FullPlayer';
import { fetchPlaylist, Track } from '../services/api';
import {DatabaseContext} from "../App";

const PlaylistPage: React.FC = () => {
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [playlist, setPlaylist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingTracks, setDownloadingTracks] = useState<{ [key: number]: number }>({});
    const downloadIntervals = useRef<{ [key: number]: NodeJS.Timeout }>({}); // 타이머 저장 객체
    const dbService = useContext(DatabaseContext);

    const handleSelectTrack = (track: Track) => {
        setSelectedTrack(track); // 선택한 트랙 정보를 상태에 저장
    };

    const handleDownloadTrack = (trackId: number) => {
        if (downloadingTracks[trackId] !== undefined) return; // 이미 다운로드 중인 경우 무시

        setDownloadingTracks((prev) => ({ ...prev, [trackId]: 0 })); // 진행률 0으로 시작

        const downloadInterval = setInterval((): any => {
            setDownloadingTracks((prev) => {
                const progress = (prev[trackId] || 0) + 10;
                if (progress >= 100) {
                    clearInterval(downloadInterval);
                    delete downloadIntervals.current[trackId]; // 타이머 삭제
                    const { [trackId]: _, ...rest } = prev;
                    return rest; // 다운로드 완료 후 상태 제거
                }
                return { ...prev, [trackId]: progress };
            });
        }, 500);

        downloadIntervals.current[trackId] = downloadInterval; // 타이머 저장
    };

    const handleCancelDownload = (trackId: number) => {
        // 다운로드 타이머가 있으면 즉시 중지
        if (downloadIntervals.current[trackId]) {
            clearInterval(downloadIntervals.current[trackId]); // 타이머 중지
            delete downloadIntervals.current[trackId]; // 타이머 삭제
        }

        // 다운로드 상태에서 트랙 진행률 즉시 제거
        setDownloadingTracks((prev) => {
            const { [trackId]: _, ...rest } = prev;
            return rest;
        });

        // 데이터 삭제 시뮬레이션: 다운로드 중이던 데이터 삭제
        console.log(`트랙 ${trackId}의 다운로드가 즉시 취소되었고, 임시 데이터가 삭제되었습니다.`);
    };

    // useEffect(() => {
    //     const loadPlaylist = async () => {
    //         try {
    //             const data = await fetchPlaylist();
    //             setPlaylist(data);
    //         } catch (error) {
    //             console.error("재생 목록을 불러오는 중 오류 발생:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //
    //     loadPlaylist();
    // }, []);
    useEffect(() => {
        const loadPlaylists = async () => {
            if (!dbService) return;

            try {
                const playlists = await dbService.getAllPlaylists();
                setPlaylist(playlists);
            } catch (error) {
                console.error('플레이리스트 로드 실패:', error);
            }
        };

        loadPlaylists();
    }, [dbService]);

    // const handleAddPlaylist = async (playlistData: Omit<Playlist, 'id'>) => {
    //     if (!dbService) return;
    //
    //     try {
    //         const id = await dbService.addPlaylist(playlistData);
    //         // 새로운 플레이리스트 추가 후 목록 새로고침
    //         const updatedPlaylists = await dbService.getAllPlaylists();
    //         setPlaylist(updatedPlaylists);
    //     } catch (error) {
    //         console.error('플레이리스트 추가 실패:', error);
    //     }
    // };

    return (
        <Container>
            <Playlist
                tracks={playlist}
                onSelectTrack={handleSelectTrack}
                onDownloadTrack={handleDownloadTrack}
                onCancelDownload={handleCancelDownload} // 다운로드 취소 함수 전달
                downloadingTracks={downloadingTracks}
            />
            {selectedTrack && <FullPlayer track={selectedTrack} />}
        </Container>
    );
};

export default PlaylistPage;
