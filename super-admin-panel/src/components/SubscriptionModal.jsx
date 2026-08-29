import { useState } from "react";
import { activateAgencySubscription } from "../services/agencyService";

export default function SubscriptionModal({ agency, onClose, onUpdated }) {
  const [planType, setPlanType] = useState("pro");
  const [durationDays, setDurationDays] = useState(30);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await activateAgencySubscription(agency._id || agency.id, {
        planType,
        durationDays: Number(durationDays),
      });
      onUpdated(data.data?.agency || agency, data.msg);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cred-overlay" onClick={onClose}>
      <div className="cred-card" onClick={(e) => e.stopPropagation()}>
        <div className="cred-top">
          <span className="cred-issued">Subscription</span>
          <button className="cred-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="cred-body">
          <h3>{agency.name}</h3>
          <p className="cred-email">Activate or upgrade this agency's plan.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="planType">Plan type</label>
              <select
                id="planType"
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontSize: "14.5px",
                  padding: "11px 13px",
                  borderRadius: "var(--radius-s)",
                }}
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="durationDays">Duration (days)</label>
              <input
                id="durationDays"
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>
            <div className="cred-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Activating…" : "Activate subscription"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
