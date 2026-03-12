import fs from 'node:fs/promises'
import fsSync from 'node:fs'
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


async function cleanupDuplicates(dir: string, baseName: string) {
  try {
    const files = await fs.readdir(dir)
    const duplicates = files.filter(f => {
      const lower = f.toLowerCase()
      return (lower.startsWith('balance') || lower.startsWith('balence')) && lower.endsWith('.ini')
    })
    
    if (duplicates.length === 1 && duplicates[0] === baseName) return
    if (duplicates.length === 0) return

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
    const toDelete = stats.slice(1).map(s => s.path)
    
    let needsSudo = false
    
    for (const p of toDelete) {
        try {
            await fs.unlink(p)
        } catch(e: unknown) {
            const err = e as { code?: string }
            if (err?.code === 'EPERM' || err?.code === 'EACCES') needsSudo = true
        }
    }

    if (keep.file !== baseName) {
      const target = path.join(dir, baseName)
      try {
          await fs.rename(keep.path, target)
      } catch(e: unknown) {
          const err = e as { code?: string }
          if (err?.code === 'EPERM' || err?.code === 'EACCES') needsSudo = true
      }
    }
    
    if (needsSudo) {
        let script = ''
        for (const p of toDelete) {
            script += `Remove-Item -LiteralPath '${p}' -Force -ErrorAction SilentlyContinue\r\n`
        }
        if (keep.file !== baseName) {
            const target = path.join(dir, baseName)
            script += `Move-Item -LiteralPath '${keep.path}' -Destination '${target}' -Force\r\n`
        }
        if (script) {
            await sudoExec(script, 10000).catch(() => {})
        }
    }
  } catch {
    // ignore
  }
}


export async function readIniConfig(): Promise<IniReadResult> {
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
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const p = CONFIG_PATH
    let existingData: Record<string, unknown> = {}
    try {
      const { data: current } = await readIniConfig()
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
    try {
      if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true })
      }
    } catch {
      // ignore errors if the directory already exists or cannot be created here
    }
    
    await cleanupDuplicates(dir, 'balences.ini')

    // Write file using writeFileSync as specifically requested by user to reliably overwrite
    try {
      fsSync.writeFileSync(p, serialized, 'utf8')
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err?.code === 'EPERM' || err?.code === 'EACCES' || err?.code === 'EXDEV') {
        // Fallback to sudo if direct write fails
        const tmp = path.join(os.tmpdir(), `balance_ini_${Date.now()}.tmp`)
        fsSync.writeFileSync(tmp, serialized, 'utf8')
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

