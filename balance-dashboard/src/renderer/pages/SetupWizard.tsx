import { useState } from 'react'
import { CheckCircle2, ArrowRight, ArrowLeft, Play, Wrench } from 'lucide-react'
import { balanceApi } from '../api/balanceApi'
import { cn } from '@/lib/utils'

type StepId = 'welcome' | 'comport' | 'config' | 'launch'

type PortInfo = {
  path: string
  friendlyName?: string
  manufacturer?: string
}

const STEPS: { id: StepId; label: string }[] = [
  { id: 'welcome', label: 'Bienvenue' },
  { id: 'comport', label: 'Port COM' },
  { id: 'config', label: 'Configuration' },
  { id: 'launch', label: 'Démarrage' },
]

export function SetupWizard() {
  const [step, setStep] = useState<StepId>('welcome')
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [loadingPorts, setLoadingPorts] = useState(false)
  const [selectedPort, setSelectedPort] = useState('')
  const [baudRate, setBaudRate] = useState('9600')
  const [apiHost, setApiHost] = useState('localhost')
  const [apiPort, setApiPort] = useState('8668')
  const [saving, setSaving] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [launchDone, setLaunchDone] = useState(false)
  const [serviceMissing, setServiceMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        path: '',
        data: {
          API: { Host: apiHost, Port: parseInt(apiPort, 10) },
          Balance: { ComPort: selectedPort, BaudRate: parseInt(baudRate, 10) }
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

    // Now start the service
    setLaunching(true)
    try {
      const res = await balanceApi.service.start()
      if (res.success) {
        setLaunchDone(true)
      } else {
        // If error contains "not found" or similar, maybe it's not installed
        if (res.error?.toLowerCase().includes('service not found') || 
            res.error?.toLowerCase().includes('n\'existe pas')) {
          setServiceMissing(true)
          setError("Le service n'est pas installé sur cette machine.")
        } else {
          setError(res.error || "Échec du démarrage du service.")
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLaunching(false)
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

        {step === 'config' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Configuration du Serveur API</h2>
            <p className="text-muted-foreground">Paramètres de l'API REST exposée par le service Windows.</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground block">Hôte (Host)</label>
                <input
                  type="text"
                  value={apiHost}
                  onChange={e => setApiHost(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
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
                  La configuration sera sauvegardée dans <code className="bg-muted px-1 rounded">balance.ini</code> puis le service sera démarré automatiquement.
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

        {step !== 'launch' && (
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
      </div>
    </div>
  )
}
