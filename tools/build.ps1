# Packages the extension for Chrome Web Store upload into dist/qr-reader-<version>.zip.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File tools/build.ps1
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$version = (Get-Content (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json).version

# Only what the extension needs at runtime.
$include = @("manifest.json", "background.js", "content.js", "icons", "lib")

$distDir = Join-Path $root "dist"
New-Item -ItemType Directory -Force $distDir | Out-Null
$zipPath = Join-Path $distDir "qr-reader-$version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Build the zip by hand so entry names use forward slashes; Windows PowerShell's
# Compress-Archive writes backslashes, which the Web Store can reject.
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($item in $include) {
    $full = Join-Path $root $item
    $files = if (Test-Path $full -PathType Container) { Get-ChildItem $full -Recurse -File } else { Get-Item $full }
    foreach ($f in $files) {
      $entry = $f.FullName.Substring($root.Path.Length + 1).Replace("\", "/")
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
      Write-Output "  + $entry"
    }
  }
} finally {
  $zip.Dispose()
}

Write-Output "Built $zipPath"
