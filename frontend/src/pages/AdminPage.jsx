import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const defaultLogin = {
  email: '',
  password: '',
}

const defaultNewUser = {
  name: '',
  email: '',
  password: '',
  package: 'free',
}

const packageRequestLimits = [
  { package: 'Free', allowance: '5 requests per day' },
  { package: 'Pro', allowance: '50 requests per day' },
  { package: 'Enterprise', allowance: 'Unlimited requests' },
]

function AdminPage() {
  const [loginForm, setLoginForm] = useState(defaultLogin)
  const [newUser, setNewUser] = useState(defaultNewUser)
  const [token, setToken] = useState(localStorage.getItem('syndicate-admin-token') || '')
  const [userList, setUserList] = useState([])
  const [packageSelections, setPackageSelections] = useState({})
  const [upgradeRequests, setUpgradeRequests] = useState([])
  const [refreshingRequests, setRefreshingRequests] = useState(false)
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
      const [usersResponse, upgradeRequestsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/allClients`, {
          headers: buildHeaders({}, authToken),
        }),
        fetch(`${API_URL}/api/admin/upgrade-requests`, {
          headers: buildHeaders({}, authToken),
        }),
      ])

      const usersData = await usersResponse.json().catch(() => ({}) )
      const upgradeRequestsData = await upgradeRequestsResponse.json().catch(() => ({}))

      if (!usersResponse.ok) {
        throw new Error(usersData.message || 'Unable to load users.')
      }

      if (!upgradeRequestsResponse.ok) {
        throw new Error(upgradeRequestsData.message || 'Unable to load upgrade requests.')
      }

      setUserList(Array.isArray(usersData) ? usersData : usersData.users || usersData.user || [])
      setUpgradeRequests(Array.isArray(upgradeRequestsData.requests) ? upgradeRequestsData.requests : [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [buildHeaders])

  const refreshAdminLiveData = useCallback(async () => {
    if (!token) return

    setRefreshingRequests(true)
    try {
      const [usersResponse, requestsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/allClients`, { headers: buildHeaders() }),
        fetch(`${API_URL}/api/admin/upgrade-requests`, { headers: buildHeaders() }),
      ])
      const usersData = await usersResponse.json().catch(() => ({}))
      const requestsData = await requestsResponse.json().catch(() => ({}))
      if (!usersResponse.ok) {
        throw new Error(usersData.message || 'Unable to refresh users.')
      }
      if (!requestsResponse.ok) {
        throw new Error(requestsData.message || 'Unable to refresh upgrade requests.')
      }
      setUserList(Array.isArray(usersData) ? usersData : usersData.users || usersData.user || [])
      setUpgradeRequests(Array.isArray(requestsData.requests) ? requestsData.requests : [])
    } catch (refreshError) {
      setError(refreshError.message)
    } finally {
      setRefreshingRequests(false)
    }
  }, [buildHeaders, token])

  useEffect(() => {
    if (!token) return undefined

    const interval = setInterval(refreshAdminLiveData, 15000)
    return () => clearInterval(interval)
  }, [refreshAdminLiveData, token])

  const handleUpgradeReview = async (request, decision) => {
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${API_URL}/api/admin/upgrade-requests/${request.userId}/${request.requestId}`,
        {
          method: 'PATCH',
          headers: buildHeaders(),
          body: JSON.stringify({ decision }),
        }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Unable to review this upgrade request.')
      }
      setMessage(data.message)
      await fetchAdminData(token)
    } catch (reviewError) {
      setError(reviewError.message)
    }
  }

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(newUser),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Unable to create user.')
      }
      setMessage(data.message)
      setNewUser(defaultNewUser)
      await fetchAdminData(token)
    } catch (createError) {
      setError(createError.message)
    }
  }

  const handleUserAction = async (user, action) => {
    setError('')
    setMessage('')

    const isDeactivation = action === 'deactivate'
    if (isDeactivation && !window.confirm(`Deactivate ${user.name}'s account? They will no longer be able to log in.`)) {
      return
    }

    const packageName = packageSelections[user._id] || (
      user.package === 'pro' ? 'enterprise' : 'pro'
    )
    const url = isDeactivation
      ? `${API_URL}/api/admin/deleteClient/${user._id}`
      : action === 'activate'
        ? `${API_URL}/api/admin/activateClient/${user._id}`
        : `${API_URL}/api/admin/users/${user._id}/package`

    try {
      const response = await fetch(url, {
        method: isDeactivation ? 'DELETE' : action === 'activate' ? 'PATCH' : 'PATCH',
        headers: buildHeaders(),
        ...(action === 'package' ? { body: JSON.stringify({ package: packageName }) } : {}),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || data.error || `Unable to ${action} user.`)
      }

      setMessage(data.message || 'User updated.')
      if (isDeactivation || action === 'activate') {
        setUserList((current) => current.map((item) => (
          item._id === user._id ? { ...item, isactive: action === 'activate' } : item
        )))
      } else {
        setUserList((current) => current.map((item) => (
          item._id === user._id ? { ...item, package: data.user.package } : item
        )))
        setPackageSelections((current) => {
          const selections = { ...current }
          delete selections[user._id]
          return selections
        })
      }
    } catch (actionError) {
      setError(actionError.message)
    }
  }

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
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Superuser login failed.')
      }

      if (!data.token) {
        throw new Error('The server did not return an authentication token.')
      }

      setToken(data.token)
      setMessage('Superuser login successful.')
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
    setMessage('Admin logged out.')
    setError('')
  }

  if (!token) {
    return (
      <section className="page-card">
        <div className="card-header">
          <p className="eyebrow">Superuser portal</p>
          <h1>Superuser sign in</h1>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            Superuser email
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              placeholder="superuser@example.com"
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
          <span>All accounts</span>
          <strong>{userList.length}</strong>
        </div>
        <div className="stat-box">
          <span>Active accounts</span>
          <strong>{userList.filter((user) => user.isactive).length}</strong>
        </div>
        <div className="stat-box">
          <span>Available plans</span>
          <strong>{packageRequestLimits.length}</strong>
        </div>
      </div>

      <div className="inline-links">
        <Link to="/admin/rate-limits" className="primary-btn">Manage user rate limits</Link>
      </div>

      {message && <p className="status success">{message}</p>}
      {error && <p className="status error">{error}</p>}

      <div className="admin-panels">
        <section className="panel-box">
          <h2>Add a user</h2>
          <form className="auth-form" onSubmit={handleCreateUser}>
            <label>
              Full name
              <input
                value={newUser.name}
                onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                autoComplete="name"
                required
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={newUser.email}
                onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Temporary password
              <input
                type="password"
                value={newUser.password}
                onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Package
              <select
                value={newUser.package}
                onChange={(event) => setNewUser({ ...newUser, package: event.target.value })}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
            <p className="profile-hint">This creates a regular user account, not an admin account.</p>
            <button type="submit" className="primary-btn" disabled={loading}>
              Add user
            </button>
          </form>
        </section>

        <section className="panel-box admin-users-panel">
          <h2>Users</h2>
          {userList.length === 0 ? (
            <p className="empty-state">No users loaded.</p>
          ) : (
            <div className="admin-users-scroll">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Role</th>
                    <th scope="col">Package</th>
                    <th scope="col">Requests remaining today</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((user) => {
                    const nextPackage = user.package === 'pro' ? 'enterprise' : 'pro'
                    const canUpgrade = user.isactive && user.package !== 'enterprise'
                    return (
                      <tr key={user._id || user.email}>
                        <td>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </td>
                        <td>{user.role}</td>
                        <td className="admin-package-cell">
                          <strong>{user.package || 'free'}</strong>
                          {canUpgrade && (
                            <div className="admin-package-actions">
                              <select
                                aria-label={`Upgrade package for ${user.email}`}
                                value={packageSelections[user._id] || nextPackage}
                                onChange={(event) => setPackageSelections({
                                  ...packageSelections,
                                  [user._id]: event.target.value,
                                })}
                              >
                                {['pro', 'enterprise']
                                  .filter((packageName) => packageName !== user.package)
                                  .map((packageName) => (
                                    <option key={packageName} value={packageName}>{packageName}</option>
                                  ))}
                              </select>
                              <button
                                type="button"
                                className="link-btn"
                                onClick={() => handleUserAction(user, 'package')}
                              >
                                Set plan
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="request-usage-cell">
                          {user.requestUsage ? (
                            user.requestUsage.limit === null ? (
                              <>
                                <strong>Unlimited</strong>
                                <span>{user.requestUsage.used} requests used today</span>
                              </>
                            ) : (
                              <>
                                <strong>{user.requestUsage.remaining} left</strong>
                                <span>
                                  {user.requestUsage.used} of {user.requestUsage.limit} used
                                </span>
                              </>
                            )
                          ) : (
                            <span>Usage unavailable</span>
                          )}
                        </td>
                        <td>
                          <span className={user.isactive ? 'account-status active' : 'account-status inactive'}>
                            {user.isactive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          {user.isactive ? (
                            <button
                              type="button"
                              className="danger-btn"
                              onClick={() => handleUserAction(user, 'deactivate')}
                              disabled={user.role === 'admin' && user.email === loginForm.email}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => handleUserAction(user, 'activate')}
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="panel-box">
          <h2>Package request limits</h2>
          <ul className="stack-list">
            {packageRequestLimits.map((item) => (
              <li key={item.package}>
                <div>
                  <strong>{item.package}</strong>
                  <span>{item.allowance}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel-box">
          <div className="upgrade-requests-heading">
            <h2>Package upgrade requests</h2>
            <button
              type="button"
              className="secondary-btn"
              onClick={refreshAdminLiveData}
              disabled={refreshingRequests}
            >
              {refreshingRequests ? 'Refreshing...' : 'Refresh requests'}
            </button>
          </div>
          {upgradeRequests.length === 0 ? (
            <p className="empty-state">No pending user requests to upgrade from Free to Pro or Enterprise.</p>
          ) : (
            <ul className="stack-list">
              {upgradeRequests.map((request) => (
                <li key={request.requestId}>
                  <div>
                    <strong>{request.name}: {request.currentPackage || 'free'} to {request.requestedPackage}</strong>
                    <span>{request.email}</span>
                    {request.requestedAt && (
                      <span>Requested {new Date(request.requestedAt).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="button-row">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => handleUpgradeReview(request, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => handleUpgradeReview(request, 'declined')}
                    >
                      Decline
                    </button>
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
