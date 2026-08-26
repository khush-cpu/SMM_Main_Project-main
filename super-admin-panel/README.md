# Super Admin Console (React + Vite)

Connected to the SuperAdmin backend API described in your API docs
(`/api/superadmin/*`, JWT bearer auth).

## Setup

```bash
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL to point at your backend
npm run dev
```

`.env`:

```
VITE_API_BASE_URL=https://your-backend-domain.com
```

Don't include `/api/superadmin` in this value — it's appended automatically
in `src/utils/api.js`. For local backend development use something like
`VITE_API_BASE_URL=http://localhost:5000`.

Build for production:

```bash
npm run build
npm run preview
```

## What's wired to the real API

| Screen | Endpoint |
|---|---|
| Register | `POST /api/superadmin/register` |
| Login | `POST /api/superadmin/login` (stores JWT) |
| Admin Panel → Create agency | `POST /api/superadmin/agencies/create` |
| Admin Panel → Agency list | `GET /api/superadmin/agencies` (page, limit, sort, search, subscriptionStatus) |
| Admin Panel → Edit agency | `PUT /api/superadmin/agencies/:id` (partial update — only changed fields are sent) |
| Admin Panel → Activate/Deactivate | `PATCH /api/superadmin/agencies/:id/toggle-status` |
| Admin Panel → Subscription | `PATCH /api/superadmin/agencies/:id/activate-subscription` |
| Admin Panel → Delete | `DELETE /api/superadmin/agencies/:id` |

Every protected call automatically sends `Authorization: Bearer <token>`
(the token saved in `localStorage` at login) — see `src/utils/api.js`.
A `401` response clears the session and the user is bounced back to
`/login` via `ProtectedRoute`.

## Forgot password / reset password — not in the API docs

The SuperAdmin API documentation you gave me only lists `POST /register`
and `POST /login` as public routes. There is **no forgot-password or
reset-password endpoint** on the backend yet, so:

- The Forgot/Reset password screens still exist in the UI (`/forgot-password`,
  `/reset-password`) so the flow is ready to go, but submitting them shows a
  clear message instead of pretending it worked.
- To make this real, add two routes to your backend, e.g.:
  - `POST /api/superadmin/forgot-password` — body `{ email }`, sends a reset
    link/token.
  - `POST /api/superadmin/reset-password` — body `{ token, newPassword }`.
- Then wire them up in `src/services/authService.js` (two new functions,
  mirroring `loginSuperAdmin`) and swap the `throw new Error(...)` calls in
  `forgotPassword` / `resetPassword` inside `src/context/AuthContext.jsx`
  for real API calls.

## Project structure

```
src/
  utils/api.js                 axios instance: base URL, JWT header, error unwrapping
  services/authService.js      register / login API calls
  services/agencyService.js    agency CRUD + status + subscription API calls
  context/AuthContext.jsx      auth state (register, login, logout, forgot/reset stubs)
  components/
    ProtectedRoute.jsx         redirects to /login if no valid session
    Topbar.jsx                 admin panel top bar (brand, user chip, sign out)
    BrandMark.jsx               logo mark used on auth screens
    EditAgencyModal.jsx         PUT /agencies/:id — partial update form
    SubscriptionModal.jsx       PATCH .../activate-subscription form
  pages/
    Register.jsx
    Login.jsx
    ForgotPassword.jsx          shows the "not in API docs" notice
    ResetPassword.jsx           shows the "not in API docs" notice
    AdminPanel.jsx               create agency + searchable/paginated list + actions
    NotFound.jsx
```

## Flow

1. `/register` — create the one-and-only super admin account (backend
   rejects a second one with a 400).
2. `/login` — sign in; JWT is stored and attached to every subsequent
   request.
3. Redirected to `/admin` — the agency console.
4. Fill in the agency form (name, owner, email, password + confirm are
   required; the rest — Aadhar, PAN, website, phone, state, city, country —
   are optional) and click **Create agency**. Use **Generate a strong
   password** if you don't want to type one. The backend starts a 3-day
   trial and emails the credentials to the agency itself.
5. The agency list below supports search, subscription-status filter,
   sort, and pagination, with per-agency **Edit**, **Subscription**,
   **Activate/Deactivate**, and **Delete** actions.

## Notes

- No endpoints for listing/managing super admins themselves were in the
  docs (only one super admin ever exists), so there's no "manage admins"
  screen.
- `sap_token` and `sap_current_user` in `localStorage` are the only client
  state kept locally now — agencies and admin data all come from your API.
