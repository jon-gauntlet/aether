import { Outlet } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Lazy load components
const Header = lazy(() => import('../components/Header'))
const Sidebar = lazy(() => import('../components/Sidebar'))

// Loading fallback components
const HeaderFallback = () => (
  <div className="h-16 bg-white shadow-sm animate-pulse" />
)

const SidebarFallback = () => (
  <div className="w-64 bg-gray-800 animate-pulse" />
)

function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-col flex-1">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <main className="flex-1 overflow-hidden">
          <div className="h-full bg-white">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout 