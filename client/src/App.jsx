import  Home  from './pages/Home'
import React, { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import Login from './pages/Login'
import ProtectedRoute from './Components/ProtectedRoute'
import Loader from './Components/Loader'
import { authApi } from './lib/api'


const App = () => {
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        setAuthChecked(true)
        return
      }

      try {
        const data = await authApi.me()
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        sessionStorage.setItem("auth_notice", "Session expired. Please login again.")
      } finally {
        setAuthChecked(true)
      }
    }

    bootstrapAuth()
  }, [])

  if (!authChecked) return <Loader />

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        
        <Route path='app' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='builder/:resumeId' element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
        </Route>

        <Route path='view/:resumeId' element={<Preview />} />
        <Route path='login' element={<Login />} />
      </Routes>
    </>
  )
}

export default App
