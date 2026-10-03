import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import UserAccountPage from './pages/UserAccountPage'
import UserLoginPage from './pages/UserLoginPage'
import AdminPage from './pages/AdminPage'
import AdminRateLimitsPage from './pages/AdminRateLimitsPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="main-nav">
          <Link to="/" className="nav-brand">Syndicate_Guard_Group_17</Link>
          <div className="nav-links">
            <details className="user-menu">
              <summary>User</summary>
              <div className="user-menu-options">
                <Link to="/user-login">Login</Link>
                <Link to="/user-account">Register</Link>
              </div>
            </details>
            <Link to="/admin">Admin</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user-account" element={<UserAccountPage />} />
          <Route path="/user-login" element={<UserLoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/rate-limits" element={<AdminRateLimitsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
