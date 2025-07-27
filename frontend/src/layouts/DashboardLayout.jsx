"use client"

import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import DashboardSidebar from "../components/dashboard/DashboardSidebar"
import DashboardHeader from "../components/dashboard/DashboardHeader"
import { useAuth } from "../hooks/useAuth"
import { getPublishedBooks } from "../api/publishedBooks"

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
        setShowSearchDropdown(false)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const handleSearch = async (term) => {
    if (!term.trim()) return

    setIsSearching(true)
    setShowSearchDropdown(true)

    try {
      const response = await getPublishedBooks({
        search: term.trim(),
        limit: 10,
      })
      setSearchResults(response.publishedBooks || [])
    } catch (error) {
      console.error("Error searching books:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-64">
        <DashboardHeader
          user={user}
          onToggleSidebar={toggleSidebar}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          searchResults={searchResults}
          isSearching={isSearching}
          showSearchDropdown={showSearchDropdown}
          onCloseSearch={() => setShowSearchDropdown(false)}
        />

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}