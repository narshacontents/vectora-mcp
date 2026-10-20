$ErrorActionPreference = 'Stop'

function Stop-VectoraMcp {
    param([string]$Message)
    [Console]::Error.WriteLine("Vectora MCP: $Message")
    exit 69
}

$candidates = [System.Collections.Generic.List[string]]::new()
$overridePath = [string]$env:VECTORA_APP_PATH
if (-not [string]::IsNullOrWhiteSpace($overridePath)) {
    $candidates.Add($overridePath.Trim().Trim('"'))
} else {
    if (-not [string]::IsNullOrWhiteSpace($env:APPDATA)) {
        $configPath = Join-Path $env:APPDATA 'Vectora\mcp-app-path'
        if (Test-Path -LiteralPath $configPath -PathType Leaf) {
            try {
                $configuredPath = ([System.IO.File]::ReadAllText($configPath)).Trim().Trim('"')
                if (-not [string]::IsNullOrWhiteSpace($configuredPath)) {
                    $candidates.Add($configuredPath)
                }
            } catch {
                [Console]::Error.WriteLine('Vectora MCP: could not read %APPDATA%\Vectora\mcp-app-path; checking standard install locations.')
            }
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
        $candidates.Add((Join-Path $env:LOCALAPPDATA 'Programs\Vectora\Vectora.exe'))
    }
    if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
        $candidates.Add((Join-Path $env:ProgramFiles 'Vectora\Vectora.exe'))
    }
    if (-not [string]::IsNullOrWhiteSpace(${env:ProgramFiles(x86)})) {
        $candidates.Add((Join-Path ${env:ProgramFiles(x86)} 'Vectora\Vectora.exe'))
    }
}

$vectoraExe = $null
foreach ($candidate in $candidates) {
    $expandedCandidate = [Environment]::ExpandEnvironmentVariables($candidate.Trim())
    if (Test-Path -LiteralPath $expandedCandidate -PathType Leaf) {
        $vectoraExe = (Resolve-Path -LiteralPath $expandedCandidate).Path
        break
    }
}

if (-not $vectoraExe) {
    Stop-VectoraMcp 'Vectora.exe was not found. Install Vectora 1.0.0 or later, set VECTORA_APP_PATH, or configure %APPDATA%\Vectora\mcp-app-path.'
}

try {
    $versionText = (Get-Item -LiteralPath $vectoraExe).VersionInfo.ProductVersion
    if ([string]::IsNullOrWhiteSpace($versionText)) {
        $versionText = (Get-Item -LiteralPath $vectoraExe).VersionInfo.FileVersion
    }
} catch {
    Stop-VectoraMcp 'could not read the selected Vectora.exe version. Choose an app build versioned 1.0.0 or later.'
}

$versionMatch = [regex]::Match([string]$versionText, '^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<prerelease>-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?(?:\.\d+)?$')
if (-not $versionMatch.Success) {
    Stop-VectoraMcp 'the selected Vectora.exe has no readable semantic version. Update Vectora to 1.0.0 or later.'
}

$major = [int]$versionMatch.Groups['major'].Value
$minor = [int]$versionMatch.Groups['minor'].Value
$patch = [int]$versionMatch.Groups['patch'].Value
$isOldVersion = ($major -lt 1) -or ($major -eq 1 -and $minor -lt 0) -or ($major -eq 1 -and $minor -eq 0 -and $patch -lt 0)
$isUnreleasedPrerelease = ($major -eq 1 -and $minor -eq 0 -and $patch -eq 0 -and $versionMatch.Groups['prerelease'].Success)
if ($isOldVersion -or $isUnreleasedPrerelease) {
    Stop-VectoraMcp "Vectora 1.0.0 or later is required; selected version is $versionText."
}

# Electron must not inherit the Node child-process switch.
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

# Capture the actual client, not only this long-lived PowerShell bridge.
$hostInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $PID" -ErrorAction Stop
$hostProcess = [System.Diagnostics.Process]::GetProcessById([int]$hostInfo.ParentProcessId)
# Force a handle now so a later PID reuse cannot turn a dead host into a live one.
[void]$hostProcess.Handle

