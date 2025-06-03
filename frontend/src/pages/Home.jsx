import BookOpen from "../components/icons/BookOpen"
import Users from "../components/icons/Users"
import RefreshCw from "../components/icons/RefreshCw"
import Gift from "../components/icons/Gift"
import ArrowLeftRight from "../components/icons/ArrowLeftRight"
import DollarSign from "../components/icons/DollarSign"

export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      {/* Hero Section */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 20px",
          display: "flex",
          flexDirection: "row",
          gap: "48px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "32px" }}>
          <div>
            <h1
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                lineHeight: "1.1",
                color: "#111827",
                margin: "0 0 16px 0",
              }}
            >
              <span style={{ color: "#2563eb" }}>Conecta</span> libros,
              <br />
              <span style={{ color: "#2563eb" }}>comparte</span> historias
            </h1>
            <p style={{ fontSize: "1.25rem", color: "#6b7280", maxWidth: "28rem", margin: "0" }}>
              Intercambia, regala o encuentra el próximo libro que quieres leer.
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <button
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                padding: "16px 32px",
                borderRadius: "8px",
                fontSize: "1.125rem",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
              }}
            >
              ¡Comienza ahora!
            </button>
            <button
              style={{
                border: "2px solid #d1d5db",
                color: "#374151",
                padding: "14px 32px",
                borderRadius: "8px",
                fontSize: "1.125rem",
                fontWeight: "600",
                background: "white",
                cursor: "pointer",
              }}
            >
              Cómo funciona
            </button>
          </div>
        </div>

        <div style={{ flex: "1 1 500px", position: "relative" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)",
              borderRadius: "24px",
              padding: "64px",
              position: "relative",
              overflow: "hidden",
              minHeight: "400px",
            }}
          >
            {/* Grid background pattern */}
            <div style={{ position: "absolute", inset: "0", opacity: "0.2" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gridTemplateRows: "repeat(6, 1fr)",
                  height: "100%",
                  width: "100%",
                  gap: "12px",
                }}
              >
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} style={{ border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "4px" }}></div>
                ))}
              </div>
            </div>

            {/* Floating cards */}
            <div
              style={{
                position: "relative",
                zIndex: "10",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "256px",
              }}
            >
              {/* Left card - Purple bookmark */}
              <div style={{ position: "absolute", left: "32px", top: "16px", transform: "rotate(12deg)" }}>
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    width: "128px",
                    height: "160px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "2px solid #a855f7",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "20px",
                        background: "#a855f7",
                        borderRadius: "2px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "0",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "0",
                          height: "0",
                          borderLeft: "6px solid transparent",
                          borderRight: "6px solid transparent",
                          borderBottom: "6px solid white",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center card - Blue document */}
              <div style={{ position: "absolute", top: "0", transform: "rotate(-6deg)" }}>
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    width: "128px",
                    height: "160px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "2px solid #2563eb",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        background: "#2563eb",
                        borderRadius: "2px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      📄
                    </div>
                  </div>
                </div>
              </div>

              {/* Right card - Cyan bookmark */}
              <div style={{ position: "absolute", right: "32px", top: "32px", transform: "rotate(6deg)" }}>
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    width: "128px",
                    height: "160px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "2px solid #0891b2",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "20px",
                        background: "#0891b2",
                        borderRadius: "2px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "0",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "0",
                          height: "0",
                          borderLeft: "6px solid transparent",
                          borderRight: "6px solid transparent",
                          borderBottom: "6px solid white",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ background: "#f9fafb", padding: "80px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "64px",
            }}
          >
            <span style={{ color: "#2563eb" }}>Cómo</span> funciona
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            {/* Card 1 */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <BookOpen style={{ width: "40px", height: "40px", color: "#2563eb" }} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>
                Publica tus libros
              </h3>
              <p style={{ color: "#6b7280" }}>Comparte los libros que tienes para regalar, intercambiar o vender.</p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#ede9fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Users style={{ width: "40px", height: "40px", color: "#7c3aed" }} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>
                Encuentra matches
              </h3>
              <p style={{ color: "#6b7280" }}>Conecta con personas cerca de ti o que tengan libros que te interesen.</p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#cffafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <RefreshCw style={{ width: "40px", height: "40px", color: "#0891b2" }} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>
                Intercambia
              </h3>
              <p style={{ color: "#6b7280" }}>
                Coordina el intercambio en persona o por envío y califica tu experiencia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Types Section */}
      <section style={{ padding: "80px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "64px",
            }}
          >
            Tipos de <span style={{ color: "#2563eb" }}>transacciones</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            {/* Regalo */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                border: "2px solid #dbeafe",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Gift style={{ width: "40px", height: "40px", color: "#2563eb" }} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>Regalo</h3>
              <p style={{ color: "#6b7280" }}>Regala libros que ya no necesitas a alguien que los apreciará.</p>
            </div>

            {/* Intercambio */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                border: "2px solid #ede9fe",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#ede9fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <ArrowLeftRight style={{ width: "40px", height: "40px", color: "#7c3aed" }} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>
                Intercambio
              </h3>
              <p style={{ color: "#6b7280" }}>Intercambia tus libros por otros que te interesen leer.</p>
            </div>

            {/* Venta */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                border: "2px solid #cffafe",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#cffafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <DollarSign style={{ width: "40px", height: "40px", color: "#0891b2" }} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>Venta</h3>
              <p style={{ color: "#6b7280" }}>Vende tus libros a precios accesibles para otros lectores.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

