from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton,
    QLabel, QScrollArea, QFrame, QSizePolicy,
)
from PyQt6.QtCore import Qt, pyqtSignal, QThread
from PyQt6.QtGui import QPixmap
import urllib.request
from core.downloader import SearchThread, find_ytdlp


class ThumbLoader(QThread):
    loaded = pyqtSignal(QPixmap)

    def __init__(self, url: str):
        super().__init__()
        self.url = url

    def run(self):
        try:
            data = urllib.request.urlopen(self.url, timeout=5).read()
            pix = QPixmap()
            pix.loadFromData(data)
            self.loaded.emit(pix)
        except Exception:
            pass


class SearchResultCard(QFrame):
    download_clicked = pyqtSignal(dict)

    def __init__(self, item: dict, parent=None):
        super().__init__(parent)
        self.item = item
        self.setObjectName("card")
        self.setFixedHeight(110)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(14, 10, 14, 10)
        layout.setSpacing(14)

        self.thumb = QLabel()
        self.thumb.setFixedSize(112, 68)
        self.thumb.setStyleSheet(
            "border-radius: 8px; background: #313244; font-size: 11px; color: #6c7086;"
        )
        self.thumb.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.thumb.setText("...")
        layout.addWidget(self.thumb)

        info = QVBoxLayout()
        info.setSpacing(3)
        info.setContentsMargins(0, 2, 0, 2)

        title = item.get("title", "Unknown")
        if len(title) > 65:
            title = title[:65] + "..."
        self.title_label = QLabel(title)
        self.title_label.setStyleSheet("font-weight: 700; font-size: 14px; color: #cdd6f4;")
        self.title_label.setWordWrap(False)
        info.addWidget(self.title_label)

        channel = item.get("channel", item.get("uploader", ""))
        self.channel_label = QLabel(channel)
        self.channel_label.setStyleSheet("font-size: 12px; color: #a6adc8;")
        info.addWidget(self.channel_label)

        duration = item.get("duration_string", "")
        views = item.get("view_count")
        view_str = f"{views:,} views" if views else ""
        meta_parts = [p for p in [duration, view_str] if p]
        self.meta_label = QLabel("  ·  ".join(meta_parts))
        self.meta_label.setStyleSheet("font-size: 11px; color: #7f849c;")
        info.addWidget(self.meta_label)

        info.addStretch()
        layout.addLayout(info, 1)

        dl_btn = QPushButton("  Download  ")
        dl_btn.setFixedSize(100, 36)
        dl_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        dl_btn.clicked.connect(lambda: self.download_clicked.emit(self.item))
        layout.addWidget(dl_btn, alignment=Qt.AlignmentFlag.AlignVCenter)

        self._load_thumb(item.get("thumbnail", ""))

    def _load_thumb(self, url: str):
        if not url:
            self.thumb.setText("N/A")
            return
        self._loader = ThumbLoader(url)
        self._loader.loaded.connect(self._set_thumb)
        self._loader.start()

    def _set_thumb(self, pix: QPixmap):
        self.thumb.setPixmap(
            pix.scaled(112, 68, Qt.AspectRatioMode.KeepAspectRatio,
                       Qt.TransformationMode.SmoothTransformation)
        )


class SearchPage(QWidget):
    download_requested = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.search_thread = None
        self.ytdlp = find_ytdlp()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 28, 28, 28)
        layout.setSpacing(16)

        title = QLabel("Search YouTube")
        title.setObjectName("heading")
        layout.addWidget(title)

        desc = QLabel("Find and download videos, music, tutorials and more")
        desc.setObjectName("subheading")
        layout.addWidget(desc)

        layout.addSpacing(4)

        search_bar = QHBoxLayout()
        search_bar.setSpacing(10)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("  🔍  Search for videos, music, tutorials...")
        self.search_input.setFixedHeight(44)
        self.search_input.returnPressed.connect(self._do_search)
        search_bar.addWidget(self.search_input)

        self.search_btn = QPushButton("  Search  ")
        self.search_btn.setFixedWidth(110)
        self.search_btn.setFixedHeight(44)
        self.search_btn.clicked.connect(self._do_search)
        search_bar.addWidget(self.search_btn)
        layout.addLayout(search_bar)

        self.status_label = QLabel("")
        self.status_label.setObjectName("muted")
        layout.addWidget(self.status_label)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll.setObjectName("card")

        self.results_widget = QWidget()
        self.results_layout = QVBoxLayout(self.results_widget)
        self.results_layout.setContentsMargins(10, 10, 10, 10)
        self.results_layout.setSpacing(10)
        self.results_layout.addStretch()

        self.placeholder = QLabel("  Search above to find videos  ")
        self.placeholder.setObjectName("subheading")
        self.placeholder.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.placeholder.setFixedHeight(120)
        self.results_layout.insertWidget(0, self.placeholder)

        scroll.setWidget(self.results_widget)
        layout.addWidget(scroll, 1)

    def _do_search(self):
        query = self.search_input.text().strip()
        if not query:
            return
        self.search_btn.setEnabled(False)
        self.search_btn.setText(" ... ")
        self.status_label.setText("Searching YouTube...")
        self._clear_results()

        self.search_thread = SearchThread(query, self.ytdlp)
        self.search_thread.results_ready.connect(self._on_results)
        self.search_thread.error.connect(self._on_error)
        self.search_thread.start()

    def _on_results(self, items: list):
        self.search_btn.setEnabled(True)
        self.search_btn.setText("  Search  ")
        if not items:
            self.status_label.setText("No results found")
            return
        self.status_label.setText(f"{len(items)} results found")
        self._clear_results()
        for item in items:
            card = SearchResultCard(item)
            card.download_clicked.connect(self._on_card_download)
            self.results_layout.insertWidget(self.results_layout.count() - 1, card)

    def _on_error(self, err: str):
        self.search_btn.setEnabled(True)
        self.search_btn.setText("  Search  ")
        self.status_label.setText(f"Error: {err}")

    def _on_card_download(self, item: dict):
        vid = item.get("id", "")
        url = item.get("url", "") or f"https://www.youtube.com/watch?v={vid}"
        self.download_requested.emit(url)

    def _clear_results(self):
        while self.results_layout.count() > 1:
            item = self.results_layout.takeAt(0)
            w = item.widget()
            if w:
                w.deleteLater()
        self.placeholder = None
