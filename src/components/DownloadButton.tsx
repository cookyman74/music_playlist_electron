import React, { useState } from "react";

// Electron이 있는지 확인하는 함수
const isElectron = () => {
    return typeof window !== "undefined" && window.hasOwnProperty("require");
};

// ipcRenderer 타입 선언
let ipcRenderer: Electron.IpcRenderer | undefined;
if (isElectron()) {
    ipcRenderer = window.require("electron").ipcRenderer;
}

interface DownloadButtonProps {
    onDownloadComplete: (path: string) => void;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onDownloadComplete }) => {
    const [url, setUrl] = useState<string>("");
    const [status, setStatus] = useState<string>("");

    const handleDownload = () => {
        if (ipcRenderer) {
            ipcRenderer.send("download-playlist", url);
            ipcRenderer.once("download-status", (event: Electron.IpcRendererEvent, message: string) => {
                setStatus(message);
            });
            ipcRenderer.once("download-path", (event: Electron.IpcRendererEvent, downloadPath: string) => {
                onDownloadComplete(downloadPath);
            });
        } else {
            setStatus("Electron 환경에서만 다운로드가 가능합니다.");
        }
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
