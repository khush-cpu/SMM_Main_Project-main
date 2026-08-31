import axios from "axios";

// Base URL comes from .env (VITE_API_BASE_URL). See .env.example.
// Falls back to a same-origin /api/superadmin if not set.
const baseURL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/superadmin`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    // Skips ngrok's free-tier HTML interstitial warning page, which has
    // no CORS headers and causes "blocked by CORS policy" even though
    // the request actually reaches the tunnel (shows as 200 OK).
    "ngrok-skip-browser-warning": "true",
  },
});

// Attach the SuperAdmin JWT (if present) to every protected request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sap_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralised error unwrapping — the backend always responds with
// { success: false, msg: "..." } on failure, so surface `msg` as the
// JS Error message everywhere calling code does try/catch.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error.response?.data?.msg ||
      error.message ||
      "Something went wrong. Please try again.";

    // Token missing/expired/invalid — clear session so the app falls
    // back to the login screen next render.
    if (error.response?.status === 401) {
      localStorage.removeItem("sap_token");
      localStorage.removeItem("sap_current_user");
    }

    return Promise.reject(new Error(msg));
  }
);

export default api;
