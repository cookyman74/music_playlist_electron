import sys
import os
from yt_dlp import YoutubeDL

def download_playlist(url):
    download_directory = os.path.join(os.getcwd(), "downloads")
    if not os.path.exists(download_directory):
        os.makedirs(download_directory)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(download_directory, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }

    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    return download_directory

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1]
        try:
            download_path = download_playlist(url)
            print(f"다운로드 완료: {download_path}")
        except Exception as e:
            print(f"오류 발생: {e}")
    else:
        print("URL을 입력하세요.")

