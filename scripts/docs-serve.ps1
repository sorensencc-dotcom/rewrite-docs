# Serve MkDocs on 127.0.0.1:8001 (8000 reserved for ironledger-workbench).
# Prefer Python 3.11/3.12/3.13 — system Python 3.14 currently crashes pygments/html.escape on some fences.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$ver = $null
foreach ($candidate in @("3.12", "3.11", "3.13")) {
  & py "-$candidate" -c "import sys; print(sys.version)" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $ver = $candidate; break }
}
if (-not $ver) {
  throw "Need Python 3.11/3.12/3.13 for mkdocs (avoid 3.14 pygments crash). Install one or use: py -3.11 -m pip install -r requirements-docs.txt"
}

Write-Host "Using py -$ver"
& py "-$ver" -m pip install --user -q -r requirements-docs.txt
if ($LASTEXITCODE -ne 0) { throw "pip install failed" }
& py "-$ver" -m mkdocs serve -a 127.0.0.1:8001
