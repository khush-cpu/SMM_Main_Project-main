import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <BrandMark />
        <h1>Sign in</h1>
        <p className="auth-sub">Access the super admin console.</p>

        {location.state?.registered && (
          <div className="alert alert-success">
            Account created. Sign in to continue.
          </div>
        )}
        {location.state?.resetDone && (
          <div className="alert alert-success">
            Password updated. Sign in with your new password.
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              required
              value={form.email}
              onChange={update("email")}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              required
              value={form.password}
              onChange={update("password")}
            />
            <div className="field-hint">
              <Link to="/forgot-password" className="link">
                Forgot password?
              </Link>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-foot">
          No account yet? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
