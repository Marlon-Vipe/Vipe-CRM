const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface RequestOptions {
  method?: string
  accessToken?: string
  body?: unknown
}

async function request<T>(path: string, { method = 'GET', accessToken, body }: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || 'Ocurrió un error al comunicarse con el servidor.')
  }

  return data as T
}

export function completeSignup({
  accessToken,
  tenantName,
}: {
  accessToken: string
  tenantName: string
}): Promise<{ tenant_id: string }> {
  return request('/auth/complete-signup', {
    method: 'POST',
    accessToken,
    body: { tenant_name: tenantName },
  })
}
