#!/usr/bin/env python3
"""Local preview without browser caching, so an edited engine or chapter is never hidden by a stale copy.

    python3 serve.py 8765 site        # then open http://localhost:8765/<book>/

python3 -m http.server sends no Cache-Control, has a backlog of 5 (it drops connections when a page opens many
files at once) and ignores Range requests (Chrome then restarts audio from 0 on every seek, so a seek looks out of
sync). This server sends no-store, queues up to 128, serves byte ranges, and listens on this computer only.
"""
import errno, functools, http.server, os, re, subprocess, sys

class NoStore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):   # a byte range of a file: 206 with just those bytes
        m = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        path = self.translate_path(self.path)
        if not m or m.groups() == ("", "") or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.groups()
        start, end = (max(size - int(b), 0), size - 1) if not a else (int(a), min(int(b) if b else size - 1, size - 1))
        if start >= size or start > end:
            self.send_response(416); self.send_header("Content-Range", f"bytes */{size}"); self.end_headers(); return None
        f = open(path, "rb"); f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        self._left = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left, self._left = getattr(self, "_left", None), None
        if left is None:
            return super().copyfile(source, outputfile)
        while left > 0 and (chunk := source.read(min(65536, left))):
            outputfile.write(chunk); left -= len(chunk)

class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(0 if sys.argv[1:] in (["-h"], ["--help"]) else 2)
    port, root = int(sys.argv[1]), sys.argv[2]
    try:
        server = Server(("127.0.0.1", port), functools.partial(NoStore, directory=root))
    except OSError as e:
        if e.errno != errno.EADDRINUSE: raise
        try:   # who holds it, where lsof is at hand (macOS, most Linux)
            who = subprocess.run(["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.strip()
        except OSError:
            who = ""
        sys.exit(f"port {port} is already taken, so pages there come from another server (perhaps another tree's site/); "
                 f"pick a free port or stop it.\n{who}")
    print(f"serving {root} at http://localhost:{port}/ (no-store, byte ranges)", flush=True)
    server.serve_forever()
