export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message || 'Không thể hoàn thành yêu cầu.')
    this.name = 'ApiError'
    this.status = status
    this.code = payload?.error?.code || 'REQUEST_FAILED'
    this.fieldErrors = payload?.error?.fieldErrors || {}
  }
}

export async function api(path, options = {}) {
  const { json, suppressExpiredEvent = false, ...rest } = options
  const headers = new Headers(rest.headers || {})
  if (json !== undefined) headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  const response = await fetch(`/api/v1${path}`, {
    ...rest,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
    body: json === undefined ? rest.body : JSON.stringify(json),
  })
  if (response.status === 401 && !suppressExpiredEvent && !path.endsWith('/auth/login')) {
    window.dispatchEvent(new CustomEvent('room-admin-session-expired'))
  }
  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, payload)
  return payload
}
