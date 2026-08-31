import { useState } from "react";
import { updateAgency, uploadAgencyLogo } from "../services/agencyService";

const FIELDS = [
  ["name", "Agency name", "text"],
  ["owner", "Owner name", "text"],
  ["email", "Email", "email"],
  ["phoneNumber", "Phone", "tel"],
  ["aadharCard", "Aadhar card", "text"],
  ["panCard", "PAN card", "text"],
  ["websiteOrSocialLink", "Website / social link", "text"],
  ["state", "State", "text"],
  ["city", "City", "text"],
  ["country", "Country", "text"],
  ["address", "Address", "text"],
  ["bankName", "Bank name", "text"],
  ["ifsc", "IFSC code", "text"],
  ["accountNumber", "Account number", "text"],
  ["branch", "Branch", "text"],
  ["accountType", "Account type", "text"],
];

export default function EditAgencyModal({ agency, onClose, onUpdated }) {
  const [form, setForm] = useState(() =>
    FIELDS.reduce((acc, [key]) => {
      acc[key] = agency[key] || "";
      return acc;
    }, {})
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(agency.logo || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleLogoUpload() {
    if (!logoFile) return;
    setLogoError("");
    setLogoUploading(true);
    try {
      await uploadAgencyLogo(logoFile);
      setLogoFile(null);
    } catch (err) {
      setLogoError(err.message);
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // Only send fields that actually changed — PUT allows partial update.
      const changed = {};
      FIELDS.forEach(([key]) => {
        if (form[key] !== (agency[key] || "")) changed[key] = form[key];
      });
      const data = await updateAgency(agency._id || agency.id, changed);
      onUpdated(data.data?.agency || { ...agency, ...changed });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cred-overlay" onClick={onClose}>
      <div className="cred-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="cred-top">
          <span className="cred-issued">Edit agency</span>
          <button className="cred-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="cred-body">
          <h3>{agency.name}</h3>
          <p className="cred-email">Only changed fields are sent to the API.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="edit-logo">Logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8 }}
                />
              )}
              <input id="edit-logo" type="file" accept="image/*" onChange={handleLogoChange} />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleLogoUpload}
                disabled={!logoFile || logoUploading}
              >
                {logoUploading ? "Uploading…" : "Upload logo"}
              </button>
            </div>
            {logoError && <div className="alert alert-error">{logoError}</div>}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {FIELDS.map(([key, label, type]) => (
                <div className="field" key={key}>
                  <label htmlFor={`edit-${key}`}>{label}</label>
                  <input
                    id={`edit-${key}`}
                    type={type}
                    value={form[key]}
                    onChange={update(key)}
                  />
                </div>
              ))}
            </div>
            <div className="cred-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
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
