/// <reference types="vite/client" />

interface Window {
  // exposed in `electron/preload/index.ts`
  api: {
    service: {
      status: () => Promise<{ state: 'running' | 'stopped' | 'unknown' }>
      start: () => Promise<{ success: boolean; error?: string; name?: string }>
      stop: () => Promise<{ success: boolean; error?: string; name?: string }>
      restart: () => Promise<{ success: boolean; error?: string; name?: string }>
      install: () => Promise<{ success: boolean; error?: string }>
    }
    config: {
      read: (configPath?: string) => Promise<{ path: string; raw: string; data: Record<string, unknown> }>
      write: (payload: { path: string; data: Record<string, unknown> }) => Promise<{ success: boolean; error?: string }>
    }
    comPorts: {
      list: () => Promise<Array<{ path: string; manufacturer?: string; serialNumber?: string; pnpId?: string; vendorId?: string; productId?: string; friendlyName?: string }>>
      test: (payload: { path: string; baudRate?: number }) => Promise<{ success: boolean; error?: string }>
    }
    balance: {
      getHealth: () => Promise<{ ok: boolean; status: number; body: unknown }>
      getWeight: () => Promise<{ ok: boolean; status: number; body: unknown }>
    }
    logs: {
      getRecent: (payload?: { newest?: number; source?: string }) => Promise<Array<{ time: string; level: string; source?: string; message: string }>>
      subscribe: (payload?: { intervalMs?: number; source?: string }) => Promise<{ success: boolean; error?: string }>
      unsubscribe: () => Promise<{ success: boolean }>
      onNewEntries: (listener: (payload: unknown) => void) => () => void
    }
    updater: {
      check: () => Promise<unknown>
      startDownload: () => Promise<unknown>
      quitAndInstall: () => Promise<unknown>
      onCanAvailable: (listener: (payload: VersionInfo) => void) => () => void
      onError: (listener: (payload: ErrorType) => void) => () => void
      onDownloadProgress: (listener: (payload: import('electron-updater').ProgressInfo) => void) => () => void
      onDownloaded: (listener: () => void) => () => void
    }
  }
}
