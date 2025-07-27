import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Heart from "./icons/Heart";
import X from "./icons/X";
import PropTypes from "prop-types";

// Constante de sensibilidad del swipe - reducida para mejor UX
const SWIPE_THRESHOLD = 75; // Distancia mínima para activar swipe

// Componente de tarjeta individual para sistema de swipe
// FLUJO DE DATOS:
// 1. Recibe datos del libro desde página Swipe
// 2. Maneja interacciones táctiles/mouse para arrastrar tarjeta
// 3. Detecta dirección del swipe (izquierda/derecha)
// 4. Ejecuta callback onSwipe con dirección y book_id
// 5. Soporta navegación por teclado para accesibilidad
export default function SwipeCard({ book, onSwipe, isTop = false }) {
  // Estados para manejo de errores y referencias
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);
  
  // SISTEMA DE ANIMACIONES CON FRAMER MOTION:
  // x: posición horizontal de la tarjeta durante el arrastre
  // rotate: rotación basada en posición horizontal para efecto natural  
  // opacity: opacidad que cambia según la distancia del swipe
  // likeOpacity/dislikeOpacity: indicadores visuales de la acción pendiente
  const x = useMotionValue(0); // Posición horizontal en tiempo real
  const rotate = useTransform(x, [-300, 300], [-15, 15]); // Rotación sutil: -15° a +15°
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]); // Fade out en extremos
  
  // Indicadores visuales de acción (LIKE/DISLIKE)
  const likeOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]); // Aparece al arrastrar derecha
  const dislikeOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]); // Aparece al arrastrar izquierda

  // Funciones callback para manejo de swipe
  // useCallback evita re-renders innecesarios cuando cambian las props
  const handleLike = useCallback(() => {
    onSwipe(book.published_book_id, 'like'); // Enviar like al componente padre
  }, [onSwipe, book.published_book_id]);

  const handleDislike = useCallback(() => {
    onSwipe(book.published_book_id, 'dislike'); // Enviar dislike al componente padre
  }, [onSwipe, book.published_book_id]);

  // SISTEMA DE NAVEGACIÓN POR TECLADO para accesibilidad
  // Solo la tarjeta superior (isTop=true) puede recibir input de teclado
  useEffect(() => {
    if (!isTop) return; // Solo la tarjeta superior puede recibir input
    
    // MAPEO DE TECLAS:
    // Flecha derecha o 'L' → LIKE
    // Flecha izquierda o 'H' → DISLIKE
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === 'l') {
        event.preventDefault();
        handleLike(); // Ejecutar like
      } else if (event.key === 'ArrowLeft' || event.key === 'h') {
        event.preventDefault();
        handleDislike(); // Ejecutar dislike
      }
    };

    // Registrar event listener global
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTop, handleLike, handleDislike]);

  // EXTRACCIÓN DE DATOS del objeto libro
  // El libro viene con estructuras anidadas desde el backend
  const {
    Book: bookInfo, // Información básica del libro (título, autor)
    User: user, // Propietario del libro
    TransactionType: transactionType, // Tipo de transacción (venta/intercambio/regalo)
    BookCondition: condition, // Estado del libro (nuevo/usado/etc)
    LocationBook: location, // Ubicación del libro
    PublishedBookImages: images = [], // Array de imágenes
    price, // Precio (si aplica)
  } = book;

  // MANEJO DE IMÁGENES con múltiples fallbacks
  // 1. Buscar imagen marcada como principal (is_primary=true)
  // 2. Si no hay principal, usar la primera disponible
  // 3. Manejar diferentes campos de imagen por compatibilidad
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const imageUrl = primaryImage?.src ||          // Nuevo campo 'src' (URL o base64)
                   primaryImage?.image_url ||    // Campo legacy para URLs
                   primaryImage?.image_data ||   // Campo legacy para base64
                   "/api/placeholder/300/400";   // Placeholder si no hay imagen

  // LÓGICA DE DETECCIÓN DE SWIPE
  // Se ejecuta cuando el usuario termina de arrastrar la tarjeta
  const handleDragEnd = (event, info) => {
    const swipeThreshold = SWIPE_THRESHOLD; // 75px mínimo
    const velocity = info.velocity.x; // Velocidad del arrastre
    
    // CRITERIOS DE ACTIVACIÓN:
    // 1. Distancia: más de 75px en cualquier dirección
    // 2. Velocidad: más de 500px/s en cualquier dirección
    // Se evalúa CUALQUIERA de los dos criterios para mejor UX
    if (info.offset.x > swipeThreshold || velocity > 500) {
      // Swipe hacia la derecha = LIKE
      onSwipe(book.published_book_id, 'like');
    } else if (info.offset.x < -swipeThreshold || velocity < -500) {
      // Swipe hacia la izquierda = DISLIKE  
      onSwipe(book.published_book_id, 'dislike');
    }
    // Si no cumple criterios, la tarjeta vuelve a posición original
  };

  return (
    <motion.div
      ref={cardRef}
      className={`absolute w-80 h-96 bg-white rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing select-none ${
        isTop ? 'z-10' : 'z-0' // Solo la tarjeta superior tiene z-index alto
      }`}
      style={{
        x, // Posición horizontal animada
        rotate, // Rotación animada
        opacity: isTop ? opacity : 1, // Solo la tarjeta superior cambia opacidad
      }}
      // CONFIGURACIÓN DE ARRASTRE:
      drag={isTop ? "x" : false} // Solo la tarjeta superior se puede arrastrar
      dragConstraints={{ left: -400, right: 400 }} // Límites de arrastre amplios
      dragElastic={0.2} // Efecto elástico en los límites
      onDragEnd={isTop ? handleDragEnd : undefined} // Solo la tarjeta superior detecta fin de arrastre
      whileDrag={{ scale: 1.05, zIndex: 50 }} // Efectos mientras se arrastra
      initial={{ scale: 0.95, y: 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{ x: 0, y: -100, opacity: 0 }}
    >
      {/* Imagen del libro */}
      <div className="relative h-3/5 w-full">
        <img
          src={imageError ? "/api/placeholder/300/240" : imageUrl}
          alt={bookInfo?.title || "Libro"}
          className="w-full h-full object-cover rounded-t-xl"
          style={{
            imageRendering: 'optimize-contrast',
            msInterpolationMode: 'nearest-neighbor'
          }}
          onError={() => setImageError(true)}
        />
        
        {/* Indicadores de swipe mejorados */}
        <motion.div
          className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm transform rotate-12 shadow-lg"
          style={{
            opacity: likeOpacity,
            scale: useTransform(x, [0, 50, 150], [0.8, 1, 1.2]),
          }}
        >
          ❤️ ME GUSTA
        </motion.div>
        
        <motion.div
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm transform -rotate-12 shadow-lg"
          style={{
            opacity: dislikeOpacity,
            scale: useTransform(x, [-150, -50, 0], [1.2, 1, 0.8]),
          }}
        >
          👎 NO ME GUSTA
        </motion.div>

        {/* Badge de condición */}
        {condition && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            {condition.condition_name}
          </div>
        )}
      </div>

      {/* Información del libro */}
      <div className="p-4 h-2/5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {bookInfo?.title || "Título no disponible"}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {bookInfo?.author || "Autor desconocido"}
          </p>
          
          {/* Precio o tipo de transacción */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-green-600">
              {transactionType?.type_name === 'Intercambio' 
                ? 'Intercambio' 
                : `$${price || 'N/A'}`
              }
            </span>
            {location && (
              <span className="text-xs text-gray-500 truncate">
                📍 {location.city}, {location.state}
              </span>
            )}
          </div>

          {/* Usuario */}
          <p className="text-xs text-gray-500 mt-1">
            Por: {user?.first_name || 'Usuario'} {user?.last_name || ''}
          </p>
        </div>

        {/* Botones de acción mejorados */}
        {isTop && (
          <div className="flex justify-center space-x-6 mt-4">
            <button
              onClick={handleDislike}
              className="w-14 h-14 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md"
              aria-label="No me gusta"
            >
              <X className="w-7 h-7 text-red-500" />
            </button>
            <button
              onClick={handleLike}
              className="w-14 h-14 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md"
              aria-label="Me gusta"
            >
              <Heart className="w-7 h-7 text-green-500" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

SwipeCard.propTypes = {
  book: PropTypes.shape({
    published_book_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Book: PropTypes.shape({
      title: PropTypes.string,
      author: PropTypes.string,
    }),
    User: PropTypes.shape({
      first_name: PropTypes.string,
      last_name: PropTypes.string,
    }),
    TransactionType: PropTypes.shape({
      type_name: PropTypes.string,
    }),
    BookCondition: PropTypes.shape({
      condition_name: PropTypes.string,
    }),
    LocationBook: PropTypes.shape({
      city: PropTypes.string,
      state: PropTypes.string,
    }),
    PublishedBookImages: PropTypes.arrayOf(
      PropTypes.shape({
        image_url: PropTypes.string,
        is_primary: PropTypes.bool,
      })
    ),
  }).isRequired,
  onSwipe: PropTypes.func.isRequired,
  isTop: PropTypes.bool,
};
