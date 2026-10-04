import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const defaultLogin = {
  email: '',
  password: '',
}

function AdminPage() {
  const [loginForm, setLoginForm] = useState(defaultLogin)
  const [token, setToken] = useState(localStorage.getItem('syndicate-admin-token') || '')
  const [userList, setUserList] = useState([])
  const [rateLimits, setRateLimits] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const buildHeaders = useCallback(
    (customHeaders = {}, activeToken = token) => ({
      'Content-Type': 'application/json',
      ...customHeaders,
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    }),
    [token]
  )

  const fetchAdminData = useCallback(async (authToken) => {
    if (!authToken) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const [usersResponse, rateLimitsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/allClients`, {
          headers: buildHeaders({}, authToken),
        }),
        fetch(`${API_URL}/api/rate-limits`, {
          headers: buildHeaders({}, authToken),
        }),
      ])

      const usersData = await usersResponse.json().catch(() => ({}) )
      const rateLimitData = await rateLimitsResponse.json().catch(() => [])

      if (!usersResponse.ok) {
        throw new Error(usersData.message || 'Unable to load users.')
      }

      if (!rateLimitsResponse.ok) {
        throw new Error(rateLimitData.message || 'Unable to load rate limits.')
      }

      setUserList(Array.isArray(usersData) ? usersData : usersData.users || [])
      setRateLimits(Array.isArray(rateLimitData) ? rateLimitData : [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [buildHeaders])

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('syndicate-admin-token')
      return
    }

    localStorage.setItem('syndicate-admin-token', token)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdminData(token)
  }, [fetchAdminData, token])

  const handleLoginChange = (event) => {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Admin login failed.')
      }

      if (!data.token) {
        throw new Error('The server did not return an authentication token.')
      }

      setToken(data.token)
      setMessage('Admin login successful.')
      setLoginForm(defaultLogin)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    localStorage.removeItem('syndicate-admin-token')
    setUserList([])
    setRateLimits([])
    setMessage('Admin logged out.')
    setError('')
  }

  if (!token) {
    return (
      <section className="page-card">
        <div className="card-header">
          <p className="eyebrow">Admin portal</p>
          <h1>Admin sign in</h1>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            Email address
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              placeholder="Enter your password"
              required
            />
          </label>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {message && <p className="status success">{message}</p>}
        {error && <p className="status error">{error}</p>}
      </section>
    )
  }

  return (
    <section className="page-card admin-page">
      <div className="card-header split-header">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1>Control center</h1>
        </div>
        <button type="button" className="secondary-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span>Total users</span>
          <strong>{userList.length}</strong>
        </div>
        <div className="stat-box">
          <span>Rate limit packages</span>
          <strong>{rateLimits.length}</strong>
        </div>
      </div>

      <div className="inline-links">
        <Link to="/admin/rate-limits" className="primary-btn">Manage user rate limits</Link>
      </div>

      {message && <p className="status success">{message}</p>}
      {error && <p className="status error">{error}</p>}

      <div className="admin-panels">
        <div className="panel-box">
          <h2>Users</h2>
          {userList.length === 0 ? (
            <p className="empty-state">No users loaded.</p>
          ) : (
            <ul className="stack-list">
              {userList.map((user) => (
                <li key={user._id || user.email}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <em>{user.role}</em>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-box">
          <h2>Rate limits</h2>
          {rateLimits.length === 0 ? (
            <p className="empty-state">No rate limit packages configured.</p>
          ) : (
            <ul className="stack-list">
              {rateLimits.map((item) => (
                <li key={item._id || item.package}>
                  <div>
                    <strong>{item.package}</strong>
                    <span>{item.limit} req / {item.window}s</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminPage
