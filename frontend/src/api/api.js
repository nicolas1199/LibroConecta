import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

const defaultConfig = {
  baseURL: BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
}

const api = axios.create(defaultConfig)

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export default api
