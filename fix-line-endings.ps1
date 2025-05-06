# Convert CRLF to LF and fix trailing spaces in the patch script file
$content = Get-Content -Path "patch-remix-routes.cjs" -Raw
$content = $content -replace "`r`n", "`n"
# Remove trailing spaces
$content = $content -replace " +\n", "`n"
# Add blank line before line 125
$content = $content -replace "const appBackupPath = appPath \+ '\.backup';\n  if \(fs\.existsSync\(appPath\)", "const appBackupPath = appPath + '.backup';\n\n  if (fs.existsSync(appPath)"
# Add blank line after comment before line 138
$content = $content -replace "// Try to restore from backup if available\n    if \(fs\.existsSync\(appBackupPath\)\)", "// Try to restore from backup if available\n\n    if (fs.existsSync(appBackupPath))"
# Add blank line before comment on line 137
$content = $content -replace "console\.error\('Error while packing asar:', packError\);\n    // Try to restore", "console.error('Error while packing asar:', packError);\n\n    // Try to restore"
Set-Content -Path "patch-remix-routes.cjs" -Value $content -NoNewline
Write-Host "Linter errors fixed - added blank lines where needed" -ForegroundColor Green 