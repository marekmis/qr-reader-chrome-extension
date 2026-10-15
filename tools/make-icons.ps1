# Renders the extension icons into icons/. Run: powershell -File tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force $outDir | Out-Null

$blue = [System.Drawing.Color]::FromArgb(255, 79, 140, 255)
$white = [System.Drawing.Color]::White

foreach ($size in 16, 32, 48, 128) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  # Everything below is drawn on a 128-unit grid.
  $g.ScaleTransform($size / 128.0, $size / 128.0)

  $blueBrush = New-Object System.Drawing.SolidBrush $blue
  $whiteBrush = New-Object System.Drawing.SolidBrush $white

  # Rounded background
  $r = 28
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc(0, 0, $r * 2, $r * 2, 180, 90)
  $path.AddArc(128 - $r * 2, 0, $r * 2, $r * 2, 270, 90)
  $path.AddArc(128 - $r * 2, 128 - $r * 2, $r * 2, $r * 2, 0, 90)
  $path.AddArc(0, 128 - $r * 2, $r * 2, $r * 2, 90, 90)
  $path.CloseFigure()
  $g.FillPath($blueBrush, $path)

  # Selection crop marks in the corners
  $pen = New-Object System.Drawing.Pen $white, 9
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $a = 20; $b = 108; $len = 22
  $g.DrawLines($pen, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new($a, $a + $len), [System.Drawing.PointF]::new($a, $a), [System.Drawing.PointF]::new($a + $len, $a)))
  $g.DrawLines($pen, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new($b - $len, $a), [System.Drawing.PointF]::new($b, $a), [System.Drawing.PointF]::new($b, $a + $len)))
  $g.DrawLines($pen, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new($b, $b - $len), [System.Drawing.PointF]::new($b, $b), [System.Drawing.PointF]::new($b - $len, $b)))
  $g.DrawLines($pen, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new($a + $len, $b), [System.Drawing.PointF]::new($a, $b), [System.Drawing.PointF]::new($a, $b - $len)))

  # QR glyph: three finder patterns plus a few data modules
  foreach ($p in @(@(38, 38), @(66, 38), @(38, 66))) {
    $x = $p[0]; $y = $p[1]
    $g.FillRectangle($whiteBrush, $x, $y, 24, 24)
    $g.FillRectangle($blueBrush, $x + 5, $y + 5, 14, 14)
    $g.FillRectangle($whiteBrush, $x + 9, $y + 9, 6, 6)
  }
  foreach ($m in @(@(66, 66), @(80, 66), @(73, 75), @(66, 82), @(82, 82))) {
    $g.FillRectangle($whiteBrush, $m[0], $m[1], 8, 8)
  }

  $file = Join-Path $outDir "icon$size.png"
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "wrote $file"
}
