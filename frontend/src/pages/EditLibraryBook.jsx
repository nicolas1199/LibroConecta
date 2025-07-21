"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserLibraryBookById } from "../api/userLibrary";
import { useUpdateLibraryBook } from "../hooks/useUpdateLibraryBook";
import ArrowLeft from "../components/icons/ArrowLeft";
import CustomDatePicker from "../components/CustomDatePicker";
import CustomSelect from "../components/CustomSelect";

export default function EditLibraryBook() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    updateBookAsync,
    isUpdating,
    error: updateError,
  } = useUpdateLibraryBook();

  const [book, setBook] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    status: "por_leer",
    rating: 0,
    review: "",
    startedAt: "",
    finishedAt: "",
  });

  // Opciones para el selector de estado
  const readingStatusOptions = [
    {
      value: "por_leer",
      label: "Quiero leer",
      description: "Añadir a lista de pendientes",
    },
    {
      value: "leyendo",
      label: "Leyendo",
      description: "Actualmente en progreso",
    },
    {
      value: "leido",
      label: "Leído",
      description: "Lectura completada",
    },
    {
      value: "abandonado",
      label: "Abandonado",
      description: "Lectura interrumpida",
    },
  ];

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserLibraryBookById(id);
      setBook(response);
      setFormData({
        status: response.reading_status || "por_leer",
        rating: response.rating || 0,
        review: response.review || "",
        startedAt: response.date_started
          ? response.date_started.split("T")[0]
          : "",
        finishedAt: response.date_finished
          ? response.date_finished.split("T")[0]
          : "",
      });
    } catch (error) {
      console.error("Error loading book:", error);
      setError("Error al cargar el libro");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBook();
  }, [id, loadBook]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de fechas
    if (formData.startedAt && formData.finishedAt) {
      const startDate = new Date(formData.startedAt);
      const finishDate = new Date(formData.finishedAt);

      if (startDate > finishDate) {
        setError(
          "La fecha de inicio no puede ser posterior a la fecha de finalización",
        );
        return;
      }
    }

    try {
      const dataToSend = {
        reading_status: formData.status,
        rating: formData.rating > 0 ? formData.rating : null,
        review: formData.review || null,
        date_started: formData.startedAt || null,
        date_finished: formData.finishedAt || null,
      };

      await updateBookAsync(id, dataToSend);
      navigate("/dashboard/library");
    } catch (error) {
      console.error("Error updating book:", error);
      setError("Error al actualizar el libro");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || "Libro no encontrado"}</p>
        <button
          onClick={() => navigate("/dashboard/library")}
          className="btn btn-secondary mt-4"
        >
          Volver a biblioteca
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-1">
          <button
            onClick={() => navigate("/dashboard/library")}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar libro</h1>
            <p className="text-gray-600">
              Actualiza el estado de lectura de tu libro
            </p>
          </div>
        </div>

        {/* Card centrada */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {/* Header del libro */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-100 rounded-t-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {book["title"] || "Título no disponible"}
            </h2>
            <p className="text-gray-600 flex items-center">
              <span className="text-gray-400 mr-2">por</span>
              {book["author"] || "Autor no disponible"}
            </p>
          </div>

          {/* Formulario */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <CustomSelect
                  value={formData.status}
                  onChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                  options={readingStatusOptions}
                  label="Estado de lectura"
                  placeholder="Selecciona el estado del libro"
                />
              </div>

              {(formData.status === "leido" ||
                formData.status === "abandonado") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valoración
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, rating: star })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          (formData.rating || 0) >= star
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                      >
                        <span className="text-xl">★</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: 0 })}
                      className="text-sm text-gray-500 ml-3 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              )}

              {(formData.status === "leyendo" ||
                formData.status === "leido" ||
                formData.status === "abandonado") && (
                <div>
                  <CustomDatePicker
                    selected={
                      formData.startedAt ? new Date(formData.startedAt) : null
                    }
                    onChange={(dateString) =>
                      setFormData({
                        ...formData,
                        startedAt: dateString,
                      })
                    }
                    placeholder="Selecciona fecha de inicio"
                    label="Fecha de inicio"
                    optional={true}
                    maxDate={new Date()}
                    minDate={null}
                  />
                </div>
              )}

              {(formData.status === "leido" ||
                formData.status === "abandonado") && (
                <div>
                  <CustomDatePicker
                    selected={
                      formData.finishedAt ? new Date(formData.finishedAt) : null
                    }
                    onChange={(dateString) =>
                      setFormData({
                        ...formData,
                        finishedAt: dateString,
                      })
                    }
                    placeholder="Selecciona fecha de finalización"
                    label="Fecha de finalización"
                    optional={true}
                    maxDate={new Date()}
                    minDate={
                      formData.startedAt ? new Date(formData.startedAt) : null
                    }
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={formData.review}
                  onChange={(e) =>
                    setFormData({ ...formData, review: e.target.value })
                  }
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Escribe tus notas sobre este libro..."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/library")}
                  disabled={isUpdating}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUpdating && (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isUpdating ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
