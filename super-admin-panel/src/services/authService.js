import api from "../utils/api";

// POST /register — one-time only, backend rejects with 400 if a
// SuperAdmin already exists.
export async function registerSuperAdmin(payload) {
  const res = await api.post("/register", payload);
  return res.data; // { success, msg, superAdmin }
}

// POST /login
export async function loginSuperAdmin(payload) {
  const res = await api.post("/login", payload);
  return res.data; // { success, msg, token, superAdmin }
}
