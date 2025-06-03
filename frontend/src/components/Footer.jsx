import BookOpen from "./icons/BookOpen"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16 mt-24">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-2 mb-12">
          <BookOpen className="h-8 w-8 text-blue-400" />
          <span className="text-xl font-bold">LibroConecta</span>
        </div>
        <div className="text-center text-gray-400">
          <p>&copy; 2024 LibroConecta. Conectando lectores, compartiendo historias.</p>
        </div>
      </div>
    </footer>
  )
}
