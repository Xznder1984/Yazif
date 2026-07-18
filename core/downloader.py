import json
import os
import subprocess
import sys
import shutil
from pathlib import Path
from PyQt6.QtCore import QThread, pyqtSignal


def find_ytdlp() -> str:
    ytdlp = shutil.which("yt-dlp")
    if ytdlp:
        return ytdlp
    if sys.platform == "win32":
        for p in [
            Path.home() / "AppData" / "Local" / "Programs" / "Python" / "Scripts" / "yt-dlp.exe",
            Path(r"C:\tools\yt-dlp.exe"),
        ]:
            if p.exists():
                return str(p)
    return "yt-dlp"


def ensure_ytdlp_installed() -> tuple[bool, str]:
    path = find_ytdlp()
    if path != "yt-dlp" and Path(path).exists():
        return True, path
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "yt-dlp"],
            capture_output=True, timeout=120,
        )
        path = find_ytdlp()
        if path != "yt-dlp":
            return True, path
    except Exception:
        pass
    return False, ""


class SearchThread(QThread):
    results_ready = pyqtSignal(list)
    error = pyqtSignal(str)

    def __init__(self, query: str, ytdlp_path: str = "yt-dlp"):
        super().__init__()
        self.query = query
        self.ytdlp_path = ytdlp_path

    def run(self):
        try:
            result = subprocess.run(
                [
                    self.ytdlp_path,
                    f"ytsearch10:{self.query}",
                    "--dump-json",
                    "--flat-playlist",
                    "--no-warnings",
                ],
                capture_output=True, text=True, timeout=30,
            )
            items = []
            for line in result.stdout.strip().split("\n"):
                if line.strip():
                    try:
                        items.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
            self.results_ready.emit(items)
        except Exception as e:
            self.error.emit(str(e))


class DownloadThread(QThread):
    progress = pyqtSignal(dict)
    finished = pyqtSignal(dict)
    error = pyqtSignal(str)

    def __init__(self, url: str, output_dir: str, options: dict = None, ytdlp_path: str = "yt-dlp"):
        super().__init__()
        self.url = url
        self.output_dir = output_dir
        self.options = options or {}
        self.ytdlp_path = ytdlp_path
        self._process = None

    def run():
        self = DownloadThread.__new__(DownloadThread)
        pass

    def run(self):
        try:
            os.makedirs(self.output_dir, exist_ok=True)
            output_template = os.path.join(self.output_dir, "%(title)s.%(ext)s")
            cmd = [
                self.ytdlp_path,
                self.url,
                "-o", output_template,
                "--no-warnings",
                "--newline",
            ]
            fmt = self.options.get("format")
            if fmt:
                if fmt in ("mp3", "wav", "flac", "ogg", "m4a"):
                    cmd += ["-x", "--audio-format", fmt]
                    q = self.options.get("audio_quality", "192")
                    cmd += ["--audio-quality", q]
                elif fmt in ("mp4", "mkv", "webm", "avi"):
                    cmd += ["-f", f"bestvideo[ext={fmt}]+bestaudio/best"]

            extra = self.options.get("extra_args", "")
            if extra:
                cmd += extra.split()

            self._process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
            )

            for line in self._process.stdout:
                line = line.strip()
                if not line:
                    continue
                info = self._parse_progress(line)
                if info:
                    self.progress.emit(info)

            self._process.wait()
            if self._process.returncode == 0:
                self.finished.emit({"status": "done", "url": self.url})
            else:
                self.error.emit(f"yt-dlp exited with code {self._process.returncode}")
        except Exception as e:
            self.error.emit(str(e))

    def _parse_progress(self, line: str) -> dict | None:
        if "[download]" in line and "%" in line:
            try:
                parts = line.split()
                pct = [p for p in parts if "%" in p][0].replace("%", "")
                return {"type": "progress", "percent": float(pct), "line": line}
            except (IndexError, ValueError):
                pass
        if "[download] Destination:" in line:
            fname = line.split("Destination:")[-1].strip()
            return {"type": "destination", "file": fname, "line": line}
        if "has already been downloaded" in line:
            return {"type": "already", "line": line}
        return None

    def cancel(self):
        if self._process:
            self._process.terminate()
