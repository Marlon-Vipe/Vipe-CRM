const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

async function request(path, { method = "GET", accessToken, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Ocurrió un error al comunicarse con el servidor.");
  }

  return data;
}

export function completeSignup({ accessToken, tenantName }) {
  return request("/auth/complete-signup", {
    method: "POST",
    accessToken,
    body: { tenant_name: tenantName },
  });
}
