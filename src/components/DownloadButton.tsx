// src/components/DownloadButton.tsx

import React, { useState } from "react";
const { ipcRenderer } = window.require("electron");

interface DownloadButtonProps {
    onDownloadComplete: (path: string) => void;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onDownloadComplete }) => {
    const [url, setUrl] = useState<string>("");
    const [status, setStatus] = useState<string>("");

    const handleDownload = () => {
        ipcRenderer.send("download-playlist", url);
        ipcRenderer.once("download-status", (event, message) => {
            setStatus(message);
        });
        ipcRenderer.once("download-path", (event, downloadPath) => {
            onDownloadComplete(downloadPath);
        });
    };

    return (
        <div>
            <h2>유튜브 재생목록 다운로드</h2>
            <input
                type="text"
                placeholder="유튜브 비디오 URL 입력"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />
            <button onClick={handleDownload}>다운로드 시작</button>
            {status && <p>상태: {status}</p>}
        </div>
    );
};

export default DownloadButton;
