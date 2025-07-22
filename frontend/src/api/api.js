import axios from "axios";
import {
  getStoredToken,
  handleAuthError,
  clearAuthData,
  isTokenNearExpiry,
} from "../utils/auth.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://146.83.198.35:1234/api";

const defaultConfig = {
  baseURL: BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
};

const api = axios.create(defaultConfig);

// Función para renovar el token
const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    console.log("🔄 Renovando token de acceso...");

    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken,
    });

    if (response.data.accessToken) {
      localStorage.setItem("token", response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      console.log("✅ Token renovado exitosamente");
      return response.data.accessToken;
    }

    throw new Error("No access token in refresh response");
  } catch (error) {
    console.error("❌ Error renovando token:", error);
    clearAuthData();

    // Solo mostrar mensaje de sesión expirada si el usuario estaba previamente autenticado
    // (no en el caso de registro reciente)
    const isFromRegistration =
      window.location.pathname === "/dashboard" &&
      sessionStorage.getItem("justRegistered");

    if (isFromRegistration) {
      sessionStorage.removeItem("justRegistered");
      window.location.href = "/login?message=registration_auth_error";
    } else {
      window.location.href = "/login?message=session_expired";
    }
    throw error;
  }
};

// Variable para prevenir múltiples intentos de refresh simultáneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    let token = getStoredToken();

    // Si el token está próximo a expirar, intentar renovarlo
    if (token && isTokenNearExpiry(token) && !isRefreshing) {
      console.log("⚠️ Token próximo a expirar, renovando...");
      try {
        token = await refreshAuthToken();
      } catch (error) {
        console.error("Error renovando token de forma proactiva:", error);
        // Si falla la renovación proactiva, usar el token actual y dejar que el interceptor de respuesta lo maneje
      }
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es un error 401 y no hemos intentado renovar el token aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya estamos renovando, poner la petición en cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();
        processQueue(null, newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleAuthError(error);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Solo manejar como error de autenticación los códigos 401 y 403
    if (error.response?.status === 401 || error.response?.status === 403) {
      handleAuthError(error);
    }

    return Promise.reject(error);
  },
);

export default api;