import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/ipcChannels'
import { execFileAsync } from '../utils/exec'

export type LogEntry = {
  time: string
  level: 'Information' | 'Warning' | 'Error' | 'Unknown'
  source?: string
  message: string
}

function toLevel(entryType?: string): LogEntry['level'] {
  const v = (entryType ?? '').toLowerCase()
  if (v.includes('error')) return 'Error'
  if (v.includes('warn')) return 'Warning'
  if (v.includes('information') || v.includes('info')) return 'Information'
  return 'Unknown'
}

async function getRecentLogs(opts?: { newest?: number; source?: string }): Promise<LogEntry[]> {
  const newest = opts?.newest ?? 100
  const source = opts?.source ?? 'BalanceAgentService'

  // Use Get-EventLog for compatibility with Windows PowerShell on runners.
  const script = [
    `$ErrorActionPreference = 'Stop'`,
    `$items = Get-EventLog -LogName Application -Newest ${newest} -Source '${source}'`,
    `$items | Select-Object TimeGenerated, EntryType, Source, Message | ConvertTo-Json -Depth 3`,
  ].join('; ')

  const res = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { timeoutMs: 20_000 })
  if (res.exitCode !== 0) return []

  try {
    const parsed = JSON.parse(res.stdout)
    const items = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
    return items.map((i: unknown) => {
      const obj = i as Record<string, unknown>
      return {
        time: String(obj.TimeGenerated ?? ''),
        level: toLevel(typeof obj.EntryType === 'string' ? obj.EntryType : undefined),
        source: obj.Source ? String(obj.Source) : undefined,
        message: String(obj.Message ?? ''),
      }
    })
  } catch {
    return []
  }
}

type Subscription = {
  timer: NodeJS.Timeout
  lastFingerprint: string | null
  winId: number
}

const subscriptions = new Map<number, Subscription>()

function fingerprint(entry: LogEntry): string {
  return `${entry.time}::${entry.level}::${entry.source ?? ''}::${entry.message}`
}

export function registerLogHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle(IPC_CHANNELS.logs.getRecent, async (_evt, payload?: { newest?: number; source?: string }) => {
    return await getRecentLogs(payload)
  })

  ipcMain.handle(IPC_CHANNELS.logs.subscribe, async (_evt, payload?: { intervalMs?: number; source?: string }) => {
    const win = getWindow()
    if (!win) return { success: false, error: 'No window' }

    const winId = win.id
    const intervalMs = Math.max(1000, payload?.intervalMs ?? 3000)
    const source = payload?.source

    const existing = subscriptions.get(winId)
    if (existing) {
      clearInterval(existing.timer)
      subscriptions.delete(winId)
    }

    const sub: Subscription = {
      winId,
      lastFingerprint: null,
      timer: setInterval(async () => {
        const w = getWindow()
        if (!w || w.id !== winId) return

        const recent = await getRecentLogs({ newest: 25, source })
        if (!recent.length) return

        const newestEntry = recent[0]
        const newestFp = fingerprint(newestEntry)
        if (sub.lastFingerprint === newestFp) return

        sub.lastFingerprint = newestFp
        w.webContents.send(IPC_CHANNELS.logs.newEntries, recent)
      }, intervalMs),
    }

    subscriptions.set(winId, sub)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.logs.unsubscribe, async () => {
    const win = getWindow()
    if (!win) return { success: true }
    const existing = subscriptions.get(win.id)
    if (existing) {
      clearInterval(existing.timer)
      subscriptions.delete(win.id)
    }
    return { success: true }
  })
}

