import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import SwipeCard from "../components/SwipeCard";
import { getRecommendations, recordSwipeInteraction, getUserSwipeStats } from "../api/publishedBooks";

export default function Swipe() {
  const [books, setBooks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allBooksViewed, setAllBooksViewed] = useState(false);
  const [swipeStats, setSwipeStats] = useState({
    likes: 0,
    dislikes: 0,
  });

  // Cargar libros recomendados
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      setAllBooksViewed(false);
      const response = await getRecommendations({
        limit: 20,
      });
      
      if (response.success) {
        if (response.data.length > 0) {
          setBooks(response.data);
        } else {
          // Verificar si el mensaje indica que ya revisó todos los libros
          if (response.message === "Has revisado todos los libros disponibles") {
            setAllBooksViewed(true);
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

  // Manejar swipe
  const handleSwipe = async (bookId, action) => {
    if (action === 'like') {
      setSwipeStats(prev => ({ ...prev, likes: prev.likes + 1 }));
      
      // Registrar interacción
      try {
        await recordSwipeInteraction({
          published_book_id: bookId,
          interaction_type: 'like'
        });
        console.log(`✅ Interacción registrada para el libro ${bookId}`);
      } catch (error) {
        console.error("Error registrando interacción:", error);
        // No mostramos error al usuario para no interrumpir la experiencia
      }
    } else {
      setSwipeStats(prev => ({ ...prev, dislikes: prev.dislikes + 1 }));
      
      // Registrar interacción de dislike
      try {
        await recordSwipeInteraction({
          published_book_id: bookId,
          interaction_type: 'dislike'
        });
        console.log(`👎 Dislike registrado para el libro ${bookId}`);
      } catch (error) {
        console.error("Error registrando dislike:", error);
      }
    }

    // Avanzar al siguiente libro
    setCurrentIndex(prev => prev + 1);
  };

  // Función para cargar más libros
  const loadMoreBooks = useCallback(async () => {
    if (allBooksViewed) return; // No cargar más si ya vimos todos
    
    try {
      const response = await getRecommendations({
        limit: 20,
      });
      
      if (response.success) {
        if (response.data.length > 0) {
          setBooks(prev => [...prev, ...response.data]);
        } else {
          // Verificar si el mensaje indica que ya revisó todos los libros
          if (response.message === "Has revisado todos los libros disponibles") {
            setAllBooksViewed(true);
          }
        }
      }
    } catch (err) {
      console.error("Error cargando más libros:", err);
    }
  }, [allBooksViewed]);

  // Cargar más libros cuando quedan pocos
  useEffect(() => {
    if (books.length - currentIndex <= 3 && !loading) {
      loadMoreBooks();
    }
  }, [currentIndex, books.length, loading, loadMoreBooks]);

  const resetSwipe = () => {
    setCurrentIndex(0);
    setSwipeStats({ likes: 0, dislikes: 0 });
    setAllBooksViewed(false);
    setBooks([]);
    loadBooks();
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={resetSwipe}
            className="btn btn-primary"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  const currentBooks = books.slice(currentIndex, currentIndex + 2);
  const hasMoreBooks = currentIndex < books.length;

  // Mostrar pantalla especial cuando ya revisó todos los libros disponibles
  if (allBooksViewed && books.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Has revisado todos los libros!
          </h2>
          <p className="text-gray-600 mb-6">
            Has evaluado todos los libros disponibles. Vuelve más tarde para ver nuevas publicaciones.
          </p>
          <button
            onClick={resetSwipe}
            className="btn btn-primary"
          >
            Verificar nuevos libros
          </button>
        </div>
      </div>
    );
  }

  if (!hasMoreBooks && !allBooksViewed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Has visto todos los libros!
          </h2>
          <p className="text-gray-600 mb-6">
            Te gustaron {swipeStats.likes} libros de {swipeStats.likes + swipeStats.dislikes} recomendaciones
          </p>
          <button
            onClick={resetSwipe}
            className="btn btn-primary"
          >
            Empezar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              📚 LibroSwipe
            </h1>
            <p className="text-gray-600">
              Desliza para descubrir tu próximo libro favorito
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="text-green-600 font-semibold text-lg">{swipeStats.likes}</div>
              <div className="text-gray-500 text-sm">Me gusta</div>
            </div>
            <div className="text-center">
              <div className="text-red-500 font-semibold text-lg">{swipeStats.dislikes}</div>
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
              Desliza hacia la derecha (👍) si te gusta el libro o hacia la izquierda (👎) si no te interesa.
              También puedes usar los botones.
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
    </div>
  );
}
