# Vault Sync Script - Synchronizes CIC and Rewrite Labs reference documents
# Usage: .\sync-vault.ps1 [-System all|cic|rl] [-Verbose] [-DryRun]

param(
    [ValidateSet('all', 'cic', 'rl')]
    [string]$System = 'all',
    [switch]$Verbose,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Configuration
$ConfigFile = "$PSScriptRoot\vault-sync-config.json"
$LogFile = "$PSScriptRoot\vault-sync.log"
$TimestampFormat = "yyyy-MM-dd HH:mm:ss"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error   = "Red"
    Info    = "Cyan"
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Warning', 'Error', 'Success')]
        [string]$Level = 'Info'
    )

    $timestamp = Get-Date -Format $TimestampFormat
    $logEntry = "[$timestamp] [$Level] $Message"

    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
    Write-Host $logEntry -ForegroundColor $Colors[$Level]
}

function Test-VaultStructure {
    param([string]$VaultPath, [string]$VaultName)

    Write-Log "Checking $VaultName structure at $VaultPath" -Level Info

    if (-not (Test-Path $VaultPath)) {
        Write-Log "Creating $VaultName directory: $VaultPath" -Level Info
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $VaultPath -Force | Out-Null
        }
    }

    return $true
}

function Get-VaultConfig {
    if (-not (Test-Path $ConfigFile)) {
        Write-Log "Config file not found: $ConfigFile" -Level Warning
        Write-Log "Using default configuration" -Level Info
        return Get-DefaultConfig
    }

    try {
        $config = Get-Content $ConfigFile | ConvertFrom-Json
        Write-Log "Loaded config from $ConfigFile" -Level Success
        return $config
    }
    catch {
        Write-Log "Error parsing config file: $_" -Level Error
        return Get-DefaultConfig
    }
}

function Get-DefaultConfig {
    @{
        vaults = @(
            @{
                name = "CIC"
                source = "PENDING"  # Update with actual OneDrive path
                destination = "$PSScriptRoot\cic-ref"
                enabled = $true
                patterns = @(
                    "BUILD-SUMMARY.md"
                    "AGENTS.md"
                    "AGENTS_API.md"
                    "*ENV*.md"
                    "*OBSERVABILITY*.md"
                    "*TOKEN*.md"
                    "ROADMAP.md"
                )
                sourceType = "onedrive"  # onedrive, googledrive, github, local
            },
            @{
                name = "RewriteLabs"
                source = "PENDING"  # Configure when RL docs location is confirmed
                destination = "$PSScriptRoot\rl-ref"
                enabled = $false
                patterns = @("*.md")
                sourceType = "onedrive"
            }
        )
        architecture = @{
            cic_patterns = "$PSScriptRoot\architecture\cic-patterns"
            rl_patterns = "$PSScriptRoot\architecture\rl-patterns"
            enabled = $true
        }
        indexFile = "$PSScriptRoot\00-RL-INDEX.md"
        setupFile = "$PSScriptRoot\RL-VAULT-SETUP.md"
    }
}

function Sync-VaultContent {
    param(
        [string]$VaultName,
        [string]$Source,
        [string]$Destination,
        [string[]]$Patterns,
        [string]$SourceType
    )

    Write-Log "Syncing $VaultName from $Source" -Level Info

    if ($Source -eq "PENDING") {
        Write-Log "$VaultName source not configured. Skipping." -Level Warning
        return $false
    }

    # This is a template - actual implementation depends on source type
    switch ($SourceType) {
        "onedrive" {
            Write-Log "OneDrive sync not yet implemented. Manual sync required." -Level Warning
            Write-Log "Source: $Source" -Level Info
            Write-Log "Destination: $Destination" -Level Info
            return $false
        }
        "googledrive" {
            Write-Log "Google Drive sync not yet implemented. Manual sync required." -Level Warning
            return $false
        }
        "github" {
            Write-Log "Syncing from GitHub: $Source" -Level Info
            try {
                $scriptPath = Join-Path $PSScriptRoot "scripts\rl-vault-sync.js"
                if (-not (Test-Path $scriptPath)) {
                    Write-Log "Sync script not found: $scriptPath" -Level Error
                    return $false
                }

                $syncArgs = @()
                if ($Verbose) { $syncArgs += "--verbose" }
                if ($DryRun) { $syncArgs += "--dry-run" }
                # --pull is default; add if needed

                Write-Log "Running: node $scriptPath $($syncArgs -join ' ')" -Level Info
                if (-not $DryRun) {
                    & node $scriptPath @syncArgs
                    if ($LASTEXITCODE -eq 0) {
                        Write-Log "$VaultName sync via GitHub completed" -Level Success
                        return $true
                    }
                    else {
                        Write-Log "$VaultName sync failed with exit code $LASTEXITCODE" -Level Error
                        return $false
                    }
                }
                else {
                    Write-Log "[DRY-RUN] Would run: node $scriptPath $($syncArgs -join ' ')" -Level Info
                    return $true
                }
            }
            catch {
                Write-Log "GitHub sync error: $_" -Level Error
                return $false
            }
        }
        "local" {
            if (-not (Test-Path $Source)) {
                Write-Log "Local source not found: $Source" -Level Error
                return $false
            }
            Write-Log "Syncing from local path: $Source" -Level Info
            if (-not $DryRun) {
                Copy-Item -Path "$Source\*" -Destination $Destination -Recurse -Force
            }
            return $true
        }
        default {
            Write-Log "Unknown source type: $SourceType" -Level Error
            return $false
        }
    }
}

