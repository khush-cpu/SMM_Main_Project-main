import { createContext, useContext, useState, useCallback } from "react";
import { registerSuperAdmin, loginSuperAdmin } from "../services/authService";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("sap_current_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser());

  const register = useCallback(async ({ name, email, password, confirmPassword }) => {
    const data = await registerSuperAdmin({ name, email, password, confirmPassword });
    return data.superAdmin;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginSuperAdmin({ email, password });
    localStorage.setItem("sap_token", data.token);
    localStorage.setItem("sap_current_user", JSON.stringify(data.superAdmin));
    setUser(data.superAdmin);
    return data.superAdmin;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sap_token");
    localStorage.removeItem("sap_current_user");
    setUser(null);
  }, []);

  // NOTE: The SuperAdmin API documentation provided only lists
  // POST /register and POST /login as public endpoints — there is no
  // forgot-password / reset-password route on the backend yet. These
  // two functions are intentionally NOT wired to a real endpoint; they
  // reject with a clear message so the UI can explain that instead of
  // silently pretending it worked. See README.md for the exact routes
  // to add on the backend to make this flow real.
  const forgotPassword = useCallback(async () => {
    throw new Error(
      "Backend has no /forgot-password endpoint yet (not in the provided API docs). Add one to enable this."
    );
  }, []);

  const resetPassword = useCallback(async () => {
    throw new Error(
      "Backend has no /reset-password endpoint yet (not in the provided API docs). Add one to enable this."
    );
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user && localStorage.getItem("sap_token")),
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
