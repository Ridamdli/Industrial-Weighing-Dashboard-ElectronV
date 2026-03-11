export async function fetchWithTimeout(
  input: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = init?.timeoutMs ?? 3000
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const rest: RequestInit & Record<string, unknown> = init ? { ...init } : {}
    delete rest.timeoutMs
    return await fetch(input, { ...(rest as RequestInit), signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

