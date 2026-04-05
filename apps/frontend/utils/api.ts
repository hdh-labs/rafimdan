export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

let refreshPromise: Promise<string | null> | null = null

function getToken(): string | null {
  return useCookie<string | null>("access_token").value ?? null
}

function setToken(token: string): void {
  useCookie<string | null>("access_token", {
    maxAge: 60 * 15,
    sameSite: "lax",
    path: "/",
  }).value = token
}

function clearToken(): void {
  useCookie<string | null>("access_token").value = null
}

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await $fetch<{ data: { access_token: string } }>("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })
      const newToken = res.data.access_token
      setToken(newToken)
      return newToken
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

const NO_RETRY_PATHS = ["/api/auth/refresh", "/api/auth/logout"]

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const config = useRuntimeConfig()
  const base = (config.public.apiBase as string) || ""
  const url = `${base}${path}`
  const token = getToken()
  const isFormData = init?.body instanceof FormData

  const buildHeaders = (tok: string | null): HeadersInit => ({
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...init?.headers,
    ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
  })

  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: buildHeaders(token),
  })

  if (response.status === 401 && !NO_RETRY_PATHS.includes(path)) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      const retry = await fetch(url, {
        credentials: "include",
        ...init,
        headers: buildHeaders(newToken),
      })
      if (!retry.ok) {
        const body = (await retry.json().catch(() => null)) as Record<string, unknown> | null
        const msg = typeof body?.error === "string" ? body.error : `API error: ${retry.status}`
        const code = (body?.code as string) ?? "UNKNOWN_ERROR"
        throw new ApiError(msg, retry.status, code)
      }
      return retry.json() as Promise<T>
    }
    clearToken()
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null
    const msg = typeof body?.error === "string" ? body.error : `API error: ${response.status}`
    const code = (body?.code as string) ?? "UNKNOWN_ERROR"
    throw new ApiError(msg, response.status, code)
  }

  return response.json() as Promise<T>
}
