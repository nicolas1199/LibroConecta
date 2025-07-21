import axios from "axios"
import { handleAuthError } from "../utils/auth"

const API_BASE_URL = "http://localhost:4000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor para agregar el token
api.interceptors.request.use(
  (config) => {
    // Usar 'token' que es donde se guarda el accessToken en Login.jsx
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si es error 401 y no hemos intentado refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        // Intentar renovar el token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data

        // Actualizar tokens en localStorage
        localStorage.setItem("token", accessToken)
        localStorage.setItem("refreshToken", newRefreshToken)

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Si falla el refresh, limpiar todo y redirigir
        console.error("Error renovando token:", refreshError)
        handleAuthError(error)
        return Promise.reject(error)
      }
    }

    // Para otros errores de autenticación
    if (error.response?.status === 401 || error.response?.status === 403) {
      handleAuthError(error)
    }

    return Promise.reject(error)
  },
)

export default api