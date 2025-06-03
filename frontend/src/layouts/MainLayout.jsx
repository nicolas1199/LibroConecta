import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}