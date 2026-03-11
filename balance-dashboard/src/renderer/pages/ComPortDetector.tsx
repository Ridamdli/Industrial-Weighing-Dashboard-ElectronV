import { useEffect, useState } from 'react'
import { RefreshCw, Play, CheckCircle2, XCircle } from 'lucide-react'
import { balanceApi } from '../api/balanceApi'
import { cn } from '@/lib/utils'

type PortInfo = {
  path: string;
  manufacturer: string;
  serialNumber: string;
  pnpId: string;
  locationId: string;
  friendlyName: string;
  vendorId: string;
  productId: string;
}

export function ComPortDetector() {
  const [ports, setPorts] = useState<PortInfo[]>([])
  const [scanning, setScanning] = useState(false)
  const [testStatus, setTestStatus] = useState<Record<string, { testing: boolean, success?: boolean, detail?: string }>>({})

  useEffect(() => {
    scanPorts()
  }, [])

  const scanPorts = async () => {
    setScanning(true)
    try {
      const res = await balanceApi.comPorts.list()
      // comPorts.list() returns the array directly
      if (Array.isArray(res)) {
        setPorts(res as PortInfo[])
      }
    } catch (err) {
      console.error('Error scanning ports:', err)
    } finally {
      setScanning(false)
    }
  }

  const testPort = async (path: string) => {
    setTestStatus(prev => ({ ...prev, [path]: { testing: true } }))
    try {
      const res = await balanceApi.comPorts.test({ path, baudRate: 9600 })
      setTestStatus(prev => ({ 
        ...prev, 
        [path]: { 
          testing: false, 
          success: res.success, 
          detail: res.success ? 'Connexion réussie (9600 bauds)' : res.error 
        } 
      }))
    } catch (err) {
      setTestStatus(prev => ({ 
        ...prev, 
        [path]: { 
          testing: false, 
          success: false, 
          detail: err instanceof Error ? err.message : String(err) 
        } 
      }))
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ports COM</h1>
          <p className="text-muted-foreground mt-2">
            Détection des ports série disponibles sur le système pour la connexion à la balance.
          </p>
        </div>
        <button
          onClick={scanPorts}
          disabled={scanning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border",
            scanning 
              ? "bg-muted border-transparent text-muted-foreground cursor-not-allowed opacity-50" 
              : "bg-card border-border hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", scanning && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {ports.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {scanning ? 'Recherche de ports...' : 'Aucun port COM détecté sur le système.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ports.map((port) => {
              const status = testStatus[port.path]
              
              return (
                <div key={port.path} className="p-6 hover:bg-muted/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-mono tracking-tight">{port.path}</h3>
                      {port.manufacturer && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {port.manufacturer}
                        </span>
                      )}
                    </div>
                    {port.friendlyName && <p className="text-sm text-foreground">{port.friendlyName}</p>}
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      {port.vendorId && <span>VID: {port.vendorId}</span>}
                      {port.productId && <span>PID: {port.productId}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 min-w-[200px]">
                    <button
                      onClick={() => testPort(port.path)}
                      disabled={status?.testing}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2 w-full rounded-md font-medium text-sm transition-colors",
                        status?.testing
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {status?.testing ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Test en cours...</>
                      ) : (
                        <><Play className="w-4 h-4" /> Tester (9600)</>
                      )}
                    </button>
                    
                    {status && !status.testing && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs font-medium mt-1 text-right w-full justify-end",
                        status.success ? "text-green-500" : "text-destructive"
                      )}>
                        {status.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span className="line-clamp-1" title={status.detail}>{status.detail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
