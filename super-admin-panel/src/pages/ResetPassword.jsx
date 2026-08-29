import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token: token.trim(), newPassword: password });
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
        <Link to="/login" className="back-link">
          ← Back to sign in
        </Link>
        <h1>Reset password</h1>
        <p className="auth-sub">
          Paste the token from your reset email, then choose a new password.
        </p>

        <div className="alert alert-info">
          There's no <code>/reset-password</code> endpoint in the SuperAdmin
          API docs yet, so this can't update a real password until your
          backend adds it. This screen is ready to go the moment that route
          exists — see README.md.
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="token">Reset token</label>
            <input
              id="token"
              type="text"
              placeholder="Paste token here"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm new password</label>
            <input
              id="confirm"
              type="password"
              placeholder="Re-enter new password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
