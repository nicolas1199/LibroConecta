"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Filter from "../components/icons/Filter"
import ArrowRight from "../components/icons/ArrowRight"
import BookOpen from "../components/icons/BookOpen"
import RefreshCw from "../components/icons/RefreshCw"
import Gift from "../components/icons/Gift"
import DollarSign from "../components/icons/DollarSign"
import BookCard from "../components/BookCard"
import { getPublishedBooks } from "../api/publishedBooks"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("recientes")
  const [publishedBooks, setPublishedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    const loadPublishedBooks = async () => {
      try {
        setLoading(true)
        const response = await getPublishedBooks({ limit: 6 })
        setPublishedBooks(response.publishedBooks || [])
      } catch (error) {
        console.error("Error loading published books:", error)
        setError("Error al cargar los libros")
      } finally {
        setLoading(false)
      }
    }

    loadPublishedBooks()
  }, [])

  const tabs = [
    { id: "recientes", label: "Recientes" },
    { id: "matches", label: "Matches" },
    { id: "cercanos", label: "Cercanos" },
  ]

  const stats = [
    { icon: BookOpen, label: "Libros publicados", value: publishedBooks.length, color: "blue" },
    { icon: RefreshCw, label: "Intercambios", value: 0, color: "purple" },
    { icon: Gift, label: "Regalos", value: 0, color: "green" },
    { icon: DollarSign, label: "Ventas", value: 0, color: "cyan" },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido, {user?.first_name || "Lector"}</h1>
        <p className="text-gray-600">Descubre nuevos libros y conecta con otros lectores</p>
      </div>

      {/* Tabs and Content */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="dashboard-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`dashboard-tab ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filtrar</span>
          </button>
        </div>

        {/* Books Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Libros recientes</h2>
            <Link to="/dashboard/explore" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="spinner border-gray-300 border-t-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Books Grid */}
          {!loading && !error && publishedBooks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedBooks.map((book) => (
                <BookCard key={book.published_book_id} book={book} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && publishedBooks.length === 0 && (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay libros publicados aún</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Sé el primero en compartir un libro con la comunidad
              </p>
              <Link to="/dashboard/publish" className="btn btn-primary btn-lg inline-flex items-center space-x-2">
                <span>Publicar mi primer libro</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Actividad reciente</h3>
          <p className="text-sm text-gray-600 mb-6">Últimos intercambios y calificaciones</p>

          <div className="text-center py-8">
            <p className="text-gray-500">No hay actividad reciente para mostrar.</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas</h3>
          <p className="text-sm text-gray-600 mb-6">Tu actividad en LibroConecta</p>

          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.label} className="dashboard-stats-item">
                <div className="dashboard-stats-content">
                  <div className={`dashboard-stats-icon bg-${stat.color}-100`}>
                    <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                  </div>
                  <span className="text-gray-700 font-medium">{stat.label}</span>
                </div>
                <span className="dashboard-stats-value">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
