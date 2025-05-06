# Create a new clean patch-remix-routes.cjs file
$originalFile = "patch-remix-routes.cjs"
$tempFile = "patch-remix-routes.cjs.temp"

# First, ensure the file ends without a trailing space
(Get-Content $originalFile -Raw) | Set-Content $tempFile -NoNewline

# Fix line endings by converting to LF
$content = [System.IO.File]::ReadAllText($tempFile)
$content = $content.Replace("`r`n", "`n")
[System.IO.File]::WriteAllText("$originalFile", $content)

# Clean up
Remove-Item $tempFile -Force

Write-Host "Fixed line endings in $originalFile" -ForegroundColor Green 