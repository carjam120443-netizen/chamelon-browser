# Download and verify the official Tor Expert Bundle for Windows x64.
# The version is pinned so builds are reproducible; update it deliberately when Tor releases a newer stable bundle.
$ErrorActionPreference = "Stop"
$version = "15.0.26"
$archiveName = "tor-expert-bundle-windows-x86_64-$version.tar.gz"
$baseUrl = "https://dist.torproject.org/torbrowser/$version"
$tempRoot = Join-Path $env:TEMP "chamelon-tor-$version"
$archivePath = Join-Path $tempRoot $archiveName
$checksumsPath = Join-Path $tempRoot "sha256sums-unsigned-build.txt"
$extractPath = Join-Path $tempRoot "extracted"
$destination = Join-Path (Get-Location) "vendor/tor"

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
Invoke-WebRequest -Uri "$baseUrl/$archiveName" -OutFile $archivePath
Invoke-WebRequest -Uri "$baseUrl/sha256sums-unsigned-build.txt" -OutFile $checksumsPath

$checksumText = Get-Content -Raw $checksumsPath
$pattern = "(?m)^([A-Fa-f0-9]{64})\s+\*?" + [regex]::Escape($archiveName) + "\s*$"
$match = [regex]::Match($checksumText, $pattern)
if (-not $match.Success) {
  throw "The official checksum list did not contain $archiveName. Refusing to package an unverified Tor archive."
}
$expectedHash = $match.Groups[1].Value.ToUpperInvariant()
$sha256 = [System.Security.Cryptography.SHA256]::Create()
try {
  $fileStream = [System.IO.File]::OpenRead($archivePath)
  try {
    $hashBytes = $sha256.ComputeHash($fileStream)
  } finally {
    $fileStream.Dispose()
  }
  $actualHash = ([System.BitConverter]::ToString($hashBytes) -replace "-", "").ToUpperInvariant()
} finally {
  $sha256.Dispose()
}
if ($actualHash -ne $expectedHash) {
  throw "Tor archive SHA-256 mismatch. Expected $expectedHash, got $actualHash."
}

if (Test-Path $extractPath) { Remove-Item -Recurse -Force $extractPath }
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
tar.exe -xzf $archivePath -C $extractPath
if ($LASTEXITCODE -ne 0) { throw "Could not extract the Tor Expert Bundle." }

$torExe = Get-ChildItem -Path $extractPath -Filter "tor.exe" -File -Recurse | Select-Object -First 1
if (-not $torExe) { throw "The official Tor bundle did not contain tor.exe." }

if (Test-Path $destination) { Remove-Item -Recurse -Force $destination }
New-Item -ItemType Directory -Force -Path $destination | Out-Null
Copy-Item -Path (Join-Path $torExe.Directory.FullName "*") -Destination $destination -Recurse -Force
if (-not (Test-Path (Join-Path $destination "tor.exe"))) {
  throw "Tor executable was not copied to vendor/tor/tor.exe."
}
Write-Host "Prepared Tor Expert Bundle $version (SHA-256 verified) at vendor/tor."
