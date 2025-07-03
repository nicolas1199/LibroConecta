import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import MainLayout from "../layouts/MainLayout"
import DashboardLayout from "../layouts/DashboardLayout"
import Home from "../pages/Home"
import Login from "../pages/Login"
import Register from "../pages/Register"
import Dashboard from "../pages/Dashboard"
import PublishBook from "../pages/PublishBook"
import Explore from "../pages/Explore"

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Routes without MainLayout (auth pages) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes with MainLayout (public pages) */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        {/* Dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        {/* Explore books route */}
        <Route
          path="/dashboard/explore"
          element={
            <DashboardLayout>
              <Explore />
            </DashboardLayout>
          }
        />

        {/* Publish book route */}
        <Route path="/dashboard/publish" element={<PublishBook />} />

        {/* Future dashboard routes can be added here */}
      </Routes>
    </Router>
  )
}
