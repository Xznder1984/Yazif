import sys
import os
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QStackedWidget, QLabel, QFrame, QGraphicsDropShadowEffect,
)
from PyQt6.QtCore import Qt, QUrl, QSize
from PyQt6.QtGui import QIcon, QDesktopServices, QDragEnterEvent, QDropEvent, QColor

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
    ("search", "Search", "🔍"),
    ("simple", "Quick Download", "⬇"),
    ("advanced", "Advanced Download", "⚙"),
    ("music", "Music Organizer", "🎵"),
    ("downloads", "Downloads", "📁"),
]


class SidebarButton(QPushButton):
    def __init__(self, key: str, label: str, icon_char: str = "", parent=None):
        display = f"  {icon_char}  {label}" if icon_char else label
        super().__init__(display, parent)
        self.key = key
        self.setCheckable(True)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(46)


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

        # ── Sidebar ──
        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(230)
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(12, 20, 12, 20)
        sidebar_layout.setSpacing(2)

        brand = QLabel("YAZIF")
        brand.setObjectName("sidebarTitle")
        brand.setAlignment(Qt.AlignmentFlag.AlignLeft)
        sidebar_layout.addWidget(brand)

        version = QLabel("v1.0.0")
        version.setObjectName("sidebarVersion")
        sidebar_layout.addWidget(version)

        sep = QFrame()
        sep.setObjectName("sidebarSeparator")
        sep.setFrameShape(QFrame.Shape.HLine)
        sidebar_layout.addWidget(sep)
        sidebar_layout.addSpacing(8)

        self.nav_buttons = {}
        for key, label, icon in SIDEBAR_ITEMS:
            btn = SidebarButton(key, label, icon)
            btn.clicked.connect(lambda checked, k=key: self._switch_page(k))
            sidebar_layout.addWidget(btn)
            self.nav_buttons[key] = btn

        sidebar_layout.addStretch()

        sep2 = QFrame()
        sep2.setObjectName("sidebarSeparator")
        sep2.setFrameShape(QFrame.Shape.HLine)
        sidebar_layout.addWidget(sep2)
        sidebar_layout.addSpacing(6)

        settings_btn = SidebarButton("settings", "Settings", "⚙")
        settings_btn.clicked.connect(lambda: self._switch_page("settings"))
        self.nav_buttons["settings"] = settings_btn
        sidebar_layout.addWidget(settings_btn)

        help_btn = QPushButton("  ❓  Help")
        help_btn.setObjectName("ghostBtn")
        help_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        help_btn.setFixedHeight(42)
        help_btn.clicked.connect(self._open_help)
        sidebar_layout.addWidget(help_btn)

        shadow = QGraphicsDropShadowEffect()
        shadow.setBlurRadius(20)
        shadow.setColor(QColor(0, 0, 0, 60))
        shadow.setOffset(2, 0)
        sidebar.setGraphicsEffect(shadow)

        main_layout.addWidget(sidebar)

        # ── Content area ──
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
            self.downloads_page.log.append("yt-dlp not found - downloads may not work")

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
