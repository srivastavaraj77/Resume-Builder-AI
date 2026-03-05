import  Home  from './pages/Home'
import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
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
        // Keep current auth state on transient failures.
        // The API layer already handles 401 by clearing token + redirecting.
      } finally {
        setAuthChecked(true)
      }
    }

    bootstrapAuth()
  }, [])

  if (!authChecked) return <Loader />

  return <Outlet />
}

export default App
