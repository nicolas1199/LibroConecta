import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import Heart from "./icons/Heart";
import Users from "./icons/Users";
import BookOpen from "./icons/BookOpen";
import X from "./icons/X";

// Componente de notificación para matches automáticos
// FLUJO DE DATOS:
// 1. Recibe autoMatchData desde página Swipe cuando se detecta match mutuo
// 2. Muestra notificación animada con información del match
// 3. Permite al usuario cerrar o navegar a la página de matches
// 4. Se auto-cierra después de 8 segundos
// 5. Ejecuta callback onClose para limpiar estado en componente padre
export default function AutoMatchNotification({ autoMatchData, onClose }) {
  const navigate = useNavigate(); // Para navegación programática
  const [isVisible, setIsVisible] = useState(true); // Control de visibilidad con animación

  // FUNCIÓN: Cerrar notificación con animación
  // Inicia animación de salida y después ejecuta callback
  const handleClose = useCallback(() => {
    setIsVisible(false); // Iniciar animación de salida
    setTimeout(() => {
      onClose(); // Ejecutar callback del padre después de animación
    }, 300); // Tiempo de animación de salida
  }, [onClose]);

  // FUNCIÓN: Navegar a página de matches
  // Cierra notificación y redirige al usuario
  const handleViewMatches = useCallback(() => {
    handleClose(); // Cerrar notificación primero
    navigate("/dashboard/matches"); // Navegar a matches
  }, [handleClose, navigate]);

  // FUNCIÓN: Navegar a página de swipe
  // Cierra notificación y redirige al usuario a swipe
  const handleContinueSwiping = useCallback(() => {
    handleClose(); // Cerrar notificación primero
    navigate("/dashboard/swipe"); // Navegar a swipe
  }, [handleClose, navigate]);

  // EFECTO: Auto-cierre automático
  // La notificación se cierra sola después de 8 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose(); // Cerrar automáticamente
    }, 8000); // 8 segundos de duración

    return () => clearTimeout(timer); // Cleanup del timer
  }, [handleClose]);

  // VALIDACIÓN: No renderizar si no hay datos válidos
  if (!autoMatchData?.created || !autoMatchData.match) {
    return null;
  }

  // EXTRACCIÓN DE DATOS del match
  const { match, trigger_info } = autoMatchData;
  const otherUser =
    match.User1?.user_id === match.user_id_1 ? match.User2 : match.User1;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            {/* Botón de cerrar */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Cerrar notificación"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado con iconos animados */}
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="flex items-center space-x-2"
              >
                <Heart className="w-8 h-8 text-red-300" />
                <span className="text-2xl">🎉</span>
                <Heart className="w-8 h-8 text-red-300" />
              </motion.div>
            </div>

            {/* Título */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-1">¡Nuevo Match!</h3>
              <p className="text-pink-100 text-sm">Tienes un like mutuo</p>
            </div>

            {/* Información del usuario */}
            <div className="bg-white/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">
                    {otherUser?.first_name} {otherUser?.last_name}
                  </p>
                  <p className="text-pink-100 text-sm">{otherUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Información del trigger */}
            {trigger_info && (
              <div className="bg-white/10 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="w-4 h-4 text-pink-200" />
                  <span className="text-sm font-medium text-pink-100">
                    Libro que activó el match:
                  </span>
                </div>
                <p className="text-sm text-white font-medium">
                  &ldquo;{trigger_info.trigger_book}&rdquo;
                </p>
                {trigger_info.books_count > 1 && (
                  <p className="text-xs text-pink-200 mt-1">
                    +{trigger_info.books_count - 1} libro
                    {trigger_info.books_count > 2 ? "s" : ""} más en común
                  </p>
                )}
              </div>
            )}

            {/* Call to action */}
            <div className="text-center">
              <p className="text-sm text-pink-100 mb-3">
                ¡Ve a la sección de Matches para iniciar una conversación!
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleContinueSwiping}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Seguir deslizando
                </button>
                <button
                  onClick={handleViewMatches}
                  className="flex-1 bg-white text-purple-600 hover:bg-pink-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver Matches
                </button>
              </div>
            </div>

            {/* Efectos decorativos */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

AutoMatchNotification.propTypes = {
  autoMatchData: PropTypes.shape({
    created: PropTypes.bool,
    match: PropTypes.shape({
      match_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      user_id_1: PropTypes.string,
      user_id_2: PropTypes.string,
      User1: PropTypes.shape({
        user_id: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
      }),
      User2: PropTypes.shape({
        user_id: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
      }),
    }),
    trigger_info: PropTypes.shape({
      trigger_book: PropTypes.string,
      books_count: PropTypes.number,
    }),
  }),
  onClose: PropTypes.func.isRequired,
};
