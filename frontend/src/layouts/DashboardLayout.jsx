"use client"

import { useState, useEffect } from "react"
import { Layout } from "antd"
import { useNavigate } from "react-router-dom"

import DashboardHeader from "../components/DashboardHeader"
import DashboardSidebar from "../components/DashboardSidebar"
import { getUserFromLocalStorage } from "../utils/localStorage"

const { Header, Sider, Content } = Layout

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  // Agregar al inicio del componente, después de los otros estados:
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    const storedUser = getUserFromLocalStorage()
    if (storedUser) {
      setUser(storedUser)
    } else {
      navigate("/login")
    }
  }, [navigate])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Función para manejar los resultados de búsqueda
  const handleSearchResults = (results) => {
    setSearchResults(results)
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={isSidebarOpen}>
        <DashboardSidebar user={user} />
      </Sider>
      <Layout className="site-layout">
        <Header
          className="site-layout-background"
          style={{
            padding: 0,
            background: "#fff",
          }}
        >
          <DashboardHeader
            user={user}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchResults={handleSearchResults} // <- Agregar esta línea
          />
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "#fff",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default DashboardLayout