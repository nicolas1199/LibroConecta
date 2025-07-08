import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Verificar si hay token en localStorage (mismo nombre que usa Login.jsx)
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      if (!token || !user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // TODO: Verificar token con el servidor
      // const response = await api.get("/api/auth/verify", {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      // if (response.data.valid) {
      //   setIsAuthenticated(true);
      // } else {
      //   localStorage.removeItem("token");
      //   localStorage.removeItem("user");
      //   setIsAuthenticated(false);
      // }

      // Simulación temporal - verificar que el token y user existan
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
} 