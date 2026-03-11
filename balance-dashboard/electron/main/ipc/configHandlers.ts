import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/ipcChannels'
import { detectDefaultConfigPath, readIniConfig, writeIniConfig } from '../utils/iniConfig'

export function registerConfigHandlers() {
  ipcMain.handle(IPC_CHANNELS.config.read, async (_evt, configPath?: string) => {
    const p = configPath ?? (await detectDefaultConfigPath())
    return await readIniConfig(p)
  })

  ipcMain.handle(IPC_CHANNELS.config.write, async (_evt, payload: { path?: string; data: Record<string, unknown> }) => {
    const p = (payload.path && payload.path.trim() !== '') ? payload.path : (await detectDefaultConfigPath())
    return await writeIniConfig(p, payload.data)
  })
}

