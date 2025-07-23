"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getUserProfileById } from "../api/auth"
import ArrowLeft from "../components/icons/ArrowLeft"
import Edit from "../components/icons/Edit"
import MapPin from "../components/icons/MapPin"
import Users from "../components/icons/Users"
import BookOpen from "../components/icons/BookOpen"
import MessageCircle from "../components/icons/MessageCircle"

export default function UserProfile() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(true)

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
              // Es el perfil propio
              profileUser = parsedCurrentUser
              console.log("✅ Usando perfil propio:", profileUser)
            } else {
              // Es perfil de otro usuario - cargar por API
              console.log("🌐 Cargando perfil de otro usuario...")
              const response = await getUserProfileById(userId)
              profileUser = response.data
              console.log("📥 Perfil cargado de API:", profileUser)
            }
            
            setUser(profileUser)
            console.log("✅ Usuario establecido en estado:", profileUser)
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
              {isOwnProfile ? "Mi Perfil" : `Perfil de ${user?.first_name} ${user?.last_name}`}
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
                    {user?.location || "No especificada"}
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
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {getInitials()}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {user.first_name} {user.last_name}
                </h3>
                
                <p className="text-gray-500 mb-2">@{user.username}</p>
                
                {user.location && (
                  <div className="flex items-center justify-center text-gray-500 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                  </div>
                )}
                
                {/* Botón de chat para perfiles de otros usuarios */}
                {!isOwnProfile && (
                  <button
                    onClick={() => navigate(`/dashboard/messages/new?user=${user.user_id}`)}
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
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-600">Matches</span>
                  </div>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 