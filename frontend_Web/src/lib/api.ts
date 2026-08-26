// ─── Central API client ───────────────────────────────────────────────────────

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  // "https://whacking-dispute-agility.ngrok-free.dev";
  // "https://smm-backend1-stkn.onrender.com";
  "https://gc360smm.duckdns.org";
  // "https://gc360smm.duckdns.org";
  

export const REDIRECT_URI =
  import.meta.env.VITE_REDIRECT_URI ||
  `${window.location.origin}/auth/callback`;

// ─── OAuth Platforms ─────────────────────────────────────────────────────────

export const PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest"
] as const;

export type PlatformId = (typeof PLATFORMS)[number];

export const OAUTH_ROUTES: Record<PlatformId, string> = {
  facebook: "/api/social/auth/facebook",
  instagram: "/api/social/auth/instagram",
  twitter: "/api/social/auth/twitter",
  linkedin: "/api/social/auth/linkedin",
  youtube: "/api/social/auth/google",
  pinterest: "/api/social/auth/pinterest",
};

// ─── Backend Platform Key Mapping ───────────────────────────────────────────
// Backend dev ka naya rule: Instagram ab purane Facebook-linked Instagram
// OAuth flow se connect nahi hota — ab ek naya, alag platform key
// "instagramLogin" use hota hai jo seedha Instagram ka apna login page
// dikhata hai (Facebook nahi). Ye sirf BACKEND ko bheji jaane wali request
// (auth URL fetch + connect confirm) ke liye hai — UI mein (buttons, channel
// list, localStorage, saare pages) hamesha "instagram" hi use/store/dikhaya
// jayega. Success ke baad backend khud account ko "instagram" platform ke
// roop mein hi return karega, isliye channel list mein bhi kuch alag nahi
// dikhega.
const BACKEND_PLATFORM_KEY: Partial<Record<string, string>> = {
  instagram: "instagramLogin",
};

const toBackendPlatform = (platform: string): string =>
  BACKEND_PLATFORM_KEY[platform.toLowerCase().trim()] ?? platform;

const API_KEY =
  import.meta.env.VITE_API_KEY ||
  "sf_live_a7k92mXpQ3nR8vTz5wYdJ6bLcU1eHi4o";

// ─── Generic POST Request ─────────────────────────────────────────────────────

