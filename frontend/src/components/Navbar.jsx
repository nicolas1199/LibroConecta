import { Link } from "react-router-dom"
import BookOpen from "./icons/BookOpen"

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <BookOpen className="navbar-logo h-8 w-8 text-blue-600" />
          <span className="navbar-name">LibroConecta</span>
        </Link>

        <nav className="navbar-nav">
          <Link to="/login" className="btn btn-secondary">
            Iniciar sesión
          </Link>
          <Link to="/register" className="btn btn-primary">
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  )
}
