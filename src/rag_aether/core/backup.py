"""Backup system for RAG implementation.

Christ is King! ☦
"""
import os
import json
import time
import shutil
import logging
import hashlib
import tarfile
import tempfile
from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass
import redis
from supabase import create_client

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@dataclass
class BackupConfig:
    """Backup configuration."""
    backup_dir: str = os.getenv("BACKUP_DIR", "backups")
    retention_days: int = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
    compression_level: int = int(os.getenv("BACKUP_COMPRESSION_LEVEL", "9"))
    verify_backups: bool = os.getenv("VERIFY_BACKUPS", "true").lower() == "true"
    backup_schedule: str = os.getenv("BACKUP_SCHEDULE", "0 0 * * *")  # Daily at midnight
    supabase_url: str = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")

class BackupManager:
    """Manages system backups and recovery."""
    
    def __init__(self, config: Optional[BackupConfig] = None):
        """Initialize backup manager.
        
        Args:
            config: Backup configuration
        """
        self.config = config or BackupConfig()
        self.backup_dir = Path(self.config.backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize clients
        self.redis = redis.from_url(self.config.redis_url)
        self.supabase = create_client(self.config.supabase_url, self.config.supabase_key)
    
    def _create_backup_name(self) -> str:
        """Create backup name with timestamp.
        
        Returns:
            Backup name with timestamp
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"backup_{timestamp}"
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA-256 checksum of a file.
        
        Args:
            file_path: Path to file
        
        Returns:
            SHA-256 checksum
        """
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256.update(chunk)
        return sha256.hexdigest()
    
    def _verify_backup(self, backup_path: Path, checksum: str) -> bool:
        """Verify backup integrity.
        
        Args:
            backup_path: Path to backup file
            checksum: Expected checksum
        
        Returns:
            True if backup is valid
        """
        return self._calculate_checksum(backup_path) == checksum
    
    async def _clean_old_backups(self) -> None:
        """Remove backups older than retention days."""
        retention_date = datetime.now() - timedelta(days=self.config.retention_days)
        
        # Get all backup files and manifests
        backup_files = list(Path(self.config.backup_dir).glob("backup_*.tar.gz"))
        manifest_files = list(Path(self.config.backup_dir).glob("backup_*_manifest.json"))
        
        # Process each backup file
        for backup_file in backup_files:
            try:
                # Get corresponding manifest file
                manifest_file = Path(str(backup_file).replace(".tar.gz", "_manifest.json"))
                
                if not manifest_file.exists():
                    logging.warning(f"Removed backup with missing manifest: {backup_file}")
                    backup_file.unlink()
                    continue
                    
                # Read manifest and check timestamp
                with open(manifest_file) as f:
                    manifest = json.load(f)
                    backup_time = datetime.fromisoformat(manifest["timestamp"])
                    
                if backup_time < retention_date:
                    logging.info(f"Removing old backup: {backup_file}")
                    backup_file.unlink()
                    manifest_file.unlink()
                    
            except (json.JSONDecodeError, KeyError, ValueError) as e:
                logging.error(f"Error processing backup {backup_file}: {e}")
                backup_file.unlink()
                if manifest_file.exists():
                    manifest_file.unlink()
        
        # Clean up orphaned manifest files
        for manifest_file in manifest_files:
            backup_file = Path(str(manifest_file).replace("_manifest.json", ".tar.gz"))
            if not backup_file.exists():
                logging.warning(f"Removed orphaned manifest file: {manifest_file}")
                manifest_file.unlink()
    
    async def create_backup(self) -> dict:
        """Create a backup of the system."""
        try:
            # Generate backup name with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"backup_{timestamp}"
            backup_path = Path(self.config.backup_dir) / f"{backup_name}.tar.gz"
            manifest_path = Path(self.config.backup_dir) / f"{backup_name}_manifest.json"

            # Create backup directory if it doesn't exist
            os.makedirs(self.config.backup_dir, exist_ok=True)

            # Create temporary directory for backup files
            with tempfile.TemporaryDirectory() as temp_dir:
                # Backup Redis data
                redis_data = {}
                keys = await self.redis.keys("*")
                for key in keys:
                    value = await self.redis.get(key)
                    redis_data[key.decode()] = value.hex() if isinstance(value, bytes) else value

                # Save Redis data
                redis_backup_path = Path(temp_dir) / "redis_data.json"
                with open(redis_backup_path, "w") as f:
                    json.dump(redis_data, f)

                # Backup Supabase data
                supabase_data = []
                for table in ["documents", "embeddings", "metadata"]:
                    response = await self.supabase.table(table).select("*").execute()
                    supabase_data.extend(response.data)
                
                with open(Path(temp_dir) / "supabase_data.json", "w") as f:
                    json.dump(supabase_data, f)

                # Create compressed backup
                with tarfile.open(backup_path, f"w:gz", compresslevel=self.config.compression_level) as tar:
                    tar.add(temp_dir, arcname="")

            # Calculate checksum
            checksum = self._calculate_checksum(backup_path)

            # Create manifest
            manifest = {
                "backup_name": backup_name,
                "timestamp": datetime.now().isoformat(),
                "checksum": checksum,
                "size_bytes": os.path.getsize(backup_path),
                "components": ["redis", "supabase"],
                "compression": "gzip",
                "compression_level": self.config.compression_level
            }

            # Save manifest
            with open(manifest_path, "w") as f:
                json.dump(manifest, f)

            # Clean old backups
            await self._clean_old_backups()

            return manifest

        except Exception as e:
            logging.error(f"Backup failed: {str(e)}")
            # Clean up any partial backup files
            if backup_path.exists():
                backup_path.unlink()
            if manifest_path.exists():
                manifest_path.unlink()
            raise
    
    async def restore_backup(self, backup_name: str) -> bool:
        """Restore system from a backup."""
        # Find backup files
        backup_path = Path(self.config.backup_dir) / f"{backup_name}.tar.gz"
        manifest_path = Path(self.config.backup_dir) / f"{backup_name}_manifest.json"

        if not backup_path.exists() or not manifest_path.exists():
            logging.error("Backup not found")
            raise ValueError("Backup not found")

        try:
            # Load and verify manifest
            with open(manifest_path) as f:
                manifest = json.load(f)

            # Verify checksum
            if self.config.verify_backups:
                current_checksum = self._calculate_checksum(backup_path)
                if current_checksum != manifest["checksum"]:
                    raise ValueError("Backup checksum verification failed")

            # Create temporary directory for restoration
            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract backup
                with tarfile.open(backup_path, "r:gz") as tar:
                    tar.extractall(temp_dir)

                # Restore Redis data
                with open(Path(temp_dir) / "redis_data.json") as f:
                    redis_data = json.load(f)

                # Clear existing Redis data
                self.redis.flushall()

                # Restore Redis keys
                for key, value in redis_data.items():
                    self.redis.restore(key, 0, bytes.fromhex(value))  # Convert hex string back to bytes

                # Restore Supabase data
                with open(Path(temp_dir) / "supabase_data.json") as f:
                    supabase_data = json.load(f)

                # Clear existing Supabase data
                for table in ["documents", "embeddings", "metadata"]:
                    await self.supabase.table(table).delete().neq("id", 0).execute()

                # Restore Supabase data
                if supabase_data:
                    await self.supabase.table("documents").insert(supabase_data).execute()

            return True

        except Exception as e:
            logging.error(f"Restore failed: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return False
    
    def list_backups(self) -> List[Dict[str, str]]:
        """List available backups.
        
        Returns:
            List of backup manifests
        """
        manifests = []
        for manifest_file in sorted(self.backup_dir.glob("*_manifest.json"), reverse=True):
            try:
                with open(manifest_file) as f:
                    manifest = json.load(f)
                manifests.append(manifest)
            except Exception as e:
                logger.warning(f"Error reading manifest {manifest_file}: {e}")
        return manifests
    
    def verify_all_backups(self) -> Dict[str, bool]:
        """Verify all backups.
        
        Returns:
            Dict mapping backup names to verification status
        """
        results = {}
        for manifest_file in self.backup_dir.glob("*_manifest.json"):
            try:
                with open(manifest_file) as f:
                    manifest = json.load(f)
                
                backup_path = self.backup_dir / f"{manifest['backup_name']}.tar.gz"
                if backup_path.exists():
                    results[manifest["backup_name"]] = self._verify_backup(
                        backup_path, manifest["checksum"]
                    )
                else:
                    results[manifest["backup_name"]] = False
            except Exception as e:
                logger.warning(f"Error verifying backup {manifest_file}: {e}")
                results[manifest_file.stem.replace("_manifest", "")] = False
        
        return results 