import subprocess
import sys
import os

def main():
    print("Installing dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)

    print("Building executable...")
    subprocess.run([
        sys.executable, "-m", "PyInstaller",
        "Yazif.spec",
        "--clean",
        "--noconfirm",
    ], check=True)

    print("\nBuild complete! Output in dist/Yazif/")
    print("Installer: run 'dist/Yazif/Yazif.exe'")

if __name__ == "__main__":
    main()
