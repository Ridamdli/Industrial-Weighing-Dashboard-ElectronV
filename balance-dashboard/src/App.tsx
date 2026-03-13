import { useEffect } from 'react'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Activity, Settings, HardDrive, FileText, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from './components/StatusBadge'
import { WeightGauge } from './components/WeightGauge'
import { LiveWeightChart } from './components/LiveWeightChart'
import { useWeightPolling } from './renderer/hooks/useWeightPolling'
import { useAppStore } from './renderer/store/appStore'
import { balanceApi } from './renderer/api/balanceApi'
import { ServiceControl } from './renderer/pages/ServiceControl'
import { IniForm } from './renderer/pages/IniForm'
import { ComPortDetector } from './renderer/pages/ComPortDetector'
import { LogsViewer } from './renderer/pages/LogsViewer'
import { SetupWizard } from './renderer/pages/SetupWizard'
import { BalanceHistoryTable } from './renderer/components/BalanceHistoryTable'
import './App.css'

function Dashboard() {
  const { error } = useWeightPolling(1000)
  const serviceState = useAppStore(s => s.serviceState)
  const logs = useAppStore(s => s.logs).slice(0, 5)
  
  const isIdle = error != null && (error.includes('Inactif') || error.includes('attente'))
  const isRealError = error != null && !isIdle
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble en temps réel du système de pesage industriel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card border rounded-lg flex flex-col gap-1 shadow-sm">
          <span className="text-sm font-medium text-muted-foreground">État du Service</span>
          <div className="mt-1"><StatusBadge state={serviceState} /></div>
        </div>
        <div className={cn("p-4 bg-card border rounded-lg flex flex-col gap-1 shadow-sm",
            isRealError ? "border-destructive bg-destructive/5" :
            isIdle ? "border-amber-400 bg-amber-50/30" : "")}>
          <span className="text-sm font-medium text-muted-foreground">API Balance</span>
          <span className={cn("text-lg font-bold",
            isRealError ? "text-destructive" :
            isIdle ? "text-amber-500" :
            "text-green-500")}>
            {isRealError ? 'Erreur / Déconnectée' : isIdle ? 'En attente (Inactif)' : 'Connectée'}
          </span>
          {error && <span className="text-xs text-muted-foreground truncate" title={error}>{error}</span>}
        </div>
        <div className="p-4 bg-card border rounded-lg flex flex-col gap-1 shadow-sm min-h-[100px] overflow-hidden">
          <span className="text-sm font-medium text-muted-foreground">Derniers Journaux</span>
          <div className="space-y-1 mt-1 overflow-auto">
            {logs.length === 0 ? <div className="text-xs text-muted-foreground">Aucun journal.</div> : 
              logs.map((L: { message: string }, i: number) => (
                <div key={i} className="text-xs text-foreground truncate" title={L.message}>
                  {L.message}
                </div>
              ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <WeightGauge error={error} />
        </div>
        <div className="lg:col-span-2">
          <LiveWeightChart />
        </div>
      </div>

      <div>
        <BalanceHistoryTable />
      </div>
    </div>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  const serviceState = useAppStore(s => s.serviceState)
  const setServiceState = useAppStore(s => s.setServiceState)

  useEffect(() => {
      balanceApi.service.status().then((res) => setServiceState(res.state as Parameters<typeof setServiceState>[0]))
    const timer = setInterval(() => {
        balanceApi.service.status().then((res) => setServiceState(res.state as Parameters<typeof setServiceState>[0]))
    }, 5000)
    return () => clearInterval(timer)
  }, [setServiceState])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <h2 className="font-semibold tracking-tight">Balance Dashboard</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
            <Activity className="w-4 h-4" /> Tableau de Bord
          </Link>
          <Link to="/service" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
            <Settings className="w-4 h-4" /> Contrôle du Service
          </Link>
          <Link to="/config" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
            <HardDrive className="w-4 h-4" /> Configuration
          </Link>
          <Link to="/ports" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
            <Wrench className="w-4 h-4" /> Ports COM
          </Link>
          <Link to="/logs" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
            <FileText className="w-4 h-4" /> Journaux (Logs)
          </Link>
          <div className="my-4 border-t border-border"></div>
          <Link to="/setup" className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-colors">
            <Wrench className="w-4 h-4" /> Assistant d'Installation
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/50 flex items-center px-6 justify-between shrink-0">
          <div className="text-sm font-medium text-muted-foreground">Industrial Weighing System</div>
          <StatusBadge state={serviceState} />
        </header>
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/service" element={<ServiceControl />} />
          <Route path="/config" element={<IniForm />} />
          <Route path="/ports" element={<ComPortDetector />} />
          <Route path="/logs" element={<LogsViewer />} />
          <Route path="/setup" element={<SetupWizard />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App