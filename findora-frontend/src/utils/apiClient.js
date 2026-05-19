import { API_BASE_URL } from "../config/api";
import { getSession } from "./auth";

export const authHeaders = (extra = {}) => {
  const { token } = getSession();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });

export const parseApiJson = async (res) => {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();

  if (text.trimStart().startsWith("<")) {
    throw new Error(
      "Server returned HTML instead of JSON. Restart the backend (node server.js) and try again."
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 160) || `Request failed (${res.status})`);
  }
};