async function request<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    const errMsg =
      json?.message || json?.msg || json?.error || `Request failed (${res.status})`;

    if (!res.ok) return { data: null, error: errMsg };
    if (json?.success === false) return { data: null, error: errMsg };

    return { data: json as T, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ─── Authenticated Request (JSON) ────────────────────────────────────────────

async function authRequest<T = unknown>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  token: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  // Guard: token khali ho to early return
  if (!token || token.trim() === "") {
    return { data: null, error: "Session expired. Please login again." };
  }
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
      "x-api-key": API_KEY,
      // FIXED: GET requests (e.g. client/SMM/GD list) ko browser ya
      // ngrok jaisa proxy kabhi-kabhi cache kar leta tha, isliye kabhi
      // list blank (purani "khaali" cached response) ya kabhi delete
      // ho chuka purana data dikhta tha. Ab explicitly no-cache force.
      "Cache-Control": "no-cache",
    };

    if (method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      cache: "no-store",
      headers,
      body: body && method !== "GET" ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error:
          json?.message ||
          json?.msg ||
          json?.error ||
          `Request failed (${res.status})`,
      };
    }

    if (json?.success === false) {
      return {
        data: null,
        error: json?.message || json?.msg || json?.error || "Request failed",
      };
    }

    return { data: json as T, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ─── Authenticated Request (FormData) ────────────────────────────────────────
// Use this for endpoints that require multipart/form-data (e.g. file uploads)

async function authRequestFormData<T = unknown>(
  path: string,
  token: string,
  formData: FormData
): Promise<{ data: T | null; error: string | null }> {
  try {
    // NOTE: Do NOT set Content-Type manually — browser sets it with boundary automatically
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
        "x-api-key": API_KEY,
      },
      body: formData,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error:
          json?.message ||
          json?.msg ||
          json?.error ||
          `Request failed (${res.status})`,
      };
    }

    if (json?.success === false) {
      return {
        data: null,
        error: json?.message || json?.msg || json?.error || "Request failed",
      };
    }

    return { data: json as T, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ─── SESSION ──────────────────────────────────────────────────────────────────

const SESSION_KEY = "sf_session";

export interface AppSession {
  token: string;
  email: string;
  userId?: string;
}

export function saveSession(s: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function getSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── PROFILE API ──────────────────────────────────────────────────────────────

export interface ProfileUser {
  name: string;
  email: string;
  mobileNumber: string;
  // NEW: role/specialization/experience — agar backend inhe profile response
  // me bhejta hai (SMM/GD ke liye), to Profile section me dikhaye jaate hain.
  role?: string;
  specialization?: string;
  designation?: string;
  experience?: string;
}

export interface ProfileRes {
  success: boolean;
  user?: ProfileUser;
  message?: string;
}

export const apiGetProfile = (token: string) =>
  authRequest<ProfileRes>("/api/user/profile", "GET", token);

export const apiUpdateProfile = (
  token: string,
  name: string,
  mobileNumber: string
) =>
  authRequest<ProfileRes>("/api/user/profile", "PUT", token, {
    name,
    mobileNumber,
  });

export const apiDeleteProfile = (token: string, password: string) =>
  authRequest<{ success: boolean; message?: string }>(
    "/api/user/profile",
    "DELETE",
    token,
    { password }
  );

// NEW: Non-admin users (SMM / Graphic Designer / Client) ke liye password
// change karne ka generic endpoint — admin ke "apiAdminChangePassword" jaisa
// hi pattern follow karta hai.
export const apiChangePassword = (
  token: string,
  oldPassword: string,
  newPassword: string
) =>
  authRequest<{ success?: boolean; message?: string; msg?: string }>(
    "/api/user/change-password",
    "PUT",
    token,
    { oldPassword, newPassword }
  );

// ─── SOCIAL CONNECT ───────────────────────────────────────────────────────────

export interface SocialConnectRes {
  success?: boolean;
  message?: string;
  authUrl?: string;
  url?: string;
  redirectUrl?: string;
  [key: string]: unknown;
}
export const apiSocialConnect = (
  token: string,
  platform: string,
  code: string,
  state: string,
  codeVerifier?: string,
  clientId?: string
) => {
  // Backend ko hamesha mapped key bhejo (e.g. instagram -> instagramLogin);
  // caller (UI) apna original "platform" hi use karta rehta hai.
  const backendPlatform = toBackendPlatform(platform);

  console.log("JWT Token:", token);
  console.log("Platform:", backendPlatform);
  console.log("Code:", code);
  console.log("ClientId:", clientId);

  return authRequest<SocialConnectRes>(
    "/api/social/connect",
    "POST",
    token,
    {
      platform: backendPlatform,
      code,
      state,
      codeVerifier,
      redirectUri: REDIRECT_URI,
      ...(clientId ? { clientId } : {}),
    }
  );
};



// ✅ FIX: clientId ab query param mein pass hota hai
// Backend pe SMM ke liye clientId MANDATORY hai — bina iske 400 error aata tha
// ⚠️ RULE (backend ke kehne pe): kisi bhi platform (Facebook/Instagram/
// Pinterest/LinkedIn/Threads/YouTube) ka OAuth URL KABHI khud se
// construct mat karo (jaise "facebook.com/dialog/oauth?client_id=...").
// Hamesha yahi function call karo — jo backend se already-correct
// redirect_uri ke saath bana hua authUrl leke aata hai. Response ke
// `authUrl` (ya `url`/`redirectUrl`) ko seedha window.location.href
// mein daalo, usme kuch add/edit mat karo.
export const apiGetOAuthUrl = (token: string, platform: string, clientId?: string) => {
  // e.g. "instagram" -> "instagramLogin" (naya direct-Instagram-login flow)
  const backendPlatform = toBackendPlatform(platform);
  return authRequest<{ authUrl?: string; url?: string; redirectUrl?: string }>(
    `/api/social/auth/${backendPlatform}${clientId ? `?clientId=${clientId}` : ""}`,
    "GET",
    token
  );
};

// ─── CHANNELS ────────────────────────────────────────────────────────────────

export interface SocialChannel {
  id?: string;
  _id?: string;
  platform: string;
  username?: string;
  name?: string;
  avatar?: string;
  connected?: boolean;
  [key: string]: unknown;
}

export interface ChannelsRes {
  success?: boolean;
  channels?: SocialChannel[];
  data?: SocialChannel[];
  accounts?: SocialChannel[];
  [key: string]: unknown;
}

export const apiGetChannels = (
  token: string,
  opts?: { clientId?: string; platform?: string }
) => {
  const params = new URLSearchParams();
  if (opts?.clientId) params.set("clientId", opts.clientId);
  if (opts?.platform) params.set("platform", opts.platform);
  const qs = params.toString();
  return authRequest<ChannelsRes>(
    `/api/social/accounts${qs ? `?${qs}` : ""}`,
    "GET",
    token
  );
};

export const apiDisconnectChannel = (token: string, channelId: string) =>
  authRequest<{ success?: boolean; message?: string }>(
    `/api/social/disconnect/${channelId}`,
    "DELETE",
    token
  );

// ─── POSTS API ────────────────────────────────────────────────────────────────

export interface Post {
  id?: string;
  _id?: string;
  content: string;
  platforms: string[];
  tags?: string[];
  media?: (string | File)[];   // URLs from API, or File objects during upload
  status: "draft" | "scheduled" | "published" | "failed";
  scheduleAt?: string;
  scheduled_at?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface PostsRes {
  success?: boolean;
  posts?: Post[];
  data?: Post[];
  [key: string]: unknown;
}

export interface CreatePostRes {
  success?: boolean;
  message?: string;
  post?: Post;
  data?: Post;
  [key: string]: unknown;
}

// GET all posts (with optional status filter)
// export const apiGetPosts = (token: string, status?: string) => {
//   const qs = status ? `?status=${status}` : "";
//   return authRequest<PostsRes>(`/api/posts${qs}`, "GET", token);
// };
// ✅ NAYA
export const apiGetPosts = (token: string, status?: string) => {
  if (status === "published") {
    return authRequest<PostsRes>("/api/posts/published", "GET", token);
  }
  const qs = status ? `?status=${status}` : "";
  return authRequest<PostsRes>(`/api/posts${qs}`, "GET", token);
};

// Create / Schedule post — sends as FormData (backend expects multipart)
// export const apiCreatePost = (
//   token: string,
//   content: string,
//   platforms: string[],
//   tags: string[],
//   mediaFiles: (File | string)[],   // File objects OR existing URLs
//   scheduleAt: string
// ) => {
//   const fd = new FormData();
//   fd.append("content", content);

//   // Arrays must be appended individually — FormData doesn't support JSON arrays
// platforms.forEach((p) => fd.append("platforms", p));
// tags.forEach((t) => fd.append("tags", t));

//   // Attach actual File objects if present
//   mediaFiles.forEach((m) => {
//     if (m instanceof File) {
//       fd.append("media", m);
//     } else if (typeof m === "string" && m) {
//       fd.append("mediaUrls[]", m);
//     }
//   });

//   if (scheduleAt) fd.append("scheduleAt", scheduleAt);

//   return authRequestFormData<CreatePostRes>("/api/posts/create", token, fd);
// };

// ── ONLY apiCreatePost function replace karo in api.ts ──────────────
// Baki sab same rehega

// Create / Schedule post — sends as FormData (backend expects multipart)
// export const apiCreatePost = (
//   token: string,
//   content: string,
//   platforms: string[],
//   tags: string[],
//   mediaFiles: (File | string)[],
//   scheduleAt: string | null,
//   youtubeTitle?:   string,   // YouTube ke liye video title
//   youtubePrivacy?: string    // "public" | "private" | "unlisted"
// ) => {
//   const fd = new FormData();
//   fd.append("content", content);

//   platforms.forEach((p) => fd.append("platforms", p));
//   tags.forEach((t) => fd.append("tags", t));

//   mediaFiles.forEach((m) => {
//     if (m instanceof File) {
//       fd.append("media", m);
//     } else if (typeof m === "string" && m) {
//       fd.append("mediaUrls[]", m);
//     }
//   });

//   if (scheduleAt)     fd.append("scheduleAt",     scheduleAt);
//   if (youtubeTitle)   fd.append("youtubeTitle",   youtubeTitle);
//   if (youtubePrivacy) fd.append("youtubePrivacy", youtubePrivacy);

//   return authRequestFormData<CreatePostRes>("/api/posts/create", token, fd);
// };

export interface PlatformAccount {
  platform: string;
  accountId: string;
}

export const apiCreatePost = (
  token: string,
  content: string,
  platforms: string[],
  tags: string[],
  mediaFiles: (File | string)[],
  scheduleAt: string | null,
  youtubeTitle?:   string,
  youtubePrivacy?: string,
  clientId?: string,                    // ✅ SMM ke liye mandatory
  platformAccounts?: PlatformAccount[]   // ✅ ADD: backend-confirmed field —
                                          // batata hai kis platform ke kis
                                          // specific account/page pe post
                                          // jaani hai, e.g. Facebook Page.
) => {
  const fd = new FormData();
  fd.append("content", content);

  platforms.forEach((p) => fd.append("platforms", p));
  tags.forEach((t) => fd.append("tags", t));

  mediaFiles.forEach((m) => {
    if (m instanceof File) {
      fd.append("media", m);
    } else if (typeof m === "string" && m) {
      fd.append("mediaUrls[]", m);
    }
  });

  if (scheduleAt)     fd.append("scheduleAt",     scheduleAt);
  if (youtubeTitle)   fd.append("youtubeTitle",   youtubeTitle);
  if (youtubePrivacy) fd.append("youtubePrivacy", youtubePrivacy);
  if (clientId)       fd.append("clientId",       clientId);
  if (platformAccounts && platformAccounts.length > 0) {
    // multipart/form-data mein array/object seedha nahi jaata — backend ke
    // kehne pe JSON.stringify() karke string ke roop mein bhej rahe hain.
    fd.append("platformAccounts", JSON.stringify(platformAccounts));
  }

  return authRequestFormData<CreatePostRes>("/api/posts/create", token, fd);
};

// Save as draft — sends as FormData (backend expects multipart)
export const apiSaveDraft = (
  token: string,
  content: string,
  platforms: string[],
  tags: string[],
  mediaFiles: (File | string)[],
  platformAccounts?: PlatformAccount[]   // ✅ ADD: draft ke liye bhi same field
) => {
  const fd = new FormData();
  fd.append("content", content);

  platforms.forEach((p) => fd.append("platforms", p));
  tags.forEach((t) => fd.append("tags", t));

  mediaFiles.forEach((m) => {
    if (m instanceof File) {
      fd.append("media", m);
    } else if (typeof m === "string" && m) {
      fd.append("mediaUrls[]", m);
    }
  });

  if (platformAccounts && platformAccounts.length > 0) {
    fd.append("platformAccounts", JSON.stringify(platformAccounts));
  }

  return authRequestFormData<CreatePostRes>("/api/posts/draft", token, fd);
};

// Publish immediately (PUT /api/posts/published/:id)
// export const apiPublishPost = (token: string, postId: string) =>
//   authRequest<CreatePostRes>(`/api/posts/published/`, "GET", token);
export const apiPublishPost = (token: string) =>
  authRequest<CreatePostRes>(
    "/api/posts/published",
    "GET",
    token
  );
// Delete post
export const apiDeletePost = (token: string, postId: string) =>
  authRequest<{ success?: boolean; message?: string }>(
    `/api/posts/${postId}`,
    "DELETE",
    token
  );

// Get queued posts (GET /api/posts/queued)
export const apiGetQueuedPosts = (token: string) =>
  authRequest<PostsRes>("/api/posts/queued", "GET", token);

// Get all drafts (GET /api/posts/drafts)
export const apiGetDrafts = (token: string) =>
  authRequest<PostsRes>("/api/posts/drafts", "GET", token);

// Update draft (PUT /api/posts/draft/:id) — sends as FormData
export const apiUpdateDraft = (
  token: string,
  draftId: string,
  content: string,
  platforms: string[],
  mediaFiles: (File | string)[]
) => {
  const fd = new FormData();
  fd.append("content", content);
  platforms.forEach((p) => fd.append("platforms", p));
  mediaFiles.forEach((m) => {
    if (m instanceof File) {
      fd.append("media", m);
    } else if (typeof m === "string" && m) {
      fd.append("mediaUrls[]", m);
    }
  });
  // PUT with FormData — use manual fetch (authRequestFormData only supports POST)
  return (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/draft/${draftId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
          "x-api-key": API_KEY,
        },
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        return {
          data: null,
          error: json?.message || json?.msg || json?.error || `Request failed (${res.status})`,
        };
      return { data: json as CreatePostRes, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : "Network error" };
    }
  })();
};

// Delete draft (DELETE /api/posts/draft/:id)
export const apiDeleteDraft = (token: string, draftId: string) =>
  authRequest<{ success?: boolean; message?: string }>(
    `/api/posts/draft/${draftId}`,
    "DELETE",
    token
  );

// ─── POSTS ANALYTICS OVERVIEW (GET /api/posts/overview) ─────────────────────
// Auth: SMM / Admin. Optional clientId scopes the overview to one client.

export interface PostsOverviewByPlatform {
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  impressions: number;
  posts: number;
}

export interface PostsOverviewProfileViewsByPlatform {
  platform: string;
  profileViews: number;
  reach: number;
}

export interface OverviewRes {
  success?: boolean;
  data?: {
    client?: unknown;
    posts?: {
      totalPosts?: number;
      draftPosts?: number;
      queuedPosts?: number;
      scheduledPosts?: number;
      publishedPosts?: number;
      [key: string]: unknown;
    };
    analytics?: {
      totalLikes?: number;
      totalComments?: number;
      totalShares?: number;
      totalViews?: number;
      totalReach?: number;
      totalImpressions?: number;
      totalEngagement?: number;
      totalProfileViews?: number;
      byPlatform?: PostsOverviewByPlatform[];
      profileViewsByPlatform?: PostsOverviewProfileViewsByPlatform[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const apiGetOverview = (token: string, clientId?: string) => {
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  return authRequest<OverviewRes>(`/api/posts/overview${qs}`, "GET", token);
};

// Get connected social accounts (GET /api/social/accounts)
export const apiGetSocialAccounts = (token: string) =>
  authRequest<ChannelsRes>("/api/social/accounts", "GET", token);

// Disconnect social account (DELETE /api/social/disconnect/:id)
export const apiDisconnectSocialAccount = (token: string, id: string) =>
  authRequest<{ success?: boolean; message?: string }>(
    `/api/social/disconnect/${id}`,
    "DELETE",
    token
  );

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export interface AnalyticsRes {
  success?: boolean;
  data?: {
    reach?: number;
    impressions?: number;
    engagement?: number;
    followers?: number;
    clicks?: number;
    profileVisits?: number;
    weeklyData?: { day: string; reach: number; engagement: number }[];
    platformData?: { platform: string; posts: number }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const apiGetAnalytics = (token: string, clientId?: string) => {
  const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  return authRequest<AnalyticsRes>(`/api/analytics${qs}`, "GET", token);
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export type NotificationType = "SUCCESS" | "ERROR" | "INFO" | "WARNING";

export interface NotificationItem {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsRes {
  notifications?: NotificationItem[];
  data?: NotificationItem[];
  total?: number;
  page?: number;
}

export const apiGetNotifications = (token: string, page = 1, limit = 10) =>
  authRequest<NotificationsRes>(
    `/api/notifications?page=${page}&limit=${limit}`,
    "GET",
    token
  );

export const apiMarkNotificationRead = (token: string, id: string) =>
  authRequest<{ success?: boolean; message?: string }>(
    `/api/notifications/${id}/read`,
    "PATCH",
    token
  );

export const apiCreateNotification = (
  token: string,
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) =>
  authRequest("/api/notifications/create", "POST", token, {
    userId,
    type,
    title,
    message,
  });

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface RegisterRes {
  message?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LoginRes {
  message?: string;
  userId?: string;
  _id?: string;
  id?: string;
  token?: string;
  loginToken?: string;
  email?: string;
  [key: string]: unknown;
}

export interface OtpRes {
  message?: string;
  token?: string;
  accessToken?: string;
  access_token?: string;
  user?: { id?: string; email?: string; [key: string]: unknown };
  [key: string]: unknown;
}

const OTP_META_KEY = "sf_otp_meta";

interface OtpMeta {
  userId?: string;
  loginToken?: string;
  email?: string;
}

function getPendingOtpMeta(): OtpMeta {
  try {
    const raw = sessionStorage.getItem(OTP_META_KEY);
    return raw ? (JSON.parse(raw) as OtpMeta) : {};
  } catch {
    return {};
  }
}

export function savePendingOtpMeta(meta: OtpMeta) {
  const existing = getPendingOtpMeta();
  sessionStorage.setItem(OTP_META_KEY, JSON.stringify({ ...existing, ...meta }));
}

export function clearPendingOtpMeta() {
  sessionStorage.removeItem(OTP_META_KEY);
}

export const apiRegister = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  mobileNumber: string
) =>
  request<RegisterRes>("/api/auth/register", {
    name,
    email,
    password,
    confirmPassword,
    mobileNumber,
  });

export const apiLogin = async (
  email: string,
  password: string
): Promise<{ data: LoginRes | null; error: string | null }> => {
  const result = await request<LoginRes>("/api/auth/login", { email, password });
  if (result.data) {
    const d = result.data;
    savePendingOtpMeta({
      email,
      userId: d.userId ?? d._id ?? d.id ?? undefined,
      loginToken: d.loginToken ?? d.token ?? undefined,
    });
  }
  return result;
};

export const apiVerifyOtp = (email: string, otp: string) => {
  const meta = getPendingOtpMeta();
  const payload: Record<string, unknown> = { email, otp };
  if (meta.userId) payload["userId"] = meta.userId;
  if (meta.loginToken) payload["loginToken"] = meta.loginToken;
  return request<OtpRes>("/api/auth/verify-otp", payload);
};

export const apiResendOtp = (email: string) =>
  request<{ message?: string }>("/api/auth/resend-otp", { email });

export const apiForgotPassword = (email: string) =>
  request<{ message?: string }>("/api/auth/forgot-password", { email });

export const apiVerifyResetOtp = (email: string, otp: string) =>
  request<OtpRes>("/api/auth/verify-reset-otp", { email, otp });

export const apiResendResetOtp = (email: string) =>
  request<{ message?: string }>("/api/auth/resend-reset-otp", { email });

export const apiResetPassword = (
  email: string,
  password: string,
  confirmPassword: string
) =>
  request<{ message?: string }>("/api/auth/reset-password", {
    email,
    newPassword: password,
    confirmPassword,
  });

// ─── ADMIN SESSION ────────────────────────────────────────────────────────────

const ADMIN_SESSION_KEY = "sf_admin_session";

export interface AdminSession {
  token: string;
  email: string;
  name: string;
  adminId?: string;
}

export function saveAdminSession(s: AdminSession) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(s));
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

// ─── ADMIN API ────────────────────────────────────────────────────────────────

export const apiAdminRegister = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
) =>
  request<{ message?: string; adminId?: string; [key: string]: unknown }>(
    "/api/admin/register",
    { name, email, password, confirmPassword }
  );

export const apiAdminLogin = (email: string, password: string) =>
  request<{
    message?: string;
    token?: string;
    admin?: { name?: string; email?: string; _id?: string };
    [key: string]: unknown;
  }>("/api/agency/login", { email, password });

export const apiAdminSendResetOtp = (email: string) =>
  request<{ message?: string }>("/api/admin/send-reset-otp", { email });

export const apiAdminVerifyResetOtp = (email: string, otp: string) =>
  request<{ message?: string }>("/api/admin/verify-reset-otp", { email, otp });

export const apiAdminResendResetOtp = (email: string) =>
  request<{ message?: string }>("/api/admin/resend-reset-otp", { email });

export const apiAdminResetPassword = (
  email: string,
  newPassword: string,
  confirmPassword: string
) =>
  request<{ message?: string }>("/api/admin/reset-password", {
    email,
    newPassword,
    confirmPassword,
  });

export const apiAdminChangePassword = (
  token: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) =>
  authRequest<{ message?: string }>("/api/admin/change-password", "PUT", token, {
    oldPassword,
    newPassword,
    confirmPassword,
  });

export const apiAdminDashboard = (token: string) =>
  authRequest<{
    users?: number;
    projects?: number;
    [key: string]: unknown;
  }>("/api/admin/dashboard", "GET", token);

export const apiAdminGetUsers = (
  token: string,
  params?: { role?: string; search?: string; page?: number; limit?: number }
) => {
  const q = new URLSearchParams();
  if (params?.role) q.set("role", params.role);
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return authRequest<{ data?: any[]; users?: any[]; [key: string]: unknown }>(
    `/api/admin/users${qs ? "?" + qs : ""}`,
    "GET",
    token
  );
};

export const apiAdminCreateUser = (
  token: string,
  body: Record<string, unknown>
) =>
  authRequest<{
    message?: string;
    msg?: string;
    data?: { user?: { _id?: string } };
    [key: string]: unknown;
  }>("/api/user/create", "POST", token, body);

export const apiAdminToggleStatus = (token: string, userId: string) =>
  authRequest<{ message?: string; msg?: string; [key: string]: unknown }>(
    `/api/admin/users/${userId}/toggle-status`,
    "PATCH",
    token
  );

export const apiAdminDeleteUser = (token: string, userId: string) =>
  authRequest<{ message?: string; msg?: string; [key: string]: unknown }>(
    `/api/admin/users/${userId}`,
    "DELETE",
    token
  );

export const apiAdminUpdateUser = (
  token: string,
  userId: string,
  body: Record<string, unknown>
) =>
  // FIXED: backend par is route (/api/admin/users/:id) ke liye PATCH
  // register nahi hai — isliye PATCH bhejne par 404 Not Found aata tha
  // (toggle-status/change-password jaise sub-routes alag se register
  // hain isliye wo kaam karte the). Baaki update endpoints (jaise
  // apiUpdateProfile) ki tarah yahan bhi PUT use kar rahe hain.
  authRequest<{ message?: string; msg?: string; data?: unknown; [key: string]: unknown }>(
    `/api/admin/users/${userId}`,
    "PUT",
    token,
    body
  );

export const apiAdminChangeUserPassword = (
  token: string,
  userId: string,
  newPassword: string,
  confirmPassword: string
) =>
  authRequest<{ message?: string; msg?: string; [key: string]: unknown }>(
    `/api/admin/users/${userId}/change-password`,
    "PUT",
    token,
    { newPassword, confirmPassword }
  );

export const apiAdminProfile = (token: string) =>
  authRequest<{ [key: string]: unknown }>("/api/admin/profile", "GET", token);

export const apiAdminUploadProfileImage = (token: string, file: File) => {
  const formData = new FormData();
  formData.append("profileImage", file);
  return authRequestFormData<{ message?: string; imageUrl?: string; profileImage?: string; [key: string]: unknown }>(
    "/api/admin/profile/image",
    token,
    formData
  );
};

export const apiAdminRemoveProfileImage = (token: string) =>
  authRequest<{ message?: string; [key: string]: unknown }>(
    "/api/admin/profile/image",
    "DELETE",
    token
  );

export const apiAdminWorkspaceUpdate = (
  token: string,
  body: { agencyName: string; description: string; address: string }
) =>
  authRequest<{ message?: string; msg?: string; [key: string]: unknown }>(
    "/api/admin/workspace",
    "PUT",
    token,
    body
  );

export const apiAdminDesignProjects = (token: string) =>
  authRequest<{ data?: any[]; projects?: any[]; [key: string]: unknown }>(
    "/api/admin/design-projects",
    "GET",
    token
  );

// NEW: admin ek particular design project par kis SMM aur kis Graphic
// Designer ko assign kare, ye set/update karne ke liye. Same
// "/api/admin/design-projects" base path use karta hai jo GET list ke
// liye already documented hai — REST convention follow karte hue
// PATCH /api/admin/design-projects/:id se assignment update hoti hai.
// NEW: admin panel se naya design project banane ke liye. Same
// "/api/admin/design-projects" base path (REST convention: GET list,
// POST create, PATCH update). Agar backend par ye POST route abhi na ho
// to backend developer ko add karna hoga — request/response shape SMM ke
// "/api/smm/design-projects" create endpoint jaisa hi rakha hai.
export const apiAdminCreateDesignProject = (
  token: string,
  fields: {
    clientId: string;
    smmId?: string;
    designerId?: string;
    title: string;
    designType: string;
    deadline: string;
    priority: string;
    description?: string;
    targetAudience?: string;
    brandColors?: string;
    fontPreferences?: string;
    revisionLimit?: number;
  },
  assets?: File[]
) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== "") fd.append(k, String(v));
  });
  assets?.forEach((f) => fd.append("assets", f));
  return authRequestFormData<{ message?: string; msg?: string; data?: any; [key: string]: unknown }>(
    "/api/admin/design-projects",
    token,
    fd
  );
};

export const apiAdminUpdateDesignProject = (
  token: string,
  projectId: string,
  body: { smmId?: string; designerId?: string }
) =>
  authRequest<{ message?: string; msg?: string; data?: unknown; [key: string]: unknown }>(
    `/api/admin/design-projects/${projectId}`,
    "PATCH",
    token,
    body
  );

// NEW: admin ek design project ko permanently delete kare. Same
// "/api/admin/design-projects" base path (REST convention: GET list,
// POST create, PATCH update, DELETE remove).
export const apiAdminDeleteDesignProject = (token: string, projectId: string) =>
  authRequest<{ message?: string; msg?: string; [key: string]: unknown }>(
    `/api/admin/design-projects/${projectId}`,
    "DELETE",
    token
  );

// ─── ADMIN INVOICES ───────────────────────────────────────────────────────────
// Base path: /api/admin/invoices | Auth: Admin (Agency) only

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  clientId: string | { _id: string; name?: string; email?: string; companyName?: string };
  items: InvoiceItem[];
  taxPercent?: number;
  discount?: number;
  currency?: string;
  dueDate?: string;
  notes?: string;
  invoiceNumber?: string;
  status: InvoiceStatus;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface InvoiceListRes {
  success?: boolean;
  data?: Invoice[] | { invoices?: Invoice[]; total?: number; page?: number; pages?: number };
  invoices?: Invoice[];
  total?: number;
  page?: number;
  pages?: number;
  [key: string]: unknown;
}

export interface InvoiceRes {
  success?: boolean;
  data?: Invoice;
  invoice?: Invoice;
  message?: string;
  [key: string]: unknown;
}

// Generate a new invoice for a client
export const apiAdminCreateInvoice = (
  token: string,
  body: {
    clientId: string;
    items: InvoiceItem[];
    taxPercent?: number;
    discount?: number;
    currency?: string;
    dueDate?: string;
    notes?: string;
    invoiceNumber?: string;
  }
) => authRequest<InvoiceRes>("/api/admin/invoices", "POST", token, body);

// Get all invoices (optionally filtered)
export const apiAdminGetInvoices = (
  token: string,
  params?: { clientId?: string; status?: string; page?: number; limit?: number }
) => {
  const q = new URLSearchParams();
  if (params?.clientId) q.set("clientId", params.clientId);
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return authRequest<InvoiceListRes>(
    `/api/admin/invoices${qs ? "?" + qs : ""}`,
    "GET",
    token
  );
};

// Get all invoices for a specific client
export const apiAdminGetInvoicesByClient = (token: string, clientId: string) =>
  authRequest<InvoiceListRes>(
    `/api/admin/invoices/client/${clientId}`,
    "GET",
    token
  );

// Get a single invoice by ID
export const apiAdminGetInvoice = (token: string, id: string) =>
  authRequest<InvoiceRes>(`/api/admin/invoices/${id}`, "GET", token);

// Update invoice status (Draft | Sent | Paid | Overdue | Cancelled)
export const apiAdminUpdateInvoiceStatus = (
  token: string,
  id: string,
  status: InvoiceStatus
) =>
  authRequest<InvoiceRes>(`/api/admin/invoices/${id}/status`, "PATCH", token, {
    status,
  });

// Delete an invoice
export const apiAdminDeleteInvoice = (token: string, id: string) =>
  authRequest<{ success?: boolean; message?: string }>(
    `/api/admin/invoices/${id}`,
    "DELETE",
    token
  );

// ─── ADMIN ANALYTICS OVERVIEW (agency-wide) ──────────────────────────────────
// Base path: /api/admin/analytics | Auth: Admin (Agency) only

export type AnalyticsPeriod = "weekly" | "monthly" | "yearly";

export interface AdminAnalyticsTrendPoint {
  period: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  impressions: number;
  posts: number;
  engagement: number;
}

export interface AdminAnalyticsOverviewRes {
  success?: boolean;
  data?: {
    period?: string;
    totals?: {
      totalLikes?: number;
      totalComments?: number;
      totalShares?: number;
      totalViews?: number;
      totalReach?: number;
      totalImpressions?: number;
      totalEngagement?: number;
      totalProfileViews?: number;
    };
    trend?: AdminAnalyticsTrendPoint[];
    byPlatform?: PostsOverviewByPlatform[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Agency-wide analytics (all SMMs + clients combined) with weekly/monthly/yearly trend
export const apiAdminAnalyticsOverview = (
  token: string,
  params?: { period?: AnalyticsPeriod; clientId?: string; smmId?: string }
) => {
  const q = new URLSearchParams();
  if (params?.period) q.set("period", params.period);
  if (params?.clientId) q.set("clientId", params.clientId);
  if (params?.smmId) q.set("smmId", params.smmId);
  const qs = q.toString();
  return authRequest<AdminAnalyticsOverviewRes>(
    `/api/admin/analytics/overview${qs ? "?" + qs : ""}`,
    "GET",
    token
  );
};

// ─── ADMIN REVENUE OVERVIEW ───────────────────────────────────────────────────
// Base path: /api/admin/analytics | Auth: Admin (Agency) only

export interface AdminRevenueStatusBreakdown {
  status: string;
  totalAmount: number;
  count: number;
}

export interface AdminRevenueTrendPoint {
  period: string;
  revenue: number;
  invoices: number;
}

export interface AdminRevenueOverviewRes {
  success?: boolean;
  data?: {
    period?: string;
    totals?: {
      totalRevenue?: number;
      totalInvoiced?: number;
      totalPending?: number;
      totalOverdue?: number;
      invoiceCount?: number;
    };
    statusBreakdown?: AdminRevenueStatusBreakdown[];
    trend?: AdminRevenueTrendPoint[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Real revenue overview from invoices, with weekly/monthly/yearly trend
export const apiAdminRevenueOverview = (
  token: string,
  params?: { period?: AnalyticsPeriod; status?: string }
) => {
  const q = new URLSearchParams();
  if (params?.period) q.set("period", params.period);
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return authRequest<AdminRevenueOverviewRes>(
    `/api/admin/analytics/revenue${qs ? "?" + qs : ""}`,
    "GET",
    token
  );
};

// ─── SMM DASHBOARD ────────────────────────────────────────────────────────────

export const apiSMMDashboard = (token: string) =>
  authRequest<{ data?: any; [key: string]: unknown }>(
    "/api/smm/dashboard",
    "GET",
    token
  );

// ─── SMM CLIENTS / GRAPHIC DESIGNERS (direct list, not derived from projects) ──
// NEW: pehle SMM ki client/GD list design-projects se (ya localStorage se)
// nikaali jaati thi — isliye jab tak koi design project na banaya ho, list
// hamesha khaali dikhti thi. Ab seedha backend ke dedicated endpoints hit
// karte hain jo SMM ki apni agency ke saare Client/GD deta hai — inhi se
// aage YouTube/social connect ke liye clientId milega.

export interface SmmClientLite {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  [key: string]: unknown;
}

export interface SmmGdLite {
  _id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

export const apiSMMGetClients = (token: string) =>
  authRequest<{ data?: { clients?: SmmClientLite[] }; [key: string]: unknown }>(
    "/api/smm/clients?limit=100",
    "GET",
    token
  );

// NEW: SMM apna assigned client edit bhi kar sake (naam, email, phone,
// company, platforms). Budget/price yahan jaan-bujhkar shaamil nahi hai —
// pricing sirf agency (admin) manage karti hai.
export const apiSMMUpdateClient = (
  token: string,
  clientId: string,
  body: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    companyName?: string;
    platforms?: string[];
  }
) =>
  authRequest<{ message?: string; msg?: string; data?: unknown; [key: string]: unknown }>(
    `/api/smm/clients/${clientId}`,
    "PATCH",
    token,
    body
  );

export const apiSMMGetGraphicDesigners = (token: string) =>
  authRequest<{ data?: { designers?: SmmGdLite[] }; [key: string]: unknown }>(
    "/api/smm/graphic-designers?limit=100",
    "GET",
    token
  );

// NEW: SMM apne dashboard se khud bhi client add kar sake — same
// "/api/user/create" endpoint reuse karte hain jo admin ke "Add Client"
// form me use hota hai (role: "Client"), bas ab SMM ka apna token bhejte
// hain. Budget/price field jaan-bujhkar body me include nahi karte —
// SMM ko pricing dikhana/collect karna nahi hai, wo sirf agency
// (admin) ka kaam hai.
export const apiSMMCreateClient = (
  token: string,
  body: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    companyName?: string;
    platforms?: string[];
  }
) =>
  authRequest<{
    message?: string;
    msg?: string;
    data?: { user?: { _id?: string } };
    [key: string]: unknown;
  }>("/api/user/create", "POST", token, { ...body, role: "Client" });

// ─── SMM DESIGN PROJECTS ──────────────────────────────────────────────────────

export const apiSMMGetDesignProjects = (
  token: string,
  params?: {
    status?: string;
    search?: string;
    clientId?: string;
    designerId?: string;
    page?: number;
    limit?: number;
  }
) => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  if (params?.clientId) q.set("clientId", params.clientId);
  if (params?.designerId) q.set("designerId", params.designerId);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return authRequest<{ data?: any[]; projects?: any[]; [key: string]: unknown }>(
    `/api/smm/design-projects${qs ? "?" + qs : ""}`,
    "GET",
    token
  );
};

export const apiSMMGetDesignProject = (token: string, id: string) =>
  authRequest<{ project?: any; files?: any[]; revisions?: any[]; revisionInfo?: any; [key: string]: unknown }>(
    `/api/smm/design-projects/${id}`,
    "GET",
    token
  );

export const apiSMMCreateDesignProject = (
  token: string,
  fields: {
    clientId: string;
    // Design Project create karte waqt designerId optional hai — us waqt GD ko
    // koi task assign nahi hota (future record). Sirf "Assign Task to GD" flow
    // hi designerId bhejta hai, jisse task turant GD ke dashboard par aata hai.
    designerId?: string;
    title: string;
    designType: string;
    deadline: string;
    priority: string;
    description?: string;
    targetAudience?: string;
    brandColors?: string;
    fontPreferences?: string;
    revisionLimit?: number;
  },
  assets?: File[]
) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== "") fd.append(k, String(v));
  });
  assets?.forEach((f) => fd.append("assets", f));
  return authRequestFormData<{ message?: string; data?: any; [key: string]: unknown }>(
    "/api/smm/design-projects",
    token,
    fd
  );
};

export const apiSMMUpdateDesignProject = (
  token: string,
  id: string,
  body: { deadline?: string; priority?: string; description?: string; [key: string]: unknown }
) =>
  authRequest<{ message?: string; data?: any; [key: string]: unknown }>(
    `/api/smm/design-projects/${id}`,
    "PUT",
    token,
    body
  );

export const apiSMMDeleteDesignProject = (token: string, id: string) =>
  authRequest<{ message?: string; [key: string]: unknown }>(
    `/api/smm/design-projects/${id}`,
    "DELETE",
    token
  );

export const apiSMMApproveRejectProject = (
  token: string,
  id: string,
  action: "approve" | "reject",
  note?: string
) =>
  authRequest<{ message?: string; [key: string]: unknown }>(
    `/api/smm/design-projects/${id}/approve`,
    "PATCH",
    token,
    { action, note }
  );

export const apiSMMRequestRevision = (
  token: string,
  id: string,
  revisionMessage: string
) =>
  authRequest<{ message?: string; [key: string]: unknown }>(
    `/api/smm/design-projects/${id}/revisions`,
    "POST",
    token,
    { revisionMessage }
  );

export const apiSMMGetComments = (token: string, id: string) =>
  authRequest<{ data?: any[]; comments?: any[]; [key: string]: unknown }>(
    `/api/smm/design-projects/${id}/comments`,
    "GET",
    token
  );

export const apiSMMAddComment = (token: string, id: string, message: string) =>
  authRequest<{ message?: string; data?: any; [key: string]: unknown }>(
    `/api/smm/design-projects/${id}/comments`,
    "POST",
    token,
    { message }
  );
