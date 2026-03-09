#!/bin/bash
# SzerződésPortál - PostgreSQL Daily Backup Script
# Deploy to server: /opt/szerzodes-portal/scripts/db-backup.sh
# Cron: 0 2 * * * /opt/szerzodes-portal/scripts/db-backup.sh

set -euo pipefail

DB_NAME="szerzodes_portal"
DB_USER="szerzodes"
BACKUP_DIR="/opt/szerzodes-portal/backups"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create compressed backup
echo "[$(date)] Starting backup of ${DB_NAME}..."
pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_FILE"

# Verify backup was created and has content
if [ -s "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup created successfully: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date)] ERROR: Backup file is empty or was not created!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Remove backups older than retention period
DELETED=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Cleaned up $DELETED old backup(s) (older than ${RETENTION_DAYS} days)"
fi

echo "[$(date)] Backup complete."
