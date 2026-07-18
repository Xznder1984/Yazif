import os
import subprocess
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QScrollArea, QFrame, QSizePolicy,
)
from PyQt6.QtCore import Qt, pyqtSignal
from core.config import load_config


class DownloadItemCard(QFrame):
    def __init__(self, filepath: str, parent=None):
        super().__init__(parent)
        self.filepath = filepath
        self.setObjectName("card")
        self.setFixedHeight(60)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 8, 12, 8)
        layout.setSpacing(12)

        name = os.path.basename(filepath)
        ext = os.path.splitext(name)[1].lower()

        icon_label = QLabel(ext.upper().replace(".", "") if ext else "FILE")
        icon_label.setFixedSize(36, 36)
        icon_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        colors = {
            ".mp4": "#89b4fa", ".mkv": "#89b4fa", ".webm": "#89b4fa",
            ".mp3": "#a6e3a1", ".wav": "#a6e3a1", ".flac": "#a6e3a1",
            ".m4a": "#a6e3a1", ".ogg": "#a6e3a1",
        }
        c = colors.get(ext, "#9399b2")
        icon_label.setStyleSheet(f"background: {c}22; color: {c}; border-radius: 6px; font-weight: bold; font-size: 10px;")
        layout.addWidget(icon_label)

        info = QVBoxLayout()
        info.setSpacing(2)
        info.addWidget(QLabel(name))
        size = ""
        try:
            s = os.path.getsize(filepath)
            if s > 1_000_000:
                size = f"{s / 1_000_000:.1f} MB"
            else:
                size = f"{s / 1_000:.0f} KB"
        except Exception:
            pass
        size_label = QLabel(size)
        size_label.setObjectName("muted")
        info.addWidget(size_label)
        layout.addLayout(info, 1)

        open_btn = QPushButton("Open")
        open_btn.setObjectName("secondaryBtn")
        open_btn.setFixedWidth(60)
        open_btn.clicked.connect(self._open_file)
        layout.addWidget(open_btn)

        folder_btn = QPushButton("Folder")
        folder_btn.setObjectName("secondaryBtn")
        folder_btn.setFixedWidth(60)
        folder_btn.clicked.connect(self._open_folder)
        layout.addWidget(folder_btn)

    def _open_file(self):
        try:
            os.startfile(self.filepath)
        except Exception:
            subprocess.run(["explorer", self.filepath])

    def _open_folder(self):
        subprocess.run(["explorer", "/select,", self.filepath])


class DownloadsPage(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        header = QHBoxLayout()
        title = QLabel("Recent Downloads")
        title.setObjectName("heading")
        header.addWidget(title)
        header.addStretch()

        refresh_btn = QPushButton("Refresh")
        refresh_btn.setObjectName("secondaryBtn")
        refresh_btn.setFixedWidth(80)
        refresh_btn.clicked.connect(self.refresh)
        header.addWidget(refresh_btn)
        layout.addLayout(header)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        self.list_widget = QWidget()
        self.list_layout = QVBoxLayout(self.list_widget)
        self.list_layout.setContentsMargins(0, 0, 0, 0)
        self.list_layout.setSpacing(8)
        self.list_layout.addStretch()

        self.empty_label = QLabel("No downloads yet")
        self.empty_label.setObjectName("subheading")
        self.empty_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.list_layout.insertWidget(0, self.empty_label)

        scroll.setWidget(self.list_widget)
        layout.addWidget(scroll, 1)

        self.refresh()

    def refresh(self):
        while self.list_layout.count() > 1:
            item = self.list_layout.takeAt(0)
            w = item.widget()
            if w:
                w.deleteLater()

        cfg = load_config()
        downloads = cfg.get("recent_downloads", [])
        found = 0
        for fp in reversed(downloads[-50:]):
            if os.path.exists(fp):
                card = DownloadItemCard(fp)
                self.list_layout.insertWidget(0, card)
                found += 1

        if found:
            self.empty_label = None
        else:
            self.empty_label = QLabel("No downloads yet")
            self.empty_label.setObjectName("subheading")
            self.empty_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.list_layout.insertWidget(0, self.empty_label)

    def add_download(self, filepath: str):
        cfg = load_config()
        downloads = cfg.get("recent_downloads", [])
        if filepath not in downloads:
            downloads.append(filepath)
        cfg["recent_downloads"] = downloads[-100:]
        from core.config import save_config
        save_config(cfg)
        self.refresh()
