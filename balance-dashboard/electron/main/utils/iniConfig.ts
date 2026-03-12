import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import ini from 'ini'
import { sudoExec } from './sudoExec'

export type IniReadResult = {
  path: string
  raw: string
  data: Record<string, unknown>
}

const CONFIG_PATH = 'C:\\Windows\\SysWOW64\\balences.ini'

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function cleanupDuplicates(dir: string, baseName: string) {
  try {
    const files = await fs.readdir(dir)
    const duplicates = files.filter(f => f.startsWith('balences') && f.endsWith('.ini'))
    
    if (duplicates.length <= 1) return

    const stats = await Promise.all(
      duplicates.map(async f => {
        const fullPath = path.join(dir, f)
        const stat = await fs.stat(fullPath)
        return { file: f, path: fullPath, mtimeMs: stat.mtimeMs }
      })
    )

    // Sort descending by modified time
    stats.sort((a, b) => b.mtimeMs - a.mtimeMs)
    
    // Keep the first (most recent), rename to standard name if needed, delete others
    const keep = stats[0]
    for (let i = 1; i < stats.length; i++) {
        await fs.unlink(stats[i].path).catch(() => {})
    }

    if (keep.file !== baseName) {
      await fs.rename(keep.path, path.join(dir, baseName)).catch(() => {})
    }
  } catch {
    // ignore
  }
}


export async function readIniConfig(configPath?: string): Promise<IniReadResult> {
  const p = CONFIG_PATH
  const dir = path.dirname(p)
  await cleanupDuplicates(dir, 'balences.ini')
  
  try {
    const raw = await fs.readFile(p, 'utf8')
    const data = ini.parse(raw) as Record<string, unknown>
    return { path: p, raw, data }
  } catch {
    return { path: p, raw: '', data: {} }
  }
}

export async function writeIniConfig(
  configPath: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const p = CONFIG_PATH
    let existingData: Record<string, unknown> = {}
    try {
      const { data: current } = await readIniConfig(p)
      existingData = current
    } catch {
      // ignore
    }

    const mergedData = { ...existingData }
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
        mergedData[key] = { ...(existingData[key] as Record<string, unknown> || {}), ...(data[key] as Record<string, unknown>) }
      } else {
        mergedData[key] = data[key]
      }
    }

    const serialized = ini.stringify(mergedData as Record<string, unknown>)
    const dir = path.dirname(p)
    await fs.mkdir(dir, { recursive: true }).catch(() => {})
    
    await cleanupDuplicates(dir, 'balences.ini')

    // Write file
    try {
      await fs.writeFile(p, serialized, 'utf8')
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err?.code === 'EPERM' || err?.code === 'EACCES' || err?.code === 'EXDEV') {
        // Fallback to sudo if direct write fails
        const tmp = path.join(os.tmpdir(), `balance_ini_${Date.now()}.tmp`)
        await fs.writeFile(tmp, serialized, 'utf8')
        const cmd = `move /y "${path.normalize(tmp)}" "${path.normalize(p)}"`
        await sudoExec(cmd)
      } else {
        throw e
      }
    }
    
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

