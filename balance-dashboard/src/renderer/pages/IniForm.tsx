import { useEffect, useState } from 'react'
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { balanceApi } from '../api/balanceApi'
import { cn } from '@/lib/utils'

export function IniForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [config, setConfig] = useState({
    api_host: 'localhost',
    api_port: '8668',
    balance_com_port: 'COM1',
    balance_baud_rate: '9600'
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await balanceApi.config.read()
      if (res && res.data) {
        // Map INI sections to our flat state
        const raw = res.data as Record<string, Record<string, unknown>>
        setConfig({
          api_host: String(raw.API?.Host ?? 'localhost'),
          api_port: String(raw.API?.Port ?? '8668'),
          balance_com_port: String(raw.Balance?.ComPort ?? ''),
          balance_baud_rate: String(raw.Balance?.BaudRate ?? '9600')
        })
      } else {
        setMessage({ type: 'error', text: 'Impossible de lire la configuration.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    // Basic Validation
    if (!config.balance_com_port.trim()) {
      setMessage({ type: 'error', text: 'Le Port COM est requis.' })
      setSaving(false)
      return
    }

    try {
      // Reconstruct the payload to match the INI sections
      const payload = {
        path: '', // auto-detect
        data: {
          API: {
            Host: config.api_host,
            Port: parseInt(config.api_port, 10),
          },
          Balance: {
            ComPort: config.balance_com_port,
            BaudRate: parseInt(config.balance_baud_rate, 10),
          }
        }
      }

      const res = await balanceApi.config.write(payload)
      if (res.success) {
        setMessage({ type: 'success', text: 'Configuration sauvegardée. Veuillez redémarrer le service.' })
      } else {
        setMessage({ type: 'error', text: res.error || 'Erreur lors de la sauvegarde.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement de la configuration...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Gérer les paramètres du service et la connexion à la balance (balance.ini).
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-8 shadow-sm">
        
        {message && (
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg text-sm font-medium",
            message.type === 'error' ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600 dark:text-green-400"
          )}>
            {message.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-medium border-b border-border pb-2">Paramètres Serveur API</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Hôte (Host)</label>
              <input 
                type="text" 
                value={config.api_host}
                onChange={e => setConfig(s => ({ ...s, api_host: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Port</label>
              <input 
                type="number" 
                value={config.api_port}
                onChange={e => setConfig(s => ({ ...s, api_port: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium border-b border-border pb-2">Connexion Balance Série</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Port COM <span className="text-destructive">*</span></label>
              <input 
                type="text" 
                value={config.balance_com_port}
                onChange={e => setConfig(s => ({ ...s, balance_com_port: e.target.value }))}
                placeholder="ex: COM1"
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Baud Rate</label>
              <select 
                value={config.balance_baud_rate}
                onChange={e => setConfig(s => ({ ...s, balance_baud_rate: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="4800">4800</option>
                <option value="9600">9600</option>
                <option value="19200">19200</option>
                <option value="38400">38400</option>
                <option value="115200">115200</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm",
              saving ? "bg-primary/70 text-primary-foreground cursor-wait" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Save className={cn("w-4 h-4", saving && "animate-pulse")} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </div>
  )
}
