import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Layout from './pages/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ResumeBuilder from './pages/ResumeBuilder.jsx'
import Preview from './pages/Preview.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import MyAccount from './pages/MyAccount.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'app',
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'builder/:resumeId',
            element: (
              <ProtectedRoute>
                <ResumeBuilder />
              </ProtectedRoute>
            ),
          },
          {
            path: 'account',
            element: (
              <ProtectedRoute>
                <MyAccount />
              </ProtectedRoute>
            ),
          },
        ],
      },
      { path: 'view/:resumeId', element: <Preview /> },
      { path: 'login', element: <Login /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