# A per-launch job owns only this MCP process tree. Closing/crashing the bridge
# closes the job handle and reclaims Chromium children, even after main exits.
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public static class VectoraMcpJob {
    [StructLayout(LayoutKind.Sequential)] struct Basic {
        public long ProcessTime, JobTime; public uint Flags;
        public UIntPtr Minimum, Maximum; public uint Active; public UIntPtr Affinity;
        public uint Priority, Scheduling;
    }
    [StructLayout(LayoutKind.Sequential)] struct Counters { public ulong A, B, C, D, E, F; }
    [StructLayout(LayoutKind.Sequential)] struct Extended {
        public Basic Limits; public Counters IO; public UIntPtr ProcessMemory, JobMemory, PeakProcess, PeakJob;
    }
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr security, string name);
    [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job, int info, IntPtr data, uint length);
    [DllImport("kernel32.dll", SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
    [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr handle);
    public static IntPtr Create() {
        IntPtr job = CreateJobObject(IntPtr.Zero, null);
        if (job == IntPtr.Zero) throw new Win32Exception();
        var value = new Extended(); value.Limits.Flags = 0x2000; // KILL_ON_JOB_CLOSE
        int size = Marshal.SizeOf(value); IntPtr data = Marshal.AllocHGlobal(size);
        try {
            Marshal.StructureToPtr(value, data, false);
            if (!SetInformationJobObject(job, 9, data, (uint)size)) throw new Win32Exception();
            return job;
        } catch { CloseHandle(job); throw; } finally { Marshal.FreeHGlobal(data); }
    }
    public static void Assign(IntPtr job, IntPtr process) {
        if (!AssignProcessToJobObject(job, process)) throw new Win32Exception();
    }
}
'@
function Stop-OwnedProcessTree {
    param([System.Diagnostics.Process]$OwnedProcess)
    if ($null -eq $OwnedProcess -or $OwnedProcess.HasExited) { return }
    $killInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $killInfo.FileName = Join-Path $env:SystemRoot 'System32\taskkill.exe'
    $killInfo.Arguments = "/PID $($OwnedProcess.Id) /T /F"
    $killInfo.UseShellExecute = $false
    $killInfo.CreateNoWindow = $true
    $killInfo.RedirectStandardOutput = $true
    $killInfo.RedirectStandardError = $true
    $killer = [System.Diagnostics.Process]::Start($killInfo)
    try {
        [void]$killer.StandardOutput.BaseStream.CopyToAsync([System.IO.Stream]::Null)
        [void]$killer.StandardError.BaseStream.CopyToAsync([Console]::OpenStandardError())
        if (-not $killer.WaitForExit(5000)) { [Console]::Error.WriteLine('Vectora MCP: process-tree cleanup timed out.') }
    } finally { $killer.Dispose() }
}

# Electron treats this variable as a Node.js child-process request. Never inherit it into Vectora.

# Electron's Windows GUI stdin can close before the MCP handshake. Use a
# current-user-only duplex pipe inside the launcher; Codex still sees stdio.
$pipeName = 'vectora-mcp-' + [Guid]::NewGuid().ToString('N')
$pipeSecurity = [System.IO.Pipes.PipeSecurity]::new()
$pipeSecurity.SetAccessRuleProtection($true, $false)
$userSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$pipeSecurity.AddAccessRule([System.IO.Pipes.PipeAccessRule]::new(
    $userSid, [System.IO.Pipes.PipeAccessRights]::FullControl,
    [System.Security.AccessControl.AccessControlType]::Allow))
$pipe = [System.IO.Pipes.NamedPipeServerStream]::new(
    $pipeName, [System.IO.Pipes.PipeDirection]::InOut, 1,
    [System.IO.Pipes.PipeTransmissionMode]::Byte,
    [System.IO.Pipes.PipeOptions]::Asynchronous, 65536, 65536, $pipeSecurity)
$process = $null
$job = [VectoraMcpJob]::Create()
$exitCode = 1
try {
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $vectoraExe
    $startInfo.Arguments = "--mcp-stdio --mcp-pipe=$pipeName --mcp-host-pid=$($hostProcess.Id)"
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.EnvironmentVariables['ELECTRON_NO_ATTACH_CONSOLE'] = '1'
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $process = [System.Diagnostics.Process]::Start($startInfo)
    try { [VectoraMcpJob]::Assign($job, $process.Handle) }
    catch { Stop-OwnedProcessTree $process; throw }
    # Runtime console noise must never enter the JSON-RPC output channel.
    $noiseCopy = $process.StandardOutput.BaseStream.CopyToAsync([System.IO.Stream]::Null)
    $diagnosticCopy = $process.StandardError.BaseStream.CopyToAsync([Console]::OpenStandardError())
    $connection = $pipe.WaitForConnectionAsync()
    $clock = [System.Diagnostics.Stopwatch]::StartNew()
    while (-not $connection.Wait(100)) {
        if ($hostProcess.HasExited) { throw 'MCP client exited during startup.' }
        if ($process.HasExited) { throw "Vectora exited before MCP connected (code $($process.ExitCode))." }
        if ($clock.Elapsed.TotalSeconds -gt 35) { throw 'Vectora MCP startup timed out.' }
    }
    [void]$connection.GetAwaiter().GetResult()
    $inputCopy = [Console]::OpenStandardInput().CopyToAsync($pipe)
    $outputCopy = $pipe.CopyToAsync([Console]::OpenStandardOutput())
    while (-not $process.WaitForExit(250)) {
        if ($hostProcess.HasExited -or $inputCopy.IsCompleted -or $outputCopy.IsCompleted) {
            $pipe.Dispose()
            if (-not $process.WaitForExit(5000)) { Stop-OwnedProcessTree $process }
            break
        }
    }
    if ($process.WaitForExit(5000)) { $exitCode = $process.ExitCode }
    else { [Console]::Error.WriteLine('Vectora MCP: shutdown timed out; closing owned job.') }
    try { [void][Threading.Tasks.Task]::WaitAll(@($noiseCopy, $diagnosticCopy), 2000) } catch {}
} catch {
    [Console]::Error.WriteLine("Vectora MCP: $($_.Exception.Message)")
} finally {
    $pipe.Dispose()
    if ($null -ne $process) {
        if (-not $process.HasExited) {
            if (-not $process.WaitForExit(5000)) { Stop-OwnedProcessTree $process }
        }
        $process.Dispose()
    }
    [void][VectoraMcpJob]::CloseHandle($job)
    $hostProcess.Dispose()
}
exit $exitCode
