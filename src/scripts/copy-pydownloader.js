const fs = require('fs-extra');
const path = require('path');

async function copyPydownloader() {
    const srcDir = path.join(__dirname, '..', 'src', 'utils', 'pydownloader');
    const destDir = path.join(__dirname, '..', 'resources', 'pydownloader');

    try {
        // 이전 파일 정리
        await fs.remove(destDir);
        // 파일 복사
        await fs.copy(srcDir, destDir);
        console.log('Pydownloader files copied successfully');
    } catch (err) {
        console.error('Error copying pydownloader files:', err);
        process.exit(1);
    }
}

copyPydownloader();
