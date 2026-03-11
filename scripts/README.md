# Server Scripts

## db-backup.sh - PostgreSQL Daily Backup

### Deploy
```bash
# Copy to server
scp scripts/db-backup.sh root@178.104.36.213:/opt/legitas/scripts/

# Make executable
ssh root@178.104.36.213 'chmod +x /opt/legitas/scripts/db-backup.sh'

# Set up daily cron (runs at 2:00 AM)
ssh root@178.104.36.213 'echo "0 2 * * * /opt/legitas/scripts/db-backup.sh >> /var/log/legitas-backup.log 2>&1" | crontab -'

# Test manually
ssh root@178.104.36.213 '/opt/legitas/scripts/db-backup.sh'
```

### Restore
```bash
gunzip -c /opt/legitas/backups/legitas_portal_YYYY-MM-DD_HHMMSS.sql.gz | psql -U legitas -d legitas_portal
```
