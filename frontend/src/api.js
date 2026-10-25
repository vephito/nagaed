async function request(path, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Please try again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || (typeof data.detail === "string" ? data.detail : "Request failed. Please try again.");
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const registerUser = (details) => request("/api/register", { method: "POST", body: details });
export const suggestUsernames = (interests) => request("/api/suggest-username", { method: "POST", body: { interests } });
export const loginUser = (details) => request("/api/login", { method: "POST", body: details });
export const getUser = (id, token) => request(`/api/users/${encodeURIComponent(id)}`, { token });
