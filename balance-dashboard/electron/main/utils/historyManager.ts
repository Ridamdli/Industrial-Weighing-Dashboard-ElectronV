import { app, dialog } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

export interface BalanceRecord {
  id: string
  balanceName: string
  weight: number
  unit: string
  timestamp: string
}

const HISTORY_FILE = path.join(app.getPath('userData'), 'balance_history.json')

export const historyManager = {
  async getRecords(): Promise<BalanceRecord[]> {
    try {
      if (!existsSync(HISTORY_FILE)) return []
      const raw = await fs.readFile(HISTORY_FILE, 'utf8')
      return JSON.parse(raw)
    } catch (error) {
      console.error('Error reading history file:', error)
      return []
    }
  },

  async addRecord(record: Omit<BalanceRecord, 'id'>): Promise<BalanceRecord | null> {
    try {
      const records = await this.getRecords()
      
      // Prevent duplicates based on timestamp and balanceName
      const isDuplicate = records.some(r => r.timestamp === record.timestamp && r.balanceName === record.balanceName)
      if (isDuplicate) return null

      const newRecord: BalanceRecord = {
        ...record,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
      }

      // Add to beginning (append on top)
      const updatedRecords = [newRecord, ...records]
      await fs.writeFile(HISTORY_FILE, JSON.stringify(updatedRecords, null, 2), 'utf8')
      return newRecord
    } catch (error) {
      console.error('Error adding record:', error)
      throw error
    }
  },

  async clearRecords(): Promise<void> {
    try {
      if (existsSync(HISTORY_FILE)) {
        await fs.unlink(HISTORY_FILE)
      }
    } catch (error) {
      console.error('Error clearing history:', error)
      throw error
    }
  },

  async exportToCsv(): Promise<boolean> {
    try {
      const records = await this.getRecords()
      if (records.length === 0) return false

      const { filePath } = await dialog.showSaveDialog({
        title: 'Exporter les enregistrements',
        defaultPath: path.join(app.getPath('documents'), 'balance_history.csv'),
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      })

      if (!filePath) return false

      const header = 'ID,Balance,Weight,Unit,Timestamp\n'
      const rows = records.map(r => 
        `"${r.id}","${r.balanceName}","${r.weight}","${r.unit}","${r.timestamp}"`
      ).join('\n')

      await fs.writeFile(filePath, header + rows, 'utf8')
      return true
    } catch (error) {
      console.error('Error exporting CSV:', error)
      return false
    }
  }
}
