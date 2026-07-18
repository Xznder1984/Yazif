from pathlib import Path

try:
    from mutagen.easyid3 import EasyID3
    HAS_MUTAGEN = True
except ImportError:
    HAS_MUTAGEN = False


def get_metadata(path: str) -> dict:
    if not HAS_MUTAGEN:
        return {}
    try:
        audio = EasyID3(path)
        return {
            "artist": audio.get("artist", ["Unknown Artist"])[0],
            "album": audio.get("album", ["Unknown Album"])[0],
            "title": audio.get("title", [Path(path).stem])[0],
        }
    except Exception:
        return {"artist": "Unknown Artist", "album": "Unknown Album", "title": Path(path).stem}


def organize_by_artist_album(source_dir: str, dest_dir: str = None) -> list[dict]:
    src = Path(source_dir)
    dst = Path(dest_dir or source_dir)
    audio_exts = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".wma", ".opus"}
    moved = []
    for f in sorted(src.iterdir()):
        if f.is_file() and f.suffix.lower() in audio_exts:
            meta = get_metadata(str(f))
            artist = _safe_dirname(meta.get("artist", "Unknown Artist"))
            album = _safe_dirname(meta.get("album", "Unknown Album"))
            target_dir = dst / artist / album
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / f.name
            if f.resolve() != target.resolve():
                f.rename(target)
                moved.append({
                    "file": f.name,
                    "artist": meta["artist"],
                    "album": meta["album"],
                    "target": str(target),
                })
    return moved


def get_music_stats(source_dir: str) -> dict:
    src = Path(source_dir)
    audio_exts = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".wma", ".opus"}
    files = [f for f in src.rglob("*") if f.is_file() and f.suffix.lower() in audio_exts]
    artists = set()
    albums = set()
    for f in files:
        meta = get_metadata(str(f))
        artists.add(meta.get("artist", "Unknown"))
        albums.add(meta.get("album", "Unknown"))
    return {
        "total_files": len(files),
        "total_artists": len(artists),
        "total_albums": len(albums),
        "artists": sorted(artists),
        "albums": sorted(albums),
    }


def _safe_dirname(name: str) -> str:
    bad = '<>:"/\\|?*'
    for c in bad:
        name = name.replace(c, "_")
    return name.strip().strip(".") or "Unknown"
