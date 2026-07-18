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
/* ============================================================
   BASE
   ============================================================ */
QMainWindow {{
    background-color: {C['base']};
}}

QWidget {{
    background-color: transparent;
    color: {C['text']};
    font-family: 'Segoe UI', 'Inter', sans-serif;
    font-size: 13px;
}}

/* ============================================================
   SIDEBAR
   ============================================================ */
#sidebar {{
    background-color: {C['crust']};
    border-right: 1px solid {C['surface0']};
}}

#sidebarTitle {{
    color: {C['mauve']};
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 20px 16px 12px 16px;
}}

#sidebarVersion {{
    color: {C['overlay0']};
    font-size: 11px;
    padding: 0 16px 8px 16px;
}}

#sidebarSeparator {{
    background-color: {C['surface0']};
    max-height: 1px;
    min-height: 1px;
    margin: 4px 12px;
}}

#sidebar QPushButton {{
    background: transparent;
    color: {C['overlay1']};
    border: none;
    border-radius: 8px;
    padding: 10px 14px;
    text-align: left;
    font-size: 13px;
    font-weight: 500;
    margin: 1px 4px;
}}

#sidebar QPushButton:hover {{
    background-color: {C['surface0']};
    color: {C['subtext1']};
}}

#sidebar QPushButton:checked {{
    background-color: {C['surface0']};
    color: {C['mauve']};
    font-weight: 600;
}}

/* ============================================================
   PAGE HEADERS
   ============================================================ */
#heading {{
    font-size: 24px;
    font-weight: 700;
    color: {C['text']};
    letter-spacing: -0.3px;
}}

#subheading {{
    font-size: 14px;
    color: {C['subtext0']};
    font-weight: 400;
}}

#muted {{
    color: {C['overlay1']};
    font-size: 12px;
}}

/* ============================================================
   BUTTONS
   ============================================================ */
QPushButton {{
    background-color: {C['mauve']};
    color: {C['crust']};
    border: none;
    border-radius: 8px;
    padding: 10px 22px;
    font-weight: 700;
    font-size: 13px;
}}

QPushButton:hover {{
    background-color: {C['lavender']};
}}

QPushButton:pressed {{
    background-color: {C['blue']};
    padding: 11px 21px 9px 23px;
}}

QPushButton:disabled {{
    background-color: {C['surface1']};
    color: {C['overlay0']};
}}

#secondaryBtn {{
    background-color: {C['surface0']};
    color: {C['subtext1']};
    border: 1px solid {C['surface1']};
    font-weight: 500;
}}

#secondaryBtn:hover {{
    background-color: {C['surface1']};
    color: {C['text']};
    border-color: {C['surface2']};
}}

#ghostBtn {{
    background: transparent;
    color: {C['subtext0']};
    border: none;
    font-weight: 500;
}}

#ghostBtn:hover {{
    color: {C['text']};
    background: {C['surface0']};
}}

/* ============================================================
   INPUTS
   ============================================================ */
QLineEdit, QSpinBox {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 2px solid {C['surface1']};
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    selection-background-color: {C['mauve']};
    selection-color: {C['crust']};
}}

QLineEdit:hover, QSpinBox:hover {{
    border-color: {C['surface2']};
}}

QLineEdit:focus, QSpinBox:focus {{
    border-color: {C['mauve']};
}}

QComboBox {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 2px solid {C['surface1']};
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
}}

QComboBox:hover {{
    border-color: {C['surface2']};
}}

QComboBox:focus {{
    border-color: {C['mauve']};
}}

QComboBox::drop-down {{
    border: none;
    padding-right: 10px;
    width: 20px;
}}

QComboBox::down-arrow {{
    image: none;
    border: none;
}}

QComboBox QAbstractItemView {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 1px solid {C['surface2']};
    border-radius: 8px;
    padding: 4px;
    selection-background-color: {C['mauve']};
    selection-color: {C['crust']};
    outline: none;
}}

QTextEdit {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 2px solid {C['surface1']};
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'Cascadia Code', 'Consolas', 'Fira Code', monospace;
    font-size: 12px;
    selection-background-color: {C['mauve']};
}}

