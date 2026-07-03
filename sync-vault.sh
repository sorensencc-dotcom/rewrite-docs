#!/bin/bash
# Vault Sync Script - Synchronizes CIC and Rewrite Labs reference documents
# Usage: ./sync-vault.sh [--system all|cic|rl] [--dry-run] [--verbose]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/vault-sync-config.json"
LOG_FILE="${SCRIPT_DIR}/vault-sync.log"
TIMESTAMP_FORMAT="%Y-%m-%d %H:%M:%S"

# Defaults
SYSTEM="${1:-all}"
DRY_RUN=false
VERBOSE=false

# Colors
COLOR_SUCCESS='\033[0;32m'
COLOR_WARNING='\033[1;33m'
COLOR_ERROR='\033[0;31m'
COLOR_INFO='\033[0;36m'
COLOR_RESET='\033[0m'

# Utility functions
log() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date +"${TIMESTAMP_FORMAT}")
    local log_entry="[${timestamp}] [${level}] ${message}"

    echo -e "${log_entry}" >> "${LOG_FILE}"

    case "${level}" in
        SUCCESS)
            echo -e "${COLOR_SUCCESS}${log_entry}${COLOR_RESET}"
            ;;
        WARNING)
            echo -e "${COLOR_WARNING}${log_entry}${COLOR_RESET}"
            ;;
        ERROR)
            echo -e "${COLOR_ERROR}${log_entry}${COLOR_RESET}"
            ;;
        INFO)
            echo -e "${COLOR_INFO}${log_entry}${COLOR_RESET}"
            ;;
    esac
}

usage() {
    cat << EOF
Usage: ${0##*/} [OPTIONS]

OPTIONS:
    --system all|cic|rl     Sync target (default: all)
    --dry-run               Show what would be synced without making changes
    --verbose               Enable verbose output
    --help                  Show this help message

EXAMPLES:
    # Sync both CIC and RL vaults
    ./sync-vault.sh

    # Sync only CIC
    ./sync-vault.sh --system cic

    # Test sync without making changes
    ./sync-vault.sh --dry-run

EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "${1}" in
        --system)
            SYSTEM="${2}"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            log ERROR "Unknown option: ${1}"
            usage
            ;;
    esac
done

# Test and validate
test_vault_structure() {
    local vault_path="$1"
    local vault_name="$2"

    log INFO "Checking ${vault_name} structure at ${vault_path}"

    if [[ ! -d "${vault_path}" ]]; then
        log INFO "Creating ${vault_name} directory: ${vault_path}"
        if [[ "${DRY_RUN}" != true ]]; then
            mkdir -p "${vault_path}"
        fi
    fi
}

# Sync vault content
sync_vault_content() {
    local vault_name="$1"
    local source="$2"
    local destination="$3"
    local source_type="$4"

    log INFO "Syncing ${vault_name} from ${source}"

    if [[ "${source}" == "PENDING"* ]] || [[ "${source}" == "CONFIGURE"* ]]; then
        log WARNING "${vault_name} source not configured. Skipping."
        return 1
    fi

    case "${source_type}" in
        onedrive)
            log WARNING "OneDrive sync not yet implemented. Manual sync required."
            log INFO "Source: ${source}"
            log INFO "Destination: ${destination}"
            return 1
            ;;
        googledrive)
            log WARNING "Google Drive sync not yet implemented. Manual sync required."
            return 1
            ;;
        github)
            log WARNING "GitHub sync not yet implemented. Manual sync required."
            return 1
            ;;
        local)
            if [[ ! -d "${source}" ]]; then
                log ERROR "Local source not found: ${source}"
                return 1
            fi
            log INFO "Syncing from local path: ${source}"
            if [[ "${DRY_RUN}" != true ]]; then
                rsync -av "${source}"/ "${destination}/"
            else
                log INFO "[DRY RUN] Would sync ${source}/ to ${destination}/"
            fi
            return 0
            ;;
        *)
            log ERROR "Unknown source type: ${source_type}"
            return 1
            ;;
    esac
}

