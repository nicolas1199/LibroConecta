import { useState, useEffect, createContext, useContext } from 'react';

// Contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage al inicializar
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const updateUserContext = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const logout = () => {
    setUser(null);
    clearAuthData();
  };

  const value = {
    user,
    updateUserContext,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import { useState, useEffect, createContext, useContext } from 'react';

// Contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage al inicializar
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const updateUserContext = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const logout = () => {
    setUser(null);
    clearAuthData();
  };

  const value = {
    user,
    updateUserContext,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Utilidades para manejo de autenticación y tokens
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
};

export const isValidJWTFormat = (token) => {
  if (!token || typeof token !== "string") return false;
  return token.split(".").length === 3;
};

// Función para decodificar un JWT sin verificar
export const decodeJWT = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
};

// Verificar si el token está próximo a expirar (menos de 5 minutos)
export const isTokenNearExpiry = (token) => {
  if (!token) return true;

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  const now = Date.now() / 1000; // Convertir a segundos
  const timeToExpiry = decoded.exp - now;

  // Si expira en menos de 5 minutos (300 segundos)
  return timeToExpiry < 300;
};

export const getStoredToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!isValidJWTFormat(token)) {
    console.warn("Token malformado encontrado, eliminando...");
    clearAuthData();
    return null;
  }

  return token;
};

export const handleAuthError = (error) => {
  console.error("Error de autenticación:", error);

  const status = error.response?.status;
  const errorMessage = error.response?.data?.error || "";

  // Si es un error de autenticación, limpiar tokens
  if (status === 401 || status === 403) {
    if (
      errorMessage.includes("Token") ||
      errorMessage.includes("JWT") ||
      errorMessage.includes("autenticación") ||
      errorMessage.includes("malformado")
    ) {
      clearAuthData();

      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes("login")) {
        // Verificar si el usuario acaba de registrarse
        const isFromRegistration =
          window.location.pathname === "/dashboard" &&
          sessionStorage.getItem("justRegistered");

        if (isFromRegistration) {
          sessionStorage.removeItem("justRegistered");
          window.location.href = "/login?message=registration_auth_error";
        } else {
          window.location.href = "/login?message=session_expired";
        }
      }
    }
  }

  return error;
};

export const redirectToLogin = (message = null) => {
  clearAuthData();
  const url = message ? `/login?message=${message}` : "/login";
  window.location.href = url;
};

// Función completa de logout que incluye llamada al backend
export const performLogout = async (navigate) => {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { logout: logoutApi } = await import("../api/auth");

    // Llamar al endpoint de logout del backend
    await logoutApi();
    console.log("✅ Logout exitoso en el servidor");
  } catch (error) {
    // Aunque falle el logout del servidor, continuar con el logout local
    console.error("❌ Error en logout del servidor:", error);
  } finally {
    // Siempre limpiar datos locales y redirigir
    clearAuthData();
    if (navigate) {
      navigate("/", { replace: true });
    } else {
      window.location.href = "/";
    }
  }
};
