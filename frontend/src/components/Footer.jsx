import BookOpen from "./icons/BookOpen"

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <BookOpen className="h-8 w-8 text-blue-400 mr-2" />
            <span className="text-xl font-bold">LibroConecta</span>
          </div>
          <p className="footer-text">
            &copy; {new Date().getFullYear()} LibroConecta. Conectando lectores, compartiendo historias.
          </p>
        </div>
      </div>
    </footer>
  )
}

