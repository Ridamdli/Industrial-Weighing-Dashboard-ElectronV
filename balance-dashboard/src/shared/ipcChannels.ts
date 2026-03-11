export const IPC_CHANNELS = {
  service: {
    start: 'service:start',
    stop: 'service:stop',
    restart: 'service:restart',
    install: 'service:install',
    status: 'service:status',
  },
  config: {
    read: 'config:read',
    write: 'config:write',
  },
  comPorts: {
    list: 'comPorts:list',
    test: 'comPorts:test',
  },
  balance: {
    getWeight: 'balance:getWeight',
    getHealth: 'balance:getHealth',
  },
  logs: {
    subscribe: 'logs:subscribe',
    unsubscribe: 'logs:unsubscribe',
    getRecent: 'logs:getRecent',
    newEntries: 'logs:new-entries',
  },
  updater: {
    check: 'updater:check',
    startDownload: 'updater:start-download',
    quitAndInstall: 'updater:quit-and-install',
    canAvailable: 'updater:can-available',
    error: 'updater:error',
    downloadProgress: 'updater:download-progress',
    downloaded: 'updater:downloaded',
  },
  demo: {
    mainProcessMessage: 'main-process-message',
  },
} as const

export type IpcChannel =
  (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS][keyof (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]]

