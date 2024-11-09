import React, { useState } from "react";

// ipcRenderer 타입 선언
let ipcRenderer: typeof window.electron.ipcRenderer | undefined;
if (typeof window !== "undefined" && window.electron) {
    ipcRenderer = window.electron.ipcRenderer;
    console.log("ipcRenderer 로드 성공"); // ipcRenderer가 로드되었는지 확인
} else {
    console.warn("Electron 환경이 아님");
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
            ipcRenderer.once("download-status", (event, message: string) => {
                setStatus(message);
            });
            ipcRenderer.once("download-path", (event, downloadPath: string) => {
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
