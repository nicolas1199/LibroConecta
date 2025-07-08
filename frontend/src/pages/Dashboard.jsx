"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Filter from "../components/icons/Filter"
import ArrowRight from "../components/icons/ArrowRight"
import BookOpen from "../components/icons/BookOpen"
import RefreshCw from "../components/icons/RefreshCw"
import Gift from "../components/icons/Gift"
import DollarSign from "../components/icons/DollarSign"
import MessageCircle from "../components/icons/MessageCircle"
import Star from "../components/icons/Star"
import Heart from "../components/icons/Heart"
import BookCard from "../components/BookCard"
import MatchCard from "../components/MatchCard"
import { getPublishedBooks } from "../api/publishedBooks"
import { getMatches, getSuggestedMatches } from "../api/matches"
import { getConversations } from "../api/messages"
import { getPendingRatings, getMyRatings } from "../api/ratings"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("recientes")
  const [publishedBooks, setPublishedBooks] = useState([])
  const [matches, setMatches] = useState([])
  const [suggestedMatches, setSuggestedMatches] = useState([])
  const [conversations, setConversations] = useState([])
  const [pendingRatings, setPendingRatings] = useState([])
  const [myRatings, setMyRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Cargar datos solo si el usuario está logueado
        const token = localStorage.getItem("token")
        if (token) {
          const [
            booksResponse,
            matchesResponse,
            suggestedResponse,
            conversationsResponse,
            pendingRatingsResponse,
            myRatingsResponse
          ] = await Promise.all([
            getPublishedBooks({ limit: 6 }),
            getMatches({ limit: 5 }),
            getSuggestedMatches({ limit: 3 }),
            getConversations({ limit: 5 }),
            getPendingRatings(),
            getMyRatings({ type: "received", limit: 5 })
          ])

          setPublishedBooks(booksResponse.publishedBooks || [])
          setMatches(matchesResponse.data || [])
          setSuggestedMatches(suggestedResponse.data || [])
          setConversations(conversationsResponse.data || [])
          setPendingRatings(pendingRatingsResponse.data || [])
          setMyRatings(myRatingsResponse.data || [])
        } else {
          // Solo cargar libros publicados si no hay usuario
          const response = await getPublishedBooks({ limit: 6 })
          setPublishedBooks(response.publishedBooks || [])
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const tabs = [
    { id: "recientes", label: "Recientes" },
    { id: "matches", label: "Matches" },
    { id: "cercanos", label: "Cercanos" },
  ]

  const getCurrentData = () => {
    switch (activeTab) {
      case "matches":
        return suggestedMatches.map(match => ({
          ...match.user,
          score: match.score,
          commonCategories: match.commonCategories,
          booksCount: match.booksCount,
          type: "suggested_match"
        }))
      case "cercanos":
        return publishedBooks.filter(book => book.LocationBook?.location_name)
      default:
        return publishedBooks
    }
  }

  const stats = [
    { icon: BookOpen, label: "Libros publicados", value: publishedBooks.length, color: "blue" },
    { icon: RefreshCw, label: "Matches", value: matches.length, color: "purple" },
    { icon: Gift, label: "Mensajes", value: conversations.length, color: "green" },
    { icon: DollarSign, label: "Calificaciones", value: myRatings.length, color: "cyan" },
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

        {/* Content Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "matches" ? "Matches sugeridos" : 
               activeTab === "cercanos" ? "Libros cercanos" : 
               "Libros recientes"}
            </h2>
            <Link 
              to={activeTab === "matches" ? "/dashboard/matches" : "/dashboard/explore"} 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
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

          {/* Content Grid */}
          {!loading && !error && getCurrentData().length > 0 && (
            <>
              {activeTab === "matches" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getCurrentData().map((match) => (
                    <MatchCard key={match.user_id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getCurrentData().map((book) => (
                    <BookCard key={book.published_book_id} book={book} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && getCurrentData().length === 0 && (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                {activeTab === "matches" ? (
                  <Heart className="h-8 w-8 text-gray-400" />
                ) : (
                  <BookOpen className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === "matches" ? "No hay matches disponibles" : 
                 activeTab === "cercanos" ? "No hay libros cercanos" : 
                 "No hay libros publicados aún"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {activeTab === "matches" ? "Publica más libros para encontrar usuarios compatibles" : 
                 activeTab === "cercanos" ? "No hay libros disponibles en tu área" : 
                 "Sé el primero en compartir un libro con la comunidad"}
              </p>
              <Link 
                to={activeTab === "matches" ? "/dashboard/publish" : "/dashboard/publish"} 
                className="btn btn-primary btn-lg inline-flex items-center space-x-2"
              >
                <span>
                  {activeTab === "matches" ? "Publicar libro" : "Publicar mi primer libro"}
                </span>
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
          <p className="text-sm text-gray-600 mb-6">Últimos matches, mensajes y calificaciones</p>

          <div className="space-y-4">
            {/* Pending Ratings */}
            {pendingRatings.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">
                      {pendingRatings.length} calificación{pendingRatings.length > 1 ? 'es' : ''} pendiente{pendingRatings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Link 
                    to="/dashboard/ratings" 
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    Ver todas
                  </Link>
                </div>
              </div>
            )}

            {/* Suggested Matches */}
            {suggestedMatches.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {suggestedMatches.length} match{suggestedMatches.length > 1 ? 'es' : ''} sugerido{suggestedMatches.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Link 
                    to="/dashboard/matches" 
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Ver todos
                  </Link>
                </div>
              </div>
            )}

            {/* Recent Conversations */}
            {conversations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Conversaciones recientes</h4>
                {conversations.slice(0, 3).map((conversation) => (
                  <Link
                    key={conversation.match_id}
                    to={`/dashboard/messages/${conversation.match_id}`}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.other_user.first_name} {conversation.other_user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.last_message || "No hay mensajes"}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {conversation.unread_count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {pendingRatings.length === 0 && suggestedMatches.length === 0 && conversations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay actividad reciente para mostrar.</p>
              </div>
            )}
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
