import { memo } from "react";
import ChevronDown from "../icons/ChevronDown";

const LibraryPagination = memo(
  ({ currentPage, totalPages, totalBooks, booksPerPage, onPageChange }) => {
    if (totalPages <= 1) {
      return null;
    }

    const startItem = (currentPage - 1) * booksPerPage + 1;
    const endItem = Math.min(currentPage * booksPerPage, totalBooks);

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, "...");
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push("...", totalPages);
      } else {
        if (totalPages > 1) {
          rangeWithDots.push(totalPages);
        }
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg">
        <div className="flex-1 flex justify-between items-center">
          {/* Información de resultados */}
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{startItem}</span>
            {" - "}
            <span className="font-medium">{endItem}</span>
            {" de "}
            <span className="font-medium">{totalBooks}</span>
            {" resultados"}
          </div>

          {/* Navegación */}
          <div className="flex items-center space-x-1">
            {/* Botón anterior */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←<span className="sr-only">Anterior</span>
            </button>

            {/* Números de página */}
            <div className="hidden sm:flex space-x-1">
              {visiblePages.map((page, index) => (
                <div key={index}>
                  {page === "..." ? (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        page === currentPage
                          ? "z-10 bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Selector de página en móvil */}
            <div className="sm:hidden">
              <select
                value={currentPage}
                onChange={(e) => onPageChange(parseInt(e.target.value))}
                className="form-select relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-md"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <option key={page} value={page}>
                      Página {page}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Botón siguiente */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →<span className="sr-only">Siguiente</span>
            </button>
          </div>
        </div>
      </div>
    );
  },
);

LibraryPagination.displayName = "LibraryPagination";

export default LibraryPagination;
