import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/ipcChannels'
import { readIniConfig, writeIniConfig } from '../utils/iniConfig'

export function registerConfigHandlers() {
  ipcMain.handle(IPC_CHANNELS.config.read, async (_evt, configPath?: string) => {
    return await readIniConfig(configPath)
  })

  ipcMain.handle(IPC_CHANNELS.config.write, async (_evt, payload: { path?: string; data: Record<string, unknown> }) => {
    return await writeIniConfig(payload.path || '', payload.data)
  })
}

