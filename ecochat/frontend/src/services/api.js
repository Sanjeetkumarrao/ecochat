import axios from "axios";

const api = axios.create({ baseURL: "https://ecochat-717q.onrender.com/api/v1", withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const hasToken = localStorage.getItem("accessToken");
    if (error.response?.status === 401 && !original._retry && hasToken && !original.url.includes("current-user")) {
      original._retry = true;
      try {
        const res = await axios.post("/api/v1/users/refresh-token", {}, { withCredentials: true });
        const { accessToken } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
