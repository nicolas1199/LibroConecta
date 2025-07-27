"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Home from "../icons/Home";
import BookOpen from "../icons/BookOpen";
import Heart from "../icons/Heart";
import MessageCircle from "../icons/MessageCircle";
import Users from "../icons/Users";
import Settings from "../icons/Settings";
import LogOut from "../icons/LogOut";
import ChevronDown from "../icons/ChevronDown";
import Star from "../icons/Star";
import Edit from "../icons/Edit";
import TrendingUp from "../icons/TrendingUp";
import BarChart from "../icons/BarChart";
import FileText from "../icons/FileText";
import Calendar from "../icons/Calendar";
import Clock from "../icons/Clock";
import Bell from "../icons/Bell";
import { getPendingChatRequestsCount } from "../../api/chatRequests";
import ProfileImage from "../ProfileImage";
import Search from "../icons/Search";
import ArrowLeftRight from "../icons/ArrowLeftRight";
import Plus from "../icons/Plus";
import List from "../icons/List";

export default function DashboardSidebar({
  user,
  onLogout,
  currentPath,
  isOpen,
  onClose,
  isLoggingOut = false,
}) {
  const [expandedSections, setExpandedSections] = useState({
    misLibros: true,
    actividad: false,
    configuracion: false,
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const loadPendingRequestsCount = async () => {
      try {
        const response = await getPendingChatRequestsCount();
        setPendingRequestsCount(response.data?.count || 0);
      } catch (error) {
        console.error("Error loading pending requests count:", error);
        // Si hay error, establecer en 0 para evitar problemas
        setPendingRequestsCount(0);
      }
    };

    // Solo cargar si el usuario está autenticado
    if (user && user.user_id) {
      loadPendingRequestsCount();
      
      // Recargar cada 30 segundos
      const interval = setInterval(loadPendingRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const menuItems = {
    principal: [
      { icon: Home, label: "Inicio", path: "/dashboard" },
      {
        icon: Search,
        label: "Explorar",
        path: "/dashboard/explore",
        badge: "Nuevo",
      },
      {
        icon: ArrowLeftRight,
        label: "Swipe",
        path: "/dashboard/swipe",
        badge: "Hot",
      },
      { icon: Users, label: "Matches", path: "/dashboard/matches", count: 0 },
      {
        icon: MessageCircle,
        label: "Mensajes",
        path: "/dashboard/messages",
        count: 0,
      },
      {
        icon: Bell,
        label: "Solicitudes de Chat",
        path: "/chat-requests",
        count: pendingRequestsCount,
      },
    ],
    misLibros: [
      { icon: BookOpen, label: "Mi biblioteca", path: "/dashboard/library" },
      { icon: Plus, label: "Publicar libro", path: "/dashboard/publish" },
      { icon: Edit, label: "Mis publicaciones", path: "/my-publications" },
      {
        icon: FileText,
        label: "Borradores",
        path: "/dashboard/drafts",
        count: 0,
      },
      { icon: Heart, label: "Favoritos", path: "/dashboard/favorites" },
      { icon: List, label: "Lista de deseos", path: "/dashboard/wishlist" },
      { icon: Clock, label: "Historial", path: "/dashboard/history" },
    ],
    actividad: [
      { icon: Star, label: "Calificaciones", path: "/dashboard/ratings" },
      { icon: FileText, label: "Reseñas", path: "/dashboard/reviews" },
      { icon: BarChart, label: "Estadísticas", path: "/dashboard/stats" },
      { icon: Settings, label: "Pruebas Auto-Match", path: "/dashboard/swipe/test", badge: "Dev" },
    ],
  };

  return (
    <aside
      className={`dashboard-sidebar ${isOpen ? "dashboard-sidebar-open" : ""}`}
      style={{ 
        // Temporalmente forzar visible para debug
        transform: window.innerWidth >= 1024 ? 'translateX(0)' : undefined 
      }}
    >
      {/* Validación adicional para evitar errores */}
      {!user || !user.user_id ? (
        <div className="p-4 text-center text-gray-500">
          <p>Cargando usuario...</p>
        </div>
      ) : (
        <>
          <div className="sidebar-section">
            {/* User Profile */}
            <div className="sidebar-user-profile">
              <Link
                to="/profile"
                className="flex items-center space-x-3 w-full hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => window.innerWidth < 1024 && onClose && onClose()}
              >
                <ProfileImage user={user} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {user?.first_name || ""} {user?.last_name || ""}
                  </h3>
                  <div className="user-rating">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">4.8</span>
                    <span className="user-badge">Pro</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="space-y-6">
              {/* Principal */}
              <div className="sidebar-nav-section">
                <h4 className="sidebar-nav-title">Principal</h4>
                <ul className="space-y-1">
                  {menuItems.principal.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`sidebar-nav-item ${currentPath === item.path ? "active" : ""}`}
                        onClick={() =>
                          window.innerWidth < 1024 && onClose && onClose()
                        }
                      >
                        <div className="sidebar-nav-content">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="sidebar-badge sidebar-badge-new">
                            {item.badge}
                          </span>
                        )}
                        {item.count !== undefined && item.count > 0 && (
                          <span className="sidebar-badge sidebar-badge-count">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mis Libros */}
              <div className="sidebar-nav-section">
                <button
                  onClick={() => toggleSection("misLibros")}
                  className="sidebar-section-toggle sidebar-nav-title"
                >
                  <span>Mis Libros</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${expandedSections.misLibros ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedSections.misLibros && (
                  <ul className="space-y-1">
                    {menuItems.misLibros.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`sidebar-nav-item ${currentPath === item.path ? "active" : ""}`}
                          onClick={() =>
                            window.innerWidth < 1024 && onClose && onClose()
                          }
                        >
                          <div className="sidebar-nav-content">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="sidebar-badge sidebar-badge-count">
                              {item.count}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actividad */}
              <div className="sidebar-nav-section">
                <button
                  onClick={() => toggleSection("actividad")}
                  className="sidebar-section-toggle sidebar-nav-title"
                >
                  <span>Actividad</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${expandedSections.actividad ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedSections.actividad && (
                  <ul className="space-y-1">
                    {menuItems.actividad.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`sidebar-nav-item ${currentPath === item.path ? "active" : ""}`}
                        >
                          <div className="sidebar-nav-content">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </nav>
          </div>

          {/* Configuration & Logout */}
          <div className="sidebar-section">
            <button
              onClick={() => toggleSection("configuracion")}
              className="sidebar-section-toggle sidebar-nav-title"
            >
              <span>Configuración rápida</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${expandedSections.configuracion ? "rotate-180" : ""}`}
              />
            </button>
            {expandedSections.configuracion && (
              <ul className="space-y-1 mb-4">
                <li>
                  <Link
                    to="/profile"
                    className={`sidebar-nav-item ${currentPath === "/profile" ? "active" : ""}`}
                  >
                    <div className="sidebar-nav-content">
                      <Users className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/edit-profile"
                    className={`sidebar-nav-item ${currentPath === "/edit-profile" ? "active" : ""}`}
                  >
                    <div className="sidebar-nav-content">
                      <Edit className="h-4 w-4" />
                      <span>Editar Perfil</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/settings"
                    className={`sidebar-nav-item ${currentPath === "/dashboard/settings" ? "active" : ""}`}
                  >
                    <div className="sidebar-nav-content">
                      <Settings className="h-4 w-4" />
                      <span>Configuración</span>
                    </div>
                  </Link>
                </li>
              </ul>
            )}

            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className="sidebar-nav-item text-red-600 hover:bg-red-50 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="sidebar-nav-content">
                {isLoggingOut ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
              </div>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
