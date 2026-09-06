"""
VittMitra Development Environment Setup & Validation Script
"""
import sys
import shutil
from pathlib import Path

def check_environment():
    root_dir = Path(__file__).resolve().parent.parent
    print("==================================================")
    print("   VittMitra Development Environment Diagnostic   ")
    print("==================================================")
    print(f"Project Root: {root_dir}")
    print(f"Python Version: {sys.version.split()[0]}")

    env_file = root_dir / ".env"
    env_example = root_dir / ".env.example"

    if not env_file.exists():
        if env_example.exists():
            print("[INFO] .env not found. Copying .env.example -> .env")
            shutil.copy(env_example, env_file)
            print("[SUCCESS] Created .env from .env.example")
        else:
            print("[WARNING] .env.example not found.")
    else:
        print("[SUCCESS] .env file is present.")

    # Check key directories
    required_dirs = ["frontend", "backend", "ai-services", "data", "database", "docs", "scripts", "tests"]
    all_present = True
    for d in required_dirs:
        dir_path = root_dir / d
        if dir_path.is_dir():
            print(f"[OK] Directory: {d}/")
        else:
            print(f"[MISSING] Directory: {d}/")
            all_present = False

    if all_present:
        print("\n[SUCCESS] Environment structure verified successfully.")
    else:
        print("\n[ERROR] Some required directories are missing.")

if __name__ == "__main__":
    check_environment()
