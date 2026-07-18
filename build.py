import subprocess
import sys

def main():
    print("Building executable...")
    subprocess.run([
        sys.executable, "-m", "PyInstaller",
        "Yazif.spec",
        "--clean",
        "--noconfirm",
    ], check=True)
    print("\nBuild complete! Output in dist/Yazif/")

if __name__ == "__main__":
    main()
