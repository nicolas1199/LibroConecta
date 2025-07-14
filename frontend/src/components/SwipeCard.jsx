import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Heart from "./icons/Heart";
import X from "./icons/X";
import PropTypes from "prop-types";

const SWIPE_THRESHOLD = 100;

export default function SwipeCard({ book, onSwipe, isTop = false }) {
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);
  
  // Motion values para el arrastre
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

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
  const imageUrl = primaryImage?.image_url || "/api/placeholder/300/400";

  // Manejar el final del arrastre
  const handleDragEnd = (event, info) => {
    const swipeThreshold = SWIPE_THRESHOLD;
    
    if (info.offset.x > swipeThreshold) {
      // Swipe derecha - Like
      onSwipe(book.published_book_id, 'like');
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe izquierda - Dislike
      onSwipe(book.published_book_id, 'dislike');
    }
  };

  // Funciones para botones
  const handleLike = () => {
    onSwipe(book.published_book_id, 'like');
  };

  const handleDislike = () => {
    onSwipe(book.published_book_id, 'dislike');
  };

  return (
    <motion.div
      ref={cardRef}
      className={`absolute w-80 h-96 bg-white rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing ${
        isTop ? 'z-10' : 'z-0'
      }`}
      style={{
        x,
        rotate,
        opacity: isTop ? opacity : 1,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileDrag={{ scale: 1.05 }}
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
          onError={() => setImageError(true)}
        />
        
        {/* Indicadores de swipe */}
        <motion.div
          className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full font-bold text-lg transform rotate-12"
          style={{
            opacity: useTransform(x, [0, 100], [0, 1]),
          }}
        >
          LIKE
        </motion.div>
        
        <motion.div
          className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-lg transform -rotate-12"
          style={{
            opacity: useTransform(x, [-100, 0], [1, 0]),
          }}
        >
          NOPE
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
            Por: {user?.name || 'Usuario'} {user?.last_name || ''}
          </p>
        </div>

        {/* Botones de acción (solo visibles en la carta superior) */}
        {isTop && (
          <div className="flex justify-center space-x-4 mt-3">
            <button
              onClick={handleDislike}
              className="w-12 h-12 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-red-500" />
            </button>
            <button
              onClick={handleLike}
              className="w-12 h-12 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full flex items-center justify-center transition-colors"
            >
              <Heart className="w-6 h-6 text-green-500" />
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
      name: PropTypes.string,
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
