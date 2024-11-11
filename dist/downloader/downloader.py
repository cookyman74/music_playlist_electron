import sys
import os
import json
import re
import requests
from yt_dlp import YoutubeDL
import logging
from typing import Optional
from urllib.parse import urlparse

class PlaylistDownloader:
    def __init__(self, url, preferred_codec='mp3', preferred_quality='192', download_directory='./downloads'):
        self.url = url
        self.preferred_codec = preferred_codec
        self.preferred_quality = preferred_quality
        self.download_directory = download_directory

        # 썸네일 저장 디렉토리 설정
        self.thumbnail_directory = os.path.join(download_directory, 'thumbnails')
        if not os.path.exists(self.thumbnail_directory):
            os.makedirs(self.thumbnail_directory)

        # Logger 설정
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        self.logger.addHandler(console_handler)

    def sanitize_filename(self, filename: str) -> str:
        """파일 이름에서 허용되지 않는 문자 제거"""
        filename = re.sub(r'[\\/*?:"<>|]', "", filename)
        return filename.strip()

    def download_thumbnail(self, url: str, video_id: str) -> Optional[str]:
        """썸네일 이미지 다운로드"""
        if not url:
            return None

        try:
            # 파일 경로 생성
            thumbnail_filename = f"{video_id}.jpg"
            thumbnail_path = os.path.join(self.thumbnail_directory, thumbnail_filename)

            # 이미 존재하는 경우 기존 경로 반환
            if os.path.exists(thumbnail_path):
                return thumbnail_path

            # 썸네일 다운로드
            response = requests.get(url, stream=True)
            if response.status_code == 200:
                with open(thumbnail_path, 'wb') as f:
                    for chunk in response.iter_content(1024):
                        f.write(chunk)
                return thumbnail_path
            else:
                self.logger.error(f"썸네일 다운로드 실패: {url} (상태 코드: {response.status_code})")
                return None

        except Exception as e:
            self.logger.error(f"썸네일 다운로드 오류: {str(e)}")
            return None

    def extract_playlist_info(self):
        """재생목록 정보를 추출하는 함수"""
        info_opts = {
            'quiet': True,
            'extract_flat': False,  # 상세 정보 추출을 위해 False로 설정
            'skip_download': True,
        }

        try:
            with YoutubeDL(info_opts) as ydl:
                self.logger.info("재생목록 정보 추출 중...")
                playlist_info = ydl.extract_info(self.url, download=False)

                # 각 트랙의 썸네일 다운로드
                tracks = []
                for entry in playlist_info.get('entries', []):
                    video_id = entry.get('id')
                    thumbnail_url = entry.get('thumbnail')
                    thumbnail_path = None

                    if thumbnail_url:
                        thumbnail_path = self.download_thumbnail(thumbnail_url, video_id)
                        if thumbnail_path:
                            # 상대 경로로 변환
                            thumbnail_path = os.path.relpath(thumbnail_path, self.download_directory)

                    track_info = {
                        'id': video_id,
                        'title': self.sanitize_filename(entry.get('title', 'Unknown Title')),
                        'duration': entry.get('duration'),
                        'url': f"https://youtube.com/watch?v={video_id}",
                        'thumbnail_path': thumbnail_path,
                        'artist': entry.get('artist', entry.get('uploader', 'Unknown Artist')),
                        'upload_date': entry.get('upload_date')
                    }
                    tracks.append(track_info)

                formatted_info = {
                    'playlist_id': playlist_info.get('id'),
                    'title': playlist_info.get('title', 'Untitled Playlist'),
                    'uploader': playlist_info.get('uploader', 'Unknown'),
                    'thumbnail_path': self.download_thumbnail(
                        playlist_info.get('thumbnail'),
                        f"playlist_{playlist_info.get('id')}"
                    ),
                    'tracks': tracks
                }

                print(f"playlist_info:{json.dumps(formatted_info)}")
                return formatted_info

        except Exception as e:
            error_message = f"재생목록 정보 추출 실패: {str(e)}"
            self.logger.error(error_message)
            print(f"error:playlist_extraction:{error_message}")
            return None

    def download_track(self, track, playlist_directory):
        """개별 트랙을 다운로드하는 함수"""
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(playlist_directory, '%(title)s.%(ext)s'),
            'progress_hooks': [lambda d: self.progress_hook(d, track['id'])],
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': self.preferred_codec,
                'preferredquality': self.preferred_quality,
            }],
            'quiet': True,
            'no_warnings': True,
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                # 다운로드 전 파일 경로 계산
                file_path = os.path.join(
                    playlist_directory,
                    f"{self.sanitize_filename(track['title'])}.{self.preferred_codec}"
                )
                ydl.download([track['url']])

                # 파일 경로를 상대 경로로 변환
                relative_path = os.path.relpath(file_path, self.download_directory)
                success_message = {
                    'track_id': track['id'],
                    'status': 'success',
                    'file_path': relative_path,
                    'thumbnail_path': track.get('thumbnail_path')
                }
                print(f"track_status:{json.dumps(success_message)}")
                return True
        except Exception as e:
            error_message = str(e)
            error_info = {
                'track_id': track['id'],
                'status': 'failed',
                'error': error_message
            }
            print(f"track_status:{json.dumps(error_info)}")
            self.logger.error(f"트랙 다운로드 실패 - {track['title']}: {error_message}")
            return False

    def progress_hook(self, d, track_id):
        """다운로드 진행 상황을 추적하는 hook 함수"""
        if d['status'] == 'downloading':
            try:
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes', 0) or d.get('total_bytes_estimate', 0)

                if total > 0:
                    progress = (downloaded / total) * 100
                    progress_info = {
                        'track_id': track_id,
                        'progress': progress,
                        'downloaded': downloaded,
                        'total': total,
                        'speed': d.get('speed', 0),
                        'eta': d.get('eta', 0)
                    }
                    print(f"progress:{json.dumps(progress_info)}")

            except Exception as e:
                self.logger.error(f"진행률 계산 오류: {str(e)}")

        elif d['status'] == 'finished':
            print(f"track_complete:{track_id}")

    def download_playlist(self):
        """재생목록의 모든 트랙을 다운로드하는 메인 함수"""
        try:
            # 재생목록 정보 추출
            playlist_info = self.extract_playlist_info()
            if not playlist_info:
                return

            # 재생목록 디렉토리 생성
            playlist_directory = os.path.join(
                self.download_directory,
                self.sanitize_filename(playlist_info['title'])
            )
            if not os.path.exists(playlist_directory):
                os.makedirs(playlist_directory)

            # 각 트랙 다운로드
            for track in playlist_info['tracks']:
                self.download_track(track, playlist_directory)

        except Exception as e:
            error_message = str(e)
            self.logger.error(f"재생목록 다운로드 중 오류 발생: {error_message}")
            print(f"error:general:{error_message}")

def main():
    if len(sys.argv) != 5:
        print("error:invalid_arguments")
        print("사용법: python downloader.py <URL> <preferred_codec> <preferred_quality> <download_directory>")
        sys.exit(1)

    url = sys.argv[1]
    preferred_codec = sys.argv[2]
    preferred_quality = sys.argv[3]
    download_directory = sys.argv[4]

    downloader = PlaylistDownloader(url, preferred_codec, preferred_quality, download_directory)
    downloader.download_playlist()

if __name__ == "__main__":
    main()
