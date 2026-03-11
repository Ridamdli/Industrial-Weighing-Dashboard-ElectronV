import { create } from 'zustand'
import type { LogEntry } from '../../../electron/main/ipc/logHandlers'

export type ServiceState = 'running' | 'stopped' | 'unknown'

interface AppState {
  weight: number
  unit: string
  timestamp: string | null
  serviceState: ServiceState
  logs: LogEntry[]
  
  setWeight: (weight: number, unit: string, timestamp: string) => void
  setServiceState: (state: ServiceState) => void
  addLogs: (newLogs: LogEntry[]) => void
  clearLogs: () => void
}

export const useAppStore = create<AppState>((set) => ({
  weight: 0,
  unit: 'kg',
  timestamp: null,
  serviceState: 'unknown',
  logs: [],

  setWeight: (weight, unit, timestamp) => set({ weight, unit, timestamp }),
  setServiceState: (serviceState) => set({ serviceState }),
  addLogs: (newLogs) => set((state) => {
    // Keep max 1000 logs in memory to prevent memory leak
    const merged = [...newLogs, ...state.logs]
    return { logs: merged.slice(0, 1000) }
  }),
  clearLogs: () => set({ logs: [] }),
}))
