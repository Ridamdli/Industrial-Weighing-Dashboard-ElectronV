import { useEffect, useState } from 'react'
import { Save, AlertTriangle, CheckCircle2, Network, Loader2, RefreshCw, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { balanceApi } from '../api/balanceApi'
import { AppUpdater } from '../components/AppUpdater'
import { cn } from '@/lib/utils'

export function IniForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [availableIps, setAvailableIps] = useState<string[]>([])
  const [detectingHost, setDetectingHost] = useState(false)

  type PortInfo = { path: string; friendlyName?: string; manufacturer?: string }
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [scanningPorts, setScanningPorts] = useState(false)
  
  const [configPath, setConfigPath] = useState('')
  const [config, setConfig] = useState({
    api_host: 'localhost',
    api_port: '5001',
    balance_com_port: 'COM1',
    balance_baud_rate: '9600',
    balance_data_bits: '8',
    balance_parity: 'None',
    balance_stop_bits: 'One',
    balance_timeout: '5000',
    balance_unite: 'kg',
    balance_decimales: '2'
  })

  useEffect(() => {
    fetchConfig()
    fetchIps()
  }, [])

  const fetchIps = async () => {
    try {
      const ips = await balanceApi.network.getIps()
      setAvailableIps(ips || [])
    } catch (e) {
      console.error("Failed to fetch IPs", e)
    }
  }

  const scanPorts = async () => {
    setScanningPorts(true)
    try {
      const res = await balanceApi.comPorts.list()
      if (Array.isArray(res)) setPorts(res as PortInfo[])
    } catch {
      // silent
    } finally {
      setScanningPorts(false)
    }
  }

  const fetchConfig = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await balanceApi.config.read()
      if (res && res.data) {
        const raw = res.data as Record<string, Record<string, unknown>>
        setConfigPath(res.path)
        const newConfig = {
          api_host: String(raw.api?.host ?? 'localhost'),
          api_port: String(raw.api?.port ?? '5001'),
          balance_com_port: String(raw.Balance1?.PortCom ?? ''),
          balance_baud_rate: String(raw.Balance1?.BaudRate ?? '9600'),
          balance_data_bits: String(raw.Balance1?.DataBits ?? '8'),
          balance_parity: String(raw.Balance1?.Parity ?? 'None'),
          balance_stop_bits: String(raw.Balance1?.StopBits ?? 'One'),
          balance_timeout: String(raw.Balance1?.Timeout ?? '5000'),
          balance_unite: String(raw.Balance1?.Unite ?? 'kg'),
          balance_decimales: String(raw.Balance1?.Decimales ?? '2')
        }
        setConfig(newConfig)
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
      const payload = {
        path: configPath,
        data: {
          api: {
            host: config.api_host,
            port: parseInt(config.api_port, 10),
          },
          Balance1: {
            PortCom: config.balance_com_port,
            BaudRate: parseInt(config.balance_baud_rate, 10),
            DataBits: parseInt(config.balance_data_bits, 10),
            Parity: config.balance_parity,
            StopBits: config.balance_stop_bits,
            Timeout: parseInt(config.balance_timeout, 10),
            Unite: config.balance_unite,
            Decimales: parseInt(config.balance_decimales, 10)
          }
        }
      }

      const res = await balanceApi.config.write(payload)
      if (res.success) {
        setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès. Veuillez redémarrer le service manuellement si nécessaire.' })
      } else {
        setMessage({ type: 'error', text: res.error || 'Erreur lors de la sauvegarde.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setSaving(false)
    }
  }

  const handleDetectHost = async () => {
    setDetectingHost(true)
    setMessage(null)
    try {
      if (availableIps.length === 0) {
        await fetchIps()
      }
      const ipsToTest = [...availableIps]
      if (!ipsToTest.includes('localhost')) ipsToTest.unshift('localhost')
      if (!ipsToTest.includes('127.0.0.1')) ipsToTest.unshift('127.0.0.1')
      
      let found = false
      for (const ip of ipsToTest) {
        try {
          // Trying each IP via native fetch with a short timeout
          const res = await fetch(`http://${ip}:${config.api_port}/api/health`, {
            signal: AbortSignal.timeout(1500)
          })
          if (res.ok) {
            setConfig(s => ({ ...s, api_host: ip }))
            setMessage({ type: 'success', text: `Hôte API détecté avec succès : ${ip}` })
            found = true
            break
          }
        } catch {
          // Ignore timeout or connection refused
        }
      }
      if (!found) {
        setMessage({ type: 'error', text: "Impossible de détecter l'hôte API automatiquement. Le service est-il démarré ?" })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : String(e) })
    } finally {
      setDetectingHost(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement de la configuration...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Gérer les paramètres du service et la connexion à la balance (balances.ini).
          </p>
        </div>
        <button
          onClick={() => navigate('/setup')}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors font-medium text-sm border border-primary/20"
        >
          <Wrench className="w-4 h-4" /> Assistant de configuration
        </button>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground block">Hôte (Host)</label>
                <button
                  type="button"
                  onClick={handleDetectHost}
                  disabled={detectingHost || loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-50 transition-all"
                >
                  {detectingHost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
                  Auto-détection
                </button>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={config.api_host}
                  onChange={e => setConfig(s => ({ ...s, api_host: e.target.value }))}
                  list="ip-list"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <datalist id="ip-list">
                  <option value="localhost" />
                  <option value="127.0.0.1" />
                  {availableIps.map(ip => (
                    <option key={ip} value={ip} />
                  ))}
                </datalist>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground block">Port COM <span className="text-destructive">*</span></label>
                <button
                  type="button"
                  onClick={scanPorts}
                  disabled={scanningPorts || loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent disabled:opacity-50 transition-all"
                >
                  {scanningPorts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Scanner les ports
                </button>
              </div>
              <input 
                type="text" 
                value={config.balance_com_port}
                onChange={e => setConfig(s => ({ ...s, balance_com_port: e.target.value }))}
                placeholder="ex: COM1"
                list="com-port-list"
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <datalist id="com-port-list">
                {ports.map(p => (
                  <option key={p.path} value={p.path}>
                    {p.friendlyName ? `${p.path} – ${p.friendlyName}` : p.path}
                  </option>
                ))}
              </datalist>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Data Bits</label>
              <select value={config.balance_data_bits} onChange={e => setConfig(s => ({ ...s, balance_data_bits: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <option value="7">7</option><option value="8">8</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Parity</label>
              <select value={config.balance_parity} onChange={e => setConfig(s => ({ ...s, balance_parity: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <option value="None">None</option><option value="Even">Even</option><option value="Odd">Odd</option><option value="Mark">Mark</option><option value="Space">Space</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Stop Bits</label>
              <select value={config.balance_stop_bits} onChange={e => setConfig(s => ({ ...s, balance_stop_bits: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <option value="One">1</option><option value="OnePointFive">1.5</option><option value="Two">2</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Timeout (ms)</label>
              <input type="number" value={config.balance_timeout} onChange={e => setConfig(s => ({ ...s, balance_timeout: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Unité</label>
              <input type="text" value={config.balance_unite} onChange={e => setConfig(s => ({ ...s, balance_unite: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Décimales</label>
              <input type="number" value={config.balance_decimales} onChange={e => setConfig(s => ({ ...s, balance_decimales: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
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

      <div className="mt-8">
        <AppUpdater />
      </div>
    </div>
  )
}
