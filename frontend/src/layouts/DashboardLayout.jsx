"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { performLogout } from "../utils/auth";
import { useAuth } from "../hooks/useAuth";
import { getUserProfile } from "../api/auth";

export default function DashboardLayout({ children }) {
  const { user, isLoading, updateUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Agregar clase dashboard al body
    document.body.classList.add("dashboard");

    // Cleanup: remover clase cuando se desmonte el componente
    return () => {
      document.body.classList.remove("dashboard");
    };
  }, []);

  // Sincronizar datos del usuario desde el servidor (cada 5 minutos)
  useEffect(() => {
    const syncUserData = async () => {
      if (user && user.user_id) {
        try {
          const response = await getUserProfile();
          if (response && response.data) {
            // Actualizar localStorage y estado del hook
            localStorage.setItem("user", JSON.stringify(response.data));
            updateUser(response.data);
          }
        } catch (error) {
          console.error("Error sincronizando datos del usuario:", error);
          // Si falla, mantener los datos actuales
        }
      }
    };

    // Sincronizar al montar el componente
    syncUserData();
    
    // Configurar intervalo para sincronizar cada 5 minutos
    const interval = setInterval(syncUserData, 5 * 60 * 1000);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await performLogout(navigate);
    } catch (error) {
      // En caso de error, resetear el estado
      setIsLoggingOut(false);
      console.error("Error durante logout:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Función para manejar cambios en la búsqueda
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // Mostrar loading mientras se cargan los datos del usuario
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={user} 
        onToggleSidebar={toggleSidebar}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      <DashboardSidebar
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isLoggingOut={isLoggingOut}
      />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
