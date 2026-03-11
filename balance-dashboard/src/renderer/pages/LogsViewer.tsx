import { useEffect, useState, useRef } from 'react'
import { RefreshCw, Trash2, Play, Square } from 'lucide-react'
import { balanceApi } from '../api/balanceApi'
import { useAppStore } from '../store/appStore'
import { cn } from '@/lib/utils'

type LogEntry = {
  eventId?: number
  level: string
  message: string
  timeGenerated?: string
  time?: string
  source?: string
}

const levelColors: Record<string, string> = {
  Error:       'text-red-500',
  Warning:     'text-yellow-500',
  Information: 'text-blue-400',
  Verbose:     'text-muted-foreground',
}

export function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [filterLevel, setFilterLevel] = useState('All')
  const bottomRef = useRef<HTMLDivElement>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const setStoreLogs = useAppStore(s => s.addLogs)

  const fetchRecent = async () => {
    setLoading(true)
    try {
      const res = await balanceApi.logs.getRecent({ newest: 100 })
      if (Array.isArray(res)) {
        setLogs(res as unknown as LogEntry[])
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const startStream = async () => {
    setStreaming(true)
    await balanceApi.logs.subscribe({ intervalMs: 3000 })
    if (unsubRef.current) unsubRef.current()
    unsubRef.current = balanceApi.logs.onNewEntries((payload: unknown) => {
      if (Array.isArray(payload)) {
        setLogs(prev => {
          const newEntries = payload as LogEntry[]
          const prevMap = new Map(prev.map(e => [`${e.timeGenerated || '-'}-${e.eventId || '-'}-${e.message}`, e]))
          newEntries.forEach(e => {
            prevMap.set(`${e.timeGenerated || '-'}-${e.eventId || '-'}-${e.message}`, e)
          })
          const merged = Array.from(prevMap.values()).sort((a, b) => {
            return new Date(b.timeGenerated || b.time || 0).getTime() - new Date(a.timeGenerated || a.time || 0).getTime()
          })
          return merged.slice(0, 500)
        })
        setStoreLogs(payload)
      }
    })
  }

  const stopStream = async () => {
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
    await balanceApi.logs.unsubscribe()
    setStreaming(false)
  }

  useEffect(() => {
    fetchRecent()
    return () => {
      if (unsubRef.current) unsubRef.current()
      balanceApi.logs.unsubscribe().catch(() => {})
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journaux (Logs)</h1>
          <p className="text-muted-foreground mt-2">
            Événements Windows générés par le service BalanceAgentService.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchRecent}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualiser
          </button>

          {streaming ? (
            <button
              onClick={stopStream}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium"
            >
              <Square className="w-4 h-4" /> Arrêter le flux
            </button>
          ) : (
            <button
              onClick={startStream}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Play className="w-4 h-4" /> Flux en direct
            </button>
          )}

          <button
            onClick={() => setLogs([])}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> Vider
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <input 
          type="text" 
          placeholder="Filtrer par texte..." 
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <select 
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="w-48 h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          <option value="All">Tous les niveaux</option>
          <option value="Error">Erreurs</option>
          <option value="Warning">Avertissements</option>
          <option value="Information">Informations</option>
        </select>
      </div>

      {streaming && (
        <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Flux en direct actif — rafraîchissement toutes les 3 secondes
        </div>
      )}

      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[60vh] font-mono text-sm">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {loading ? 'Chargement des journaux...' : 'Aucun journal disponible.'}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-44">Horodatage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-28">Niveau</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-24">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs
                  .filter(entry => filterLevel === 'All' || entry.level === filterLevel)
                  .filter(entry => !filterText || (entry.message && entry.message.toLowerCase().includes(filterText.toLowerCase())))
                  .map((entry, i) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatTime(entry.timeGenerated ?? entry.time ?? '')}</td>
                    <td className={cn("px-4 py-2.5 text-xs font-medium whitespace-nowrap", levelColors[entry.level] ?? 'text-foreground')}>{entry.level}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{entry.eventId}</td>
                    <td className="px-4 py-2.5 text-xs text-foreground max-w-md truncate" title={entry.message}>{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
