import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SearchProvider } from './contexts/SearchContext'
import ErrorBoundary from './components/ErrorBoundary'
import MainLayout from './layouts/MainLayout'
import PrivateRoute from './components/PrivateRoute'
import { NotificationProvider } from './contexts/NotificationContext'
import { TeamProvider } from './contexts/TeamContext'
import { FileProvider } from './contexts/FileContext'

// Lazy load route components
const Chat = lazy(() => import('./pages/Chat'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Teams = lazy(() => import('./pages/Teams'))
const Files = lazy(() => import('./pages/Files'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-gray-500">Loading...</div>
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <SearchProvider>
            <TeamProvider>
              <FileProvider>
                <Router>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/" element={
                        <PrivateRoute>
                          <MainLayout />
                        </PrivateRoute>
                      }>
                        <Route index element={<Chat />} />
                        <Route path="teams" element={<Teams />} />
                        <Route path="files" element={<Files />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </Router>
              </FileProvider>
            </TeamProvider>
          </SearchProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App 