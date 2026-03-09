# Server Scripts

## db-backup.sh - PostgreSQL Daily Backup

### Deploy
```bash
# Copy to server
scp scripts/db-backup.sh root@cegverzum.hu:/opt/szerzodes-portal/scripts/

# Make executable
ssh root@cegverzum.hu 'chmod +x /opt/szerzodes-portal/scripts/db-backup.sh'

# Set up daily cron (runs at 2:00 AM)
ssh root@cegverzum.hu 'echo "0 2 * * * /opt/szerzodes-portal/scripts/db-backup.sh >> /var/log/szerzodes-backup.log 2>&1" | crontab -'

# Test manually
ssh root@cegverzum.hu '/opt/szerzodes-portal/scripts/db-backup.sh'
```

### Restore
```bash
gunzip -c /opt/szerzodes-portal/backups/szerzodes_portal_YYYY-MM-DD_HHMMSS.sql.gz | psql -U szerzodes -d szerzodes_portal
```
