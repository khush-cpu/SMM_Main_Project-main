import { useEffect, useState, useCallback } from "react";
import Topbar from "../components/Topbar";
import EditAgencyModal from "../components/EditAgencyModal";
import SubscriptionModal from "../components/SubscriptionModal";
import {
  createAgency,
  getAgencies,
  toggleAgencyStatus,
  deleteAgency,
  uploadAgencyLogo,
} from "../services/agencyService";
import { generateStrongPassword } from "../utils/generators";

const emptyForm = {
  name: "",
  owner: "",
  email: "",
  password: "",
  confirmPassword: "",
  aadharCard: "",
  panCard: "",
  websiteOrSocialLink: "",
  phoneNumber: "",
  state: "",
  city: "",
  country: "",
  address: "",
  bankName: "",
  ifsc: "",
  accountNumber: "",
  branch: "",
  accountType: "",
};

export default function AdminPanel() {
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [agencies, setAgencies] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [actionError, setActionError] = useState("");

  const [editingAgency, setEditingAgency] = useState(null);
  const [subAgency, setSubAgency] = useState(null);

  const loadAgencies = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const params = { page, limit: 10, sort };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.subscriptionStatus = statusFilter;
      const data = await getAgencies(params);
      setAgencies(data.data?.agencies || []);
      setPagination(data.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
  }, [page, sort, search, statusFilter]);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function fillGeneratedPassword() {
    const pwd = generateStrongPassword(12);
    setForm((f) => ({ ...f, password: pwd, confirmPassword: pwd }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setCreating(true);
    try {
      const data = await createAgency(form);
      if (logoFile) {
        try {
          await uploadAgencyLogo(logoFile);
        } catch (logoErr) {
          setFormError(`Agency created, but logo upload failed: ${logoErr.message}`);
        }
      }
      setSuccessMsg(data.msg || `${form.name} was created and credentials were emailed.`);
      setForm(emptyForm);
      setLogoFile(null);
      setLogoPreview("");
      setPage(1);
      loadAgencies();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(agency) {
    setActionError("");
    try {
      await toggleAgencyStatus(agency._id || agency.id);
      loadAgencies();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(agency) {
    if (!window.confirm(`Permanently delete "${agency.name}"? This cannot be undone.`)) return;
    setActionError("");
    try {
      await deleteAgency(agency._id || agency.id);
      loadAgencies();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="app-shell">
      <Topbar />
      <div className="main-content">
        <div className="page-head">
          <span className="eyebrow">Super admin console</span>
          <h1>Agencies</h1>
          <p>Create agency accounts. Login credentials are emailed by the backend automatically.</p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Create a new agency</h2>
          </div>

          {formError && <div className="alert alert-error">{formError}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Agency name *</label>
                <input id="name" type="text" placeholder="Skyline Media Agency" required value={form.name} onChange={update("name")} />
              </div>
              <div className="field">
                <label htmlFor="owner">Owner name *</label>
                <input id="owner" type="text" placeholder="Riya Kapoor" required value={form.owner} onChange={update("owner")} />
              </div>
              <div className="field">
                <label htmlFor="email">Agency email *</label>
                <input id="email" type="email" placeholder="contact@agency.com" required value={form.email} onChange={update("email")} />
              </div>
              <div className="field">
                <label htmlFor="phoneNumber">Phone</label>
                <input id="phoneNumber" type="tel" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={update("phoneNumber")} />
              </div>
              <div className="field">
                <label htmlFor="password">Password *</label>
                <input id="password" type="text" placeholder="At least 8 characters" required value={form.password} onChange={update("password")} />
                <div className="field-hint">
                  <button type="button" className="link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }} onClick={fillGeneratedPassword}>
                    Generate a strong password
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm password *</label>
                <input id="confirmPassword" type="text" placeholder="Re-enter password" required value={form.confirmPassword} onChange={update("confirmPassword")} />
              </div>
              <div className="field">
                <label htmlFor="aadharCard">Aadhar card</label>
                <input id="aadharCard" type="text" value={form.aadharCard} onChange={update("aadharCard")} />
              </div>
              <div className="field">
                <label htmlFor="panCard">PAN card</label>
                <input id="panCard" type="text" value={form.panCard} onChange={update("panCard")} />
              </div>
              <div className="field">
                <label htmlFor="websiteOrSocialLink">Website / social link</label>
                <input id="websiteOrSocialLink" type="text" value={form.websiteOrSocialLink} onChange={update("websiteOrSocialLink")} />
              </div>
              <div className="field">
                <label htmlFor="state">State</label>
                <input id="state" type="text" value={form.state} onChange={update("state")} />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" type="text" value={form.city} onChange={update("city")} />
              </div>
              <div className="field">
                <label htmlFor="country">Country</label>
                <input id="country" type="text" value={form.country} onChange={update("country")} />
              </div>
              <div className="field">
                <label htmlFor="address">Address</label>
                <input id="address" type="text" value={form.address} onChange={update("address")} />
              </div>
              <div className="field">
                <label htmlFor="bankName">Bank name</label>
                <input id="bankName" type="text" value={form.bankName} onChange={update("bankName")} />
              </div>
              <div className="field">
                <label htmlFor="ifsc">IFSC code</label>
                <input id="ifsc" type="text" value={form.ifsc} onChange={update("ifsc")} />
              </div>
              <div className="field">
                <label htmlFor="accountNumber">Account number</label>
                <input id="accountNumber" type="text" value={form.accountNumber} onChange={update("accountNumber")} />
              </div>
              <div className="field">
                <label htmlFor="branch">Branch</label>
                <input id="branch" type="text" value={form.branch} onChange={update("branch")} />
              </div>
              <div className="field">
                <label htmlFor="accountType">Account type</label>
                <select
                  id="accountType"
                  value={form.accountType}
                  onChange={update("accountType")}
                  style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "14.5px", padding: "11px 13px", borderRadius: "var(--radius-s)" }}
                >
                  <option value="">Select</option>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="logo">Logo</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }}
                    />
                  )}
                  <input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
                </div>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={creating} style={{ width: "auto", padding: "12px 22px" }}>
              {creating ? "Creating & emailing credentials…" : "Create agency"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>All agencies</h2>
            <span className="count">{pagination.total}</span>
          </div>

          <div className="form-grid" style={{ marginBottom: 18 }}>
            <div className="field">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="text"
                placeholder="Name, email, or owner"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              />
            </div>
            <div className="field">
              <label htmlFor="statusFilter">Subscription status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
                style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "14.5px", padding: "11px 13px", borderRadius: "var(--radius-s)" }}
              >
                <option value="">All</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="sort">Sort by created</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => { setPage(1); setSort(e.target.value); }}
                style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "14.5px", padding: "11px 13px", borderRadius: "var(--radius-s)" }}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>

          {actionError && <div className="alert alert-error">{actionError}</div>}
          {listError && <div className="alert alert-error">{listError}</div>}

          {listLoading ? (
            <div className="empty-state"><p>Loading agencies…</p></div>
          ) : agencies.length === 0 ? (
            <div className="empty-state">
              <h3>No agencies found</h3>
              <p>Agencies you create will show up here.</p>
            </div>
          ) : (
            <div>
              {agencies.map((a) => (
                <div className="agency-row" key={a._id || a.id}>
                  <div className="agency-id-block">
                    <div className="agency-badge" style={a.logo ? { padding: 0, overflow: "hidden" } : undefined}>
                      {a.logo ? (
                        <img
                          src={a.logo}
                          alt={`${a.name} logo`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                        />
                      ) : (
                        (a.name || "?").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="agency-name">{a.name}</div>
                      <div className="agency-meta">
                        {a.email} · {a.owner}
                        {a.subscriptionStatus ? ` · ${a.subscriptionStatus}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="status-tag" style={a.isActive === false ? { background: "var(--danger-soft)", color: "var(--danger)" } : undefined}>
                      {a.isActive === false ? "Inactive" : "Active"}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingAgency(a)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSubAgency(a)}>Subscription</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(a)}>
                      {a.isActive === false ? "Activate" : "Deactivate"}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(a)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22 }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span style={{ fontSize: 13, color: "var(--muted)", alignSelf: "center" }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {editingAgency && (
        <EditAgencyModal
          agency={editingAgency}
          onClose={() => setEditingAgency(null)}
          onUpdated={() => { setEditingAgency(null); loadAgencies(); }}
        />
      )}

      {subAgency && (
        <SubscriptionModal
          agency={subAgency}
          onClose={() => setSubAgency(null)}
          onUpdated={() => { setSubAgency(null); loadAgencies(); }}
        />
      )}
    </div>
  );
}
