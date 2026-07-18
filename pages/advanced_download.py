from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton,
    QLabel, QTextEdit, QProgressBar, QFileDialog, QFrame,
)
from PyQt6.QtCore import Qt, pyqtSignal
from core.downloader import DownloadThread, find_ytdlp
from core.config import load_config


class AdvancedDownloadPage(QWidget):
    download_started = pyqtSignal(str)
    download_finished = pyqtSignal(dict)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.cfg = load_config()
        self.download_thread = None
        self.ytdlp = find_ytdlp()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel("Advanced Download")
        title.setObjectName("heading")
        layout.addWidget(title)

        desc = QLabel("Full yt-dlp control — use any yt-dlp argument")
        desc.setObjectName("subheading")
        layout.addWidget(desc)

        url_row = QHBoxLayout()
        url_row.setSpacing(8)
        self.url_input = QLineEdit()
        self.url_input.setPlaceholderText("https://www.youtube.com/watch?v=...")
        url_row.addWidget(self.url_input)

        self.dl_btn = QPushButton("Download")
        self.dl_btn.setFixedWidth(110)
        self.dl_btn.clicked.connect(self._start_download)
        url_row.addWidget(self.dl_btn)
        layout.addLayout(url_row)

        args_label = QLabel("Extra yt-dlp arguments:")
        args_label.setObjectName("subheading")
        layout.addWidget(args_label)

        self.args_input = QTextEdit()
        self.args_input.setPlaceholderText(
            "# Examples:\n"
            "# --format bestvideo+bestaudio\n"
            "# --write-subs --sub-lang en\n"
            "# --extract-audio --audio-format flac\n"
            "# --playlist-items 1:5\n"
            "# --cookies-from-browser chrome"
        )
        self.args_input.setFixedHeight(100)
        layout.addWidget(self.args_input)

        out_row = QHBoxLayout()
        out_row.setSpacing(8)
        out_row.addWidget(QLabel("Save to:"))
        self.path_input = QLineEdit()
        self.path_input.setText(self.cfg.get("download_path", ""))
        self.path_input.setReadOnly(True)
        out_row.addWidget(self.path_input, 1)

        browse_btn = QPushButton("Browse")
        browse_btn.setObjectName("secondaryBtn")
        browse_btn.setFixedWidth(80)
        browse_btn.clicked.connect(self._browse_folder)
        out_row.addWidget(browse_btn)
        layout.addLayout(out_row)

        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.progress_bar.setFixedHeight(8)
        layout.addWidget(self.progress_bar)

        self.status_label = QLabel("Ready")
        self.status_label.setObjectName("muted")
        layout.addWidget(self.status_label)

        layout.addStretch()

    def _browse_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Select download folder", self.path_input.text())
        if folder:
            self.path_input.setText(folder)

    def _start_download(self):
        url = self.url_input.text().strip()
        if not url:
            self.status_label.setText("Please enter a URL")
            return
        out_dir = self.path_input.text().strip()
        if not out_dir:
            self.status_label.setText("Please select a download folder")
            return

        extra = self.args_input.toPlainText().strip()
        extra = "\n".join(l for l in extra.splitlines() if l.strip() and not l.strip().startswith("#"))

        self.dl_btn.setEnabled(False)
        self.dl_btn.setText("Downloading...")
        self.progress_bar.setValue(0)
        self.status_label.setText("Starting download...")
        self.download_started.emit(url)

        self.download_thread = DownloadThread(url, out_dir, {"extra_args": extra}, self.ytdlp)
        self.download_thread.progress.connect(self._on_progress)
        self.download_thread.finished.connect(self._on_done)
        self.download_thread.error.connect(self._on_error)
        self.download_thread.start()

    def _on_progress(self, info: dict):
        if info.get("type") == "progress":
            self.progress_bar.setValue(int(info.get("percent", 0)))
            self.status_label.setText(info.get("line", ""))

    def _on_done(self, info: dict):
        self.dl_btn.setEnabled(True)
        self.dl_btn.setText("Download")
        self.progress_bar.setValue(100)
        self.status_label.setText("Download complete!")
        self.download_finished.emit(info)

    def _on_error(self, err: str):
        self.dl_btn.setEnabled(True)
        self.dl_btn.setText("Download")
        self.progress_bar.setValue(0)
        self.status_label.setText(f"Error: {err}")
