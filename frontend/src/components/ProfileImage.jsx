import React from "react";

export default function ProfileImage({ 
  user, 
  size = "md", 
  className = "",
  showBorder = false,
  onClick = null 
}) {
  // Debug temporal para verificar datos del usuario
  console.log("🔍 ProfileImage recibió usuario:", {
    user_id: user?.user_id,
    first_name: user?.first_name,
    last_name: user?.last_name,
    has_profile_image: !!user?.profile_image_base64,
    profile_image_length: user?.profile_image_base64?.length || 0
  });
  const getInitials = () => {
    if (!user) return "U";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const username = user.username || "";
    
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "w-6 h-6 text-xs";
      case "sm":
        return "w-8 h-8 text-sm";
      case "md":
        return "w-10 h-10 text-sm";
      case "lg":
        return "w-12 h-12 text-base";
      case "xl":
        return "w-16 h-16 text-lg";
      case "2xl":
        return "w-20 h-20 text-xl";
      case "3xl":
        return "w-24 h-24 text-2xl";
      default:
        return "w-10 h-10 text-sm";
    }
  };

  const getGradientColors = () => {
    if (!user) return "from-gray-400 to-gray-600";
    
    // Generar colores basados en el nombre del usuario para consistencia
    const name = (user.first_name + user.last_name + user.username).toLowerCase();
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-blue-600",
      "from-purple-500 to-pink-600",
      "from-orange-500 to-red-600",
      "from-teal-500 to-green-600",
      "from-indigo-500 to-purple-600",
      "from-pink-500 to-red-600",
      "from-yellow-500 to-orange-600",
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`relative ${getSizeClasses()} ${className} ${
        showBorder ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      {user?.profile_image_base64 ? (
        <img
          src={user.profile_image_base64}
          alt={`${user.first_name || user.username} profile`}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            // Si la imagen falla, mostrar las iniciales
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div
        className={`w-full h-full rounded-full bg-gradient-to-br ${getGradientColors()} flex items-center justify-center text-white font-semibold ${
          user?.profile_image_base64 ? "hidden" : "flex"
        }`}
      >
        {getInitials()}
      </div>
    </div>
  );
} 