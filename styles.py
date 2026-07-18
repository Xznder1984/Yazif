CATPPUCCIN = {
    "rosewater": "#f5e0dc",
    "flamingo": "#f2cdcd",
    "pink": "#f5c2e7",
    "mauve": "#cba6f7",
    "red": "#f38ba8",
    "maroon": "#eba0ac",
    "peach": "#fab387",
    "yellow": "#f9e2af",
    "green": "#a6e3a1",
    "teal": "#94e2d5",
    "sky": "#89dceb",
    "sapphire": "#74c7ec",
    "blue": "#89b4fa",
    "lavender": "#b4befe",
    "text": "#cdd6f4",
    "subtext1": "#bac2de",
    "subtext0": "#a6adc8",
    "overlay2": "#9399b2",
    "overlay1": "#7f849c",
    "overlay0": "#6c7086",
    "surface2": "#585b70",
    "surface1": "#45475a",
    "surface0": "#313244",
    "base": "#1e1e2e",
    "mantle": "#181825",
    "crust": "#11111b",
}

C = CATPPUCCIN

QSS = f"""
QMainWindow, QWidget {{
    background-color: {C['base']};
    color: {C['text']};
    font-family: 'Segoe UI', sans-serif;
    font-size: 13px;
}}

/* Sidebar */
#sidebar {{
    background-color: {C['mantle']};
    border-right: 1px solid {C['surface0']};
}}

#sidebar QPushButton {{
    background: transparent;
    color: {C['subtext0']};
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    text-align: left;
    font-size: 13px;
}}

#sidebar QPushButton:hover {{
    background-color: {C['surface0']};
    color: {C['text']};
}}

#sidebar QPushButton:checked {{
    background-color: {C['surface0']};
    color: {C['mauve']};
}}

#sidebarTitle {{
    color: {C['mauve']};
    font-size: 18px;
    font-weight: bold;
    padding: 16px;
}}

/* Buttons */
QPushButton {{
    background-color: {C['mauve']};
    color: {C['crust']};
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: bold;
    font-size: 13px;
}}

QPushButton:hover {{
    background-color: {C['lavender']};
}}

QPushButton:pressed {{
    background-color: {C['blue']};
}}

QPushButton:disabled {{
    background-color: {C['surface1']};
    color: {C['overlay0']};
}}

#secondaryBtn {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 1px solid {C['surface2']};
}}

#secondaryBtn:hover {{
    background-color: {C['surface1']};
    border-color: {C['overlay1']};
}}

/* Inputs */
QLineEdit, QSpinBox, QComboBox {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 1px solid {C['surface2']};
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    selection-background-color: {C['mauve']};
}}

QLineEdit:focus, QSpinBox:focus, QComboBox:focus {{
    border-color: {C['mauve']};
}}

QComboBox::drop-down {{
    border: none;
    padding-right: 8px;
}}

QComboBox QAbstractItemView {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 1px solid {C['surface2']};
    selection-background-color: {C['mauve']};
    selection-color: {C['crust']};
}}

QTextEdit {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 1px solid {C['surface2']};
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 12px;
}}

QTextEdit:focus {{
    border-color: {C['mauve']};
}}

/* Labels */
QLabel {{
    color: {C['text']};
}}

#heading {{
    font-size: 22px;
    font-weight: bold;
    color: {C['text']};
}}

#subheading {{
    font-size: 14px;
    color: {C['subtext0']};
}}

#muted {{
    color: {C['overlay1']};
    font-size: 12px;
}}

/* Progress bar */
QProgressBar {{
    background-color: {C['surface0']};
    border: none;
    border-radius: 4px;
    height: 8px;
    text-align: center;
    color: transparent;
}}

QProgressBar::chunk {{
    background-color: {C['mauve']};
    border-radius: 4px;
}}

/* Scroll bar */
QScrollBar:vertical {{
    background: transparent;
    width: 8px;
    margin: 0;
}}

QScrollBar::handle:vertical {{
    background: {C['surface2']};
    border-radius: 4px;
    min-height: 30px;
}}

QScrollBar::handle:vertical:hover {{
    background: {C['overlay1']};
}}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
    height: 0;
}}

QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {{
    background: transparent;
}}

/* Cards / Panels */
#card {{
    background-color: {C['surface0']};
    border: 1px solid {C['surface1']};
    border-radius: 12px;
    padding: 16px;
}}

#card:hover {{
    border-color: {C['surface2']};
}}

/* Group box */
QGroupBox {{
    border: 1px solid {C['surface1']};
    border-radius: 8px;
    margin-top: 12px;
    padding-top: 16px;
    font-weight: bold;
    color: {C['subtext1']};
}}

QGroupBox::title {{
    subcontrol-origin: margin;
    left: 12px;
    padding: 0 6px;
}}

/* Tab widget */
QTabWidget::pane {{
    border: 1px solid {C['surface1']};
    border-radius: 8px;
    background: {C['base']};
}}

QTabBar::tab {{
    background: {C['surface0']};
    color: {C['subtext0']};
    border: none;
    border-radius: 6px 6px 0 0;
    padding: 8px 16px;
    margin-right: 2px;
}}

QTabBar::tab:selected {{
    background: {C['surface1']};
    color: {C['mauve']};
}}

/* List / Table */
QListWidget, QTableWidget {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 1px solid {C['surface1']};
    border-radius: 8px;
    outline: none;
    padding: 4px;
}}

QListWidget::item, QTableWidget::item {{
    padding: 8px;
    border-radius: 6px;
}}

QListWidget::item:selected, QTableWidget::item:selected {{
    background-color: {C['surface1']};
    color: {C['mauve']};
}}

QHeaderView::section {{
    background-color: {C['surface0']};
    color: {C['subtext1']};
    border: none;
    border-bottom: 1px solid {C['surface1']};
    padding: 8px;
    font-weight: bold;
}}

/* Check box */
QCheckBox {{
    spacing: 8px;
    color: {C['text']};
}}

QCheckBox::indicator {{
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 2px solid {C['surface2']};
    background: {C['surface0']};
}}

QCheckBox::indicator:checked {{
    background: {C['mauve']};
    border-color: {C['mauve']};
}}

/* Tool tip */
QToolTip {{
    background-color: {C['surface1']};
    color: {C['text']};
    border: 1px solid {C['surface2']};
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
}}
"""
