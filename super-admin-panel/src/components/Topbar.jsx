import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandMark from "./BrandMark";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.name || user?.email || "?")
    .trim()
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="topbar">
      <Link to="/admin" style={{ textDecoration: "none" }}>
        <div style={{ marginBottom: 0 }}>
          <BrandMark />
        </div>
      </Link>
      <div className="topbar-right">
        <div className="user-chip">
          <span className="avatar">{initials}</span>
          <span>{user?.name || user?.email}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
