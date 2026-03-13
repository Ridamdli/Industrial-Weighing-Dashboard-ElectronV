import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  RefreshCw, 
  Trash2, 
  Download, 
  Search, 
  Weight, 
  Settings2,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react'
import { balanceApi } from '../api/balanceApi'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Record {
  id: string
  balanceName: string
  weight: number
  unit: string
  timestamp: string
}

type SortField = 'timestamp' | 'weight'
type SortOrder = 'asc' | 'desc'

export function BalanceHistoryTable() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(false)
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(5) // seconds
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [lastFetchStatus, setLastFetchStatus] = useState<{ ok: boolean; message: string } | null>(null)

  // Initial load
  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const data = await balanceApi.history.get()
      setRecords(data)
    } catch (error) {
      console.error('Error loading records:', error)
    }
  }

  const fetchNewData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await balanceApi.balance.getWeight() as { 
        ok: boolean; 
        body: { 
          weight?: number; 
          poids?: number; 
          unit?: string; 
          unite?: string; 
          timestemp?: string; 
          timestamp?: string;
          balanceName?: string;
        } 
      }
      if (result.ok && result.body) {
        const body = result.body
        const weight = body.weight ?? body.poids ?? 0
        const unit = body.unit ?? body.unite ?? 'kg'
        const timestamp = body.timestemp ?? body.timestamp ?? new Date().toISOString()
        const balanceName = body.balanceName ?? 'reception'

        const newRecord = {
          balanceName,
          weight: Number(weight),
          unit,
          timestamp
        }

        const saved = await balanceApi.history.add(newRecord)
        if (saved) {
          // Add to beginning
          setRecords(prev => [saved, ...prev])
          setLastFetchStatus({ ok: true, message: 'Donnée récupérée et sauvegardée' })
        } else {
          setLastFetchStatus({ ok: true, message: 'Donnée déjà présente (doublon ignoré)' })
        }
      } else {
        setLastFetchStatus({ ok: false, message: 'Impossible de joindre l\'API balance' })
      }
    } catch {
      setLastFetchStatus({ ok: false, message: 'Erreur de connexion' })
    } finally {
      setLoading(false)
      // Auto-clear status message after 3s
      setTimeout(() => setLastFetchStatus(null), 3000)
    }
  }, [])

  // Auto-refresh logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isAutoRefresh) {
      interval = setInterval(() => {
        fetchNewData()
      }, refreshInterval * 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoRefresh, refreshInterval, fetchNewData])

  const handleClear = async () => {
    if (!confirm('Voulez-vous vraiment supprimer tout l\'historique (GUI et Fichier) ?')) return
    try {
      await balanceApi.history.clear()
      setRecords([])
    } catch (error) {
      console.error('Error clearing:', error)
    }
  }

  const handleExport = async () => {
    try {
      const success = await balanceApi.history.export()
      if (success) {
        alert('Historique exporté avec succès.')
      }
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Filter and Sort records for display
  const filteredRecords = useMemo(() => {
    const result = records.filter(r => 
      r.balanceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.weight.toString().includes(searchQuery) ||
      format(new Date(r.timestamp), 'dd/MM/yyyy HH:mm:ss').includes(searchQuery)
    )

    result.sort((a, b) => {
      let valA: string | number = a[sortField]
      let valB: string | number = b[sortField]

      if (sortField === 'timestamp') {
        valA = new Date(a.timestamp).getTime()
        valB = new Date(b.timestamp).getTime()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [records, searchQuery, sortField, sortOrder])

  // Limit display to last 20 records for GUI table
  const displayRecords = useMemo(() => {
    return filteredRecords.slice(0, 20)
  }, [filteredRecords])

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full shadow-sm">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-border bg-muted/30 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Historique des Pesées
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Affichage des 20 derniers enregistrements (Persistance active)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNewData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Rafraîchir
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 border border-border bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors"
              title="Exporter en CSV"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-1.5 border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md text-sm font-medium transition-all"
              title="Vider l'historique"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par poids, date, nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Auto Refresh Config */}
          <div className="flex items-center gap-3 bg-background border border-border px-3 py-1.5 rounded-md self-stretch sm:self-auto">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="auto-refresh" className="text-sm font-medium cursor-pointer">Auto</label>
            </div>
            {isAutoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-sm border-none focus:ring-0 p-0 pr-6 font-medium"
              >
                <option value={2}>2s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
            )}
          </div>
        </div>

        {/* Status Message */}
        {lastFetchStatus && (
          <div className={cn(
            "flex items-center gap-2 text-xs px-3 py-1 rounded-full w-fit animate-in fade-in slide-in-from-top-1",
            lastFetchStatus.ok ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
          )}>
            {lastFetchStatus.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {lastFetchStatus.message}
          </div>
        )}
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-background/95 backdrop-blur-sm shadow-sm z-10">
            <tr className="border-b border-border">
              <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Balance
              </th>
              <th 
                className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('weight')}
              >
                <div className="flex items-center gap-1">
                  Poids
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Unité
              </th>
              <th 
                className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  Horodatage
                  {sortField === 'timestamp' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                  {sortField !== 'timestamp' && <ArrowUpDown className="w-3 h-3" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Filter className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Aucun enregistrement trouvé</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayRecords.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      <span className="font-medium text-sm">{record.balanceName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-bold tabular-nums text-sm">{record.weight.toLocaleString('fr-FR')}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-muted-foreground">
                    {record.unit}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium underline decoration-primary/20 underline-offset-4">
                        {format(new Date(record.timestamp), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(record.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Stats */}
      <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-medium">
        <div className="flex items-center gap-4">
          <span>Total persisté: <span className="text-foreground">{records.length}</span></span>
          {records.length > 20 && (
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">Détails table: 20 affichés</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Settings2 className="w-3 h-3" />
          Fichier local: AppData/Industrial Weighing Dashboard
        </div>
      </div>
    </div>
  )
}
