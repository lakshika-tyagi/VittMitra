"""
VittMitra PostgreSQL + PostGIS Safe Restore Utility

Restores schema & data from a specified backup archive in database/backups/.
Requires explicit --confirm flag to prevent accidental overwrite.
"""
import sys
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse

# Add project root and backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(backend_dir))

from app.core.config import settings

BACKUP_DIR = root_dir / "database" / "backups"


def perform_restore(backup_path: Path = None, confirmed: bool = False):
    print("================================================================================")
    print("   VittMitra PostgreSQL + PostGIS Restore Utility                               ")
    print("================================================================================")

    if not confirmed:
        print("[CAUTION] Database restoration will replace current schema & data.")
        print("To proceed, supply the --confirm flag:")
        print("  python scripts/restore_db.py --confirm [optional_backup_file.sql]")
        return

    # Find backup file
    if backup_path is None:
        if not BACKUP_DIR.exists():
            print(f"[ERROR] Backup directory not found at: {BACKUP_DIR}")
            return
        backups = sorted(list(BACKUP_DIR.glob("*.sql")), reverse=True)
        if not backups:
            print(f"[ERROR] No .sql backup files found in {BACKUP_DIR}")
            return
        backup_path = backups[0]

    if not backup_path.exists():
        print(f"[ERROR] Specified backup file does not exist: {backup_path}")
        return

    print(f"Restoring from: {backup_path.name}")
    print(f"File Size:      {backup_path.stat().st_size / 1024.0:.2f} KB")

    # Parse database URL
    db_url = settings.DATABASE_URL
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
        "psql",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "-f", str(backup_path)
    ]

    print(f"Executing: psql -h {db_host} -p {db_port} -U {db_user} -d {db_name} -f {backup_path.name}")

    try:
        res = subprocess.run(cmd, env=env, capture_output=True, text=True, check=True)
        print("\n[SUCCESS] Database restore completed successfully!")
    except FileNotFoundError:
        print("\n[NOTICE] 'psql' CLI utility not found in system PATH.")
        print("To run manual restore via Docker Compose:")
        print(f"  cat {backup_path} | docker-compose exec -T database psql -U {db_user} -d {db_name}")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Restore failed:\n{e.stderr}")


if __name__ == "__main__":
    is_confirmed = "--confirm" in sys.argv
    custom_file = None
    for arg in sys.argv[1:]:
        if arg.endswith(".sql"):
            custom_file = Path(arg)
            break

    perform_restore(backup_path=custom_file, confirmed=is_confirmed)
