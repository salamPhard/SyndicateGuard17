import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const defaultForm = {
  packageName: '',
  limit: '',
  window: '',
}

function AdminRateLimitsPage() {
  const [token, setToken] = useState(localStorage.getItem('syndicate-admin-token') || '')
  const [form, setForm] = useState(defaultForm)
  const [editingPackage, setEditingPackage] = useState(null)
  const [rateLimits, setRateLimits] = useState([])
  const [usageSummary, setUsageSummary] = useState({ packages: [], activeUsage: [], totalActiveClients: 0 })
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

  const fetchRateLimits = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/rate-limits`, {
          headers: buildHeaders({}, activeToken),
        })

        const data = await response.json().catch(() => [])

        if (!response.ok) {
          throw new Error(data.message || 'Unable to fetch rate limits.')
        }

        setRateLimits(Array.isArray(data) ? data : [])
      } catch (loadError) {
        setError(loadError.message)
      }
    },
    [buildHeaders, token]
  )

  const fetchUsageSummary = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/usage`, {
          headers: buildHeaders({}, activeToken),
        })

        const data = await response.json().catch(() => ({ packages: [], activeUsage: [], totalActiveClients: 0 }))

        if (!response.ok) {
          throw new Error(data.message || 'Unable to fetch usage summary.')
        }

        setUsageSummary({
          packages: Array.isArray(data.packages) ? data.packages : [],
          activeUsage: Array.isArray(data.activeUsage) ? data.activeUsage : [],
          totalActiveClients: Number(data.totalActiveClients || 0),
        })
      } catch (loadError) {
        setError(loadError.message)
      }
    },
    [buildHeaders, token]
  )

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('syndicate-admin-token')
      return
    }

    localStorage.setItem('syndicate-admin-token', token)

    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        await Promise.all([fetchRateLimits(token), fetchUsageSummary(token)])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [token, fetchRateLimits, fetchUsageSummary])

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleLogout = () => {
    setToken('')
    setMessage('Admin logged out.')
    setError('')
    setForm(defaultForm)
    setEditingPackage(null)
    setRateLimits([])
    setUsageSummary({ packages: [], activeUsage: [], totalActiveClients: 0 })
  }

  const handleClearUsage = async () => {
    if (!token) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setMessage('')

      const response = await fetch(`${API_URL}/api/usage/clear`, {
        method: 'DELETE',
        headers: buildHeaders(),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Unable to clear usage data.')
      }

      setMessage('Usage cache cleared successfully.')
      fetchUsageSummary(token)
    } catch (clearError) {
      setError(clearError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const packageName = form.packageName.trim()
    const limit = Number(form.limit)
    const windowSeconds = Number(form.window)

    if (!packageName || !Number.isInteger(limit) || !Number.isInteger(windowSeconds)) {
      setError('Package name, limit, and window must be valid numbers.')
      setMessage('')
      return
    }

    const method = editingPackage ? 'PATCH' : 'POST'
    const url = editingPackage
      ? `${API_URL}/api/rate-limits/${encodeURIComponent(editingPackage)}`
      : `${API_URL}/api/rate-limits`

    try {
      setLoading(true)
      setError('')
      setMessage('')

      const response = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: JSON.stringify({
          package: packageName,
          limit,
          window: windowSeconds,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Rate limit update failed.')
      }

      setMessage(
        editingPackage ? 'Rate limit updated successfully.' : 'Rate limit created successfully.'
      )
      setForm(defaultForm)
      setEditingPackage(null)
      fetchRateLimits(token)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rateLimit) => {
    setEditingPackage(rateLimit.package)
    setForm({
      packageName: rateLimit.package,
      limit: String(rateLimit.limit),
      window: String(rateLimit.window),
    })
    setError('')
    setMessage('')
  }

  const handleDelete = async (packageName) => {
    const shouldDelete = window.confirm(`Delete the ${packageName} rate limit package?`)
    if (!shouldDelete) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setMessage('')

      const response = await fetch(`${API_URL}/api/rate-limits/${encodeURIComponent(packageName)}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete rate limit.')
      }

      setMessage(`${packageName} was deleted successfully.`)
      if (editingPackage === packageName) {
        setEditingPackage(null)
        setForm(defaultForm)
      }
      fetchRateLimits(token)
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <section className="page-card">
        <div className="card-header">
          <p className="eyebrow">Admin access</p>
          <h1>Admin sign in required</h1>
          <p>Sign in to the admin portal before managing user rate limits.</p>
        </div>

        <div className="inline-links">
          <Link to="/admin" className="primary-btn">Go to admin sign in</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-card rate-limit-page">
      <div className="card-header split-header">
        <div>
          <p className="eyebrow">Rate limit control</p>
          <h1>User rate limits</h1>
        </div>
        <div className="toolbar-actions">
          <Link to="/admin" className="secondary-btn">Admin overview</Link>
          <button type="button" className="secondary-btn" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="rate-limit-grid">
        <div className="panel-box">
          <h2>{editingPackage ? 'Edit package' : 'Create new package'}</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Package name
              <input
                type="text"
                name="packageName"
                value={form.packageName}
                onChange={handleFormChange}
                placeholder="billing-api"
                required
              />
            </label>

            <label>
              Request limit
              <input
                type="number"
                name="limit"
                min="1"
                value={form.limit}
                onChange={handleFormChange}
                placeholder="100"
                required
              />
            </label>

            <label>
              Window (seconds)
              <input
                type="number"
                name="window"
                min="1"
                value={form.window}
                onChange={handleFormChange}
                placeholder="60"
                required
              />
            </label>

            <div className="button-row">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : editingPackage ? 'Update package' : 'Create package'}
              </button>

              {editingPackage && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setEditingPackage(null)
                    setForm(defaultForm)
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel-box">
          <h2>Configured packages</h2>

          {loading && rateLimits.length === 0 ? (
            <p className="empty-state">Loading...</p>
          ) : rateLimits.length === 0 ? (
            <p className="empty-state">No rate limits yet.</p>
          ) : (
            <ul className="stack-list">
              {rateLimits.map((item) => (
                <li key={item._id || item.package}>
                  <div>
                    <strong>{item.package}</strong>
                    <span>{item.limit} requests / {item.window}s</span>
                  </div>
                  <div className="mini-actions">
                    <button type="button" className="link-btn" onClick={() => handleEdit(item)}>Edit</button>
                    <button type="button" className="danger-btn" onClick={() => handleDelete(item.package)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="usage-block">
        <div className="card-header split-header">
          <h2>Live usage</h2>
          <button type="button" className="secondary-btn" onClick={handleClearUsage}>
            Clear usage
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <span>Active clients</span>
            <strong>{usageSummary.totalActiveClients}</strong>
          </div>
          <div className="stat-box">
            <span>Tracked packages</span>
            <strong>{usageSummary.packages.length}</strong>
          </div>
        </div>

        {usageSummary.packages.length === 0 ? (
          <p className="empty-state">No live requests recorded yet.</p>
        ) : (
          <ul className="stack-list">
            {usageSummary.packages.map((item) => (
              <li key={item.package}>
                <div>
                  <strong>{item.package}</strong>
                  <span>{item.requests} requests across {item.clients} clients</span>
                </div>
                <em>{item.limit} cap</em>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p className="status success">{message}</p>}
      {error && <p className="status error">{error}</p>}
    </section>
  )
}

export default AdminRateLimitsPage
