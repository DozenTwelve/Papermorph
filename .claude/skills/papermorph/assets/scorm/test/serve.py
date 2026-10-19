"""Serve a folder the way many LMS file servers do: files only, no index.html for folder URLs.

    python3 SKILL/assets/scorm/test/serve.py <folder> [port]

Put mock-lms.html and an unzipped package (e.g. pkg/) in <folder>, then open
http://localhost:8781/mock-lms.html?pkg=pkg&v=1.2&reset
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class FilesOnly(SimpleHTTPRequestHandler):
    def send_head(self):
        if Path(self.translate_path(self.path)).is_dir():
            self.send_error(404, 'Folder URLs are not served (as on many LMS file servers)')
            return None
        return super().send_head()


if __name__ == '__main__':
    root = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8781
    print(f'http://localhost:{port}/  serving {Path(root).resolve()}')
    ThreadingHTTPServer(('localhost', port), partial(FilesOnly, directory=root)).serve_forever()
