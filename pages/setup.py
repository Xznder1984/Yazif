from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton,
    QLabel, QFileDialog, QFrame,
)
from PyQt6.QtCore import Qt, pyqtSignal
from core.config import load_config, save_config


class SetupWizard(QWidget):
    setup_complete = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.cfg = load_config()

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setContentsMargins(100, 60, 100, 60)
        layout.setSpacing(20)

        logo = QLabel("YAZIF")
        logo.setAlignment(Qt.AlignmentFlag.AlignCenter)
        logo.setStyleSheet("font-size: 52px; font-weight: 800; color: #cba6f7; letter-spacing: 2px;")
        layout.addWidget(logo)

        subtitle = QLabel("Welcome! Let's get you set up.")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle.setStyleSheet("font-size: 16px; color: #bac2de;")
        layout.addWidget(subtitle)

        layout.addSpacing(16)

        card = QFrame()
        card.setObjectName("card")
        card.setMinimumWidth(500)
        card_layout = QVBoxLayout(card)
        card_layout.setContentsMargins(28, 28, 28, 28)
        card_layout.setSpacing(18)

        path_label = QLabel("Choose your download folder:")
        path_label.setStyleSheet("font-weight: 600; font-size: 14px;")
        card_layout.addWidget(path_label)

        path_row = QHBoxLayout()
        path_row.setSpacing(10)
        self.path_input = QLineEdit()
        self.path_input.setText(self.cfg.get("download_path", ""))
        self.path_input.setReadOnly(True)
        self.path_input.setFixedHeight(40)
        path_row.addWidget(self.path_input, 1)

        browse_btn = QPushButton("Browse")
        browse_btn.setObjectName("secondaryBtn")
        browse_btn.setFixedWidth(90)
        browse_btn.setFixedHeight(40)
        browse_btn.clicked.connect(self._browse)
        path_row.addWidget(browse_btn)
        card_layout.addLayout(path_row)

        card_layout.addSpacing(8)

        api_label = QLabel("NVIDIA NIM API key (optional — enables AI renaming):")
        api_label.setStyleSheet("font-weight: 600; font-size: 14px;")
        card_layout.addWidget(api_label)

        self.api_input = QLineEdit()
        self.api_input.setPlaceholderText("nvapi-... (leave blank to skip)")
        self.api_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.api_input.setFixedHeight(40)
        card_layout.addWidget(self.api_input)

        api_link = QLabel('<a href="https://build.nvidia.com" style="color: #89b4fa; text-decoration: none;">Get a free key at build.nvidia.com →</a>')
        api_link.setOpenExternalLinks(True)
        card_layout.addWidget(api_link)

        layout.addWidget(card, alignment=Qt.AlignmentFlag.AlignCenter)

        layout.addSpacing(8)

        start_btn = QPushButton("  Start Using Yazif  ")
        start_btn.setFixedWidth(220)
        start_btn.setFixedHeight(48)
        start_btn.clicked.connect(self._finish)
        layout.addWidget(start_btn, alignment=Qt.AlignmentFlag.AlignCenter)

    def _browse(self):
        folder = QFileDialog.getExistingDirectory(self, "Select download folder")
        if folder:
            self.path_input.setText(folder)

    def _finish(self):
        self.cfg["download_path"] = self.path_input.text()
        self.cfg["nvidia_api_key"] = self.api_input.text().strip()
        self.cfg["setup_complete"] = True
        save_config(self.cfg)
        self.setup_complete.emit()
