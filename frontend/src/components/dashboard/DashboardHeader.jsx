"use client"

import { useState, useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { styled } from "@mui/material/styles"
import { Box, CssBaseline } from "@mui/material"

import DashboardHeader from "./DashboardHeader"
import DashboardSidebar from "./DashboardSidebar"
import useAuth from "../hooks/useAuth"

const drawerWidth = 240

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}))

const AppBarOffset = styled("div")(({ theme }) => theme.mixins.toolbar)

export default function DashboardLayout({ children, searchTerm, onSearchChange }) {
  const [open, setOpen] = useState(false)
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user)
    } else {
      setUser(null)
    }
  }, [auth])

  useEffect(() => {
    if (!auth?.token) {
      navigate("/login", { replace: true })
    }
  }, [auth, navigate])

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  const toggleSidebar = () => {
    setOpen(!open)
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <DashboardHeader
        user={user}
        onToggleSidebar={toggleSidebar}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
      <DashboardSidebar open={open} handleDrawerClose={handleDrawerClose} />
      <Main open={open}>
        <AppBarOffset />
        {children}
        <Outlet />
      </Main>
    </Box>
  )
}