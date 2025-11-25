// src/api/api.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("access_token");
}
function setToken(token) {
  localStorage.setItem("access_token", token);
}
function clearToken() {
  localStorage.removeItem("access_token");
}

// wrapper for fetch that adds Authorization header when token exists
export async function apiFetch(path, opts = {}) {
  const headers = opts.headers ? { ...opts.headers } : {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  const res = await fetch(API_BASE + path, { ...opts, headers });
  // if unauthorized, bubble up
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  // try parse JSON
  const text = await res.text();
  try {
    return JSON.parse(text || "{}");
  } catch (err) {
    console.log(err);
    return text;
  }
}

// auth endpoints
export async function login(username, password) {
  const res = await fetch(API_BASE + "/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Login failed");
  }
  const data = await res.json();
  setToken(data.access);
  return data;
}

export function logout() {
  clearToken();
}

// high-level endpoints
export const getMetaFilters = (qs = "") =>
  apiFetch(`/meta/filters/${qs ? "?" + qs : ""}`);
export const getAvgIntensityByYear = (qs = "") =>
  apiFetch(`/agg/avg-intensity-by-year/${qs ? "?" + qs : ""}`);
export const getCountByCountry = (qs = "") =>
  apiFetch(`/agg/count-by-country/${qs ? "?" + qs : ""}`);
export const getEvents = (qs = "") => apiFetch(`/events/${qs ? "?" + qs : ""}`);
