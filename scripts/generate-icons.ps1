Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\ayush\.gemini\antigravity\brain\7d7f42d2-d58f-4064-a972-90c193435738\.user_uploaded\media_1791035407393.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$densities = @(
    @{ name = "mdpi"; size = 48; fgSize = 108 },
    @{ name = "hdpi"; size = 72; fgSize = 162 },
    @{ name = "xhdpi"; size = 96; fgSize = 216 },
    @{ name = "xxhdpi"; size = 144; fgSize = 324 },
    @{ name = "xxxhdpi"; size = 192; fgSize = 432 }
)

$resDir = "C:\Users\ayush\.gemini\antigravity\scratch\ayushmaan-os-v2\android\app\src\main\res"

function Resize-Image($source, $targetWidth, $targetHeight, $destPath, $asCircle = $false) {
    $dest = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    if ($asCircle) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $targetWidth, $targetHeight)
        $g.SetClip($path)
    }
    
    $g.DrawImage($source, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
}

foreach ($d in $densities) {
    $dir = Join-Path $resDir ("mipmap-" + $d.name)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    
    # Standard square icon
    $launcherPath = Join-Path $dir "ic_launcher.png"
    Resize-Image $src $d.size $d.size $launcherPath $false
    
    # Round icon
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    Resize-Image $src $d.size $d.size $roundPath $true
    
    # Foreground icon for adaptive
    $fgPath = Join-Path $dir "ic_launcher_foreground.png"
    Resize-Image $src $d.fgSize $d.fgSize $fgPath $false
    
    Write-Output "Generated icons for mipmap-$($d.name): size=$($d.size)x$($d.size), fg=$($d.fgSize)x$($d.fgSize)"
}

# Also update web favicon and pwa icon
$publicDir = "C:\Users\ayush\.gemini\antigravity\scratch\ayushmaan-os-v2\public"
if (Test-Path $publicDir) {
    Resize-Image $src 192 192 (Join-Path $publicDir "icon-192.png") $false
    Resize-Image $src 512 512 (Join-Path $publicDir "icon-512.png") $false
    Resize-Image $src 64 64 (Join-Path $publicDir "favicon.png") $false
    Write-Output "Generated web icons in public/"
}

$src.Dispose()
Write-Output "SUCCESS: All app icons successfully generated!"
