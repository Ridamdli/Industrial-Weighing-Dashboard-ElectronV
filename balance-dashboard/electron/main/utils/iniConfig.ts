import fs from 'node:fs/promises'
import path from 'node:path'
import ini from 'ini'

export type IniReadResult = {
  path: string
  raw: string
  data: Record<string, unknown>
}

const DEFAULT_CONFIG_PATHS = [
  'C:\\Windows\\SysWOW64\\balance.ini',
  'C:\\Windows\\SysWOW64\\balances.ini',
]

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function detectDefaultConfigPath(): Promise<string> {
  // 1. Check standard system paths
  for (const p of DEFAULT_CONFIG_PATHS) {
    if (await fileExists(p)) return p
  }

  // 2. Check bundled resources (production)
  const resourcesPath = (process as unknown as { resourcesPath: string }).resourcesPath
  if (resourcesPath) {
    const bundledPath = path.join(resourcesPath, 'balances.ini')
    if (await fileExists(bundledPath)) return bundledPath
  }

  // 3. Fallback to app-local working dir (dev)
  // Check for both balance.ini and balances.ini
  const devPath = path.join(process.cwd(), 'balances.ini')
  if (await fileExists(devPath)) return devPath
  
  return path.join(process.cwd(), 'balance.ini')
}

export async function readIniConfig(configPath?: string): Promise<IniReadResult> {
  const p = configPath ?? (await detectDefaultConfigPath())
  const raw = await fs.readFile(p, 'utf8')
  const data = ini.parse(raw) as Record<string, unknown>
  return { path: p, raw, data }
}

export async function writeIniConfig(
  configPath: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const serialized = ini.stringify(data as Record<string, unknown>)
    const dir = path.dirname(configPath)
    const base = path.basename(configPath)
    const tmp = path.join(dir, `${base}.tmp`)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(tmp, serialized, 'utf8')
    await fs.rename(tmp, configPath)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

