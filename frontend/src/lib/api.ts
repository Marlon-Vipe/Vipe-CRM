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

export function getInvitation(token: string): Promise<{ email: string; role: string; tenant_name: string }> {
  return request(`/invitations/${token}`)
}

export function acceptInvitation({ accessToken, token }: { accessToken: string; token: string }): Promise<{ tenant_id: string }> {
  return request(`/invitations/${token}/accept`, {
    method: 'POST',
    accessToken,
  })
}

export function sendConversationMessage({
  accessToken,
  conversationId,
  content,
}: {
  accessToken: string
  conversationId: string
  content: string
}): Promise<{ id: string; direction: string; content: string; type: string; created_at: string }> {
  return request(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    accessToken,
    body: { content },
  })
}

export interface WhatsAppTemplate {
  id: string
  name: string
  twilio_content_sid: string
  variable_labels: string[]
  created_at: string
}

export function sendTemplateMessage({
  accessToken,
  conversationId,
  templateId,
  variables,
}: {
  accessToken: string
  conversationId: string
  templateId: string
  variables: string[]
}): Promise<{ id: string; direction: string; content: string; type: string; created_at: string }> {
  return request(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    accessToken,
    body: { templateId, variables },
  })
}

export function listChannels(accessToken: string): Promise<{ id: string; type: string; provider: string; external_id: string; status: string }[]> {
  return request('/channels', { accessToken })
}

export function listWhatsAppTemplates(accessToken: string): Promise<WhatsAppTemplate[]> {
  return request('/channels/whatsapp/templates', { accessToken })
}

export function createWhatsAppTemplate({
  accessToken,
  name,
  twilioContentSid,
  variableLabels,
}: {
  accessToken: string
  name: string
  twilioContentSid: string
  variableLabels: string[]
}): Promise<WhatsAppTemplate> {
  return request('/channels/whatsapp/templates', {
    method: 'POST',
    accessToken,
    body: { name, twilio_content_sid: twilioContentSid, variable_labels: variableLabels },
  })
}

export function deleteWhatsAppTemplate({ accessToken, templateId }: { accessToken: string; templateId: string }): Promise<null> {
  return request(`/channels/whatsapp/templates/${templateId}`, { method: 'DELETE', accessToken })
}

export function connectWhatsAppChannel({
  accessToken,
  phoneNumber,
}: {
  accessToken: string
  phoneNumber: string
}): Promise<{ id: string; external_id: string; status: string }> {
  return request('/channels/whatsapp', {
    method: 'POST',
    accessToken,
    body: { phone_number: phoneNumber },
  })
}

export function disconnectChannel({ accessToken, channelId }: { accessToken: string; channelId: string }): Promise<null> {
  return request(`/channels/${channelId}`, { method: 'DELETE', accessToken })
}

export function getSubscription(
  accessToken: string
): Promise<{ plan: string; status: string | null; tenantStatus: string; renewsAt: string | null; billingConfigured: boolean }> {
  return request('/billing/subscription', { accessToken })
}

export function createCheckoutSession({ accessToken, plan }: { accessToken: string; plan: string }): Promise<{ url: string }> {
  return request('/billing/checkout', { method: 'POST', accessToken, body: { plan } })
}

export function createPortalSession(accessToken: string): Promise<{ url: string }> {
  return request('/billing/portal', { method: 'POST', accessToken })
}

export function createInvitation({
  accessToken,
  email,
  role,
}: {
  accessToken: string
  email: string
  role: string
}): Promise<{ id: string; email: string; role: string; token: string; expires_at: string; email_sent: boolean }> {
  return request('/invitations', {
    method: 'POST',
    accessToken,
    body: { email, role },
  })
}
