"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import MessageCircle from "./icons/MessageCircle"
import Star from "./icons/Star"
import BookOpen from "./icons/BookOpen"
import Heart from "./icons/Heart"
import ProfileImage from "./ProfileImage"

export default function MatchCard({ match, matchData }) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)

  // Extraer datos del match
  const {
    user_id,
    first_name,
    last_name,
    email,
    score,
    commonCategories = 0,
    booksCount = 0,
    date_match
  } = match

  // Función para obtener las iniciales del usuario
  const getInitials = () => {
    const firstInitial = first_name?.charAt(0) || "U"
    const lastInitial = last_name?.charAt(0) || ""
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  // Función para generar estrellas de compatibilidad
  const renderCompatibilityStars = () => {
    const rating = Math.round((score || 0) / 20) // Convertir score de 0-100 a 0-5 estrellas
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index} 
        className={`h-4 w-4 ${index < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} 
      />
    ))
  }

  // Función para manejar el chat
  const handleStartChat = (e) => {
    e.stopPropagation()
    // Aquí iría la lógica para crear un match/conversación
    console.log("Iniciar chat con usuario:", user_id)
    navigate(`/dashboard/messages/new?user=${user_id}`)
  }

  // Función para ver perfil
  const handleViewProfile = (e) => {
    e.stopPropagation()
    navigate(`/profile/${user_id}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
      {/* Header con avatar y score */}
      <div className="relative p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          {/* Avatar */}
          <ProfileImage user={match} size="lg" />

          {/* Score de compatibilidad */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {score || 0}%
            </div>
            <div className="text-xs text-gray-500">Compatibilidad</div>
          </div>
        </div>

        {/* Nombre */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {first_name} {last_name}
        </h3>
        
        {/* Fecha del match */}
        {date_match && (
          <p className="text-xs text-gray-500 mb-2">
            Match desde {new Date(date_match).toLocaleDateString()}
          </p>
        )}
        
        {/* Calificación de compatibilidad */}
        {score && (
          <div className="flex items-center space-x-1 mb-2">
            {renderCompatibilityStars()}
            <span className="text-sm text-gray-500 ml-2">
              ({Math.round((score || 0) / 20)}/5)
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-lg font-semibold text-gray-900">{booksCount}</span>
            </div>
            <div className="text-xs text-gray-500">Libros</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Heart className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-lg font-semibold text-gray-900">{commonCategories}</span>
            </div>
            <div className="text-xs text-gray-500">Categorías en común</div>
          </div>
        </div>

        {/* Categorías comunes */}
        {commonCategories > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Intereses en común:</div>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {commonCategories} categoría{commonCategories > 1 ? 's' : ''} en común
              </span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex space-x-2">
          <button 
            onClick={handleViewProfile}
            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Ver perfil
          </button>
          
          <button 
            onClick={handleStartChat}
            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat</span>
          </button>
        </div>
      </div>
    </div>
  )
} 