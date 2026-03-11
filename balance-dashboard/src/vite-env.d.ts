/// <reference types="vite/client" />

interface Window {
  // exposed in `electron/preload/index.ts`
  api: {
    service: {
      status: () => Promise<{ state: 'running' | 'stopped' | 'unknown' }>
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
    demo: {
      onMainProcessMessage: (listener: (payload: string) => void) => () => void
    }
  }
}
