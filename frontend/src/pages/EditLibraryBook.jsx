"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUserLibraryBookById,
  updateReadingStatus,
} from "../api/userLibrary";
import ArrowLeft from "../components/icons/ArrowLeft";

export default function EditLibraryBook() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    status: "por_leer",
    rating: 0,
    progress: 0,
    review: "",
    startedAt: "",
    finishedAt: "",
  });

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await getUserLibraryBookById(id);
      setBook(response);
      setFormData({
        status: response.reading_status || "por_leer",
        rating: response.rating || 0,
        progress: response.progress || 0,
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        reading_status: formData.status,
        rating: formData.rating > 0 ? formData.rating : null,
        progress: formData.progress || null,
        review: formData.review || null,
        date_started: formData.startedAt || null,
        date_finished: formData.finishedAt || null,
      };

      await updateReadingStatus(id, dataToSend);
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
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/dashboard/library")}
          className="text-gray-600 hover:text-gray-900"
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

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {book.title}
          </h2>
          <p className="text-gray-600">por {book.author}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de lectura
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="por_leer">Quiero leer</option>
              <option value="leyendo">Leyendo</option>
              <option value="leido">Leído</option>
              <option value="abandonado">Abandonado</option>
            </select>
          </div>

          {formData.status === "leyendo" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progreso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {(formData.status === "leido" ||
            formData.status === "abandonado") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valoración
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`p-2 ${
                      (formData.rating || 0) >= star
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: 0 })}
                  className="text-sm text-gray-500 ml-2"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}

          {formData.status === "reading" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={formData.startedAt}
                onChange={(e) =>
                  setFormData({ ...formData, startedAt: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {(formData.status === "read" || formData.status === "abandoned") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={formData.startedAt}
                  onChange={(e) =>
                    setFormData({ ...formData, startedAt: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de finalización
                </label>
                <input
                  type="date"
                  value={formData.finishedAt}
                  onChange={(e) =>
                    setFormData({ ...formData, finishedAt: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.review}
              onChange={(e) =>
                setFormData({ ...formData, review: e.target.value })
              }
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Escribe tus notas sobre este libro..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/library")}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
