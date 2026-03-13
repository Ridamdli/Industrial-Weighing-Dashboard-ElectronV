import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../src/shared/ipcChannels'
import { historyManager, BalanceRecord } from '../utils/historyManager'

export function registerHistoryHandlers() {
  ipcMain.handle(IPC_CHANNELS.history.get, async () => {
    return await historyManager.getRecords()
  })

  ipcMain.handle(IPC_CHANNELS.history.add, async (_event, record: Omit<BalanceRecord, 'id'>) => {
    return await historyManager.addRecord(record)
  })

  ipcMain.handle(IPC_CHANNELS.history.clear, async () => {
    return await historyManager.clearRecords()
  })

  ipcMain.handle(IPC_CHANNELS.history.export, async () => {
    return await historyManager.exportToCsv()
  })
}
