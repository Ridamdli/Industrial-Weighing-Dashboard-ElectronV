import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/ipcChannels'
import { fetchWithTimeout } from '../utils/http'
import { readIniConfig } from '../utils/iniConfig'

type ApiSettings = {
  host: string
  port: number
  timeoutMs: number
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function getApiSettingsFromIni(data: Record<string, unknown>): ApiSettings {
  const api = data.api
  if (!api || typeof api !== 'object') {
    throw new Error('Missing [api] section in balance.ini')
  }
  const apiObj = api as Record<string, unknown>

  const host = apiObj.host
  const port = toNumber(apiObj.port)
  const timeoutMs = toNumber(apiObj.timeout) ?? 3000

  if (typeof host !== 'string' || host.trim() === '') {
    throw new Error('Missing api.host in balance.ini')
  }
  if (port == null || port <= 0) {
    throw new Error('Missing or invalid api.port in balance.ini')
  }

  return { host: host.trim(), port, timeoutMs }
}

async function getBaseUrlAndTimeout(): Promise<{ baseUrl: string; timeoutMs: number }> {
  const { data } = await readIniConfig()
  const { host, port, timeoutMs } = getApiSettingsFromIni(data)
  return { baseUrl: `http://${host}:${port}`, timeoutMs }
}

async function getJson(url: string, timeoutMs: number) {
  const res = await fetchWithTimeout(url, { timeoutMs })
  const contentType = res.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await res.json() : await res.text()
  return { ok: res.ok, status: res.status, body }
}

export function registerApiHandlers() {
  ipcMain.handle(IPC_CHANNELS.balance.getHealth, async () => {
    try {
      const { baseUrl, timeoutMs } = await getBaseUrlAndTimeout()
      return await getJson(`${baseUrl}/api/health`, timeoutMs)
    } catch (e) {
      return { ok: false, status: 0, body: { message: e instanceof Error ? e.message : String(e) } }
    }
  })

  ipcMain.handle(IPC_CHANNELS.balance.getWeight, async () => {
    try {
      const { baseUrl, timeoutMs } = await getBaseUrlAndTimeout()
      return await getJson(`${baseUrl}/api/balance/reception`, timeoutMs)
    } catch (e) {
      return { ok: false, status: 0, body: { message: e instanceof Error ? e.message : String(e) } }
    }
  })
}

