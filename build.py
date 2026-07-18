import subprocess
import sys
import os

def main():
    print("Building single-file executable...")
    result = subprocess.run([
        sys.executable, "-m", "PyInstaller",
        "Yazif.spec",
        "--clean",
        "--noconfirm",
    ], check=True)
    
    exe = os.path.join("dist", "Yazif.exe")
    if os.path.exists(exe):
        size_mb = os.path.getsize(exe) / (1024 * 1024)
        print(f"\nBuild complete! {exe} ({size_mb:.1f} MB)")
    else:
        print("\nBuild complete! Output in dist/")

if __name__ == "__main__":
    main()
