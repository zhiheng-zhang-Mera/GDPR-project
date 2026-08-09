param(
    [string]$MainFile = "Thesis Version\main-16.tex",
    [string]$TexCountPath = "D:\Tools\TinyTeX\TinyTeX\bin\windows\texcount.exe",
    [int]$MinimumWords = 25000
)

$ErrorActionPreference = "Stop"

$candidateMain = $MainFile
if (-not [IO.Path]::IsPathRooted($candidateMain) -and -not (Test-Path -LiteralPath $candidateMain)) {
    $repositoryRoot = Split-Path -Parent $PSScriptRoot
    $candidateMain = Join-Path $repositoryRoot $candidateMain
}
$resolvedMain = (Resolve-Path -LiteralPath $candidateMain).Path
$resolvedTexCount = (Resolve-Path -LiteralPath $TexCountPath).Path

# TeXcount fields are: text, headers, captions, header count, float count,
# inline formulae, displayed formulae. Only continuous body text is weighted.
# -dir makes included chapter paths relative to the main document. Without
# it, TeXcount may silently count only the wrapper when called elsewhere.
$previousErrorPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = "Continue"
    $output = & $resolvedTexCount -dir -inc -merge "-sum=1,0,0,0,0,0,0" -1 $resolvedMain 2>$null
    $texCountExitCode = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $previousErrorPreference
}

if ($texCountExitCode -ne 0) {
    throw "TeXcount failed with exit code $texCountExitCode."
}

$wordCount = $output |
    Where-Object { $_ -match "^\s*\d+\s*$" } |
    Select-Object -Last 1

if ($null -eq $wordCount) {
    throw "TeXcount did not return a numeric body-text total. Output: $($output -join ' | ')"
}

$wordCount = [int]$wordCount.Trim()
[pscustomobject]@{
    MainFile = $resolvedMain
    Metric = "TeXcount continuous body text only"
    SumWeights = "1,0,0,0,0,0,0"
    Excludes = "titles and headings; table/figure captions and float text; equations"
    WordCount = $wordCount
    MinimumWords = $MinimumWords
    Pass = $wordCount -ge $MinimumWords
} | Format-List

if ($wordCount -lt $MinimumWords) {
    exit 2
}
