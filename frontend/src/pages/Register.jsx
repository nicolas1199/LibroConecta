"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookOpen from "../components/icons/BookOpen";
import { register as registerApi } from "../api/auth";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setMessage("");

    try {
      const res = await registerApi({
        fullname: formData.name,
        location: "",
        user_type_id: 2,
        email: formData.email,
        username: formData.email.split("@")[0],
        password: formData.password,
      });

      // Guardar datos inmediatamente - usar el nombre correcto de los tokens
      localStorage.setItem("token", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));

      // Marcar que el usuario acaba de registrarse
      sessionStorage.setItem("justRegistered", "true");

      setMessage("¡Cuenta creada exitosamente! Redirigiendo...");

      // Agregar un pequeño delay para asegurar que se guarden los datos
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "Error al crear la cuenta. Inténtalo de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold">LibroConecta</span>
          </Link>
          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-subtitle">Únete a nuestra comunidad de lectores</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nombre completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors["name"] ? "border-red-500" : ""}`}
              placeholder="Tu nombre"
              disabled={isLoading}
            />
            {errors["name"] && <p className="form-error">{errors["name"]}</p>}
          </div>

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
              className={`form-control ${errors["email"] ? "border-red-500" : ""}`}
              placeholder="tu@email.com"
              disabled={isLoading}
            />
            {errors["email"] && <p className="form-error">{errors["email"]}</p>}
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
              className={`form-control ${errors["password"] ? "border-red-500" : ""}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors["password"] && (
              <p className="form-error">{errors["password"]}</p>
            )}
            <p className="form-text">
              Debe contener al menos 6 caracteres, una mayúscula, una minúscula
              y un número
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-control ${errors["confirmPassword"] ? "border-red-500" : ""}`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors["confirmPassword"] && (
              <p className="form-error">{errors["confirmPassword"]}</p>
            )}
          </div>

          <div className="form-group">
            <label className="flex items-start">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 mr-2"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-600">
                Acepto los{" "}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  política de privacidad
                </Link>
              </span>
            </label>
            {errors["acceptTerms"] && (
              <p className="form-error">{errors["acceptTerms"]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="spinner"></div>
                Creando cuenta...
              </div>
            ) : (
              "Crear cuenta"
            )}
          </button>

          {message && (
            <p
              className={`text-center text-sm mt-3 ${message.includes("exitosamente") ? "text-green-600" : "text-red-600"}`}
            >
              {message}
            </p>
          )}
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="auth-link">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
