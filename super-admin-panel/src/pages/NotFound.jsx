import { Link } from "react-router-dom";
import BrandMark from "../components/BrandMark";

export default function NotFound() {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <BrandMark />
        <h1>Page not found</h1>
        <p className="auth-sub">The page you're looking for doesn't exist.</p>
        <Link to="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
