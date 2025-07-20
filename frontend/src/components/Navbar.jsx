import { useState } from "react";
import { Link } from "react-router-dom";
import BookOpen from "./icons/BookOpen";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <BookOpen className="navbar-logo h-8 w-8 text-blue-600" />
          <span className="navbar-name">LibroConecta</span>
        </Link>

        {/* Botón hamburguesa para móvil */}
        <button
          className="navbar-toggle md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span className={`hamburger-line ${isMenuOpen ? "open" : ""}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? "open" : ""}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? "open" : ""}`}></span>
        </button>

        {/* Navegación desktop */}
        <nav className="navbar-nav">
          <Link to="/login" className="btn btn-secondary">
            Iniciar sesión
          </Link>
          <Link to="/register" className="btn btn-primary">
            Crear cuenta
          </Link>
        </nav>

        {/* Menú móvil */}
        <nav className={`navbar-mobile ${isMenuOpen ? "open" : ""}`}>
          <div className="navbar-mobile-content">
            <Link
              to="/login"
              className="btn btn-secondary w-full"
              onClick={closeMenu}
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="btn btn-primary w-full"
              onClick={closeMenu}
            >
              Crear cuenta
            </Link>
          </div>
        </nav>
      </div>

      {/* Overlay para cerrar el menú móvil */}
      {isMenuOpen && (
        <div
          className="navbar-overlay md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        ></div>
      )}
    </header>
  );
}
