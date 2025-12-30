Get-ChildItem -Path "src\app" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace '(?m)^\s*console\.(log|warn|error)\([^;]*\);?\s*$', ''
    $newContent = $newContent -replace '(?m)^\s*console\.(log|warn|error)\([\s\S]*?\);\s*$', ''
    Set-Content -Path $_.FullName -Value $newContent -NoNewline
}
Write-Host "Console statements removed from all TypeScript files in src/app"
