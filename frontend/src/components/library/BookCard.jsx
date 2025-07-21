import { memo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import BookOpen from "../icons/BookOpen";
import Edit from "../icons/Edit";
import Trash from "../icons/Trash";
import Star from "../icons/Star";

const BookCard = memo(({ userBook, onDelete, getStatusBadge }) => {
  const imageRef = useRef(null);

  useEffect(() => {
    const img = imageRef.current;
    if (img) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target;
              const src = target.getAttribute("data-src");
              if (src && target instanceof HTMLImageElement) {
                target.src = src;
                target.removeAttribute("data-src");
                observer.unobserve(target);
              }
            }
          });
        },
        { rootMargin: "50px" },
      );
      observer.observe(img);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-3 md:p-4 min-w-0">
      <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm md:text-base leading-tight">
            {userBook.title}
          </h3>
          <p className="text-xs md:text-sm text-gray-600 truncate">
            {userBook.author}
          </p>
        </div>
        <div className="flex space-x-1 flex-shrink-0">
          <Link
            to={`/dashboard/library/edit/${userBook.user_library_id}`}
            className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Edit className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
          <button
            onClick={() => onDelete(userBook)}
            className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Detalles del libro */}
      <div className="flex gap-2 md:gap-3 mb-3 md:mb-4">
        {userBook.image_url ? (
          <img
            ref={imageRef}
            data-src={userBook.image_url}
            alt={`Portada de ${userBook.title}`}
            className="w-12 h-16 md:w-16 md:h-20 object-cover rounded-md flex-shrink-0 bg-gray-100"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-12 h-16 md:w-16 md:h-20 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center">
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1 md:space-y-1.5">
          {userBook.isbn && (
            <p className="text-xs text-gray-500 truncate">
              ISBN: {userBook.isbn}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-xs md:text-sm text-gray-600 flex-shrink-0">
              Estado:
            </span>
            <div className="flex-shrink-0">
              {getStatusBadge(userBook.reading_status)}
            </div>
          </div>
          {userBook.rating && (
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm text-gray-600 flex-shrink-0">
                Valoración:
              </span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 ${i < userBook.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {userBook.review && (
        <div className="mb-3 md:mb-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Notas:</p>
          <p className="text-xs md:text-sm text-gray-800 bg-gray-50 p-2 rounded leading-relaxed">
            {userBook.review.length > 80
              ? `${userBook.review.substring(0, 80)}...`
              : userBook.review}
          </p>
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
        <span className="truncate">
          Agregado: {new Date(userBook.createdAt).toLocaleDateString()}
        </span>
        {userBook.date_finished && (
          <span className="truncate ml-2">
            Terminado: {new Date(userBook.date_finished).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
});

BookCard.displayName = "BookCard";

export default BookCard;
