"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import BookOpen from "../components/icons/BookOpen"
import { login as loginApi } from "../api/auth"

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setMessage("")

    try {
      const res = await loginApi(formData.email, formData.password)

      // Guardar datos inmediatamente
      localStorage.setItem("token", res.token)
      localStorage.setItem("user", JSON.stringify(res.user))

      setMessage("¡Inicio de sesión exitoso! Redirigiendo...")

      // Redirección inmediata
      navigate("/dashboard")
    } catch (error) {
      setMessage(error?.response?.data?.message || "Error al iniciar sesión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold">LibroConecta</span>
          </Link>
          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-subtitle">Accede a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? "border-red-500" : ""}`}
              placeholder="tu@email.com"
              disabled={isLoading}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? "border-red-500" : ""}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-600">Recordarme</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="spinner"></div>
                Iniciando sesión...
              </div>
            ) : (
              "Iniciar sesión"
            )}
          </button>

          {message && (
            <p
              className={`text-center text-sm mt-3 ${message.includes("exitoso") ? "text-green-600" : "text-red-600"}`}
            >
              {message}
            </p>
          )}
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="auth-link">
              Crear cuenta
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-semibold mb-2">Demo:</p>
          <p className="text-xs text-blue-700">Email: demo@libroconecta.com</p>
          <p className="text-xs text-blue-700">Contraseña: demo123</p>
        </div>
      </div>
    </div>
  )
}