function Update-VaultIndex {
    param([string]$IndexFile)

    Write-Log "Updating vault index: $IndexFile" -Level Info

    if (-not $DryRun) {
        $timestamp = Get-Date -Format $TimestampFormat

        # Add timestamp to index if it exists
        if (Test-Path $IndexFile) {
            $content = Get-Content $IndexFile -Raw
            $content = $content -replace "Last Updated:.*", "Last Updated: $timestamp"
            $content = $content -replace "Last Modified:.*", "Last Modified: $timestamp"
            Set-Content -Path $IndexFile -Value $content
            Write-Log "Updated timestamps in $IndexFile" -Level Success
        }
    }
}

function Create-ArchitectureStructure {
    param($Architecture)

    if (-not $Architecture.enabled) {
        Write-Log "Architecture folders disabled. Skipping." -Level Info
        return
    }

    Write-Log "Setting up architecture folder structure" -Level Info

    # Handle both old format (direct properties) and new format (folders array)
    $foldersToCreate = @()
    if ($Architecture.folders) {
        $foldersToCreate = @($Architecture.folders | ForEach-Object { $_.path })
    }
    else {
        $foldersToCreate = @($Architecture.cic_patterns, $Architecture.rl_patterns) | Where-Object { $_ }
    }

    $foldersToCreate | ForEach-Object {
        if (-not (Test-Path $_)) {
            Write-Log "Creating architecture folder: $_" -Level Info
            if (-not $DryRun) {
                New-Item -ItemType Directory -Path $_ -Force | Out-Null

                # Create a README placeholder
                $readmePath = Join-Path $_ "README.md"
                if (-not (Test-Path $readmePath)) {
                    $folderName = Split-Path $_ -Leaf
                    $title = $folderName -replace '-', ' '

                    $content = @"
# $title

Add architectural patterns and design decisions here.

## Contents

- Pattern documents
- Design decision records
- Cross-system comparisons

## Usage

Reference these patterns in cross-system analysis queries.
"@
                    Set-Content -Path $readmePath -Value $content
                    Write-Log "Created README: $readmePath" -Level Success
                }
            }
        }
    }
}

function Get-SyncStatus {
    param($Config)

    Write-Log "=== Vault Sync Status ===" -Level Info

    foreach ($vault in $Config.vaults) {
        $status = if ($vault.enabled) { "Enabled" } else { "Disabled" }
        $syncedPath = $vault.destination

        if (Test-Path $syncedPath) {
            $fileCount = @(Get-ChildItem -Path $syncedPath -File -Recurse).Count
            Write-Log "$($vault.name): $status ($fileCount files)" -Level Success
        }
        else {
            Write-Log "$($vault.name): $status (Not yet synced)" -Level Warning
        }
    }
}

# Main execution
function Main {
    Write-Log "=== Vault Sync Started ===" -Level Info
    Write-Log "System: $System | DryRun: $DryRun" -Level Info

    # Load configuration
    $config = Get-VaultConfig

    # Process vaults
    $vaultsToSync = if ($System -eq 'all') {
        $config.vaults
    }
    else {
        $config.vaults | Where-Object { $_.name -eq $System }
    }

    foreach ($vault in $vaultsToSync) {
        Write-Log "Processing vault: $($vault.name)" -Level Info
        Test-VaultStructure -VaultPath $vault.destination -VaultName $vault.name | Out-Null

        if ($vault.enabled) {
            Write-Log "Syncing $($vault.name) from $($vault.sourceType): $($vault.source)" -Level Info
            $result = Sync-VaultContent -VaultName $vault.name `
                -Source $vault.source `
                -Destination $vault.destination `
                -Patterns $vault.patterns `
                -SourceType $vault.sourceType

            if ($result) {
                Write-Log "$($vault.name) sync completed" -Level Success
            }
            else {
                Write-Log "$($vault.name) sync incomplete or pending configuration" -Level Warning
            }
        }
        else {
            Write-Log "$($vault.name) is disabled. Skipping." -Level Info
        }
    }

    # Create architecture structure
    Create-ArchitectureStructure -Architecture $config.architecture

    # Update index
    Update-VaultIndex -IndexFile $config.indexFile

    # Show status
    Get-SyncStatus -Config $config

    Write-Log "=== Vault Sync Completed ===" -Level Info
}

# Run
Main
