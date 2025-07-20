import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Heart from "./icons/Heart";
import X from "./icons/X";
import PropTypes from "prop-types";

const SWIPE_THRESHOLD = 75; // Reducido de 100 a 75 para ser más sensible

export default function SwipeCard({ book, onSwipe, isTop = false }) {
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);
  
  // Motion values para el arrastre
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-15, 15]); // Rotación más sutil
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);
  
  // Transformaciones para los indicadores (más sensibles)
  const likeOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);
  const dislikeOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);

  // Funciones para botones
  const handleLike = useCallback(() => {
    onSwipe(book.published_book_id, 'like');
  }, [onSwipe, book.published_book_id]);

  const handleDislike = useCallback(() => {
    onSwipe(book.published_book_id, 'dislike');
  }, [onSwipe, book.published_book_id]);

  // Manejar teclado para accesibilidad
  useEffect(() => {
    if (!isTop) return;
    
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === 'l') {
        event.preventDefault();
        handleLike();
      } else if (event.key === 'ArrowLeft' || event.key === 'h') {
        event.preventDefault();
        handleDislike();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTop, handleLike, handleDislike]);

  // Extraer datos del libro
  const {
    Book: bookInfo,
    User: user,
    TransactionType: transactionType,
    BookCondition: condition,
    LocationBook: location,
    PublishedBookImages: images = [],
    price,
  } = book;

  // Obtener la imagen principal
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const imageUrl = primaryImage?.src ||          // Usar el campo 'src' que puede ser URL o base64
                   primaryImage?.image_url ||    // Fallback a image_url por compatibilidad
                   primaryImage?.image_data ||   // Fallback a image_data por compatibilidad
                   "/api/placeholder/300/400";

  // Manejar el final del arrastre (más permisivo)
  const handleDragEnd = (event, info) => {
    const swipeThreshold = SWIPE_THRESHOLD;
    const velocity = info.velocity.x;
    
    // Considerar tanto el offset como la velocidad para una experiencia más natural
    if (info.offset.x > swipeThreshold || velocity > 500) {
      // Swipe derecha - Like
      onSwipe(book.published_book_id, 'like');
    } else if (info.offset.x < -swipeThreshold || velocity < -500) {
      // Swipe izquierda - Dislike
      onSwipe(book.published_book_id, 'dislike');
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`absolute w-80 h-96 bg-white rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing select-none ${
        isTop ? 'z-10' : 'z-0'
      }`}
      style={{
        x,
        rotate,
        opacity: isTop ? opacity : 1,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: -400, right: 400 }} // Más espacio para arrastrar
      dragElastic={0.2} // Añadir elasticidad
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
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
            imageRendering: 'crisp-edges',
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
