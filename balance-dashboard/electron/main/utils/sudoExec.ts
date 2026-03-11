import { execFileAsync } from './exec'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

export async function sudoExec(command: string, timeoutMs = 15_000): Promise<{ stdout: string; stderr: string }> {
  const psFilename = `elevated_cmd_${Date.now()}_${Math.floor(Math.random() * 10000)}.ps1`
  const psPath = path.join(os.tmpdir(), psFilename)
  
  await fs.writeFile(psPath, command, 'utf8')

  const psCommand = `Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File \`"${psPath}\`"" -Verb RunAs -WindowStyle Hidden -Wait`
  
  try {
    await execFileAsync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand], { timeoutMs })
    await fs.unlink(psPath).catch(() => {})
    return { stdout: 'Command executed with elevated privileges.', stderr: '' }
  } catch (err: unknown) {
    await fs.unlink(psPath).catch(() => {})
    const error = err as Error
    throw new Error(`Elevation failed: ${error.message || String(err)}`)
  }
}
