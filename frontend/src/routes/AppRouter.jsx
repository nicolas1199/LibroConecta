import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import MainLayout from "../layouts/MainLayout"
import Home from "../pages/Home"
import Login from "../pages/Login"
import Register from "../pages/Register"

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Routes without MainLayout (auth pages) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes with MainLayout */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        {/* Future routes can be added here */}
        {/* <Route path="/about" element={<MainLayout><About /></MainLayout>} /> */}
        {/* <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} /> */}
      </Routes>
    </Router>
  )
}
