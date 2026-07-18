import json
import os
from pathlib import Path

APP_NAME = "yazif"
CONFIG_DIR = Path(os.environ.get("APPDATA", Path.home() / ".config")) / APP_NAME
CONFIG_FILE = CONFIG_DIR / "config.json"
ENV_FILE = Path(__file__).parent.parent / ".env"

DEFAULTS = {
    "download_path": str(Path.home() / "Downloads" / "Yazif"),
    "nvidia_api_key": "",
    "ai_rename": True,
    "audio_format": "mp3",
    "video_format": "mp4",
    "audio_quality": "192",
    "video_quality": "best",
    "recent_downloads": [],
    "setup_complete": False,
}


def _read_env() -> dict:
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def _write_env(data: dict):
    lines = [f"{k}={v}" for k, v in data.items() if v]
    ENV_FILE.write_text("\n".join(lines) + "\n")


def load_config() -> dict:
    env = _read_env()
    cfg = dict(DEFAULTS)
    if CONFIG_FILE.exists():
        try:
            cfg.update(json.loads(CONFIG_FILE.read_text()))
        except Exception:
            pass
    if env.get("NVIDIA_API_KEY"):
        cfg["nvidia_api_key"] = env["NVIDIA_API_KEY"]
    return cfg


def save_config(cfg: dict):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    save = {k: v for k, v in cfg.items() if k != "nvidia_api_key"}
    CONFIG_FILE.write_text(json.dumps(save, indent=2))
    if cfg.get("nvidia_api_key"):
        env = _read_env()
        env["NVIDIA_API_KEY"] = cfg["nvidia_api_key"]
        _write_env(env)


def is_setup_complete() -> bool:
    return load_config().get("setup_complete", False)
