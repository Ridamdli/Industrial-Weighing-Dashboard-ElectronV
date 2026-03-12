import { useState, useEffect } from 'react'
import { Download, RefreshCw, AlertCircle, CheckCircle, PackageSearch } from 'lucide-react'
import { balanceApi } from '../api/balanceApi'
import { cn } from '@/lib/utils'

export function AppUpdater() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'>('idle')
  const [versionInfo, setVersionInfo] = useState<{ version: string; newVersion?: string }>({ version: '' })
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const unsubCanAvailable = balanceApi.updater.onCanAvailable((payload) => {
      setVersionInfo({ version: payload.version, newVersion: payload.newVersion })
      if (payload.update) {
        setStatus('available')
      } else {
        setStatus('not-available')
        setTimeout(() => setStatus('idle'), 5000)
      }
    })

    const unsubError = balanceApi.updater.onError((err) => {
      setStatus('error')
      setErrorMsg(err.message || 'Erreur lors de la mise à jour')
    })

    const unsubProgress = balanceApi.updater.onDownloadProgress((info) => {
      setStatus('downloading')
      setProgress(Math.round(info.percent))
    })

    const unsubDownloaded = balanceApi.updater.onDownloaded(() => {
      setStatus('downloaded')
    })

    return () => {
      unsubCanAvailable()
      unsubError()
      unsubProgress()
      unsubDownloaded()
    }
  }, [])

  const checkForUpdates = async () => {
    setStatus('checking')
    setErrorMsg('')
    try {
      await balanceApi.updater.check()
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Erreur réseau')
    }
  }

  const downloadUpdate = async () => {
    setStatus('downloading')
    setProgress(0)
    try {
      await balanceApi.updater.startDownload()
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Erreur réseau')
    }
  }

  const quitAndInstall = async () => {
    await balanceApi.updater.quitAndInstall()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-muted-foreground" />
            Mises à jour
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez si une nouvelle version de l'application est disponible.
          </p>
          {versionInfo.version && <div className="text-xs text-muted-foreground mt-2 font-mono">Version actuelle: {versionInfo.version}</div>}
        </div>

        <div>
          {status === 'idle' || status === 'not-available' || status === 'error' ? (
            <button
              onClick={checkForUpdates}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Vérifier
            </button>
          ) : null}

          {status === 'checking' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse px-4 py-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Recherche en cours...
            </div>
          )}

          {status === 'available' && (
            <button
              onClick={downloadUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium animate-in fade-in"
            >
              <Download className="w-4 h-4" />
              Télécharger v{versionInfo.newVersion}
            </button>
          )}

          {status === 'downloading' && (
            <div className="flex flex-col items-end gap-1">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Téléchargement: {progress}%</div>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {status === 'downloaded' && (
            <button
              onClick={quitAndInstall}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors text-sm font-medium animate-in fade-in zoom-in"
            >
              <CheckCircle className="w-4 h-4" />
              Installer & Redémarrer
            </button>
          )}
        </div>
      </div>

      {status === 'not-available' && (
        <div className="mt-4 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-2 text-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Votre application est à jour.
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  )
}
