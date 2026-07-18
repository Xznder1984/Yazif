import json
import requests
from pathlib import Path

NIM_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NIM_MODEL = "meta/llama-3.1-8b-instruct"


def is_audio_file(path: str) -> bool:
    ext = Path(path).suffix.lower()
    return ext in (".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".wma", ".opus")


def rename_file(path: str, api_key: str, context: str = "") -> str | None:
    if not api_key:
        return None
    p = Path(path)
    current_name = p.stem
    file_type = "audio" if is_audio_file(path) else "video"

    prompt = f"""Rename this {file_type} file to a clean, descriptive name.
Current filename: "{current_name}"
{f'Context: {context}' if context else ''}

Rules:
- Use PascalCase or spaces
- Remove weird characters, numbers, timestamps
- Keep it concise but descriptive
- Only return the new filename WITHOUT extension
- Do not use quotes

New name:"""

    try:
        resp = requests.post(
            NIM_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": NIM_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 64,
                "temperature": 0.3,
            },
            timeout=15,
        )
        resp.raise_for_status()
        new_name = resp.json()["choices"][0]["message"]["content"].strip()
        new_name = new_name.strip('"').strip("'").strip()
        new_name = "".join(c for c in new_name if c.isalnum() or c in " -_.")
        if new_name and new_name != current_name:
            return new_name
    except Exception:
        pass
    return None


def batch_rename(folder: str, api_key: str, callback=None) -> list[dict]:
    p = Path(folder)
    if not p.is_dir():
        return []
    results = []
    audio_exts = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"}
    video_exts = {".mp4", ".mkv", ".webm", ".avi", ".mov"}
    for f in sorted(p.iterdir()):
        if f.suffix.lower() in (audio_exts | video_exts):
            new_name = rename_file(str(f), api_key)
            if new_name:
                new_path = f.parent / f"{new_name}{f.suffix}"
                f.rename(new_path)
                results.append({"old": f.name, "new": new_path.name, "path": str(new_path)})
                if callback:
                    callback(f.name, new_path.name)
    return results
