import { create } from 'zustand'
import type { LogEntry } from '../../../electron/main/ipc/logHandlers'

export type ServiceState = 'running' | 'stopped' | 'unknown'
export type ApiStatus = 'connected' | 'idle' | 'disconnected' | 'error'
export type ServicePendingAction = 'starting' | 'stopping' | 'restarting' | null

interface AppState {
  weight: number
  unit: string
  timestamp: string | null
  serviceState: ServiceState
  servicePendingAction: ServicePendingAction
  apiStatus: ApiStatus
  apiError: string | null
  logs: LogEntry[]
  isSetupCompleted: boolean
  
  setWeight: (weight: number, unit: string, timestamp: string) => void
  setServiceState: (state: ServiceState) => void
  setServicePendingAction: (action: ServicePendingAction) => void
  setApiState: (status: ApiStatus, error?: string | null) => void
  addLogs: (newLogs: LogEntry[]) => void
  clearLogs: () => void
  setSetupCompleted: (completed: boolean) => void
}

const safeGetSetupCompleted = (): boolean => {
  try {
    return localStorage.getItem('isSetupCompleted') === 'true'
  } catch (error) {
    console.warn('[useAppStore] localStorage read failed for isSetupCompleted:', error)
    return false
  }
}

export const useAppStore = create<AppState>((set) => ({
  weight: 0,
  unit: 'kg',
  timestamp: null,
  serviceState: 'unknown',
  servicePendingAction: null,
  apiStatus: 'disconnected',
  apiError: null,
  logs: [],
  isSetupCompleted: safeGetSetupCompleted(),

  setWeight: (weight, unit, timestamp) => set({ weight, unit, timestamp }),
  setServiceState: (serviceState) => set({ serviceState }),
  setServicePendingAction: (action) => set({ servicePendingAction: action }),
  setApiState: (apiStatus, apiError = null) => set({ apiStatus, apiError }),
  addLogs: (newLogs) => set((state) => {
    // Keep max 1000 logs in memory to prevent memory leak
    const merged = [...newLogs, ...state.logs]
    return { logs: merged.slice(0, 1000) }
  }),
  clearLogs: () => set({ logs: [] }),
  setSetupCompleted: (completed) => {
    try {
      localStorage.setItem('isSetupCompleted', completed.toString())
    } catch (error) {
      // persistent storage may not be available in some contexts (e.g. private mode)
      console.warn('[setSetupCompleted] localStorage persistence failed:', error)
    }
    set({ isSetupCompleted: completed })
  },
}))
