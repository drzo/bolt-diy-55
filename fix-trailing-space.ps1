# Script to fix trailing space at the end of the file
$file = "patch-remix-routes.cjs"

# Read file as a single string
$content = Get-Content -Path $file -Raw

# Remove trailing spaces at end of lines
$content = $content -replace " +\n", "`n"
# Remove any trailing spaces at the very end of the file
$content = $content.TrimEnd()

# Write the cleaned content back to the file
[System.IO.File]::WriteAllText($file, $content)

Write-Host "Trailing spaces removed from $file" -ForegroundColor Green 