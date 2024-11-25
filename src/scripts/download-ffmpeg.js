// scripts/download-ffmpeg.js
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const extract = require('extract-zip');
const { platform } = require('os');

const FFMPEG_URLS = {
    win32: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    darwin: 'https://evermeet.cx/ffmpeg/ffmpeg-5.1.zip',
    linux: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz'
};

async function downloadFFmpeg() {
    const currentPlatform = platform();
    const ffmpegDir = path.join(__dirname, '..', 'ffmpeg-binaries', currentPlatform);

    try {
        await fs.ensureDir(ffmpegDir);

        console.log(`Downloading FFmpeg for ${currentPlatform}...`);
        const response = await axios({
            url: FFMPEG_URLS[currentPlatform],
            responseType: 'arraybuffer'
        });

        const archivePath = path.join(ffmpegDir, 'ffmpeg.zip');
        await fs.writeFile(archivePath, response.data);

        console.log('Extracting FFmpeg...');
        await extract(archivePath, { dir: ffmpegDir });

        // 플랫폼별 후처리
        switch (currentPlatform) {
            case 'win32':
                await fs.move(
                    path.join(ffmpegDir, 'ffmpeg.exe'),
                    path.join(ffmpegDir, 'ffmpeg.exe'),
                    { overwrite: true }
                );
                break;
            case 'darwin':
                await fs.chmod(path.join(ffmpegDir, 'ffmpeg'), '755');
                break;
            case 'linux':
                await fs.chmod(path.join(ffmpegDir, 'ffmpeg'), '755');
                break;
        }

        console.log('FFmpeg setup completed');
    } catch (error) {
        console.error('FFmpeg setup failed:', error);
        process.exit(1);
    }
}

downloadFFmpeg();
