"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getUserProfileById, getUserProfile } from "../api/auth"
import { getUserRatings } from "../api/ratings"
import { getMatches } from "../api/matches"
import { getPublishedBooksByUser } from "../api/publishedBooks"
import ArrowLeft from "../components/icons/ArrowLeft"
import Edit from "../components/icons/Edit"
import MapPin from "../components/icons/MapPin"
import Users from "../components/icons/Users"
import BookOpen from "../components/icons/BookOpen"
import MessageCircle from "../components/icons/MessageCircle"
import Star from "../components/icons/Star"
import ProfileImage from "../components/ProfileImage"

export default function UserProfile() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const [ratings, setRatings] = useState([])
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [stats, setStats] = useState({
    publishedBooks: 0,
    matches: 0,
    exchanges: 0
  })

  const loadUserRatings = async (targetUserId) => {
    try {
      setRatingsLoading(true)
      const response = await getUserRatings(targetUserId, { type: 'received', limit: 20 })
      const userRatings = response.data || []
      
      setRatings(userRatings)
      setTotalRatings(userRatings.length)
      
      // Calcular promedio de calificaciones
      if (userRatings.length > 0) {
        const average = userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length
        setAverageRating(Math.round(average * 10) / 10) // Redondear a 1 decimal
      } else {
        setAverageRating(0)
      }
    } catch (error) {
      console.error("Error loading user ratings:", error)
      setRatings([])
      setAverageRating(0)
      setTotalRatings(0)
    } finally {
      setRatingsLoading(false)
    }
  }

  const loadUserStats = async (targetUserId) => {
    try {
      // Solo cargar matches si es el usuario actual (por privacidad)
      const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.user_id;
      
      // Cargar libros publicados (público)
      const booksResponse = await getPublishedBooksByUser(targetUserId);
      const publishedBooks = booksResponse.data?.length || 0;
      
      let matches = 0;
      if (currentUserId && (currentUserId === targetUserId || !userId)) {
        // Solo mostrar matches si es el perfil propio
        try {
          const matchesResponse = await getMatches();
          matches = matchesResponse.data?.length || 0;
        } catch (error) {
          console.error("Error loading matches:", error);
        }
      }
      
      setStats({
        publishedBooks,
        matches,
        exchanges: 0 // Por ahora, necesitaríamos una API específica para esto
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
      setStats({
        publishedBooks: 0,
        matches: 0,
        exchanges: 0
      });
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        console.log("🔄 Cargando datos del perfil...")
        
        // Obtener usuario actual del localStorage
        const currentUserData = localStorage.getItem("user")
        console.log("📦 Datos del localStorage:", currentUserData)
        
        if (currentUserData) {
          try {
            const parsedCurrentUser = JSON.parse(currentUserData)
            console.log("👤 Usuario actual parseado:", parsedCurrentUser)
            
            // Validar que el usuario tenga los datos mínimos necesarios
            if (!parsedCurrentUser || !parsedCurrentUser.user_id) {
              console.error("❌ Usuario inválido en localStorage")
              setUser(null)
              setLoading(false)
              return
            }
            
            setCurrentUser(parsedCurrentUser)
            
            // Determinar si es perfil propio o de otro usuario
            const isOwn = !userId || userId === parsedCurrentUser.user_id.toString()
            console.log("🔍 ¿Es perfil propio?", isOwn, "userId:", userId, "currentUserId:", parsedCurrentUser.user_id)
            setIsOwnProfile(isOwn)
            
            let profileUser
            if (isOwn) {
              // SIEMPRE obtener datos actualizados desde la API
              try {
                const response = await getUserProfile()
                profileUser = response.data
                // Actualizar localStorage y estado global si es necesario
                localStorage.setItem("user", JSON.stringify(profileUser))
              } catch (apiError) {
                // Si la API falla, usar localStorage como fallback
                profileUser = parsedCurrentUser
              }
            } else {
              // Es perfil de otro usuario - cargar por API
              console.log("🌐 Cargando perfil de otro usuario...")
              const response = await getUserProfileById(userId)
              profileUser = response.data
              console.log("📥 Perfil cargado de API:", profileUser)
            }
            
            setUser(profileUser)
            console.log("✅ Usuario establecido en estado:", profileUser)
            
            // Cargar calificaciones del usuario
            loadUserRatings(profileUser.user_id)
            
            // Cargar estadísticas del usuario
            loadUserStats(profileUser.user_id)
          } catch (parseError) {
            console.error("❌ Error parseando datos del usuario:", parseError)
            setUser(null)
          }
        } else {
          console.error("❌ No hay datos de usuario en localStorage")
          setUser(null)
        }
      } catch (error) {
        console.error("❌ Error loading user profile:", error)
        setUser(null)
      } finally {
        setLoading(false)
        console.log("🏁 Carga completada")
      }
    }

    loadData()
  }, [userId])

  const getInitials = () => {
    if (!user) return "U"
    const firstName = user.first_name || ""
    const lastName = user.last_name || ""
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "U"
  }

  const renderStars = (rating) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  // Función helper para formatear la ubicación de manera segura
  const formatLocation = (location) => {
    if (!location) return "No especificada"
    
    try {
      // Si es un objeto con region y comuna
      if (typeof location === 'object' && location.region && location.comuna) {
        return `${location.comuna}, ${location.region}`
      }
      
      // Si es un string
      if (typeof location === 'string') {
        return location
      }
      
      return "No especificada"
    } catch (error) {
      console.error("❌ Error formateando ubicación:", error)
      return "No especificada"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Usuario no encontrado</p>
        </div>
      </div>
    )
  }

  // Debug temporal - mostrar datos del usuario
  console.log("🔍 Renderizando UserProfile con usuario:", user)
  console.log("🔍 Tipo de location:", typeof user.location)
  console.log("🔍 Location completo:", user.location)

  try {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al dashboard
            </button>
            
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                {isOwnProfile ? "Mi Perfil" : `Perfil de ${user?.first_name || ""} ${user?.last_name || ""}`}
              </h1>
              
              {isOwnProfile && (
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar Perfil</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Información del Usuario */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Información Personal
                </h2>

                <div className="space-y-6">
                  {/* Nombres */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {user?.first_name || "No especificado"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido
                      </label>
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {user?.last_name || "No especificado"}
                      </div>
                    </div>
                  </div>

                  {/* Email y Username */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {user?.email || "No especificado"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usuario
                      </label>
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        @{user?.username || "No especificado"}
                      </div>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {formatLocation(user?.location)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Perfil */}
            <div className="space-y-6">
              {/* Avatar y información básica */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <ProfileImage
                    user={user}
                    size="3xl"
                    showBorder={true}
                    className="mx-auto mb-4"
                  />
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {user?.first_name || ""} {user?.last_name || ""}
                  </h3>
                  
                  <p className="text-gray-500 mb-2">@{user?.username || ""}</p>
                  
                  {user?.location && (
                    <div className="flex items-center justify-center text-gray-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{formatLocation(user.location)}</span>
                    </div>
                  )}
                  
                  {user?.biography && (
                    <div className="text-left mb-4">
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {user.biography}
                      </p>
                    </div>
                  )}
                  
                  {/* Botón de chat para perfiles de otros usuarios */}
                  {!isOwnProfile && (
                    <button
                      onClick={() => navigate(`/dashboard/messages/new?user=${user?.user_id}`)}
                      className="w-full btn btn-primary flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Enviar Mensaje</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Estadísticas del usuario */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Estadísticas
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-600">Libros publicados</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.publishedBooks}</span>
                  </div>
                  
                  {(isOwnProfile || stats.matches > 0) && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-600">Matches</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stats.matches}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-gray-600">Calificación</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-gray-900">
                        {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                      </span>
                      {averageRating > 0 && (
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">Reseñas</span>
                    </div>
                    <span className="font-semibold text-gray-900">{totalRatings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Calificaciones */}
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Calificaciones Recibidas
                </h2>
                
                {totalRatings > 0 && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(Math.round(averageRating))}
                      <span className="ml-2 text-sm text-gray-600">
                        {averageRating.toFixed(1)} ({totalRatings} reseña{totalRatings !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {ratingsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : ratings.length > 0 ? (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.rating_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <ProfileImage
                            user={rating.Rater}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {rating.Rater.first_name} {rating.Rater.last_name}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {renderStars(rating.rating)}
                              <span className="text-sm text-gray-500">
                                {new Date(rating.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {rating.comment && (
                        <div className="mt-3">
                          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                            "{rating.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sin calificaciones aún
                  </h3>
                  <p className="text-gray-600">
                    {isOwnProfile 
                      ? "Aún no has recibido calificaciones." 
                      : "Este usuario aún no ha recibido calificaciones."
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("❌ Error renderizando UserProfile:", error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error al cargar el perfil</p>
          <p className="text-sm text-gray-500 mt-2">Detalles: {error.message}</p>
        </div>
      </div>
    )
  }
} 