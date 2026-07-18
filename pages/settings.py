from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLineEdit, QPushButton,
    QLabel, QFileDialog, QCheckBox, QFrame, QGroupBox, QFormLayout,
)
from PyQt6.QtCore import Qt
from core.config import load_config, save_config


class SettingsPage(QWidget):
    def __init__(self, on_config_saved=None, parent=None):
        super().__init__(parent)
        self.cfg = load_config()
        self.on_config_saved = on_config_saved

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 28, 28, 28)
        layout.setSpacing(16)

        title = QLabel("Settings")
        title.setObjectName("heading")
        layout.addWidget(title)

        desc = QLabel("Configure your download preferences")
        desc.setObjectName("subheading")
        layout.addWidget(desc)

        layout.addSpacing(4)

        dl_group = QGroupBox("Download")
        dl_form = QFormLayout(dl_group)
        dl_form.setSpacing(14)

        path_row = QHBoxLayout()
        path_row.setSpacing(12)
        self.path_input = QLineEdit()
        self.path_input.setText(self.cfg.get("download_path", ""))
        self.path_input.setReadOnly(True)
        self.path_input.setFixedHeight(40)
        path_row.addWidget(self.path_input, 1)
        browse = QPushButton("Browse")
        browse.setObjectName("secondaryBtn")
        browse.setFixedWidth(100)
        browse.setFixedHeight(40)
        browse.clicked.connect(self._browse_path)
        path_row.addWidget(browse)
        dl_form.addRow("Download folder:", path_row)

        self.ai_check = QCheckBox("Enable AI-powered file renaming")
        self.ai_check.setChecked(self.cfg.get("ai_rename", True))
        dl_form.addRow("", self.ai_check)

        layout.addWidget(dl_group)

        api_group = QGroupBox("NVIDIA NIM API")
        api_form = QFormLayout(api_group)
        api_form.setSpacing(14)

        self.api_input = QLineEdit()
        self.api_input.setPlaceholderText("nvapi-...")
        self.api_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.api_input.setText(self.cfg.get("nvidia_api_key", ""))
        self.api_input.setFixedHeight(40)
        api_form.addRow("API Key:", self.api_input)

        api_link = QLabel('<a href="https://build.nvidia.com" style="color: #89b4fa;">Get free key at build.nvidia.com</a>')
        api_link.setOpenExternalLinks(True)
        api_form.addRow("", api_link)

        layout.addWidget(api_group)

        fmt_group = QGroupBox("Default Format Settings")
        fmt_form = QFormLayout(fmt_group)
        fmt_form.setSpacing(14)
        layout.addWidget(fmt_group)

        layout.addSpacing(8)

        save_btn = QPushButton("  Save Settings  ")
        save_btn.setFixedHeight(44)
        save_btn.setMinimumWidth(160)
        save_btn.clicked.connect(self._save)
        layout.addWidget(save_btn)

        self.status_label = QLabel("")
        self.status_label.setObjectName("muted")
        layout.addWidget(self.status_label)

        layout.addStretch()

    def _browse_path(self):
        folder = QFileDialog.getExistingDirectory(self, "Select download folder", self.path_input.text())
        if folder:
            self.path_input.setText(folder)

    def _save(self):
        self.cfg["download_path"] = self.path_input.text()
        self.cfg["ai_rename"] = self.ai_check.isChecked()
        self.cfg["nvidia_api_key"] = self.api_input.text().strip()
        self.cfg["setup_complete"] = True
        save_config(self.cfg)
        self.status_label.setText("Settings saved!")
        if self.on_config_saved:
            self.on_config_saved(self.cfg)
