import sys
import os
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QStackedWidget, QLabel, QSizePolicy, QFrame,
)
from PyQt6.QtCore import Qt, QSize, QUrl
from PyQt6.QtGui import QIcon, QDesktopServices, QDragEnterEvent, QDropEvent

from styles import QSS
from core.config import load_config, is_setup_complete, save_config
from core.downloader import ensure_ytdlp_installed
from pages.setup import SetupWizard
from pages.search import SearchPage
from pages.simple_download import SimpleDownloadPage
from pages.advanced_download import AdvancedDownloadPage
from pages.music_organizer import MusicOrganizerPage
from pages.downloads import DownloadsPage
from pages.settings import SettingsPage


SIDEBAR_ITEMS = [
    ("search", "Search"),
    ("simple", "Quick Download"),
    ("advanced", "Advanced Download"),
    ("music", "Music Organizer"),
    ("downloads", "Downloads"),
    ("settings", "Settings"),
]

ICON_SVGS = {
    "search": '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M12 12L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    "simple": '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3V13M9 13L5 9M9 13L13 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    "advanced": '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 6V9L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "music": '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 2V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 2L6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    "downloads": '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 8L9 11L12 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 4V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    "settings": '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M9 2V4M9 14V16M16 9H14M4 9H2M14 4L12.5 5.5M5.5 12.5L4 14M14 14L12.5 12.5M5.5 5.5L4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
}


class SidebarButton(QPushButton):
    def __init__(self, key: str, label: str, parent=None):
        super().__init__(label, parent)
        self.key = key
        self.setCheckable(True)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(40)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Yazif")
        self.setMinimumSize(1100, 700)
        self.resize(1200, 800)
        self.setAcceptDrops(True)

        icon_path = os.path.join(os.path.dirname(__file__), "assets", "icon.ico")
        if os.path.exists(icon_path):
            self.setWindowIcon(QIcon(icon_path))

        self.cfg = load_config()

        if not is_setup_complete():
            self._show_setup()
            return

        self._show_main_ui()
        self._check_ytdlp()

    def _show_setup(self):
        self.setup_wizard = SetupWizard()
        self.setup_wizard.setup_complete.connect(self._on_setup_done)
        self.setCentralWidget(self.setup_wizard)

    def _on_setup_done(self):
        self.cfg = load_config()
        self._show_main_ui()
        self._check_ytdlp()

    def _show_main_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(200)
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(8, 12, 8, 12)
        sidebar_layout.setSpacing(4)

        brand = QLabel("Yazif")
        brand.setObjectName("sidebarTitle")
        brand.setAlignment(Qt.AlignmentFlag.AlignCenter)
        sidebar_layout.addWidget(brand)

        self.nav_buttons = {}
        for key, label in SIDEBAR_ITEMS:
            btn = SidebarButton(key, label)
            btn.clicked.connect(lambda checked, k=key: self._switch_page(k))
            sidebar_layout.addWidget(btn)
            self.nav_buttons[key] = btn

        sidebar_layout.addStretch()

        help_btn = QPushButton("Help")
        help_btn.setObjectName("secondaryBtn")
        help_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        help_btn.clicked.connect(self._open_help)
        sidebar_layout.addWidget(help_btn)

        main_layout.addWidget(sidebar)

        self.stack = QStackedWidget()
        main_layout.addWidget(self.stack, 1)

        self.pages = {}
        self.search_page = SearchPage()
        self.simple_page = SimpleDownloadPage()
        self.advanced_page = AdvancedDownloadPage()
        self.music_page = MusicOrganizerPage()
        self.downloads_page = DownloadsPage()
        self.settings_page = SettingsPage(on_config_saved=self._on_config_saved)

        self.pages["search"] = self.search_page
        self.pages["simple"] = self.simple_page
        self.pages["advanced"] = self.advanced_page
        self.pages["music"] = self.music_page
        self.pages["downloads"] = self.downloads_page
        self.pages["settings"] = self.settings_page

        for page in self.pages.values():
            self.stack.addWidget(page)

        self.search_page.download_requested.connect(self._on_search_download)

        self._switch_page("search")

    def _switch_page(self, key: str):
        if key in self.pages:
            self.stack.setCurrentWidget(self.pages[key])
        for k, btn in self.nav_buttons.items():
            btn.setChecked(k == key)

    def _on_search_download(self, url: str):
        self.simple_page.set_url(url)
        self._switch_page("simple")

    def _on_config_saved(self, cfg: dict):
        self.cfg = cfg

    def _open_help(self):
        QDesktopServices.openUrl(QUrl("https://github.com/Xznder1984/Yazif"))

    def _check_ytdlp(self):
        ok, path = ensure_ytdlp_installed()
        if not ok:
            self.downloads_page.log.append("yt-dlp not found — downloads may not work")

    def dragEnterEvent(self, event: QDragEnterEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event: QDropEvent):
        for url in event.mimeData().urls():
            path = url.toLocalFile()
            if path:
                self.simple_page.set_url(path)
                self._switch_page("simple")
                break


def main():
    app = QApplication(sys.argv)
    app.setStyleSheet(QSS)
    app.setApplicationName("Yazif")
    app.setApplicationVersion("1.0.0")

    icon_path = os.path.join(os.path.dirname(__file__), "assets", "icon.ico")
    if os.path.exists(icon_path):
        app.setWindowIcon(QIcon(icon_path))

    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
