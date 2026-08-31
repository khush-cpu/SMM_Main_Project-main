import { useState } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
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
        <h1>Forgot password</h1>
        <p className="auth-sub">
          Enter your account email and we'll send a reset link.
        </p>

        <div className="alert alert-info">
          Your backend's SuperAdmin API only exposes <code>/register</code>{" "}
          and <code>/login</code> as public routes — there's no
          forgot/reset-password endpoint yet, so this form can't complete
          against the real backend. Add <code>POST /forgot-password</code>{" "}
          and <code>POST /reset-password</code> routes to your API, then wire
          them up in <code>src/services/authService.js</code> and{" "}
          <code>src/context/AuthContext.jsx</code>.
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
