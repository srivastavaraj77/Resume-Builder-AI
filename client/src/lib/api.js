const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

const buildHeaders = (customHeaders = {}) => {
  const token = getToken();
  const headers = { ...customHeaders };

  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.setItem("auth_notice", "Session expired. Please login again.");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?state=login";
      }
    }

    const errorMessage =
      payload?.error?.message ||
      payload?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload?.data ?? null;
};

const request = async (path, options = {}) => {
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const headers = buildHeaders(options.headers);
  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Unable to reach server at ${API_BASE_URL}. Please make sure backend is running.`
    );
  }

  return parseResponse(response);
};

export const authApi = {
  register: (body) =>
    request("/api/users/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body) =>
    request("/api/users/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request("/api/users/data"),
  updateProfile: (body) =>
    request("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  changePassword: (body) =>
    request("/api/users/change-password", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  requestPasswordReset: (body) =>
    request("/api/users/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  resetPasswordWithOtp: (body) =>
    request("/api/users/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const resumeApi = {
  listMine: () => request("/api/resumes"),
  create: (body) =>
    request("/api/resumes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMineById: (resumeId) => request(`/api/resumes/${resumeId}`),
  checkDownloadAccess: (resumeId) => request(`/api/resumes/${resumeId}/download-access`),
  getPublicById: (resumeId) => request(`/api/resumes/public/${resumeId}`),
  update: (resumeId, body) =>
    request(`/api/resumes/${resumeId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  updateVisibility: (resumeId, isPublic) =>
    request(`/api/resumes/${resumeId}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ isPublic }),
    }),
  remove: (resumeId) =>
    request(`/api/resumes/${resumeId}`, {
      method: "DELETE",
    }),
};

export const aiApi = {
  enhanceSummary: (summary) =>
    request("/api/ai/enhance-summary", {
      method: "POST",
      body: JSON.stringify({ summary }),
    }),
  analyzeAts: ({ resumeId, resumeData, targetRole, includeAiFeedback = true }) =>
    request("/api/ai/ats-analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId, resumeData, targetRole, includeAiFeedback }),
    }),
  improveAts: ({ resumeId, resumeData, targetRole }) =>
    request("/api/ai/ats-improve", {
      method: "POST",
      body: JSON.stringify({ resumeId, resumeData, targetRole }),
    }),
  getAtsHistory: (resumeId) => request(`/api/ai/ats-history/${resumeId}`),
};

export const importApi = {
  previewResumeFromPdf: ({ title, file }) => {
    const formData = new FormData();
    formData.append("title", title || "");
    formData.append("resume", file);

    return request("/api/import/resume-preview", {
      method: "POST",
      body: formData,
    });
  },
  confirmResumeImport: ({ title, parsedResume }) =>
    request("/api/import/resume-confirm", {
      method: "POST",
      body: JSON.stringify({ title, parsedResume }),
    }),
};

export const paymentApi = {
  createOrder: () =>
    request("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  verifyPayment: (body) =>
    request("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getStatus: () => request("/api/payments/status"),
};
