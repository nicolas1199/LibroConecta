"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLibraryInsights } from "../api/userLibrary";
import ArrowLeft from "../components/icons/ArrowLeft";
import BookOpen from "../components/icons/BookOpen";
import TrendingUp from "../components/icons/TrendingUp";
import Calendar from "../components/icons/Calendar";
import Target from "../components/icons/Target";
import BarChart from "../components/icons/BarChart";

export default function LibraryInsights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await getLibraryInsights();
      setInsights(response);
    } catch (error) {
      console.error("Error loading insights:", error);
      setError("Error al cargar los insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || "Error al cargar insights"}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">
            Insights de tu biblioteca
          </h1>
          <p className="text-gray-600">
            Análisis detallado de tus hábitos de lectura
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total de libros
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.totalBooks || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Libros leídos</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.readBooks || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Promedio mensual
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.monthlyAverage || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Valoración promedio
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.averageRating || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <BarChart className="w-5 h-5 inline mr-2" />
            Estado de libros
          </h3>
          <div className="space-y-3">
            {insights.statusDistribution?.map((item, index) => {
              const statusLabels = {
                want_to_read: "Quiero leer",
                reading: "Leyendo",
                read: "Leído",
                abandoned: "Abandonado",
              };
              const colors = [
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
                "bg-red-500",
              ];
              const percentage =
                insights.totalBooks > 0
                  ? ((item.count / insights.totalBooks) * 100).toFixed(1)
                  : 0;

              return (
                <div key={item.status} className="flex items-center">
                  <div
                    className={`w-4 h-4 rounded ${colors[index % colors.length]} mr-3`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {statusLabels[item.status] || item.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[index % colors.length]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reading Goals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Target className="w-5 h-5 inline mr-2" />
            Progreso de lectura
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Libros leídos este año
                </span>
                <span className="text-sm text-gray-500">
                  {insights.readThisYear || 0}
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${Math.min((insights.readThisYear / 12) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Meta: 12 libros al año
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Libros en progreso
                </span>
                <span className="text-sm text-gray-500">
                  {insights.currentlyReading || 0}
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{
                    width: `${Math.min((insights.currentlyReading / 3) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recomendado: máximo 3 libros simultáneos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recomendaciones personalizadas
        </h3>
        <div className="space-y-4">
          {insights.recommendations?.map((rec, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-medium text-gray-900">{rec.title}</h4>
              <p className="text-sm text-gray-600">{rec.description}</p>
            </div>
          ))}

          {(!insights.recommendations ||
            insights.recommendations.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>
                Agrega más libros para obtener recomendaciones personalizadas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {insights.recentActivity && insights.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad reciente
          </h3>
          <div className="space-y-3">
            {insights.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
