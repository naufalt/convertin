param (
    [string]$Action,
    [string]$InputPath,
    [string]$OutputPath
)

try {
    switch ($Action) {
        "check" {
            $hasWord = Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\winword.exe"
            $hasPpt = Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\powerpnt.exe"
            $hasExcel = Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\excel.exe"
            @{
                word = $hasWord
                powerpoint = $hasPpt
                excel = $hasExcel
            } | ConvertTo-Json
        }
        "docx-to-pdf" {
            $word = New-Object -ComObject Word.Application
            $word.Visible = $false
            $doc = $word.Documents.Open($InputPath, $false, $true)
            # wdFormatPDF = 17
            $doc.SaveAs([ref]$OutputPath, [ref]17)
            $doc.Close([ref]0)
            $word.Quit()
            Write-Output "SUCCESS"
        }
        "pdf-to-docx" {
            $word = New-Object -ComObject Word.Application
            $word.Visible = $false
            $doc = $word.Documents.Open($InputPath, $false, $true)
            # wdFormatXMLDocument = 16 (docx)
            $doc.SaveAs([ref]$OutputPath, [ref]16)
            $doc.Close([ref]0)
            $word.Quit()
            Write-Output "SUCCESS"
        }
        "pptx-to-pdf" {
            $ppt = New-Object -ComObject PowerPoint.Application
            # ppFixedFormatTypePDF = 2
            $presentation = $ppt.Presentations.Open($InputPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
            $presentation.SaveAs($OutputPath, 32) # ppSaveAsPDF = 32
            $presentation.Close()
            $ppt.Quit()
            Write-Output "SUCCESS"
        }
        "xlsx-to-pdf" {
            $excel = New-Object -ComObject Excel.Application
            $excel.Visible = $false
            $wb = $excel.Workbooks.Open($InputPath)
            # xlTypePDF = 0
            $wb.ExportAsFixedFormat(0, $OutputPath)
            $wb.Close($false)
            $excel.Quit()
            Write-Output "SUCCESS"
        }
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

