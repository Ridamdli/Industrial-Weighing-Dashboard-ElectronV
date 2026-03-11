import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/ipcChannels'
import { listComPorts, testComPort } from '../utils/comPorts'

export function registerComPortHandlers() {
  ipcMain.handle(IPC_CHANNELS.comPorts.list, async () => listComPorts())
  ipcMain.handle(IPC_CHANNELS.comPorts.test, async (_evt, payload: { path: string; baudRate?: number }) =>
    testComPort(payload.path, { baudRate: payload.baudRate }),
  )
}

