[System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime') | Out-Null
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

$pdfPath = 'C:\Projects\convertin\test files\Mockup UI Payroll (1).pdf'
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
$op1 = [Windows.Storage.StorageFile]::GetFileFromPathAsync($pdfPath)
$task1 = $asTaskGeneric.MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @($op1))
$file = $task1.GetAwaiter().GetResult()
Write-Host "Got file: $($file.Name)"

[Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime] | Out-Null
$op2 = [Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)
$task2 = $asTaskGeneric.MakeGenericMethod([Windows.Data.Pdf.PdfDocument]).Invoke($null, @($op2))
try {
    $pdf = $task2.GetAwaiter().GetResult()
    Write-Host "Page Count: $($pdf.PageCount)"
} catch {
    Write-Host "Exception: $($_.Exception.ToString())"
}

