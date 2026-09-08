"""
VittMitra PostgreSQL + PostGIS Safe Backup Utility

Executes non-destructive, timestamped schema & data backups using pg_dump.
Saves backup archives to database/backups/ with metadata logs.
"""
import sys
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

# Add project root and backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(backend_dir))

from app.core.config import settings

BACKUP_DIR = root_dir / "database" / "backups"


def perform_backup():
    """Generates timestamped database dump."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"vittmitra_backup_{timestamp}.sql"

    print("================================================================================")
    print("   VittMitra PostgreSQL + PostGIS Backup Utility                                ")
    print("================================================================================")
    print(f"Target Backup Directory: {BACKUP_DIR}")
    print(f"Target Backup Archive:   {backup_file.name}")

    # Parse database URL
    db_url = settings.DATABASE_URL
    # Remove SQLAlchemy dialect prefix
    clean_url = db_url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql+psycopg2://", "postgresql://")
    parsed = urlparse(clean_url)

    db_user = parsed.username or "vittmitra_user"
    db_host = parsed.hostname or "localhost"
    db_port = str(parsed.port or 5432)
    db_name = parsed.path.lstrip("/") or "vittmitra_db"

    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    cmd = [
        "pg_dump",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "--format=plain",
        "--clean",
        "--if-exists",
        "-f", str(backup_file)
    ]

    print(f"Executing: pg_dump -h {db_host} -p {db_port} -U {db_user} -d {db_name} -f {backup_file.name}")

    try:
        res = subprocess.run(cmd, env=env, capture_output=True, text=True, check=True)
        size_kb = backup_file.stat().st_size / 1024.0
        print(f"\n[SUCCESS] Backup completed successfully!")
        print(f"  Archive Path: {backup_file}")
        print(f"  Archive Size: {size_kb:.2f} KB")
    except FileNotFoundError:
        print("\n[NOTICE] 'pg_dump' CLI utility not found in system PATH.")
        print("To run manual backup via Docker Compose:")
        print(f"  docker-compose exec -T database pg_dump -U {db_user} -d {db_name} > {backup_file}")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Backup failed:\n{e.stderr}")


if __name__ == "__main__":
    perform_backup()
