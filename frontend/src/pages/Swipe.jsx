import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SwipeCard from "../components/SwipeCard";
import AutoMatchNotification from "../components/AutoMatchNotification";
import BookOpen from "../components/icons/BookOpen";
import Clock from "../components/icons/Clock";
import {
  getRecommendations,
  recordSwipeInteraction,
  getUserSwipeHistory,
} from "../api/publishedBooks";

// Componente principal del sistema de swipe de libros
// FLUJO DE DATOS:
// 1. Carga recomendaciones de libros desde backend
// 2. Muestra tarjetas interactivas para swipe
// 3. Registra interacciones (like/dislike) en backend
// 4. Detecta y muestra notificaciones de auto-match
// 5. Maneja paginación automática de más libros
// 6. Actualiza estadísticas en tiempo real
export default function Swipe() {
  // ESTADOS PRINCIPALES del componente
  const [books, setBooks] = useState([]); // Array de libros para swipe
  const [autoMatchNotification, setAutoMatchNotification] = useState(null); // Datos para notificación de match
  const [currentIndex, setCurrentIndex] = useState(0); // Índice del libro actual en la pila
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const [error, setError] = useState(null); // Manejo de errores
  const [allBooksViewed, setAllBooksViewed] = useState(false); // Flag cuando no hay más libros
  const [totalStats, setTotalStats] = useState({
    // Estadísticas globales del usuario
    likes: 0,
    dislikes: 0,
    total: 0,
  });

  // FUNCIÓN: Cargar estadísticas totales del usuario
  // Se ejecuta para mostrar contadores globales en la interfaz
  const loadTotalStats = async () => {
    try {
      const response = await getUserSwipeHistory({ limit: 1 }); // Solo necesitamos stats
      if (response.success) {
        setTotalStats(response.data.stats); // Actualizar estadísticas
      }
    } catch (err) {
      console.error("Error loading total stats:", err);
    }
  };

  // EFECTO: Carga inicial de datos
  // Se ejecuta una sola vez al montar el componente
  useEffect(() => {
    loadBooks(); // Cargar libros recomendados
    loadTotalStats(); // Cargar estadísticas globales
  }, []);

  // FUNCIÓN: Carga inicial de libros recomendados
  // Obtiene la primera tanda de libros desde el backend
  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      setAllBooksViewed(false);

      // Solicitar 20 libros al backend
      const response = await getRecommendations({
        limit: 20,
      });

      if (response.success) {
        if (response.data.length > 0) {
          setBooks(response.data); // Guardar libros obtenidos
        } else {
          // CASO: No hay libros disponibles
          // Verificar el mensaje específico del backend
          if (
            response.message === "Has revisado todos los libros disponibles"
          ) {
            setAllBooksViewed(true); // Mostrar pantalla de "todos revisados"
          } else {
            setError("No se encontraron libros para recomendar");
          }
        }
      } else {
        setError(response.message || "Error al cargar las recomendaciones");
      }
    } catch (err) {
      console.error("Error cargando libros:", err);
      setError("Error de conexión al cargar las recomendaciones");
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PRINCIPAL: Manejo de swipe (like/dislike)
  // Se ejecuta cuando el usuario hace swipe en una tarjeta
  const handleSwipe = async (bookId, direction) => {
    try {
      // PASO 1: Preparar datos de interacción para backend
      const interactionData = {
        published_book_id: bookId,
        interaction_type: direction, // "like" o "dislike"
      };

      // PASO 2: Registrar interacción en backend
      const response = await recordSwipeInteraction(interactionData);

      // PASO 3: Verificar si se creó un auto-match
      // El backend retorna información de match si hay reciprocidad
      if (response.data.autoMatch && response.data.autoMatch.created) {
        setAutoMatchNotification(response.data.autoMatch); // Mostrar notificación
      }

      // PASO 4: Avanzar al siguiente libro
      // Incrementar índice para mostrar la siguiente tarjeta
      setCurrentIndex((prev) => prev + 1);

      // PASO 5: Actualizar estadísticas locales
      setTotalStats((prev) => ({
        ...prev,
        [direction === "like" ? "likes" : "dislikes"]:
          prev[direction === "like" ? "likes" : "dislikes"] + 1,
        total: prev.total + 1,
      }));
    } catch (error) {
      console.error("Error recording swipe:", error);
      // En caso de error, aún avanzar al siguiente libro para no bloquear UX
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // FUNCIÓN: Carga paginada de más libros
  // Se ejecuta automáticamente cuando quedan pocos libros en la pila
  const loadMoreBooks = useCallback(async () => {
    if (allBooksViewed) return; // No cargar si ya se vieron todos los libros

    try {
      const response = await getRecommendations({
        limit: 20, // Solicitar 20 libros adicionales
      });

      if (response.success) {
        if (response.data.length > 0) {
          setBooks((prev) => [...prev, ...response.data]); // Añadir a libros existentes
        } else {
          // CASO: No hay más libros disponibles
          if (
            response.message === "Has revisado todos los libros disponibles"
          ) {
            setAllBooksViewed(true); // Marcar como todos revisados
          }
        }
      }
    } catch (err) {
      console.error("Error cargando más libros:", err);
    }
  }, [allBooksViewed]);

  // EFECTO: Carga automática cuando quedan pocos libros
  // Monitorea cuántos libros quedan en la pila y carga más si es necesario
  useEffect(() => {
    // Si quedan 3 o menos libros por mostrar y no estamos cargando
    if (books.length - currentIndex <= 3 && !loading) {
      loadMoreBooks(); // Cargar más libros proactivamente
    }
  }, [currentIndex, books.length, loading, loadMoreBooks]);

  // FUNCIÓN: Reiniciar sesión de swipe
  // Permite al usuario empezar de nuevo
  const resetSwipe = () => {
    setCurrentIndex(0); // Volver al inicio
    setAllBooksViewed(false); // Reset del flag de todos revisados
    setBooks([]); // Limpiar libros actuales
    loadBooks(); // Cargar nueva tanda de libros
    loadTotalStats(); // Recargar estadísticas totales
  };

  // LÓGICA DE RENDERIZADO CONDICIONAL
  // El componente muestra diferentes pantallas según el estado

  // PANTALLA: Carga inicial
  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner border-gray-300 border-t-blue-600 w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando recomendaciones...</p>
        </div>
      </div>
    );
  }

  // PANTALLA: Error en carga de libros
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con historial siempre visible */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-semibold text-gray-900">
                    LibroConecta
                  </h1>
                </div>
                <Link
                  to="/dashboard/swipe/history"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Historial</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-green-600 font-semibold text-lg">
                  {totalStats.likes}
                </div>
                <div className="text-gray-500 text-sm">Me gusta</div>
              </div>
              <div className="text-center">
                <div className="text-red-500 font-semibold text-lg">
                  {totalStats.dislikes}
                </div>
                <div className="text-gray-500 text-sm">No me gusta</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-semibold text-lg">0</div>
                <div className="text-gray-500 text-sm">Restantes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div
          className="flex items-center justify-center p-4"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
            <div className="text-red-500 mb-4">
              <BookOpen className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Oops!</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={resetSwipe} className="btn btn-primary">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentBooks = books.slice(currentIndex, currentIndex + 2);
  const hasMoreBooks = currentIndex < books.length;

  // Mostrar pantalla especial cuando ya revisó todos los libros disponibles
  if (allBooksViewed && books.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con historial siempre visible */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-semibold text-gray-900">
                    LibroConecta
                  </h1>
                </div>
                <Link
                  to="/dashboard/swipe/history"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Historial</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-green-600 font-semibold text-lg">
                  {totalStats.likes}
                </div>
                <div className="text-gray-500 text-sm">Me gusta</div>
              </div>
              <div className="text-center">
                <div className="text-red-500 font-semibold text-lg">
                  {totalStats.dislikes}
                </div>
                <div className="text-gray-500 text-sm">No me gusta</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-semibold text-lg">0</div>
                <div className="text-gray-500 text-sm">Restantes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div
          className="flex items-center justify-center p-4"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
            <div className="text-blue-500 mb-4">
              <BookOpen className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Has revisado todos los libros!
            </h2>
            <p className="text-gray-600 mb-6">
              Has evaluado todos los libros disponibles. Vuelve más tarde para
              ver nuevas publicaciones.
            </p>
            <button onClick={resetSwipe} className="btn btn-primary">
              Verificar nuevos libros
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasMoreBooks && !allBooksViewed) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con historial siempre visible */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-semibold text-gray-900">
                    LibroConecta
                  </h1>
                </div>
                <Link
                  to="/dashboard/swipe/history"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Historial</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-green-600 font-semibold text-lg">
                  {totalStats.likes}
                </div>
                <div className="text-gray-500 text-sm">Me gusta</div>
              </div>
              <div className="text-center">
                <div className="text-red-500 font-semibold text-lg">
                  {totalStats.dislikes}
                </div>
                <div className="text-gray-500 text-sm">No me gusta</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-semibold text-lg">0</div>
                <div className="text-gray-500 text-sm">Restantes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div
          className="flex items-center justify-center p-4"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
            <div className="text-green-500 mb-4">
              <BookOpen className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Has visto todos los libros!
            </h2>
            <p className="text-gray-600 mb-6">
              Te gustaron {totalStats.likes} libros de {totalStats.total}{" "}
              recomendaciones
            </p>
            <button onClick={resetSwipe} className="btn btn-primary">
              Empezar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {" "}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-900">
                  LibroConecta
                </h1>
              </div>
              <Link
                to="/dashboard/swipe/history"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Historial</span>
              </Link>
              <Link
                to="/dashboard/swipe/test"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <span>🧪</span>
                <span>Pruebas</span>
              </Link>
            </div>
            <p className="text-gray-600 mb-3">
              Desliza para descubrir tu próximo libro favorito
            </p>
            <div className="text-sm text-gray-500">
              <span className="inline-block mr-4">
                ← Arrastrar izquierda: No me gusta
              </span>
              <span className="inline-block mr-4">
                → Arrastrar derecha: Me gusta
              </span>
              <span className="inline-block">⌨️ Teclas: ← → o H L</span>
            </div>
          </div>
          {/* Stats */}
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="text-green-600 font-semibold text-lg">
                {totalStats.likes}
              </div>
              <div className="text-gray-500 text-sm">Me gusta</div>
            </div>
            <div className="text-center">
              <div className="text-red-500 font-semibold text-lg">
                {totalStats.dislikes}
              </div>
              <div className="text-gray-500 text-sm">No me gusta</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-semibold text-lg">
                {books.length - currentIndex}
              </div>
              <div className="text-gray-500 text-sm">Restantes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="relative w-80 h-96">
          <AnimatePresence>
            {currentBooks.map((book, index) => (
              <SwipeCard
                key={`${book.published_book_id}-${currentIndex + index}`}
                book={book}
                onSwipe={handleSwipe}
                isTop={index === 0}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              💡 <strong>Instrucciones:</strong>
            </p>
            <p className="text-xs text-gray-500">
              Desliza hacia la derecha (👍) si te gusta el libro o hacia la
              izquierda (👎) si no te interesa. También puedes usar los botones.
            </p>
          </div>
        </div>
      </div>

      {/* Loading indicator for more books */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-full p-3 shadow-lg border border-gray-200">
          <div className="spinner border-gray-300 border-t-blue-600 w-6 h-6"></div>
        </div>
      )}

      {/* Auto-match notification */}
      {autoMatchNotification && (
        <AutoMatchNotification
          autoMatchData={autoMatchNotification}
          onClose={() => setAutoMatchNotification(null)}
        />
      )}
    </div>
  );
}
