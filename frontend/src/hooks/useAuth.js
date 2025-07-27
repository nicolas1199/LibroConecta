import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar la autenticación del usuario
 * Utiliza localStorage para mantener el estado de autenticación
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Cargar datos del usuario desde localStorage al inicializar
    const loadUserData = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setUser(null);
        setIsAuthenticated(false);
        // Limpiar datos corruptos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    // Escuchar cambios en localStorage (para múltiples pestañas)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Actualizar datos del usuario
   * @param {Object} userData - Nuevos datos del usuario
   */
  const updateUser = (userData) => {
    try {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
    }
  };

  /**
   * Limpiar datos de autenticación
   */
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  };

  /**
   * Verificar si el usuario tiene un rol específico
   * @param {number} userTypeId - ID del tipo de usuario a verificar
   * @returns {boolean}
   */
  const hasRole = (userTypeId) => {
    return user?.user_type_id === userTypeId;
  };

  /**
   * Verificar si el usuario es administrador
   * @returns {boolean}
   */
  const isAdmin = () => {
    return hasRole(1); // Asumiendo que 1 es el ID para administrador
  };

  /**
   * Obtener token de autenticación
   * @returns {string|null}
   */
  const getToken = () => {
    return localStorage.getItem('token');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    updateUser,
    logout,
    hasRole,
    isAdmin,
    getToken
  };
};

export default useAuth;
