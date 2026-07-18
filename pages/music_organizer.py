from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton, QLabel,
    QFileDialog, QFrame, QTextEdit, QProgressBar,
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from core.organizer import organize_by_artist_album, get_music_stats
from core.ai import batch_rename
from core.config import load_config


class OrganizeThread(QThread):
    result = pyqtSignal(list)
    error = pyqtSignal(str)

    def __init__(self, source: str, dest: str):
        super().__init__()
        self.source = source
        self.dest = dest

    def run(self):
        try:
            moved = organize_by_artist_album(self.source, self.dest)
            self.result.emit(moved)
        except Exception as e:
            self.error.emit(str(e))


class AIRenameThread(QThread):
    result = pyqtSignal(list)
    progress = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(self, folder: str, api_key: str):
        super().__init__()
        self.folder = folder
        self.api_key = api_key

    def run(self):
        try:
            results = batch_rename(self.folder, self.api_key, lambda old, new: self.progress.emit(f"{old} → {new}"))
            self.result.emit(results)
        except Exception as e:
            self.error.emit(str(e))


class MusicOrganizerPage(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.cfg = load_config()
        self.organize_thread = None
        self.rename_thread = None

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel("Music Organizer")
        title.setObjectName("heading")
        layout.addWidget(title)

        desc = QLabel("Organize your music library by Artist / Album")
        desc.setObjectName("subheading")
        layout.addWidget(desc)

        folder_row = QHBoxLayout()
        folder_row.setSpacing(8)
        folder_row.addWidget(QLabel("Music folder:"))
        self.folder_input = QLineEdit()
        self.folder_input.setPlaceholderText("C:\\Users\\User\\Music")
        folder_row.addWidget(self.folder_input, 1)

        browse_btn = QPushButton("Browse")
        browse_btn.setObjectName("secondaryBtn")
        browse_btn.setFixedWidth(80)
        browse_btn.clicked.connect(self._browse)
        folder_row.addWidget(browse_btn)
        layout.addLayout(folder_row)

        stats_card = QFrame()
        stats_card.setObjectName("card")
        stats_layout = QVBoxLayout(stats_card)
        self.stats_label = QLabel("Click Scan to analyze your music library")
        self.stats_label.setObjectName("subheading")
        stats_layout.addWidget(self.stats_label)
        layout.addWidget(stats_card)

        btn_row = QHBoxLayout()
        btn_row.setSpacing(8)

        scan_btn = QPushButton("Scan")
        scan_btn.setObjectName("secondaryBtn")
        scan_btn.clicked.connect(self._scan)
        btn_row.addWidget(scan_btn)

        org_btn = QPushButton("Organize by Artist/Album")
        org_btn.clicked.connect(self._organize)
        btn_row.addWidget(org_btn)

        rename_btn = QPushButton("AI Rename")
        rename_btn.setObjectName("secondaryBtn")
        rename_btn.clicked.connect(self._ai_rename)
        btn_row.addWidget(rename_btn)

        btn_row.addStretch()
        layout.addLayout(btn_row)

        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        self.progress_bar.setFixedHeight(8)
        layout.addWidget(self.progress_bar)

        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setPlaceholderText("Activity log...")
        layout.addWidget(self.log, 1)

        self.status_label = QLabel("Ready")
        self.status_label.setObjectName("muted")
        layout.addWidget(self.status_label)

    def _browse(self):
        folder = QFileDialog.getExistingDirectory(self, "Select music folder")
        if folder:
            self.folder_input.setText(folder)

    def _scan(self):
        folder = self.folder_input.text().strip()
        if not folder:
            self.status_label.setText("Please select a folder first")
            return
        try:
            stats = get_music_stats(folder)
            self.stats_label.setText(
                f"  {stats['total_files']} files  |  "
                f"{stats['total_artists']} artists  |  "
                f"{stats['total_albums']} albums"
            )
        except Exception as e:
            self.stats_label.setText(f"Error scanning: {e}")

    def _organize(self):
        folder = self.folder_input.text().strip()
        if not folder:
            self.status_label.setText("Please select a folder first")
            return
        self.status_label.setText("Organizing...")
        self.progress_bar.setValue(0)
        self.organize_thread = OrganizeThread(folder, folder)
        self.organize_thread.result.connect(self._on_organize_done)
        self.organize_thread.error.connect(self._on_error)
        self.organize_thread.start()

    def _on_organize_done(self, moved: list):
        self.progress_bar.setValue(100)
        if moved:
            self.log.append(f"Organized {len(moved)} files:")
            for m in moved:
                self.log.append(f"  {m['file']} → {m['artist']}/{m['album']}/")
        else:
            self.log.append("No files needed organizing")
        self.status_label.setText(f"Organized {len(moved)} files")

    def _ai_rename(self):
        folder = self.folder_input.text().strip()
        if not folder:
            self.status_label.setText("Please select a folder first")
            return
        api_key = self.cfg.get("nvidia_api_key", "")
        if not api_key:
            self.status_label.setText("Set NVIDIA API key in Settings first")
            return
        self.status_label.setText("AI renaming...")
        self.progress_bar.setValue(0)
        self.rename_thread = AIRenameThread(folder, api_key)
        self.rename_thread.progress.connect(lambda msg: self.log.append(f"  {msg}"))
        self.rename_thread.result.connect(self._on_rename_done)
        self.rename_thread.error.connect(self._on_error)
        self.rename_thread.start()

    def _on_rename_done(self, results: list):
        self.progress_bar.setValue(100)
        self.log.append(f"AI renamed {len(results)} files")
        self.status_label.setText(f"Renamed {len(results)} files")

    def _on_error(self, err: str):
        self.status_label.setText(f"Error: {err}")
        self.log.append(f"Error: {err}")
