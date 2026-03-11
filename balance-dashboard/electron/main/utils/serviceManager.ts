import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileAsync } from './exec'

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

  const res = await execFileAsync('sc.exe', ['start', name], { timeoutMs: 20_000 })
  if (res.exitCode !== 0) return { success: false, name, error: (res.stderr || res.stdout).trim() || 'Failed to start service' }
  return { success: true, name }
}

export async function stopService(serviceName?: string): Promise<{ success: boolean; error?: string; name?: string }> {
  const name = serviceName ?? (await detectServiceName())
  if (!name) return { success: false, error: 'Service not found' }

  const res = await execFileAsync('sc.exe', ['stop', name], { timeoutMs: 20_000 })
  if (res.exitCode !== 0) return { success: false, name, error: (res.stderr || res.stdout).trim() || 'Failed to stop service' }
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

