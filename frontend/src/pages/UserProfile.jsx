"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getUserProfile, updateUserProfile, getUserProfileById } from "../api/auth"
import { getLocations } from "../api/publishedBooks"
import ArrowLeft from "../components/icons/ArrowLeft"
import Edit from "../components/icons/Edit"
import MapPin from "../components/icons/MapPin"
import User from "../components/icons/Users"
import BookOpen from "../components/icons/BookOpen"
import Settings from "../components/icons/Settings"

export default function UserProfile() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(true)

  // Estados para el formulario
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    location: "",
    region: "",
    comuna: ""
  })

  // Regiones y comunas disponibles
  const [regions, setRegions] = useState([])
  const [comunas, setComunas] = useState([])
  const [selectedRegion, setSelectedRegion] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Obtener usuario actual del localStorage
        const currentUserData = localStorage.getItem("user")
        if (currentUserData) {
          const parsedCurrentUser = JSON.parse(currentUserData)
          setCurrentUser(parsedCurrentUser)
          
          // Determinar si es perfil propio o de otro usuario
          const isOwn = !userId || userId === parsedCurrentUser.user_id.toString()
          setIsOwnProfile(isOwn)
          
          let profileUser
          if (isOwn) {
            // Es el perfil propio
            profileUser = parsedCurrentUser
          } else {
            // Es perfil de otro usuario - cargar por API
            const response = await getUserProfileById(userId)
            profileUser = response.data
          }
          
          setUser(profileUser)
          
          // Solo cargar ubicaciones y configurar formulario si es perfil propio
          if (isOwn) {
            // Cargar ubicaciones
            const locationsResponse = await getLocations()
            setLocations(locationsResponse.data || [])
            
            // Procesar regiones únicas
            const uniqueRegions = [...new Set(locationsResponse.data?.map(loc => loc.region) || [])]
            setRegions(uniqueRegions)
            
            // Configurar datos del formulario
            setFormData({
              first_name: profileUser.first_name || "",
              last_name: profileUser.last_name || "",
              email: profileUser.email || "",
              username: profileUser.username || "",
              location: profileUser.location || "",
              region: "",
              comuna: ""
            })
            
            // Si el usuario tiene ubicación, parsearlo
            if (profileUser.location) {
              const [region, comuna] = profileUser.location.split(" - ")
              if (region && comuna) {
                setSelectedRegion(region)
                setFormData(prev => ({
                  ...prev,
                  region: region,
                  comuna: comuna
                }))
                
                // Cargar comunas de esa región
                const regionComunas = locationsResponse.data?.filter(loc => loc.region === region) || []
                setComunas(regionComunas)
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setError("Error al cargar el perfil")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  const handleRegionChange = (region) => {
    setSelectedRegion(region)
    setFormData(prev => ({
      ...prev,
      region: region,
      comuna: ""
    }))
    
    // Filtrar comunas de la región seleccionada
    const regionComunas = locations.filter(loc => loc.region === region)
    setComunas(regionComunas)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Construir ubicación completa
      const location = formData.region && formData.comuna ? 
        `${formData.region} - ${formData.comuna}` : 
        formData.location

      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        location: location
      }

      await updateUserProfile(updateData)
      
      // Actualizar usuario en localStorage
      const updatedUser = { ...user, ...updateData }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setSuccess("Perfil actualizado exitosamente")
      setEditing(false)
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Error al actualizar el perfil")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      const [region, comuna] = user.location ? user.location.split(" - ") : ["", ""]
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        username: user.username || "",
        location: user.location || "",
        region: region || "",
        comuna: comuna || ""
      })
      setSelectedRegion(region || "")
      if (region) {
        const regionComunas = locations.filter(loc => loc.region === region)
        setComunas(regionComunas)
      }
    }
    setEditing(false)
    setError(null)
    setSuccess(null)
  }

  const getInitials = () => {
    if (!user) return "U"
    const first = user.first_name?.charAt(0) || ""
    const last = user.last_name?.charAt(0) || ""
    return `${first}${last}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No se pudo cargar el perfil
          </h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-primary"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver al Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {isOwnProfile ? "Mi Perfil" : `Perfil de ${user?.first_name} ${user?.last_name}`}
            </h1>
            
            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
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

              {/* Mensajes de éxito/error */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    {isOwnProfile ? (
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        required
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {user?.first_name || "No especificado"}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido
                    </label>
                    {isOwnProfile ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        required
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {user?.last_name || "No especificado"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email y Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {isOwnProfile ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        required
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {user?.email || "No especificado"}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de Usuario
                    </label>
                    {isOwnProfile ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        required
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        @{user?.username || "No especificado"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Ubicación
                  </label>
                  
                  {isOwnProfile ? (
                    editing ? (
                      <div className="space-y-4">
                        {/* Selector de Región */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Región
                          </label>
                          <select
                            value={selectedRegion}
                            onChange={(e) => handleRegionChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccionar región</option>
                            {regions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selector de Comuna */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Comuna
                          </label>
                          <select
                            name="comuna"
                            value={formData.comuna}
                            onChange={handleInputChange}
                            disabled={!selectedRegion}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            <option value="">Seleccionar comuna</option>
                            {comunas.map((location) => (
                              <option key={location.location_id} value={location.comuna}>
                                {location.comuna}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {user?.location || "No especificada"}
                      </div>
                    )
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {user?.location || "No especificada"}
                    </div>
                  )}
                </div>

                {/* Botones */}
                {isOwnProfile && editing && (
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="spinner border-white border-t-transparent w-4 h-4"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4" />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="btn btn-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </form>
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
                    <User className="h-4 w-4 text-purple-600" />
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