#!/usr/bin/env bash
# CIC Log Archival & Retention Manager
# Policy: Archive logs older than 30 days, delete archives older than 90 days
# Schedule: Run daily via cron or Docker health check
# Version: 1.0.0

set -euo pipefail
IFS=$'\n\t'

# Colors
GRN='\033[0;32m'; YEL='\033[0;33m'; CYN='\033[0;36m'; RST='\033[0m'

info()    { echo -e "${CYN}[INFO]${RST}  $*"; }
archive() { echo -e "${GRN}[ARCHIVE]${RST} $*"; }
purge()   { echo -e "${YEL}[PURGE]${RST}   $*"; }

LOG_DIR="${CIC_LOG_DIR:-.}/logs"
ARCHIVE_DIR="$LOG_DIR/archive"
ARCHIVE_AGE_DAYS=30
RETENTION_AGE_DAYS=90

# Ensure archive directory exists
mkdir -p "$ARCHIVE_DIR"

info "Log Archival Policy:"
info "  - Active logs directory: $LOG_DIR"
info "  - Archive logs older than: $ARCHIVE_AGE_DAYS days"
info "  - Delete archives older than: $RETENTION_AGE_DAYS days"
info ""

# Phase 1: Archive old active logs
info "Phase 1: Archiving logs older than $ARCHIVE_AGE_DAYS days..."
archived_count=0

find "$LOG_DIR" -maxdepth 1 -name "cic-*.log" -mtime +$ARCHIVE_AGE_DAYS -type f 2>/dev/null | \
while read logfile; do
  if [[ -f "$logfile" ]]; then
    basename=$(basename "$logfile")
    archive "Compressing: $basename"

    # Gzip in-place
    if ! gzip -f "$logfile" 2>/dev/null; then
      err "Failed to gzip $basename"
      continue
    fi
    archive "Compressed: ${basename}.gz"

    # Move to archive
    if ! mv "${logfile}.gz" "$ARCHIVE_DIR/" 2>/dev/null; then
      err "Failed to move ${basename}.gz to archive"
      continue
    fi
    archive "Moved to: archive/${basename}.gz"
    (( archived_count++ ))
  fi
done

[[ $archived_count -gt 0 ]] && info "Archived $archived_count log(s)."

# Phase 2: Delete old archives
info ""
info "Phase 2: Purging archives older than $RETENTION_AGE_DAYS days..."
purged_count=0

find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +$RETENTION_AGE_DAYS -type f 2>/dev/null | \
while read archive_file; do
  if [[ -f "$archive_file" ]]; then
    basename=$(basename "$archive_file")
    purge "Deleting: $basename"

    if rm -f "$archive_file" 2>/dev/null; then
      purge "Removed: $basename"
      (( purged_count++ ))
    else
      info "Failed to delete $basename"
    fi
  fi
done

[[ $purged_count -gt 0 ]] && info "Purged $purged_count archive(s)."

# Summary
info ""
info "Log archival complete."
info "  Active logs: $(find "$LOG_DIR" -maxdepth 1 -name "cic-*.log" -type f 2>/dev/null | wc -l)"
info "  Archived logs: $(find "$ARCHIVE_DIR" -name "*.log.gz" -type f 2>/dev/null | wc -l)"
info "  Disk usage (logs): $(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)"