# Update vault index
update_vault_index() {
    local index_file="$1"

    log INFO "Updating vault index: ${index_file}"

    if [[ ! "${DRY_RUN}" == true ]]; then
        if [[ -f "${index_file}" ]]; then
            local timestamp=$(date +"${TIMESTAMP_FORMAT}")

            # Use sed to update timestamps (cross-platform compatible)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/Last Updated:.*/Last Updated: ${timestamp}/" "${index_file}"
                sed -i '' "s/Last Modified:.*/Last Modified: ${timestamp}/" "${index_file}"
            else
                sed -i "s/Last Updated:.*/Last Updated: ${timestamp}/" "${index_file}"
                sed -i "s/Last Modified:.*/Last Modified: ${timestamp}/" "${index_file}"
            fi

            log SUCCESS "Updated timestamps in ${index_file}"
        fi
    fi
}

# Create architecture structure
create_architecture_structure() {
    local cic_patterns="${SCRIPT_DIR}/architecture/cic-patterns"
    local rl_patterns="${SCRIPT_DIR}/architecture/rl-patterns"

    log INFO "Setting up architecture folder structure"

    for folder in "${cic_patterns}" "${rl_patterns}"; do
        if [[ ! -d "${folder}" ]]; then
            log INFO "Creating architecture folder: ${folder}"
            if [[ ! "${DRY_RUN}" == true ]]; then
                mkdir -p "${folder}"

                # Create README placeholder
                local readme_path="${folder}/README.md"
                if [[ ! -f "${readme_path}" ]]; then
                    local folder_name=$(basename "${folder}")
                    local title=$(echo "${folder_name}" | sed 's/-/ /g')

                    cat > "${readme_path}" << EOFREADME
# ${title}

Add architectural patterns and design decisions here.

## Contents

- Pattern documents
- Design decision records
- Cross-system comparisons

## Usage

Reference these patterns in cross-system analysis queries.
EOFREADME

                    log SUCCESS "Created README: ${readme_path}"
                fi
            fi
        fi
    done
}

# Get sync status
get_sync_status() {
    log INFO "=== Vault Sync Status ==="

    local cic_path="${SCRIPT_DIR}/cic-ref"
    local rl_path="${SCRIPT_DIR}/rl-ref"

    if [[ -d "${cic_path}" ]]; then
        local cic_count=$(find "${cic_path}" -type f | wc -l)
        log SUCCESS "CIC: Enabled (${cic_count} files)"
    else
        log WARNING "CIC: Disabled (Not yet synced)"
    fi

    if [[ -d "${rl_path}" ]]; then
        local rl_count=$(find "${rl_path}" -type f | wc -l)
        log SUCCESS "RewriteLabs: Enabled (${rl_count} files)"
    else
        log WARNING "RewriteLabs: Disabled (Not yet synced)"
    fi
}

# Main function
main() {
    log INFO "=== Vault Sync Started ==="
    log INFO "System: ${SYSTEM} | DryRun: ${DRY_RUN}"

    # Create architecture structure
    create_architecture_structure

    # Process CIC
    if [[ "${SYSTEM}" == "all" ]] || [[ "${SYSTEM}" == "cic" ]]; then
        test_vault_structure "${SCRIPT_DIR}/cic-ref" "CIC"
        sync_vault_content "CIC" "CONFIGURE_ONEDRIVE_PATH" "${SCRIPT_DIR}/cic-ref" "onedrive"
    fi

    # Process Rewrite Labs
    if [[ "${SYSTEM}" == "all" ]] || [[ "${SYSTEM}" == "rl" ]]; then
        test_vault_structure "${SCRIPT_DIR}/rl-ref" "RewriteLabs"
        sync_vault_content "RewriteLabs" "PENDING_CONFIRMATION" "${SCRIPT_DIR}/rl-ref" "onedrive"
    fi

    # Update index
    update_vault_index "${SCRIPT_DIR}/00-RL-INDEX.md"

    # Show status
    get_sync_status

    log INFO "=== Vault Sync Completed ==="
}

# Run main
main "$@"
