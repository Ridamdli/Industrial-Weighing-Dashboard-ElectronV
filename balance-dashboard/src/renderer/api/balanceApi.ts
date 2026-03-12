// These are typed wrappers around the window.api IPC calls exposed by preload/index.ts
// This file is used in the React Renderer process.

export const balanceApi = {
  service: {
    status: () => window.api.service.status(),
    start: () => window.api.service.start(),
    stop: () => window.api.service.stop(),
    restart: () => window.api.service.restart(),
    install: () => window.api.service.install(),
  },
  config: {
    read: (configPath?: string) => window.api.config.read(configPath),
    write: (payload: { path: string; data: Record<string, unknown> }) => window.api.config.write(payload),
  },
  comPorts: {
    list: () => window.api.comPorts.list(),
    test: (payload: { path: string; baudRate?: number }) => window.api.comPorts.test(payload),
  },
  network: {
    getIps: () => window.api.network.getIps(),
  },
  balance: {
    getHealth: () => window.api.balance.getHealth(),
    getWeight: () => window.api.balance.getWeight(),
  },
  logs: {
    getRecent: (payload?: { newest?: number; source?: string }) => window.api.logs.getRecent(payload),
    subscribe: (payload?: { intervalMs?: number; source?: string }) => window.api.logs.subscribe(payload),
    unsubscribe: () => window.api.logs.unsubscribe(),
    onNewEntries: (listener: (payload: unknown) => void) => window.api.logs.onNewEntries(listener),
  },
  updater: {
    check: () => window.api.updater.check(),
    startDownload: () => window.api.updater.startDownload(),
    quitAndInstall: () => window.api.updater.quitAndInstall(),
    onCanAvailable: (listener: (payload: { update: boolean; version: string; newVersion?: string }) => void) => window.api.updater.onCanAvailable(listener),
    onError: (listener: (payload: { message?: string; error?: Error }) => void) => window.api.updater.onError(listener),
    onDownloadProgress: (listener: (payload: import('electron-updater').ProgressInfo) => void) => window.api.updater.onDownloadProgress(listener),
    onDownloaded: (listener: () => void) => window.api.updater.onDownloaded(listener),
  },
}
