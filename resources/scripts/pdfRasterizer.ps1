param(
    [string]$PdfPath,
    [string]$OutputPath,
    [string]$Format = "png"
)

try {
    Add-Type -AssemblyName System.Drawing
    [System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime') | Out-Null
    [System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime.UI.Xaml') | Out-Null
    [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null

    $resolvedPdf = (Resolve-Path $PdfPath).Path

    $winrtExt = [System.WindowsRuntimeSystemExtensions]
    $genericAsTask = $winrtExt.GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and 
        $_.IsGenericMethod -and 
        $_.GetParameters().Count -eq 1 -and 
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    } | Select-Object -First 1

    function AwaitOp($op, [Type]$type) {
        $asTask = $genericAsTask.MakeGenericMethod($type)
        $task = $asTask.Invoke($null, @($op))
        $task.Wait(-1) | Out-Null
        return $task.Result
    }

    function AwaitAction($action) {
        $task = [System.WindowsRuntimeSystemExtensions]::AsTask($action)
        $task.Wait(-1) | Out-Null
    }

    $file = AwaitOp ([Windows.Storage.StorageFile]::GetFileFromPathAsync($resolvedPdf)) ([Windows.Storage.StorageFile])
    $pdfDoc = AwaitOp ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])

    if ($pdfDoc.PageCount -eq 0) {
        Write-Error "PDF has no pages."
        exit 1
    }

    # Render first page to the requested OutputPath
    $page = $pdfDoc.GetPage(0)
    $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
    AwaitAction ($page.RenderToStreamAsync($stream))

    $netStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStream($stream)
    $netStream.Position = 0
    $bitmap = [System.Drawing.Bitmap]::FromStream($netStream)

    $outDir = [System.IO.Path]::GetDirectoryName($OutputPath)
    if ($outDir -and -not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }

    $imgFormat = switch ($Format.ToLower()) {
        "jpg" { [System.Drawing.Imaging.ImageFormat]::Jpeg }
        "jpeg" { [System.Drawing.Imaging.ImageFormat]::Jpeg }
        "bmp" { [System.Drawing.Imaging.ImageFormat]::Bmp }
        Default { [System.Drawing.Imaging.ImageFormat]::Png }
    }

    $bitmap.Save($OutputPath, $imgFormat)
    $bitmap.Dispose()
    $netStream.Dispose()
    $stream.Dispose()
    $page.Dispose()

    Write-Host "SUCCESS: $OutputPath"
    exit 0
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
