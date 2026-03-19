import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileAsync } from './exec'
import { sudoExec } from './sudoExec'

export type ServiceState = 'running' | 'stopped' | 'unknown'

const DEFAULT_CANDIDATE_NAMES = ['BalanceAgentService', 'BalenceAgentService'] as const

// Mutex to prevent overlapping operations
let isOperating = false

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

export async function startService(serviceName?: string, options: { bypassLock?: boolean } = {}): Promise<{ success: boolean; error?: string; name?: string }> {
  const { bypassLock = false } = options
  if (!bypassLock && isOperating) return { success: false, error: 'Une opération est déjà en cours. Veuillez patienter.' }
  
  const name = serviceName ?? (await detectServiceName())
  if (!name) return { success: false, error: 'Service introuvable.' }

  if (!bypassLock) isOperating = true
  try {
    const current = await getServiceStatus(name)
    if (current.state === 'running') {
      return { success: true, name }
    }

    await sudoExec(`sc.exe start "${name}"\r\n`, 20_000)
    
    // Briefly poll to confirm it actually started
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 1000))
        const status = await getServiceStatus(name)
        if (status.state === 'running') break
    }

    return { success: true, name }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { success: false, name, error: e.message || String(err) }
  } finally {
    if (!bypassLock) isOperating = false
  }
}


function parseServicePid(stdout: string): number | null {
  // sc queryex prints: "        PID                    : 12345"
  const m = stdout.match(/PID\s*:\s*(\d+)/i)
  const pid = m ? parseInt(m[1], 10) : null
  return pid && pid > 0 ? pid : null
}

export async function stopService(serviceName?: string, bypassLock = false): Promise<{ success: boolean; error?: string; name?: string }> {
  // If bypassLock is true, we assume the caller (like restartService) already holds the lock
  if (!bypassLock && isOperating) return { success: false, error: 'Une opération est déjà en cours. Veuillez patienter.' }

  const name = serviceName ?? (await detectServiceName())
  if (!name) return { success: false, error: 'Service introuvable.' }

  if (!bypassLock) isOperating = true
  try {
    const currentStatus = await getServiceStatus(name)
    if (currentStatus.state === 'stopped') {
      return { success: true, name } // Early exit
    }

    // Step 1: Get PID before we touch anything
    const queryEx = await execFileAsync('sc.exe', ['queryex', name], { timeoutMs: 10_000 })
    const pid = parseServicePid(queryEx.stdout)

    // Single comprehensive stop script (1 UAC Prompt)
    // 1. Reset failure actions
    // 2. Send stop command
    // 3. Wait gracefully
    // 4. Force kill if timed out
    // 5. Restore failure actions
    const stopScript =
      `sc.exe failure "${name}" reset= 0 actions= ""\r\n` +
      `sc.exe stop "${name}"\r\n` +
      `$waited = 0\r\n` +
      `$stopped = $false\r\n` +
      `while ($waited -lt 15) {\r\n` +
      `  Start-Sleep -Seconds 1\r\n` +
      `  $waited++\r\n` +
      `  $state = (sc.exe query "${name}" | Select-String "STATE").ToString()\r\n` +
      `  if ($state -match "STOPPED") { $stopped = $true; break }\r\n` +
      `}\r\n` +
      `if (-not $stopped) {\r\n` +
      (pid ? `  Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue\r\n` : '') +
      `  Get-Process -Name "BalanceAgentService" -ErrorAction SilentlyContinue | Stop-Process -Force\r\n` +
      `  Get-Process -Name "BalenceAgentService" -ErrorAction SilentlyContinue | Stop-Process -Force\r\n` +
      `}\r\n` +
      `sc.exe failure "${name}" reset= 86400 actions= restart/5000/restart/5000/restart/5000\r\n`

    try {
      await sudoExec(stopScript, 30_000)
    } catch (scriptErr) {
      console.error('[stopService] Stop script failed:', scriptErr)
      // Still check if service actually stopped despite script error
      const finalStatus = await getServiceStatus(name)
      if (finalStatus.state !== 'stopped') {
        const e = scriptErr as { message?: string }
        return { success: false, name, error: e.message || String(scriptErr) }
      }
    }
    return { success: true, name }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { success: false, name, error: e.message || String(err) }
  } finally {
    if (!bypassLock) isOperating = false
  }
}

export async function restartService(serviceName?: string): Promise<{ success: boolean; error?: string; name?: string }> {
  if (isOperating) return { success: false, error: 'Une opération est déjà en cours. Veuillez patienter.' }

  const name = serviceName ?? (await detectServiceName())
  if (!name) return { success: false, error: 'Service introuvable.' }

  isOperating = true
  try {
    const status = await getServiceStatus(name)
    
    // Only stop if it's actually running
    if (status.state === 'running' || status.state === 'unknown') {
      // Step 1: Get PID before we touch anything
      const queryEx = await execFileAsync('sc.exe', ['queryex', name], { timeoutMs: 10_000 })
      const pid = parseServicePid(queryEx.stdout)

      // Single comprehensive restart script (1 UAC Prompt)
      const restartScript =
        `sc.exe failure "${name}" reset= 0 actions= ""\r\n` +
        `sc.exe stop "${name}"\r\n` +
        `$waited = 0\r\n` +
        `$stopped = $false\r\n` +
        `while ($waited -lt 15) {\r\n` +
        `  Start-Sleep -Seconds 1\r\n` +
        `  $waited++\r\n` +
        `  $state = (sc.exe query "${name}" | Select-String "STATE").ToString()\r\n` +
        `  if ($state -match "STOPPED") { $stopped = $true; break }\r\n` +
        `}\r\n` +
        `if (-not $stopped) {\r\n` +
        (pid ? `  Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue\r\n` : '') +
        `  Get-Process -Name "BalanceAgentService" -ErrorAction SilentlyContinue | Stop-Process -Force\r\n` +
        `  Get-Process -Name "BalenceAgentService" -ErrorAction SilentlyContinue | Stop-Process -Force\r\n` +
        `}\r\n` +
        `sc.exe failure "${name}" reset= 86400 actions= restart/5000/restart/5000/restart/5000\r\n` +
        `Start-Sleep -Seconds 1\r\n` +
        `sc.exe start "${name}"\r\n`

      await sudoExec(restartScript, 40_000)

      // Briefly poll to confirm it actually restarted
      for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000))
          const current = await getServiceStatus(name)
          if (current.state === 'running') break
      }
    } else {
      // If stopped, just start it natively (1 UAC Prompt)
      const start = await startService(name, { bypassLock: true })
      if (!start.success) return start
    }

    return { success: true, name }
  } catch (err: unknown) {
    const e = err as { message?: string }
    return { success: false, name, error: e.message || String(err) }
  } finally {
    isOperating = false
  }
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