QTextEdit:focus {{
    border-color: {C['mauve']};
}}

/* ============================================================
   PROGRESS BAR
   ============================================================ */
QProgressBar {{
    background-color: {C['surface0']};
    border: none;
    border-radius: 5px;
    max-height: 10px;
    min-height: 10px;
    text-align: center;
    color: transparent;
}}

QProgressBar::chunk {{
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 {C['mauve']}, stop:1 {C['lavender']});
    border-radius: 5px;
}}

/* ============================================================
   SCROLL BARS
   ============================================================ */
QScrollBar:vertical {{
    background: transparent;
    width: 10px;
    margin: 0;
    border-radius: 5px;
}}

QScrollBar::handle:vertical {{
    background: {C['surface2']};
    border-radius: 5px;
    min-height: 30px;
    margin: 2px;
}}

QScrollBar::handle:vertical:hover {{
    background: {C['overlay1']};
}}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
    height: 0;
    background: none;
}}

QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {{
    background: transparent;
}}

QScrollBar:horizontal {{
    background: transparent;
    height: 10px;
    margin: 0;
    border-radius: 5px;
}}

QScrollBar::handle:horizontal {{
    background: {C['surface2']};
    border-radius: 5px;
    min-width: 30px;
    margin: 2px;
}}

QScrollBar::handle:horizontal:hover {{
    background: {C['overlay1']};
}}

QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
    width: 0;
    background: none;
}}

QScrollBar::add-page:horizontal, QScrollBar::sub-page:horizontal {{
    background: transparent;
}}

/* ============================================================
   CARDS / PANELS
   ============================================================ */
#card {{
    background-color: {C['surface0']};
    border: 1px solid {C['surface1']};
    border-radius: 12px;
    padding: 16px;
}}

#card:hover {{
    border-color: {C['surface2']};
}}

/* ============================================================
   GROUP BOX
   ============================================================ */
QGroupBox {{
    border: 1px solid {C['surface1']};
    border-radius: 10px;
    margin-top: 14px;
    padding: 20px 16px 16px 16px;
    font-weight: 600;
    color: {C['subtext1']};
    background-color: {C['surface0']};
}}

QGroupBox::title {{
    subcontrol-origin: margin;
    left: 14px;
    padding: 0 8px;
    color: {C['mauve']};
}}

/* ============================================================
   LIST / TABLE
   ============================================================ */
QListWidget, QTableWidget {{
    background-color: {C['surface0']};
    color: {C['text']};
    border: 1px solid {C['surface1']};
    border-radius: 10px;
    outline: none;
    padding: 4px;
}}

QListWidget::item, QTableWidget::item {{
    padding: 10px 8px;
    border-radius: 6px;
    border: none;
}}

QListWidget::item:selected, QTableWidget::item:selected {{
    background-color: {C['surface1']};
    color: {C['mauve']};
}}

QListWidget::item:hover, QTableWidget::item:hover {{
    background-color: {C['surface1']}88;
}}

QHeaderView::section {{
    background-color: {C['surface0']};
    color: {C['subtext1']};
    border: none;
    border-bottom: 2px solid {C['surface1']};
    padding: 10px 8px;
    font-weight: 700;
    font-size: 12px;
}}

/* ============================================================
   CHECKBOX
   ============================================================ */
QCheckBox {{
    spacing: 10px;
    color: {C['text']};
    font-size: 13px;
}}

QCheckBox::indicator {{
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 2px solid {C['surface2']};
    background: {C['surface0']};
}}

QCheckBox::indicator:hover {{
    border-color: {C['overlay1']};
}}

QCheckBox::indicator:checked {{
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 {C['mauve']}, stop:1 {C['blue']});
    border-color: {C['mauve']};
}}

/* ============================================================
   TOOLTIP
   ============================================================ */
QToolTip {{
    background-color: {C['surface1']};
    color: {C['text']};
    border: 1px solid {C['surface2']};
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
}}

/* ============================================================
   SCROLL AREA
   ============================================================ */
QScrollArea {{
    border: none;
    background: transparent;
}}

QScrollArea > QWidget > QWidget {{
    background: transparent;
}}
"""
