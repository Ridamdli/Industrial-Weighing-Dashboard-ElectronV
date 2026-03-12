import { useState, useEffect } from 'react'
import { CheckCircle2, ArrowRight, ArrowLeft, Play, Wrench, Network, Loader2 } from 'lucide-react'
import { balanceApi } from '../api/balanceApi'
import { cn } from '@/lib/utils'

type StepId = 'welcome' | 'comport' | 'scaletest' | 'config' | 'launch' | 'finish'

type PortInfo = {
  path: string
  friendlyName?: string
  manufacturer?: string
}

const STEPS: { id: StepId; label: string }[] = [
  { id: 'welcome', label: 'Bienvenue' },
  { id: 'comport', label: '1. Port COM' },
  { id: 'scaletest', label: '2. Test Balance' },
  { id: 'config', label: '3. Configurations' },
  { id: 'launch', label: '4. Démarrage' },
  { id: 'finish', label: '5. Terminé' },
]

export function SetupWizard() {
  const [step, setStep] = useState<StepId>('welcome')
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [loadingPorts, setLoadingPorts] = useState(false)
  const [selectedPort, setSelectedPort] = useState('')
  const [baudRate, setBaudRate] = useState('9600')
  const [apiHost, setApiHost] = useState('localhost')
  const [apiPort, setApiPort] = useState('5001')
  const [configPath, setConfigPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [launchDone, setLaunchDone] = useState(false)
  const [serviceMissing, setServiceMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableIps, setAvailableIps] = useState<string[]>([])
  const [detectingHost, setDetectingHost] = useState(false)

  useEffect(() => {
    balanceApi.config.read().then(res => {
      if (res && res.path) {
        setConfigPath(res.path)
        const raw = res.data as Record<string, Record<string, unknown>>
        if (raw.api?.host) setApiHost(String(raw.api.host))
        if (raw.api?.port) setApiPort(String(raw.api.port))
        if (raw.Balance1?.PortCom) setSelectedPort(String(raw.Balance1.PortCom))
        if (raw.Balance1?.BaudRate) setBaudRate(String(raw.Balance1.BaudRate))
      }
    }).catch(() => {})

    balanceApi.network.getIps().then(ips => setAvailableIps(ips || [])).catch(() => {})
  }, [])

  const stepIndex = STEPS.findIndex(s => s.id === step)

  const goNext = () => {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next.id)
  }

  const goPrev = () => {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev.id)
  }

  const scanPorts = async () => {
    setLoadingPorts(true)
    try {
      const res = await balanceApi.comPorts.list()
      if (Array.isArray(res)) setPorts(res as PortInfo[])
    } catch {
      // silent
    } finally {
      setLoadingPorts(false)
    }
  }

  const handleInstall = async () => {
    setError(null)
    setInstalling(true)
    try {
      const res = await balanceApi.service.install()
      if (res.success) {
        setServiceMissing(false)
        handleSaveAndLaunch()
      } else {
        setError(res.error || "L'installation a échoué.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setInstalling(false)
    }
  }

  const handleSaveAndLaunch = async () => {
    setError(null)
    setSaving(true)
    try {
      const payload = {
        path: configPath,
        data: {
          api: { host: apiHost, port: parseInt(apiPort, 10) },
          Balance1: { PortCom: selectedPort, BaudRate: parseInt(baudRate, 10) }
        }
      }
      const writeRes = await balanceApi.config.write(payload)
      const result = writeRes as unknown as { success: boolean; error?: string }
      if (!result.success) {
        setError(result.error || 'Erreur de sauvegarde de configuration.')
        setSaving(false)
        return
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSaving(false)
      return
    }
    setSaving(false)

    // Now restart the service to apply changes
    setLaunching(true)
    try {
      const res = await balanceApi.service.restart()
      if (res.success) {
        setLaunchDone(true)
        setStep('finish')
      } else {
        // If error contains "not found" or similar, maybe it's not installed
        if (res.error?.toLowerCase().includes('service not found') || 
            res.error?.toLowerCase().includes('n\'existe pas') ||
            res.error?.toLowerCase().includes('specified service does not exist')) {
          setServiceMissing(true)
          setError("Le service n'est pas installé sur cette machine.")
        } else {
          setError(res.error || "Échec du démarrage/redémarrage du service.")
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLaunching(false)
    }
  }

  const handleDetectHost = async () => {
    setDetectingHost(true)
    setError(null)
    try {
      if (availableIps.length === 0) {
        const ips = await balanceApi.network.getIps()
        setAvailableIps(ips || [])
      }
      const ipsToTest = availableIps.length > 0 ? [...availableIps] : await balanceApi.network.getIps() || []
      if (!ipsToTest.includes('localhost')) ipsToTest.unshift('localhost')
      if (!ipsToTest.includes('127.0.0.1')) ipsToTest.unshift('127.0.0.1')
      
      let found = false
      for (const ip of ipsToTest) {
        try {
          // Trying each IP via native fetch with a short timeout
          const res = await fetch(`http://${ip}:${apiPort}/api/health`, {
            signal: AbortSignal.timeout(1500)
          })
          if (res.ok) {
            setApiHost(ip)
            found = true
            break
          }
        } catch {
          // Ignore timeout or connection refused
        }
      }
      if (!found) {
        setError("Impossible de détecter l'hôte API automatiquement. Le service est-il démarré ?")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setDetectingHost(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assistant d'Installation</h1>
        <p className="text-muted-foreground mt-2">
          Configurez le service BalanceAgentService en quelques étapes simples.
        </p>
      </div>

      {/* Step progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors",
              i < stepIndex ? "bg-primary text-primary-foreground" :
              i === stepIndex ? "bg-primary/20 text-primary border-2 border-primary" :
              "bg-muted text-muted-foreground"
            )}>
              {i < stepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              "text-sm font-medium hidden sm:block",
              i === stepIndex ? "text-foreground" : "text-muted-foreground"
            )}>{s.label}</span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-border mx-1 hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-xl p-8 min-h-[300px] shadow-sm">
        {step === 'welcome' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Bienvenue dans le configurateur</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cet assistant va vous guider à travers la configuration du service de communication
              avec la balance industrielle. 
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Vous devrez sélectionner le port COM auquel la balance est connectée, 
              configurer l'hôte et le port de l'API REST, puis démarrer le service.
            </p>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground">
              ⚠️ Assurez-vous que la balance est connectée et allumée avant de continuer.
            </div>
          </div>
        )}

        {step === 'comport' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Sélectionner le Port COM</h2>
            <p className="text-muted-foreground">Sélectionnez le port auquel la balance est connectée.</p>
            <div className="flex gap-2">
              <button
                onClick={scanPorts}
                disabled={loadingPorts}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
              >
                {loadingPorts ? 'Recherche...' : 'Scanner les ports'}
              </button>
            </div>

            {ports.length > 0 && (
              <div className="space-y-2">
                {ports.map(p => (
                  <button
                    key={p.path}
                    onClick={() => setSelectedPort(p.path)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                      selectedPort === p.path
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    <div className="font-mono font-bold">{p.path}</div>
                    {p.friendlyName && <div className="text-sm text-muted-foreground">{p.friendlyName}</div>}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Ou saisir manuellement</label>
              <input
                type="text"
                placeholder="ex: COM3"
                value={selectedPort}
                onChange={e => setSelectedPort(e.target.value)}
                className="w-full max-w-xs h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">Baud Rate</label>
              <select
                value={baudRate}
                onChange={e => setBaudRate(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option>4800</option>
                <option>9600</option>
                <option>19200</option>
                <option>38400</option>
                <option>115200</option>
              </select>
            </div>
          </div>
        )}

        {step === 'scaletest' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Test de Connexion Balance</h2>
            <p className="text-muted-foreground">Vérification de la communication avec la balance sur le port sélectionné avant de continuer.</p>
            <div className="p-4 bg-muted/50 rounded-lg border border-border text-sm space-y-1">
              <div><span className="text-muted-foreground">Port COM testé:</span> <span className="font-mono font-bold">{selectedPort}</span></div>
            </div>
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
              ℹ L'application ne peut pas tester directement le port COM pour des raisons de conformité avec l'architecture. Le test réel sera effectué par le service une fois démarré. Appuyez sur Suivant pour continuer la configuration.
            </div>
          </div>
        )}

        {step === 'config' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Configuration du Serveur API</h2>
            <p className="text-muted-foreground">Paramètres de l'API REST exposée par le service Windows.</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground block">Hôte (Host)</label>
                  <button
                    type="button"
                    onClick={handleDetectHost}
                    disabled={detectingHost}
                    className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                  >
                    {detectingHost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
                    Auto-détection
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={apiHost}
                    onChange={e => setApiHost(e.target.value)}
                    list="setup-ip-list"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  <datalist id="setup-ip-list">
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
                  value={apiPort}
                  onChange={e => setApiPort(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground">
              💡 Pour un déploiement sur la même machine, laissez <code className="bg-muted px-1 rounded">localhost</code> et le port <code className="bg-muted px-1 rounded">8668</code> par défaut.
            </div>
          </div>
        )}

        {step === 'launch' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Démarrage du Service</h2>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {launchDone ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <div>
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Service démarré avec succès !</h3>
                  <p className="text-muted-foreground mt-2">
                    Le service BalanceAgentService est en cours d'exécution.<br />
                    Vous pouvez maintenant aller sur le Tableau de Bord.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  La configuration sera sauvegardée dans <code className="bg-muted px-1 rounded">balences.ini</code> puis le service sera démarré automatiquement.
                </p>
                <div className="p-4 bg-muted/50 rounded-lg border border-border text-sm space-y-1">
                  <div><span className="text-muted-foreground">Port COM:</span> <span className="font-mono font-bold">{selectedPort || '(non défini)'}</span></div>
                  <div><span className="text-muted-foreground">Baud Rate:</span> <span className="font-mono">{baudRate}</span></div>
                  <div><span className="text-muted-foreground">Hôte API:</span> <span className="font-mono">{apiHost}:{apiPort}</span></div>
                </div>

                {serviceMissing ? (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium shadow-sm w-full sm:w-auto"
                  >
                    <Wrench className={cn("w-4 h-4", installing && "animate-spin")} />
                    {installing ? 'Installation...' : 'Installer le Service Windows'}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveAndLaunch}
                    disabled={saving || launching}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-sm w-full sm:w-auto"
                  >
                    <Play className={cn("w-4 h-4", (saving || launching) && "animate-pulse")} />
                    {saving ? 'Sauvegarde...' : launching ? 'Démarrage...' : 'Sauvegarder et Démarrer'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'finish' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Configuration Terminée</h2>
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Prêt à l'emploi !</h3>
                <p className="text-muted-foreground mt-2">
                  L'assistant a terminé la configuration du service.<br />
                  Vous pouvez retourner au Dashboard.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={stepIndex === 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium",
            stepIndex === 0
              ? "opacity-0 pointer-events-none"
              : "border-border bg-card hover:bg-accent"
          )}
        >
          <ArrowLeft className="w-4 h-4" /> Précédent
        </button>

        {step !== 'launch' && step !== 'finish' && (
          <button
            onClick={goNext}
            disabled={(step === 'comport' && !selectedPort)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium",
              step === 'comport' && !selectedPort && "opacity-50 cursor-not-allowed"
            )}
          >
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === 'finish' && (
          <button
            onClick={() => window.location.hash = '#/'}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Aller au Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
