import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 60000,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // An expired session on a protected call logs the user out (auth endpoints handle their own 401s).
    if (
      err.response?.status === 401 &&
      !String(err.config?.url || "").startsWith("/auth/")
    ) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  },
);

export const errMsg = (e) =>
  e?.response?.data?.message ||
  (e?.code === "ECONNABORTED"
    ? "The request timed out. Please try again."
    : "") ||
  (e?.request
    ? "Cannot reach the server. Check your connection and try again."
    : e?.message || "Something went wrong.");

export default api;
