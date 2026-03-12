; ============================================================
; Industrial Weighing Dashboard - Custom NSIS Installer Script
; Runs after main files are installed / before they are removed
; ============================================================

; ---------------------------------------------------------
; INSTALL HOOKS
; ---------------------------------------------------------
!macro customInstall

  ; --- 1. Create service directory ---
  CreateDirectory "C:\inetpub\SDI"

  ; --- 2. Copy BalanceAgentService.exe to service directory ---
  CopyFiles "$INSTDIR\resources\BalanceAgentService.exe" "C:\inetpub\SDI\BalanceAgentService.exe"
  CopyFiles "$INSTDIR\resources\install.bat" "C:\inetpub\SDI\install.bat"

  ; --- 3. Write balances.ini to SysWOW64 if it does not already exist ---
  IfFileExists "C:\Windows\SysWOW64\balances.ini" ini_exists ini_missing

  ini_missing:
    FileOpen $0 "C:\Windows\SysWOW64\balances.ini" w
    FileWrite $0 "[Balances]$\r$\n"
    FileWrite $0 "NombreBalances=1$\r$\n"
    FileWrite $0 "$\r$\n"
    FileWrite $0 "[Balance1]$\r$\n"
    FileWrite $0 "Nom=reception$\r$\n"
    FileWrite $0 "PortCom=COM7$\r$\n"
    FileWrite $0 "BaudRate=9600$\r$\n"
    FileWrite $0 "DataBits=8$\r$\n"
    FileWrite $0 "Parity=None$\r$\n"
    FileWrite $0 "StopBits=One$\r$\n"
    FileWrite $0 "Timeout=5000$\r$\n"
    FileWrite $0 "Unite=kg$\r$\n"
    FileWrite $0 "Decimales=2$\r$\n"
    FileWrite $0 "$\r$\n"
    FileWrite $0 "[api]$\r$\n"
    FileWrite $0 "host=localhost$\r$\n"
    FileWrite $0 "port=5001$\r$\n"
    FileWrite $0 "timeout=3000$\r$\n"
    FileClose $0
    Goto ini_done

  ini_exists:
    ; File already exists — do not overwrite to preserve user config
    Goto ini_done

  ini_done:

  ; --- 4. Register and start BalanceAgentService (skip if already registered) ---
  ; Check if service already exists by querying it
  nsExec::ExecToStack 'sc query BalanceAgentService'
  Pop $0   ; exit code
  Pop $1   ; output

  ${If} $0 != 0
    ; Service does not exist — create it
    nsExec::ExecToLog 'sc create BalanceAgentService binPath= "C:\inetpub\SDI\BalanceAgentService.exe" start= auto DisplayName= "Balance Agent Service RJ45"'
    nsExec::ExecToLog 'sc description BalanceAgentService "Service de lecture des balances RJ45 avec API HTTP sur port 5001"'
    nsExec::ExecToLog 'sc failure BalanceAgentService reset= 86400 actions= restart/5000/restart/5000/restart/5000'
  ${EndIf}

  ; Start the service (will succeed if stopped; will be a no-op if already running)
  nsExec::ExecToLog 'sc start BalanceAgentService'

  ; --- 5. Allow HTTP port 5001 through Windows Firewall (optional) ---
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Balance Agent Service API" dir=in action=allow protocol=TCP localport=5001'

!macroend


; ---------------------------------------------------------
; UNINSTALL HOOKS
; ---------------------------------------------------------
!macro customUnInstall

  ; --- 1. Stop the service ---
  nsExec::ExecToLog 'sc stop BalanceAgentService'

  ; Give the service 3 seconds to stop gracefully
  Sleep 3000

  ; --- 2. Delete the service registration ---
  nsExec::ExecToLog 'sc delete BalanceAgentService'

  ; --- 3. Remove the service binary directory ---
  RMDir /r "C:\inetpub\SDI"

  ; --- 4. Remove the firewall rule ---
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Balance Agent Service API"'

  ; NOTE: C:\Windows\SysWOW64\balances.ini is intentionally NOT removed
  ; to preserve user configuration for potential re-installation.

!macroend
