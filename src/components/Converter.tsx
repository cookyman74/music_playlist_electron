import React, { useState, useEffect } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const ffmpeg = createFFmpeg({ log: true });

interface ConverterProps {
    downloadPath: string | null;
}

const Converter: React.FC<ConverterProps> = ({ downloadPath }) => {
    const [ready, setReady] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [format, setFormat] = useState("mp3");

    useEffect(() => {
        const loadFFmpeg = async () => {
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
                setReady(true);
            }
        };
        loadFFmpeg();
    }, []);

    const convertFile = async () => {
        if (!downloadPath) return;

        setIsConverting(true);
        try {
            ffmpeg.FS("writeFile", "input.webm", await fetchFile(downloadPath));
            await ffmpeg.run("-i", "input.webm", `output.${format}`);
            const data = ffmpeg.FS("readFile", `output.${format}`);
            const audioUrl = URL.createObjectURL(new Blob([data.buffer], { type: `audio/${format}` }));
            setOutput(audioUrl);
        } catch (error) {
            console.error("변환 중 오류 발생:", error);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div>
            <h1>오디오 변환기</h1>
            {!ready && <button onClick={() => ffmpeg.load()}>FFmpeg 로드</button>}
            {ready && downloadPath && (
                <>
                    <select onChange={(e) => setFormat(e.target.value)} value={format}>
                        <option value="mp3">MP3</option>
                        <option value="m4a">M4A</option>
                        <option value="wav">WAV</option>
                    </select>
                    <button onClick={convertFile} disabled={isConverting}>
                        {isConverting ? "변환 중..." : `${format}로 변환`}
                    </button>
                </>
            )}
            {output && (
                <div>
                    <a href={output} download={`output.${format}`}>
                        변환된 파일 다운로드
                    </a>
                </div>
            )}
        </div>
    );
};

export default Converter;
