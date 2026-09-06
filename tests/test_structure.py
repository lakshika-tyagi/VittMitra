"""
Basic repository structure test
"""
from pathlib import Path

def test_repository_structure():
    root = Path(__file__).resolve().parent.parent
    expected_directories = [
        "frontend",
        "backend",
        "ai-services",
        "data",
        "database",
        "docs",
        "scripts",
        "tests",
    ]
    for directory in expected_directories:
        assert (root / directory).is_dir(), f"Expected directory {directory} does not exist"

    expected_files = [
        ".gitignore",
        ".env.example",
        "README.md",
        "docker-compose.yml",
    ]
    for file in expected_files:
        assert (root / file).is_file(), f"Expected file {file} does not exist"
