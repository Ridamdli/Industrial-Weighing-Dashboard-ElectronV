import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/ipcChannels'
import {
  getServiceStatus,
  installService,
  restartService,
  startService,
  stopService,
} from '../utils/serviceManager'

export function registerServiceHandlers() {
  ipcMain.handle(IPC_CHANNELS.service.status, async () => getServiceStatus())
  ipcMain.handle(IPC_CHANNELS.service.start, async () => startService())
  ipcMain.handle(IPC_CHANNELS.service.stop, async () => stopService())
  ipcMain.handle(IPC_CHANNELS.service.restart, async () => restartService())
  ipcMain.handle(IPC_CHANNELS.service.install, async () => installService())
}

