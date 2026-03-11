import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileAsync } from './exec'
import { sudoExec } from './sudoExec'

export type ServiceState = 'running' | 'stopped' | 'unknown'

const DEFAULT_CANDIDATE_NAMES = ['BalanceAgentService', 'BalenceAgentService'] as const

function parseScQueryState(stdout: string): ServiceState {
  // Example line: "        STATE              : 4  RUNNING"
  const m = stdout.match(/STATE\s*:\s*\d+\s+(\w+)/i)
  const raw = m?.[1]?.toLowerCase()
  if (!raw) return 'unknown'
  if (raw === 'running') return 'running'
  if (raw === 'stopped') return 'stopped'
  return 'unknown'
}
async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}
export async function serviceExists(serviceName: string): Promise<boolean> {
  const res = await execFileAsync('sc.exe', ['query', serviceName], { timeoutMs: 10_000 })
  // When it doesn't exist, sc prints "FAILED 1060".
  if (res.stdout.includes('FAILED 1060') || res.stderr.includes('FAILED 1060')) return false
  return res.exitCode === 0
}

export async function detectServiceName(): Promise<string | null> {
  for (const name of DEFAULT_CANDIDATE_NAMES) {
    if (await serviceExists(name)) return name
  }
  return null
}

export async function getServiceStatus(serviceName?: string): Promise<{ name?: string; state: ServiceState }> {
  const name = serviceName ?? (await detectServiceName())
  if (!name) return { state: 'unknown' }

  const res = await execFileAsync('sc.exe', ['query', name], { timeoutMs: 10_000 })
  if (res.exitCode !== 0) return { name, state: 'unknown' }
  return { name, state: parseScQueryState(res.stdout) }
}

export async function startService(serviceName?: string): Promise<{ success: boolean; error?: string; name?: string }> {
  const name = serviceName ?? (await detectServiceName())
  if (!name) return { success: false, error: 'Service not found' }

  try {
    await sudoExec(`sc.exe start "${name}"\r\n`, 20_000)
    return { success: true, name }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { success: false, name, error: e.message || String(err) }
  }
}


function parseServicePid(stdout: string): number | null {
  // sc queryex prints: "        PID                    : 12345"
  const m = stdout.match(/PID\s*:\s*(\d+)/i)
  const pid = m ? parseInt(m[1], 10) : null
  return pid && pid > 0 ? pid : null
}

export async function stopService(serviceName?: string): Promise<{ success: boolean; error?: string; name?: string }> {
  const name = serviceName ?? (await detectServiceName())
  if (!name) return { success: false, error: 'Service not found' }

  // Step 1: Get PID before we touch anything
  const queryEx = await execFileAsync('sc.exe', ['queryex', name], { timeoutMs: 10_000 })
  const pid = parseServicePid(queryEx.stdout)

  // Step 2: Disable auto-restart so if we later need to kill, Windows won't restart it
  // This is a fast operation (<1s)
  await sudoExec(
    `sc.exe failure "${name}" reset= 0 actions= ""\r\n`,
    8_000
  ).catch(() => {}) // Ignore if this fails (maybe already stopped)

  // Step 3: Send graceful stop signal WITH elevation + wait up to 60 seconds
  // This matches how services.msc works (it also waits indefinitely)
  const stopScript =
    `sc.exe stop "${name}"\r\n` +
    `$waited = 0\r\n` +
    `while ($waited -lt 60) {\r\n` +
    `  Start-Sleep -Seconds 1\r\n` +
    `  $waited++\r\n` +
    `  $state = (sc.exe query "${name}" | Select-String "STATE").ToString()\r\n` +
    `  if ($state -match "STOPPED") { break }\r\n` +
    `}\r\n`

  await sudoExec(stopScript, 75_000).catch(() => {})

  // Step 4: Check if it actually stopped
  const afterStop = await getServiceStatus(name)
  if (afterStop.state === 'stopped') {
    // Re-enable auto-restart now that we stopped gracefully
    await sudoExec(
      `sc.exe failure "${name}" reset= 86400 actions= restart/5000/restart/5000/restart/5000\r\n`,
      8_000
    ).catch(() => {})
    return { success: true, name }
  }

  // Step 5: Graceful stop timed out — force kill by PID (restart is already disabled)
  if (pid) {
    await sudoExec(
      `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue\r\n` +
      `Get-Process -Name "BalanceAgentService" -ErrorAction SilentlyContinue | Stop-Process -Force\r\n` +
      `Get-Process -Name "BalenceAgentService" -ErrorAction SilentlyContinue | Stop-Process -Force\r\n`,
      10_000
    ).catch(() => {})
  }

  // Restore restart policy
  await sudoExec(
    `sc.exe failure "${name}" reset= 86400 actions= restart/5000/restart/5000/restart/5000\r\n`,
    8_000
  ).catch(() => {})

  return { success: true, name }
}

export async function restartService(serviceName?: string): Promise<{ success: boolean; error?: string; name?: string }> {
  const name = serviceName ?? (await detectServiceName())
  if (!name) return { success: false, error: 'Service not found' }

  const stop = await stopService(name)
  if (!stop.success) return stop

  const start = await startService(name)
  if (!start.success) return start

  return { success: true, name }
}

export async function installService(): Promise<{ success: boolean; error?: string }> {
  try {
    const resourcesPath = (process as unknown as { resourcesPath: string }).resourcesPath
    if (!resourcesPath) return { success: false, error: 'Resources path not found' }

    const batPath = path.join(resourcesPath, 'install.bat')
    // Check if it exists in resources
    try {
      await fs.access(batPath)
    } catch {
      // If not in resources, check dev root (useful for local testing if copied)
      const devPath = path.join(process.cwd(), 'install.bat')
      await fs.access(devPath)
      // If we reach here, it exists in dev path
    }

    const targetBat = (await fileExists(batPath)) ? batPath : path.join(process.cwd(), 'install.bat')
    
    // Execute the batch file. Using cmd.exe /c to run the .bat
    const res = await execFileAsync('cmd.exe', ['/c', targetBat], { timeoutMs: 30_000 })
    
    if (res.exitCode !== 0) {
      return { success: false, error: (res.stderr || res.stdout).trim() || `Exit code ${res.exitCode}` }
    }
    
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

