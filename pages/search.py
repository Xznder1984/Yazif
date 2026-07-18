from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton,
    QLabel, QScrollArea, QFrame, QGridLayout, QSizePolicy,
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize
from PyQt6.QtGui import QPixmap
import urllib.request
from io import BytesIO
from core.downloader import SearchThread, find_ytdlp


class SearchResultCard(QFrame):
    download_clicked = pyqtSignal(dict)

    def __init__(self, item: dict, parent=None):
        super().__init__(parent)
        self.item = item
        self.setObjectName("card")
        self.setFixedHeight(100)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 8, 12, 8)
        layout.setSpacing(12)

        self.thumb = QLabel()
        self.thumb.setFixedSize(80, 60)
        self.thumb.setStyleSheet("border-radius: 6px; background: #313244;")
        self.thumb.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.thumb.setText("...")
        layout.addWidget(self.thumb)

        info = QVBoxLayout()
        info.setSpacing(4)

        title = item.get("title", "Unknown")
        if len(title) > 70:
            title = title[:70] + "..."
        self.title_label = QLabel(title)
        self.title_label.setStyleSheet("font-weight: bold; font-size: 13px;")
        self.title_label.setWordWrap(False)
        info.addWidget(self.title_label)

        channel = item.get("channel", item.get("uploader", "Unknown"))
        self.channel_label = QLabel(channel)
        self.channel_label.setObjectName("subheading")
        info.addWidget(self.channel_label)

        duration = item.get("duration_string", item.get("duration", ""))
        url = item.get("url", item.get("id", ""))
        self.meta_label = QLabel(f"{duration}  •  {url[:40]}")
        self.meta_label.setObjectName("muted")
        info.addWidget(self.meta_label)

        layout.addLayout(info, 1)

        dl_btn = QPushButton("Download")
        dl_btn.setFixedWidth(90)
        dl_btn.clicked.connect(lambda: self.download_clicked.emit(self.item))
        layout.addWidget(dl_btn, alignment=Qt.AlignmentFlag.AlignVCenter)

        self._load_thumb(item.get("thumbnail", ""))

    def _load_thumb(self, url: str):
        if not url:
            self.thumb.setText("No img")
            return
        try:
            data = urllib.request.urlopen(url, timeout=5).read()
            pix = QPixmap()
            pix.loadFromData(data)
            self.thumb.setPixmap(pix.scaled(80, 60, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        except Exception:
            self.thumb.setText("No img")


class SearchPage(QWidget):
    download_requested = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.search_thread = None
        self.ytdlp = find_ytdlp()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel("Search YouTube")
        title.setObjectName("heading")
        layout.addWidget(title)

        desc = QLabel("Find and download videos directly from YouTube")
        desc.setObjectName("subheading")
        layout.addWidget(desc)

        search_bar = QHBoxLayout()
        search_bar.setSpacing(8)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search for videos, music, tutorials...")
        self.search_input.returnPressed.connect(self._do_search)
        search_bar.addWidget(self.search_input)

        self.search_btn = QPushButton("Search")
        self.search_btn.setFixedWidth(100)
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
        self.results_layout.setContentsMargins(8, 8, 8, 8)
        self.results_layout.setSpacing(8)
        self.results_layout.addStretch()

        placeholder = QLabel("Search above to find videos")
        placeholder.setObjectName("subheading")
        placeholder.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.results_layout.insertWidget(0, placeholder)
        self.placeholder = placeholder

        scroll.setWidget(self.results_widget)
        layout.addWidget(scroll, 1)

    def _do_search(self):
        query = self.search_input.text().strip()
        if not query:
            return
        self.search_btn.setEnabled(False)
        self.search_btn.setText("...")
        self.status_label.setText("Searching...")
        self._clear_results()

        self.search_thread = SearchThread(query, self.ytdlp)
        self.search_thread.results_ready.connect(self._on_results)
        self.search_thread.error.connect(self._on_error)
        self.search_thread.start()

    def _on_results(self, items: list):
        self.search_btn.setEnabled(True)
        self.search_btn.setText("Search")
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
        self.search_btn.setText("Search")
        self.status_label.setText(f"Error: {err}")

    def _on_card_download(self, item: dict):
        url = item.get("url", "")
        if not url:
            vid = item.get("id", "")
            url = f"https://www.youtube.com/watch?v={vid}"
        self.download_requested.emit(url)

    def _clear_results(self):
        while self.results_layout.count() > 1:
            item = self.results_layout.takeAt(0)
            w = item.widget()
            if w:
                w.deleteLater()
        if self.placeholder:
            self.placeholder = None
