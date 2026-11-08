<#
.SYNOPSIS
    Automated Git Commit and Push script for AURA Hi-Fi Player.
.DESCRIPTION
    Stages all changes, creates a timestamped commit (or custom message), and pushes to GitHub.
.EXAMPLE
    .\sync-github.ps1 "Updated EQ presets"
#>

param(
    [string]$Message = "Update: AURA Hi-Fi lossless audio player enhancements"
)

Write-Host "🎵 [AURA Hi-Fi] Staging changes..." -ForegroundColor Cyan
git add .

$status = git status --porcelain
if (-not $status) {
    Write-Host "✨ Working tree clean. Nothing to commit." -ForegroundColor Green
    exit 0
}

Write-Host "💾 [AURA Hi-Fi] Committing changes with message: '$Message'..." -ForegroundColor Yellow
git commit -m $Message

Write-Host "🚀 [AURA Hi-Fi] Pushing updates to origin main..." -ForegroundColor Magenta
git push origin main

Write-Host "✅ [AURA Hi-Fi] Successfully synchronized with https://github.com/s4gnikz/LOSSLESS-HIFI-PLAYER" -ForegroundColor Green
