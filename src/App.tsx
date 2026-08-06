/**
 * 应用根组件
 * 配置路由和页面导航
 */

import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ContentArea from './components/ContentArea'


import AdminLogin from './pages/AdminLogin'
import AdminPage from './pages/AdminPage'
import ChangePassword from './pages/ChangePassword'

import { isAdminLoggedIn } from './utils/auth'


import './App.css'

/**
 * 路由守卫组件：需要管理员登录才能访问
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin-login" replace />
  }
  return <>{children}</>
}

/**
 * 主布局组件：Header + Sidebar + ContentArea
 */
function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleNavigate = (url: string, target: '_self' | '_blank' | 'main') => {
    if (target === '_blank') {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else if (target === '_self') {
      window.location.href = url
    } else if (target === 'main') {
      // 直接传递 URL，由浏览器根据当前页面地址解析相对路径
      const event = new CustomEvent('navigate', { detail: { url } })
      window.dispatchEvent(event)
    }
  }

  return (
    <>
      <Header />
      <div className="main-body">
        <Sidebar
          onNavigate={handleNavigate}

          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />
        <div className="content-wrapper">
          <ContentArea src="gx.html" />
        </div>
      </div>
    </>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <AdminRoute>
                <ChangePassword />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App
