from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton,
    QLabel, QComboBox, QProgressBar, QFileDialog, QFrame,
)
from PyQt6.QtCore import Qt, pyqtSignal
from core.downloader import DownloadThread, find_ytdlp
from core.config import load_config

AUDIO_FORMATS = ["mp3", "wav", "flac", "ogg", "m4a"]
VIDEO_FORMATS = ["mp4", "mkv", "webm", "avi"]


class SimpleDownloadPage(QWidget):
    download_started = pyqtSignal(str)
    download_finished = pyqtSignal(dict)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.cfg = load_config()
        self.download_thread = None
        self.ytdlp = find_ytdlp()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 28, 28, 28)
        layout.setSpacing(16)

        title = QLabel("Quick Download")
        title.setObjectName("heading")
        layout.addWidget(title)

        desc = QLabel("Paste a URL and choose your format")
        desc.setObjectName("subheading")
        layout.addWidget(desc)

        layout.addSpacing(4)

        url_row = QHBoxLayout()
        url_row.setSpacing(10)
        self.url_input = QLineEdit()
        self.url_input.setPlaceholderText("  https://www.youtube.com/watch?v=...")
        self.url_input.setFixedHeight(44)
        self.url_input.returnPressed.connect(self._start_download)
        url_row.addWidget(self.url_input)

        self.dl_btn = QPushButton("  Download  ")
        self.dl_btn.setFixedWidth(130)
        self.dl_btn.setFixedHeight(44)
        self.dl_btn.clicked.connect(self._start_download)
        url_row.addWidget(self.dl_btn)
        layout.addLayout(url_row)

        layout.addSpacing(4)

        opt_row = QHBoxLayout()
        opt_row.setSpacing(12)

        type_card = QFrame()
        type_card.setObjectName("card")
        tc_layout = QHBoxLayout(type_card)
        tc_layout.setContentsMargins(14, 10, 14, 10)
        tc_layout.setSpacing(10)

        tc_layout.addWidget(QLabel("Type:"))
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Audio", "Video"])
        self.type_combo.setFixedHeight(34)
        self.type_combo.currentTextChanged.connect(self._update_formats)
        tc_layout.addWidget(self.type_combo)

        tc_layout.addWidget(QLabel("Format:"))
        self.format_combo = QComboBox()
        self.format_combo.setFixedHeight(34)
        tc_layout.addWidget(self.format_combo)

        opt_row.addWidget(type_card)

        qual_card = QFrame()
        qual_card.setObjectName("card")
        qc_layout = QHBoxLayout(qual_card)
        qc_layout.setContentsMargins(14, 10, 14, 10)
        qc_layout.setSpacing(10)

        qc_layout.addWidget(QLabel("Quality:"))
        self.quality_combo = QComboBox()
        self.quality_combo.addItems(["Best", "192 kbps", "128 kbps", "64 kbps"])
        self.quality_combo.setFixedHeight(34)
        qc_layout.addWidget(self.quality_combo)

        opt_row.addWidget(qual_card)
        opt_row.addStretch()
        layout.addLayout(opt_row)

        layout.addSpacing(4)

        out_row = QHBoxLayout()
        out_row.setSpacing(10)
        out_label = QLabel("Save to:")
        out_label.setStyleSheet("font-weight: 600;")
        out_row.addWidget(out_label)

        self.path_input = QLineEdit()
        self.path_input.setText(self.cfg.get("download_path", ""))
        self.path_input.setReadOnly(True)
        self.path_input.setFixedHeight(38)
        out_row.addWidget(self.path_input, 1)

        browse_btn = QPushButton("Browse")
        browse_btn.setObjectName("secondaryBtn")
        browse_btn.setFixedWidth(80)
        browse_btn.setFixedHeight(38)
        browse_btn.clicked.connect(self._browse_folder)
        out_row.addWidget(browse_btn)
        layout.addLayout(out_row)

        layout.addSpacing(8)

        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.progress_bar.setFixedHeight(10)
        layout.addWidget(self.progress_bar)

        self.status_label = QLabel("Ready")
        self.status_label.setObjectName("muted")
        layout.addWidget(self.status_label)

        layout.addStretch()
        self._update_formats("Audio")

    def _update_formats(self, type_text: str):
        self.format_combo.clear()
        if type_text == "Audio":
            self.format_combo.addItems(AUDIO_FORMATS)
        else:
            self.format_combo.addItems(VIDEO_FORMATS)

    def _browse_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Select download folder", self.path_input.text())
        if folder:
            self.path_input.setText(folder)
            self.cfg["download_path"] = folder

    def _start_download(self):
        url = self.url_input.text().strip()
        if not url:
            self.status_label.setText("Please enter a URL")
            return
        out_dir = self.path_input.text().strip()
        if not out_dir:
            self.status_label.setText("Please select a download folder")
            return

        fmt = self.format_combo.currentText().lower()
        quality = self.quality_combo.currentText()
        opts = {"format": fmt}
        if fmt in AUDIO_FORMATS:
            opts["audio_quality"] = quality.split()[0] if "kbps" in quality else "192"

        self.dl_btn.setEnabled(False)
        self.dl_btn.setText(" ... ")
        self.progress_bar.setValue(0)
        self.status_label.setText("Starting download...")
        self.download_started.emit(url)

        self.download_thread = DownloadThread(url, out_dir, opts, self.ytdlp)
        self.download_thread.progress.connect(self._on_progress)
        self.download_thread.finished.connect(self._on_done)
        self.download_thread.error.connect(self._on_error)
        self.download_thread.start()

    def _on_progress(self, info: dict):
        if info.get("type") == "progress":
            self.progress_bar.setValue(int(info.get("percent", 0)))
            self.status_label.setText(info.get("line", ""))
        elif info.get("type") == "destination":
            self.status_label.setText(f"Downloading: {info.get('file', '')}")

    def _on_done(self, info: dict):
        self.dl_btn.setEnabled(True)
        self.dl_btn.setText("  Download  ")
        self.progress_bar.setValue(100)
        self.status_label.setText("Download complete!")
        self.download_finished.emit(info)

    def _on_error(self, err: str):
        self.dl_btn.setEnabled(True)
        self.dl_btn.setText("  Download  ")
        self.progress_bar.setValue(0)
        self.status_label.setText(f"Error: {err}")

    def set_url(self, url: str):
        self.url_input.setText(url)
