import { ipcRenderer, contextBridge } from 'electron'
import { IPC_CHANNELS } from '../../src/shared/ipcChannels'

type Listener<T = unknown> = (payload: T) => void

function on<T = unknown>(channel: string, listener: Listener<T>) {
  const wrapped = (_event: Electron.IpcRendererEvent, payload: T) => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.off(channel, wrapped)
}

contextBridge.exposeInMainWorld('api', {
  service: {
    status: () => ipcRenderer.invoke(IPC_CHANNELS.service.status),
    start: () => ipcRenderer.invoke(IPC_CHANNELS.service.start),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.service.stop),
    restart: () => ipcRenderer.invoke(IPC_CHANNELS.service.restart),
    install: () => ipcRenderer.invoke(IPC_CHANNELS.service.install),
  },
  config: {
    read: (configPath?: string) => ipcRenderer.invoke(IPC_CHANNELS.config.read, configPath),
    write: (payload: { path: string; data: Record<string, unknown> }) => ipcRenderer.invoke(IPC_CHANNELS.config.write, payload),
  },
  network: {
    getIps: () => ipcRenderer.invoke(IPC_CHANNELS.network.getIps),
  },
  comPorts: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.comPorts.list),
    test: (payload: { path: string; baudRate?: number }) => ipcRenderer.invoke(IPC_CHANNELS.comPorts.test, payload),
  },
  balance: {
    getHealth: () => ipcRenderer.invoke(IPC_CHANNELS.balance.getHealth),
    getWeight: () => ipcRenderer.invoke(IPC_CHANNELS.balance.getWeight),
  },
  logs: {
    getRecent: (payload?: { newest?: number; source?: string }) => ipcRenderer.invoke(IPC_CHANNELS.logs.getRecent, payload),
    subscribe: (payload?: { intervalMs?: number; source?: string }) => ipcRenderer.invoke(IPC_CHANNELS.logs.subscribe, payload),
    unsubscribe: () => ipcRenderer.invoke(IPC_CHANNELS.logs.unsubscribe),
    onNewEntries: (listener: Listener<unknown>) => on(IPC_CHANNELS.logs.newEntries, listener),
  },
  updater: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.updater.check),
    startDownload: () => ipcRenderer.invoke(IPC_CHANNELS.updater.startDownload),
    quitAndInstall: () => ipcRenderer.invoke(IPC_CHANNELS.updater.quitAndInstall),
    onCanAvailable: (listener: Listener<{ update: boolean; version: string; newVersion?: string }>) =>
      on(IPC_CHANNELS.updater.canAvailable, listener),
    onError: (listener: Listener<ErrorType>) =>
      on(IPC_CHANNELS.updater.error, listener),
    onDownloadProgress: (listener: Listener<import('electron-updater').ProgressInfo>) =>
      on(IPC_CHANNELS.updater.downloadProgress, listener),
    onDownloaded: (listener: Listener<void>) =>
      on(IPC_CHANNELS.updater.downloaded, listener),
  },
  history: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.history.get),
    add: (record: unknown) => ipcRenderer.invoke(IPC_CHANNELS.history.add, record),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.history.clear),
    export: () => ipcRenderer.invoke(IPC_CHANNELS.history.export),
  },
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function createLoadingOverlay() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = createLoadingOverlay()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  if (ev.data?.payload === 'removeLoading') {
    removeLoading()
  }
}

setTimeout(removeLoading, 4999)