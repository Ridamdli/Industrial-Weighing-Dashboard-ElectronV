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
}
