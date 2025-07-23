"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getUserProfile, updateUserProfile } from "../api/auth"
import { getLocations } from "../api/publishedBooks"
import DashboardLayout from "../layouts/DashboardLayout"
import ArrowLeft from "../components/icons/ArrowLeft"
import Upload from "../components/icons/Upload"
import X from "../components/icons/X"
import Users from "../components/icons/Users"
import LocationSelect from "../components/LocationSelect";


export default function EditProfile() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState("")
  const [locations, setLocations] = useState([])
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    location_id: "", // Cambiar de location a location_id
    bio: "",
    profile_image: null,
    profile_image_preview: null
  })

  // Cargar datos del usuario y ubicaciones
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true)
        
        const [profileData, locationsData] = await Promise.all([
          getUserProfile(),
          getLocations()
        ])

        setFormData({
          first_name: profileData.data.first_name || "",
          last_name: profileData.data.last_name || "",
          email: profileData.data.email || "",
          username: profileData.data.username || "",
          location_id: profileData.data.location_id || "",
          bio: profileData.data.bio || "",
          profile_image: null,
          profile_image_preview: profileData.data.profile_image || null
        })

        setLocations(locationsData)
        
      } catch (error) {
        console.error("Error loading data:", error)
        if (error.message?.includes('locations')) {
          setMessage("Error al cargar las ubicaciones. Verifique la conexión al servidor.")
        } else {
          setMessage("Error al cargar los datos del perfil")
        }
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          profile_image: "Por favor selecciona un archivo de imagen válido"
        }))
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profile_image: "La imagen no puede ser mayor a 5MB"
        }))
        return
      }

      setFormData(prev => ({
        ...prev,
        profile_image: file,
        profile_image_preview: URL.createObjectURL(file)
      }))

      // Limpiar error
      setErrors(prev => ({
        ...prev,
        profile_image: ""
      }))
    }
  }

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profile_image: null,
      profile_image_preview: null
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es requerido"
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido"
    } else if (formData.username.length < 3) {
      newErrors.username = "El nombre de usuario debe tener al menos 3 caracteres"
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "La biografía no puede exceder los 500 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setMessage("")

    try {
      // Preparar datos para enviar
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        location_id: formData.location_id,
        location: formData.location_id ? locations.find(l => l.location_id === Number.parseInt(formData.location_id))?.comuna || "" : "",
        bio: formData.bio
      }

      // Si hay imagen, convertir a base64
      if (formData.profile_image) {
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(formData.profile_image)
        })
        updateData.profile_image = base64Image
      }

      await updateUserProfile(updateData)
      
      // Actualizar datos en localStorage
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}")
      Object.assign(updatedUser, updateData)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setMessage("¡Perfil actualizado exitosamente!")
      
      // Redirigir después de un momento
      setTimeout(() => {
        navigate("/dashboard")
      }, 2000)

    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage(error.message || "Error al actualizar el perfil. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Agrupar ubicaciones por región (igual que en PublishBook)
  const groupedLocations = useMemo(() => {
    return locations.reduce((acc, location) => {
      if (!acc[location.region]) {
        acc[location.region] = []
      }
      acc[location.region].push(location)
      return acc
    }, {})
  }, [locations])

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar Perfil</h1>
            <p className="text-gray-600">Actualiza tu información personal</p>
            
            {/* Enlaces de navegación rápida */}
            <div className="flex justify-center space-x-4 mt-4">
              <button
                type="button"
                onClick={() => navigate("/my-publications")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Ver mis publicaciones
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => navigate("/dashboard/publish")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Publicar nuevo libro
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Imagen de perfil */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Imagen de perfil
              </label>
              
              <div className="flex flex-col items-center">
                {formData.profile_image_preview ? (
                  <div className="relative">
                    <img
                      src={formData.profile_image_preview}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                />
                
                <label
                  htmlFor="profile-image-upload"
                  className="mt-4 btn btn-secondary cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.profile_image_preview ? "Cambiar imagen" : "Subir imagen"}
                </label>

                {errors.profile_image && (
                  <p className="text-red-600 text-sm mt-2">{errors.profile_image}</p>
                )}
              </div>
            </div>

            {/* Información personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className={`form-control ${errors.first_name ? "border-red-500" : ""}`}
                  placeholder="Tu nombre"
                />
                {errors.first_name && <p className="form-error">{errors.first_name}</p>}
              </div>

              <div>
                <label className="form-label">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className={`form-control ${errors.last_name ? "border-red-500" : ""}`}
                  placeholder="Tu apellido"
                />
                {errors.last_name && <p className="form-error">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`form-control ${errors.email ? "border-red-500" : ""}`}
                placeholder="tu@email.com"
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div>
              <label className="form-label">
                Nombre de usuario <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`form-control ${errors.username ? "border-red-500" : ""}`}
                placeholder="tu_usuario"
              />
              {errors.username && <p className="form-error">{errors.username}</p>}
            </div>

            <div>
              {/* Selector de ubicación reutilizable */}
              <LocationSelect
                locations={locations}
                value={formData.location_id}
                onChange={e => handleInputChange("location_id", e.target.value)}
                error={errors.location_id}
                required
              />
            </div>

            <div>
              <label className="form-label">Biografía</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className={`form-control ${errors.bio ? "border-red-500" : ""}`}
                rows="4"
                placeholder="Cuéntanos algo sobre ti, tus gustos literarios, etc."
                maxLength="500"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && <p className="form-error">{errors.bio}</p>}
                <span className="text-sm text-gray-500">
                  {formData.bio.length}/500 caracteres
                </span>
              </div>
            </div>

            {/* Mensaje */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes("exitosamente") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <div className="spinner mr-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
