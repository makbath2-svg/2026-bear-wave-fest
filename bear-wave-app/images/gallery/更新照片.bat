@echo off
echo Scanning photos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files = @(Get-ChildItem -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|webp)$' } | Select-Object -ExpandProperty Name); $json = $files | ConvertTo-Json -Compress; if ([string]::IsNullOrEmpty($json)) { $json = '[]' }; Set-Content -Path 'photos.js' -Value ('window.galleryPhotos = ' + $json + ';') -Encoding UTF8"
echo.
echo =========================================
echo Photo list updated successfully!
echo You can now close this window and refresh the web page.
echo =========================================
pause
