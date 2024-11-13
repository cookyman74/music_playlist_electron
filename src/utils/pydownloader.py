import sys
import os
import json
from yt_dlp import YoutubeDL
import requests
import logging
from typing import Optional, Dict, Any

class PlaylistDownloader:
    def __init__(self, url: str, preferred_codec: str = 'mp3',
                 preferred_quality: str = '192', download_directory: str = './downloads'):
        self.url = url
        self.preferred_codec = preferred_codec
        self.preferred_quality = preferred_quality
        self.download_directory = download_directory

        # 썸네일 디렉토리 설정
        self.thumbnail_directory = os.path.join(download_directory, 'thumbnails')
        os.makedirs(self.thumbnail_directory, exist_ok=True)

        # 로거 설정
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        self.logger.addHandler(console_handler)

    def __print_message(self, message_type: str, data: Dict[str, Any]) -> None:
        """표준화된 형식으로 메시지 출력"""
        try:
            print(f"{message_type}:{json.dumps(data)}", flush=True)
        except Exception as e:
            print(f"error:{json.dumps({'error': str(e)})}", flush=True)

    def download_thumbnail(self, track_id: str, thumbnail_url: str | None) -> str:
        """썸네일 이미지를 다운로드하고 경로를 반환"""
        try:
            if not thumbnail_url:
                self.__print_message('error', {
                    'track_id': track_id,
                    'thumbnail_error': 'No thumbnail URL provided'
                })
                return ""

            # sanitize track_id
            sanitized_track_id = ''.join(c for c in track_id if c.isalnum() or c in ('-', '_'))
            thumbnail_path = os.path.join(self.thumbnail_directory, f"{sanitized_track_id}.jpg")

            response = requests.get(thumbnail_url, stream=True)
            if response.status_code == 200:
                with open(thumbnail_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=1024):
                        f.write(chunk)
                return os.path.relpath(thumbnail_path, self.download_directory)
            else:
                self.__print_message('error', {
                    'track_id': track_id,
                    'thumbnail_error': f'Failed to download thumbnail: Status code {response.status_code}'
                })
                return ""

        except Exception as e:
            self.__print_message('error', {
                'track_id': track_id,
                'thumbnail_error': str(e)
            })
            return ""

    def progress_hook(self, progress_data: Dict[str, Any], track_id: str) -> None:
        """다운로드 진행 상황을 추적하는 hook 함수"""
        try:
            if progress_data['status'] == 'downloading':
                downloaded = progress_data.get('downloaded_bytes', 0)
                total = progress_data.get('total_bytes', 0) or progress_data.get('total_bytes_estimate', 0)

                if total > 0:
                    progress = (downloaded / total) * 100
                    self.__print_message('progress', {
                        'track_id': track_id,
                        'progress': progress,
                        'downloaded': downloaded,
                        'total': total,
                        'speed': progress_data.get('speed', 0),
                        'eta': progress_data.get('eta', 0)
                    })

            elif progress_data['status'] == 'finished':
                self.__print_message('track_complete', {'track_id': track_id})

        except Exception as e:
            self.__print_message('error', {'track_id': track_id, 'error': str(e)})

    def download_track(self, track: Dict[str, Any], playlist_directory: str) -> bool:
        """개별 트랙을 다운로드하는 함수"""
        track_id = track['id']
        thumbnail_path = self.download_thumbnail(track_id, track['thumbnail_url'])

        safe_title = self.sanitize_filename(track['title'])
        output_template = os.path.join(playlist_directory, f'%(title)s.%(ext)s')

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'progress_hooks': [lambda d: self.progress_hook(d, track_id)],
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': self.preferred_codec,
                'preferredquality': self.preferred_quality,
            }],
            'quiet': True,
            'no_warnings': True,
            # 'writethumbnail': True,  # 제거 (download_thumbnail 메소드 사용)
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(track['url'], download=True)

                actual_info = info['entries'][0] if info and 'entries' in info else info
                actual_title = self.sanitize_filename(actual_info.get('title', safe_title))
                actual_file_path = os.path.join(
                    playlist_directory,
                    f"{actual_title}.{self.preferred_codec}"
                )

                if not os.path.exists(actual_file_path):
                    # 최신 파일 기준으로 검색
                    possible_files = [f for f in os.listdir(playlist_directory)
                                      if f.endswith(f'.{self.preferred_codec}')]
                    if possible_files:
                        # 파일 생성 시간 기준으로 정렬
                        possible_files.sort(key=lambda x: os.path.getctime(
                            os.path.join(playlist_directory, x)), reverse=True)
                        actual_file_path = os.path.join(playlist_directory, possible_files[0])

                if os.path.exists(actual_file_path):
                    relative_path = os.path.relpath(actual_file_path, self.download_directory)
                    self.__print_message('track_status', {
                        'track_id': track_id,
                        'status': 'success',
                        'file_path': relative_path,
                        'thumbnail_path': thumbnail_path,
                        'title': actual_info.get('title', track['title']),
                        'duration': actual_info.get('duration'),
                    })
                    return True
                else:
                    raise FileNotFoundError(f"다운로드된 파일을 찾을 수 없습니다: {actual_file_path}")
        except Exception as e:
            self.__print_message('track_status', {
                'track_id': track_id,
                'status': 'failed',
                'error': str(e)
            })
            return False  # except 블록 안으로 이동

    def sanitize_filename(self, filename: str) -> str:
        """파일 이름에서 허용되지 않는 문자 제거 및 길이 제한"""
        if not filename:
            return "unknown"

        # 허용되지 않는 문자 제거
        filename = str(filename)
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '')

        # 공백 문자 정리
        filename = ' '.join(filename.split())

        # 파일명 길이 제한 (Windows 경로 길이 제한 고려)
        max_length = 200  # 확장자와 경로를 고려한 여유 길이
        if len(filename) > max_length:
            filename = filename[:max_length]

        # 양끝 공백 및 점 제거
        filename = filename.strip('. ')

        # 빈 문자열인 경우 기본값 반환
        return filename if filename else "unknown"

    def __ensure_directory_permissions(self, directory: str) -> None:
        """디렉토리 접근 권한 확인 및 생성"""
        try:
            os.makedirs(directory, exist_ok=True)
            # 쓰기 권한 테스트
            test_file_path = os.path.join(directory, '.permission_test')
            with open(test_file_path, 'w') as f:
                f.write('test')
            os.remove(test_file_path)
        except (OSError, IOError) as e:
            raise PermissionError(f"디렉토리 접근 권한이 없습니다: {directory}. 에러: {str(e)}")

    def extract_playlist_info(self) -> Optional[Dict[str, Any]]:
        """재생목록 정보를 추출하는 함수"""
        info_opts = {
            'quiet': True,
            'extract_flat': False,  # 전체 정보를 가져오기 위해 False로 변경
            'skip_download': True,
        }

        try:
            with YoutubeDL(info_opts) as ydl:
                self.logger.info("재생목록 정보 추출 중...")
                playlist_info = ydl.extract_info(self.url, download=False)

                formatted_info = {
                    'playlist_id': playlist_info.get('id'),
                    'title': playlist_info.get('title', 'Untitled Playlist'),
                    'uploader': playlist_info.get('uploader', 'Unknown'),
                    'tracks': [{
                        'id': entry.get('id'),
                        'title': self.sanitize_filename(entry.get('title', 'Unknown Title')),
                        'duration': entry.get('duration'),
                        'url': f"https://youtube.com/watch?v={entry.get('id')}",
                        'thumbnail_url': entry.get('thumbnail') or  # 먼저 'thumbnail' 필드 확인
                                         (entry.get('thumbnails', [{}])[0].get('url') if entry.get(
                                             'thumbnails') else None)  # 없으면 thumbnails 배열 확인
                    } for entry in playlist_info.get('entries', [])]
                }

                self.__print_message('playlist_info', formatted_info)
                return formatted_info

        except Exception as e:
            self.__print_message('error', {'message': str(e)})
            return None

    def download_playlist(self) -> None:
        """재생목록의 모든 트랙을 다운로드하는 메인 함수"""
        try:
            # 기본 디렉토리 권한 확인
            self.__ensure_directory_permissions(self.download_directory)

            playlist_info = self.extract_playlist_info()
            if not playlist_info:
                return

            playlist_directory = os.path.join(
                self.download_directory,
                self.sanitize_filename(playlist_info['title'])
            )

            # 플레이리스트 디렉토리 권한 확인
            self.__ensure_directory_permissions(playlist_directory)

            for track in playlist_info['tracks']:
                self.download_track(track, playlist_directory)

        except PermissionError as e:
            self.__print_message('error', {
                'type': 'permission_error',
                'message': str(e)
            })
        except Exception as e:
            self.__print_message('error', {
                'type': 'general_error',
                'message': str(e)
            })

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
