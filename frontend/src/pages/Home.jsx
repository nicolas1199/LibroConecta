import { Link } from "react-router-dom"
import BookOpen from "../components/icons/BookOpen"
import Users from "../components/icons/Users"
import RefreshCw from "../components/icons/RefreshCw"
import Gift from "../components/icons/Gift"
import ArrowLeftRight from "../components/icons/ArrowLeftRight"
import DollarSign from "../components/icons/DollarSign"

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1>
                <span className="text-primary">Conecta</span> libros,
                <br />
                <span className="text-primary">comparte</span> historias
              </h1>
              <p>Intercambia, regala o encuentra el próximo libro que quieres leer.</p>
              <div className="hero-buttons">
                <Link to="/register" className="btn btn-primary btn-lg">
                  ¡Comienza ahora!
                </Link>
                <Link to="#como-funciona" className="btn btn-secondary btn-lg">
                  Cómo funciona
                </Link>
              </div>
            </div>

            <div className="hero-image">
              <div className="hero-cards">
                {/* Grid background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-8 grid-rows-6 h-full w-full gap-3">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="border border-purple-300 rounded"></div>
                    ))}
                  </div>
                </div>

                {/* Floating cards */}
                <div className="card-floating" style={{ left: "10%", top: "15%", transform: "rotate(12deg)" }}>
                  <div className="w-24 h-32 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-purple-500 rounded flex items-center justify-center">
                      <div className="w-6 h-8 bg-purple-500 rounded-sm relative">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="card-floating"
                  style={{ left: "50%", top: "5%", transform: "translateX(-50%) rotate(-6deg)" }}
                >
                  <div className="w-24 h-32 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-blue-600 rounded flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded text-white text-sm flex items-center justify-center">
                        📄
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-floating" style={{ right: "10%", top: "20%", transform: "rotate(6deg)" }}>
                  <div className="w-24 h-32 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-cyan-600 rounded flex items-center justify-center">
                      <div className="w-6 h-8 bg-cyan-600 rounded-sm relative">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="features">
        <div className="container">
          <div className="features-title">
            <h2>
              <span className="text-primary">Cómo</span> funciona
            </h2>
          </div>

          <div className="features-grid">
            {/* Card 1 */}
            <div className="card">
              <div className="card-icon bg-blue-100">
                <BookOpen className="text-blue-600" />
              </div>
              <h3>Publica tus libros</h3>
              <p>Comparte los libros que tienes para regalar, intercambiar o vender.</p>
            </div>

            {/* Card 2 */}
            <div className="card">
              <div className="card-icon bg-purple-100">
                <Users className="text-purple-600" />
              </div>
              <h3>Encuentra matches</h3>
              <p>Conecta con personas cerca de ti o que tengan libros que te interesen.</p>
            </div>

            {/* Card 3 */}
            <div className="card">
              <div className="card-icon bg-cyan-100">
                <RefreshCw className="text-cyan-600" />
              </div>
              <h3>Intercambia</h3>
              <p>Coordina el intercambio en persona o por envío y califica tu experiencia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Types Section */}
      <section className="transactions">
        <div className="container">
          <div className="transactions-title">
            <h2>
              Tipos de <span className="text-primary">transacciones</span>
            </h2>
          </div>

          <div className="transactions-grid">
            {/* Regalo */}
            <div className="card card-bordered">
              <div className="card-icon bg-blue-100">
                <Gift className="text-blue-600" />
              </div>
              <h3>Regalo</h3>
              <p>Regala libros que ya no necesitas a alguien que los apreciará.</p>
            </div>

            {/* Intercambio */}
            <div className="card card-bordered">
              <div className="card-icon bg-purple-100">
                <ArrowLeftRight className="text-purple-600" />
              </div>
              <h3>Intercambio</h3>
              <p>Intercambia tus libros por otros que te interesen leer.</p>
            </div>

            {/* Venta */}
            <div className="card card-bordered">
              <div className="card-icon bg-cyan-100">
                <DollarSign className="text-cyan-600" />
              </div>
              <h3>Venta</h3>
              <p>Vende tus libros a precios accesibles para otros lectores.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
