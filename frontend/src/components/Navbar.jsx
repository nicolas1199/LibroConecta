import BookOpen from "./icons/BookOpen"

export default function Navbar() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">LibroConecta</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-900 px-6 py-3 rounded-md transition-colors font-semibold">
            Iniciar sesión
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md transition-colors font-semibold">
            Crear cuenta
          </button>
        </div>
      </div>
    </header>
  )
}


