# Samil KSSB Precheck - Portable Node Bootstrap (Cycle 2N-4F, source-only, mock-verified)
#
# 경계(2N-4E 계획 / Codex plan review PASS / D76 — C안 배제 불변):
# - 무승인 준비 금지: -ApproveRuntime 없이는 어떤 다운로드/파일 생성도 하지 않고 승인 안내만 출력한다(exit 5).
# - OS installer 미실행 · 시스템 PATH 영구 수정 없음 · 관리자 권한 불요 · 레지스트리 무접촉.
#   설치 위치는 repo 밖 tool-cache이며 제거는 폴더 삭제로 완결된다.
# - 이중 hash 검증(fail-fast): (1차) repo-pinned SHA-256 + (2차) SHASUMS256.txt 해당 행 교차 —
#   어느 한쪽 불일치/파싱 실패도 부분 파일을 정리하고 중단한다(해제 금지).
# - $PINNED_ZIP_SHA256_CONST가 비어 있는 동안 실제(https) 출처 다운로드는 fail-closed로 거부된다.
#   (실측 evidence 사이클(2N-4G)에서 최초 관측값을 기록한 뒤에만 실 다운로드 가능 — 이번 사이클은 mock 전용.)
# - -SourceRoot 에 로컬 디렉터리를 주면 테스트 fixture로 검증할 수 있다(테스트 전용 — prep 로그에 출처가 남는다).
# - 이 스크립트는 Node/Python 없이 Windows 내장 PowerShell만으로 동작한다(닭-달걀 해소).
#   호출 형태: powershell -NoProfile -ExecutionPolicy Bypass -File prepare_portable_node.ps1 -ApproveRuntime
#   (Bypass는 해당 프로세스 1회에만 적용 — 시스템 실행 정책을 영구 변경하지 않는다. 사용자 결정 3 승인됨.)
#
# 종료 코드: 0=성공 / 5=승인 필요 / 7=준비 실패(모든 실패는 A안(기본 텍스트 검토 계속) 수렴).

#requires -Version 5.1
param(
    [string]$ToolCache = (Join-Path $env:USERPROFILE ".samil-kssb-precheck\tools"),
    [string]$PinVersion = "24.16.0",
    [string]$SourceRoot = "",
    [string]$PinnedZipSha256 = "",
    [switch]$ApproveRuntime
)

# pin 후보 근거: v24 LTS 계열(사용자 결정 2) — Gate D·2N-4·P0에서 실측된 major.
# 최종 pin·아래 상수는 2N-4G evidence 사이클에서 최초 관측 hash와 함께 확정한다.
$PINNED_ZIP_SHA256_CONST = ""   # 미기록(fail-closed) — 2N-4G에서 기록 전까지 실 다운로드 불가

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$zipName = "node-v$PinVersion-win-x64.zip"
$innerDirName = "node-v$PinVersion-win-x64"
$destName = "node@v$PinVersion-win-x64"

