import { execFile } from 'node:child_process'

export type ExecResult = {
  stdout: string
  stderr: string
  exitCode: number
}

type NodeExecError = Error & { code?: number | string | null }

export function execFileAsync(
  file: string,
  args: string[],
  options?: { timeoutMs?: number; cwd?: string },
): Promise<ExecResult> {
  const timeoutMs = options?.timeoutMs ?? 15_000

  return new Promise((resolve) => {
    execFile(
      file,
      args,
      { windowsHide: true, timeout: timeoutMs, cwd: options?.cwd },
      (error, stdout, stderr) => {
        // execFile sets error when exitCode != 0 or timeout; keep it structured.
        const nodeErr = error as NodeExecError | null
        const exitCode = typeof nodeErr?.code === 'number' ? nodeErr.code : 0
        resolve({
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
          exitCode,
        })
      },
    )
  })
}

