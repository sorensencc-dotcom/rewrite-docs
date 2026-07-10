<#
.SYNOPSIS
Check file lifecycle status.

.DESCRIPTION
Identifies files that haven't been modified in 90+ days.
Candidates for archival per FILE_LIFECYCLE_POLICY.md.

.PARAMETER DaysInactive
Threshold for "inactive" (default: 90)

.PARAMETER Output
Output location. Default: 'C:\dev\docs\meta\archive-candidates.md'

.EXAMPLE
./lifecycle-check.ps1
./lifecycle-check.ps1 -DaysInactive 60
./lifecycle-check.ps1 -Output "C:\dev\reports\archive.md"
#>

param(
    [int]$DaysInactive = 90,
    [string]$Output = 'C:\dev\docs\meta\archive-candidates.md'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = 'C:\dev'
$ThresholdDate = (Get-Date).AddDays(-$DaysInactive)

Write-Host "Checking file lifecycle (inactive > $DaysInactive days)..." -ForegroundColor Cyan
Write-Host "Threshold date: $($ThresholdDate.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
Write-Host "Output: $Output" -ForegroundColor Gray

$ArchiveCandidates = @()

Get-ChildItem -Path $RepoRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    ($_.Extension -in @('.md', '.ts', '.json', '.yaml')) -and
    (-not ($_.FullName -like '*node_modules*')) -and
    (-not ($_.FullName -like '*dist*')) -and
    (-not ($_.FullName -like '*build*')) -and
    (-not ($_.FullName -like '.next*')) -and
    ($_.LastWriteTime -lt $ThresholdDate)
} | ForEach-Object {
    $DaysOld = [math]::Floor(((Get-Date) - $_.LastWriteTime).TotalDays)

    $ArchiveCandidates += @{
        Path = $_.FullName -replace 'C:\\dev\\', ''
        LastModified = $_.LastWriteTime.ToString('yyyy-MM-dd')
        DaysOld = $DaysOld
        SizeKB = [math]::Round($_.Length / 1KB, 2)
    }
}

# Sort by age (oldest first)
$ArchiveCandidates = $ArchiveCandidates | Sort-Object -Property DaysOld -Descending

# Generate report
$Report = @()
$Report += "# Archive Candidates Report"
$Report += ""
$Report += "**Date:** $(Get-Date -Format 'yyyy-MM-dd')"
$Report += "**Threshold:** Files inactive for > $DaysInactive days"
$Report += "**Total candidates:** $($ArchiveCandidates.Count)"
$Report += ""

if ($ArchiveCandidates.Count -eq 0) {
    $Report += "✓ No files inactive for > $DaysInactive days"
} else {
    $Report += "## Candidates for Archival"
    $Report += ""
    $Report += "| Path | Last Modified | Days Old | Size (KB) |"
    $Report += "|------|---------------|----------|-----------|"

    $ArchiveCandidates | ForEach-Object {
        $Report += "| $($_.Path) | $($_.LastModified) | $($_.DaysOld) | $($_.SizeKB) |"
    }

    $Report += ""
    $Report += "## Action"
    $Report += ""
    $Report += "1. Review each candidate in the table above"
    $Report += "2. Confirm with file owner (check for OWNER comment)"
    $Report += "3. Move to \`docs/archive/{category}/\` per [FILE_LIFECYCLE_POLICY.md](file-lifecycle-policy.md)"
    $Report += "4. Update mkdocs.yml nav if needed"
    $Report += "5. Run \`mkdocs build --strict\` to validate"
}

$Report -join "`n" | Set-Content $Output -Encoding UTF8
Write-Host "✓ Report written: $Output" -ForegroundColor Green