function ConvertTo-JsonSafe([string]$s) {
    if ($null -eq $s) { return "" }
    return $s.Replace('\', '\\').Replace('"', '\"')
}

function Write-PrepLog([string]$Cache, [string]$Status, [string]$Summary, [string]$Src) {
    New-Item -ItemType Directory -Force -Path $Cache | Out-Null
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $line = '{"action": "runtime_prepare", "command_summary": "' + (ConvertTo-JsonSafe $Summary) +
        '", "provider": "nodejs-portable", "source": "' + (ConvertTo-JsonSafe $Src) +
        '", "status": "' + (ConvertTo-JsonSafe $Status) + '", "timestamp": "' + $ts +
        '", "version": "' + (ConvertTo-JsonSafe $PinVersion) + '"}'
    [System.IO.File]::AppendAllText((Join-Path $Cache "prep_egress_log.jsonl"), $line + "`n",
        (New-Object System.Text.UTF8Encoding($false)))
}

function Write-ApprovalMarker([string]$Cache, [string]$Target) {
    New-Item -ItemType Directory -Force -Path $Cache | Out-Null
    $p = Join-Path $Cache "approvals.json"
    $data = $null
    if (Test-Path $p) {
        try {
            $raw = [System.IO.File]::ReadAllText($p)
            $data = $raw.TrimStart([char]0xFEFF) | ConvertFrom-Json
        } catch { $data = $null }
    }
    if ($null -eq $data) { $data = New-Object PSObject }
    if (-not ($data.PSObject.Properties.Name -contains 'runtime')) {
        $data | Add-Member -NotePropertyName 'runtime' -NotePropertyValue (New-Object PSObject)
    }
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    if ($data.runtime.PSObject.Properties.Name -contains $Target) { $data.runtime.$Target = $ts }
    else { $data.runtime | Add-Member -NotePropertyName $Target -NotePropertyValue $ts }
    [System.IO.File]::WriteAllText($p, ($data | ConvertTo-Json -Depth 6),
        (New-Object System.Text.UTF8Encoding($false)))
}

# ---- 1) 승인 게이트 — 무승인 준비 금지(어떤 파일도 만들지 않는다) ----------------
if (-not $ApproveRuntime) {
    Write-Output "■ 로컬 실행 환경(Node.js) 준비 승인이 필요합니다"
    Write-Output "  - 준비 대상: Node.js 실행 환경 v$PinVersion (portable zip — OS 설치 프로그램 아님)"
    Write-Output "  - 출처: nodejs.org 공식 배포 (nodejs.org/dist — 고정 URL)"
    Write-Output "  - 용량: 다운로드 약 30MB / 해제 후 약 80MB"
    Write-Output "  - 위치: 로컬 전용 폴더 $ToolCache\$destName (이 저장소 밖 — 삭제는 폴더 제거로 완결)"
    Write-Output "  - 무결성: SHA-256 이중 검증(기록된 기대값 + 공식 SHASUMS256.txt 교차) — 불일치 시 즉시 중단"
    Write-Output "  - 시스템 변경 없음: OS installer 미실행 · PATH 영구 수정 없음 · 관리자 권한 불요"
    Write-Output "  - 이 스크립트 실행의 -ExecutionPolicy Bypass는 해당 프로세스 1회에만 적용됩니다"
    Write-Output "  - 준비(다운로드) 단계에서만 네트워크 통신이 발생하며, 문서 분석 실행은 네트워크 차단(no-egress) 훅 아래에서 수행됩니다"
    Write-Output "  - 거부해도 기본 텍스트 기반 검토는 계속 진행할 수 있습니다"
    Write-Output "  → 동의하시면 -ApproveRuntime 플래그와 함께 다시 실행하십시오."
    exit 5
}

# ---- 2) 출처·pin 확정(네트워크·파일 생성 전 fail-closed 게이트, C2N4F-MAJ-02) -----
# 원격 출처는 공식 nodejs.org/dist/v<pin>/ 로 고정한다 — 미러·리다이렉트·임의 URL은 거부.
# 원격 경로에서는 -PinnedZipSha256 override도 거부한다(repo-pinned 상수만 유효 — provenance 약화 방지).
# 로컬 디렉터리 -SourceRoot 는 테스트 fixture 전용으로 유지된다(override 허용 — 출처가 로그에 남음).
$officialRoot = "https://nodejs.org/dist/v$PinVersion"
$src = $SourceRoot
if ([string]::IsNullOrWhiteSpace($src)) { $src = $officialRoot + "/" }
$isRemote = $src -match '^https?://'
if ($isRemote) {
    if ($src.TrimEnd('/') -ne $officialRoot) {
        Write-Output "준비를 중단합니다: 원격 출처는 공식 nodejs.org/dist/v$PinVersion/ 만 허용됩니다(미러/임의 URL 거부)."
        Write-Output "기본 텍스트 기반 검토로 계속하십시오."
        exit 7
    }
    if (-not [string]::IsNullOrWhiteSpace($PinnedZipSha256)) {
        Write-Output "준비를 중단합니다: 원격 출처에서는 기록된 기대 SHA-256(repo-pinned)만 사용합니다(-PinnedZipSha256 지정 거부)."
        Write-Output "기본 텍스트 기반 검토로 계속하십시오."
        exit 7
    }
    $pinned = $PINNED_ZIP_SHA256_CONST
} else {
    $pinned = $PinnedZipSha256
    if ([string]::IsNullOrWhiteSpace($pinned)) { $pinned = $PINNED_ZIP_SHA256_CONST }
}
if ([string]::IsNullOrWhiteSpace($pinned)) {
    Write-Output "준비를 중단합니다: 기대 SHA-256(repo-pinned)이 아직 기록되지 않았습니다."
    Write-Output "실제 다운로드는 evidence 사이클에서 기대값 기록 후에만 가능합니다. 기본 텍스트 기반 검토로 계속하십시오."
    exit 7
}
$pinned = $pinned.Trim().ToLower()

$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("kssb-node-prep-" + [guid]::NewGuid().ToString("N"))
$dest = Join-Path $ToolCache $destName
$failed = $false

function Invoke-Cleanup {
    if (Test-Path $staging) {
        try { Remove-Item -Recurse -Force -Path $staging -ErrorAction Stop } catch {}
    }
}

function Fail-Prepare([string]$Reason) {
    Write-PrepLog $ToolCache ("failed " + $Reason) "prepare portable node ($zipName)" $src
    Invoke-Cleanup
    if (Test-Path $dest) {
        try { Remove-Item -Recurse -Force -Path $dest -ErrorAction Stop } catch {}
    }
    Write-Output "로컬 실행 환경 준비에 실패했습니다($Reason). 기본 텍스트 기반 검토로 계속하십시오."
    exit 7
}

Write-ApprovalMarker $ToolCache $destName
Write-PrepLog $ToolCache "started" "prepare portable node ($zipName)" $src
New-Item -ItemType Directory -Force -Path $staging | Out-Null

# ---- 3) zip + SHASUMS256.txt 확보(원격은 공식 출처 고정, 로컬은 테스트 fixture) ----
$zipPath = Join-Path $staging $zipName
$sumsPath = Join-Path $staging "SHASUMS256.txt"
try {
    if ($isRemote) {
        Invoke-WebRequest -UseBasicParsing -Uri ($src.TrimEnd('/') + "/" + $zipName) -OutFile $zipPath -ErrorAction Stop
        Invoke-WebRequest -UseBasicParsing -Uri ($src.TrimEnd('/') + "/SHASUMS256.txt") -OutFile $sumsPath -ErrorAction Stop
    } else {
        Copy-Item -Path (Join-Path $src $zipName) -Destination $zipPath -ErrorAction Stop
        Copy-Item -Path (Join-Path $src "SHASUMS256.txt") -Destination $sumsPath -ErrorAction Stop
    }
} catch { Fail-Prepare "download" }

# ---- 4) 이중 hash 검증(fail-fast — 어느 한쪽 불일치도 해제 금지) -------------------
$actual = (Get-FileHash -Algorithm SHA256 -Path $zipPath).Hash.ToLower()
if ($actual -ne $pinned) { Fail-Prepare "pinned-hash-mismatch" }

$sumsLine = $null
try {
    foreach ($line in [System.IO.File]::ReadAllLines($sumsPath)) {
        if ($line -match ('^\s*([0-9a-fA-F]{64})\s+\.?/?' + [regex]::Escape($zipName) + '\s*$')) {
            $sumsLine = $Matches[1].ToLower()
            break
        }
    }
} catch { Fail-Prepare "shasums-read" }
if ($null -eq $sumsLine) { Fail-Prepare "shasums-parse" }
if ($sumsLine -ne $actual) { Fail-Prepare "shasums-mismatch" }

# ---- 5) 해제 → 배치 → 자가 확인 ---------------------------------------------------
$extractDir = Join-Path $staging "x"
try { Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force -ErrorAction Stop }
catch { Fail-Prepare "extract" }

$innerDir = Join-Path $extractDir $innerDirName
if (-not (Test-Path (Join-Path $innerDir "node.exe"))) { Fail-Prepare "layout" }

if (Test-Path $dest) {
    try { Remove-Item -Recurse -Force -Path $dest -ErrorAction Stop } catch { Fail-Prepare "dest-clean" }
}
New-Item -ItemType Directory -Force -Path $ToolCache | Out-Null
try { Move-Item -Path $innerDir -Destination $dest -ErrorAction Stop } catch { Fail-Prepare "move" }

$observedVersion = $null
try { $observedVersion = (& (Join-Path $dest "node.exe") --version) } catch { $observedVersion = $null }
if ($observedVersion -ne "v$PinVersion") { Fail-Prepare "version-check" }
if (-not (Test-Path (Join-Path $dest "npm.cmd"))) { Fail-Prepare "npm-missing" }

Write-PrepLog $ToolCache "ok" "prepare portable node ($zipName)" $src
Invoke-Cleanup
Write-Output "■ 로컬 실행 환경 준비 완료"
Write-Output "  - 위치: $dest (이 저장소 밖 — 제거는 이 폴더 삭제로 완결)"
Write-Output "  - 확인된 버전: $observedVersion (기대값과 일치)"
Write-Output "  - 이후 문서 판독 실행은 네트워크 차단(no-egress) 훅 아래에서 수행됩니다."
exit 0
