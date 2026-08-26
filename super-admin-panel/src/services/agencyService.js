import api from "../utils/api";

// POST /agencies/create
export async function createAgency(payload) {
  const res = await api.post("/agencies/create", payload);
  return res.data; // { success, msg, agency }
}

// GET /agencies?page=&limit=&sort=&search=&subscriptionStatus=
export async function getAgencies(params = {}) {
  const res = await api.get("/agencies", { params });
  return res.data; // { success, msg, data: { agencies, pagination } }
}

// GET /agencies/:id
export async function getAgency(id) {
  const res = await api.get(`/agencies/${id}`);
  return res.data; // { success, msg, data: { agency } }
}

// PUT /agencies/:id  (partial update — only send changed fields)
export async function updateAgency(id, payload) {
  const res = await api.put(`/agencies/${id}`, payload);
  return res.data; // { success, msg, data: { agency } }
}

// PATCH /agencies/:id/toggle-status
export async function toggleAgencyStatus(id) {
  const res = await api.patch(`/agencies/${id}/toggle-status`);
  return res.data; // { success, msg, data: { agencyId, isActive } }
}

// PATCH /agencies/:id/activate-subscription
export async function activateAgencySubscription(id, { planType, durationDays }) {
  const res = await api.patch(`/agencies/${id}/activate-subscription`, {
    planType,
    durationDays,
  });
  return res.data; // { success, msg, data: { agency } }
}

// DELETE /agencies/:id
export async function deleteAgency(id) {
  const res = await api.delete(`/agencies/${id}`);
  return res.data; // { success, msg, data: { deletedAgencyId } }
}

// POST /api/agency/branding/logo  (multipart/form-data, key: "logo")
// Note: this endpoint lives under /api/agency, not /api/superadmin,
// so the base "/api/superadmin" prefix is overridden for this call.
export async function uploadAgencyLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);

  const res = await api.post("/agency/branding/logo", formData, {
    baseURL: `${import.meta.env.VITE_API_BASE_URL || ""}/api`,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { success, msg, data: { ... } }
}
