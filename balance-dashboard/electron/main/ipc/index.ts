import type { BrowserWindow } from 'electron'
import { registerApiHandlers } from './apiHandlers'
import { registerComPortHandlers } from './comPortHandlers'
import { registerConfigHandlers } from './configHandlers'
import { registerLogHandlers } from './logHandlers'
import { registerServiceHandlers } from './serviceHandlers'

export function registerIpcHandlers(getWindow: () => BrowserWindow | null) {
  registerServiceHandlers()
  registerConfigHandlers()
  registerComPortHandlers()
  registerApiHandlers()
  registerLogHandlers(getWindow)
}

