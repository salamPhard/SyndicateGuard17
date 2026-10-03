import { useEffect, useMemo, useState } from 'react'
import './App.css'

const defaultForm = {
  packageName: '',
  limit: '',
  window: '',
}

const tokenKey = 'syndicateguard-rate-limit-token'

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const [rateLimits, setRateLimits] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [editingPackage, setEditingPackage] = useState(null)
  const [token, setToken] = useState(localStorage.getItem(tokenKey) || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (token) {
      localStorage.setItem(tokenKey, token)
      return
    }

    localStorage.removeItem(tokenKey)
  }, [token])

  const buildHeaders = (extraHeaders = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  const fetchRateLimits = async () => {
    if (loading) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/rate-limits`, {
        headers: buildHeaders(),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || 'Unable to load rate limits.')
      }

      const data = await response.json()
      setRateLimits(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRateLimits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const totalRequests = rateLimits.reduce((sum, rate) => sum + Number(rate.limit || 0), 0)
    const averageWindow =
      rateLimits.length > 0
        ? Math.round(rateLimits.reduce((sum, rate) => sum + Number(rate.window || 0), 0) / rateLimits.length)
        : 0

    return {
      totalPackages: rateLimits.length,
      totalRequests,
      averageWindow,
    }
  }, [rateLimits])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const packageName = form.packageName.trim()
    const limit = Number(form.limit)
    const windowMinutes = Number(form.window)

    if (!packageName || !Number.isInteger(limit) || !Number.isInteger(windowMinutes)) {
      setError('Package name, limit, and window must be valid integers.')
      setSuccess('')
      return
    }

    const payload = {
      package: packageName,
      limit,
      window: windowMinutes,
    }

    const url = `${apiBaseUrl}/api/rate-limits${editingPackage ? `/${encodeURIComponent(editingPackage)}` : ''}`
    const method = editingPackage ? 'PATCH' : 'POST'

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || 'The rate limit request failed.')
      }

      setSuccess(editingPackage ? 'Rate limit updated successfully.' : 'Rate limit created successfully.')
      setForm(defaultForm)
      setEditingPackage(null)
      await fetchRateLimits()
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
    setSuccess('')
  }

  const handleDelete = async (packageName) => {
    const confirmed = window.confirm(`Delete the ${packageName} rate limit package?`)
    if (!confirmed) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(`${apiBaseUrl}/api/rate-limits/${encodeURIComponent(packageName)}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete rate limit.')
      }

      setSuccess(`${packageName} was removed successfully.`)
      if (editingPackage === packageName) {
        setEditingPackage(null)
        setForm(defaultForm)
      }
      await fetchRateLimits()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Traffic control</p>
          <h1>Rate limit dashboard</h1>
        </div>
        <div className="token-box">
          <label htmlFor="admin-token">Admin token</label>
          <input
            id="admin-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste bearer token"
          />
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card primary">
          <span>Total packages</span>
          <strong>{stats.totalPackages}</strong>
        </article>
        <article className="stat-card">
          <span>Requests allowed</span>
          <strong>{stats.totalRequests}</strong>
        </article>
        <article className="stat-card">
          <span>Average window</span>
          <strong>{stats.averageWindow}s</strong>
        </article>
      </section>

      <main className="content-grid">
        <section className="panel form-panel">
          <div className="panel-header">
            <h2>{editingPackage ? 'Edit rate limit' : 'Create new rate limit'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="rate-form">
            <label>
              Package name
              <input
                type="text"
                name="packageName"
                value={form.packageName}
                onChange={handleInputChange}
                placeholder="e.g. billing-api"
              />
            </label>

            <label>
              Request limit
              <input
                type="number"
                min="1"
                name="limit"
                value={form.limit}
                onChange={handleInputChange}
                placeholder="100"
              />
            </label>

            <label>
              Window (seconds)
              <input
                type="number"
                min="1"
                name="window"
                value={form.window}
                onChange={handleInputChange}
                placeholder="60"
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Saving...' : editingPackage ? 'Update rate limit' : 'Create rate limit'}
              </button>
              {editingPackage && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingPackage(null)
                    setForm(defaultForm)
                    setError('')
                    setSuccess('')
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="message error">{error}</p>}
          {success && <p className="message success">{success}</p>}
        </section>

        <section className="panel list-panel">
          <div className="panel-header">
            <h2>Configured packages</h2>
            <span className="api-label">API: {apiBaseUrl}</span>
          </div>

          {loading && rateLimits.length === 0 ? (
            <p className="empty-state">Loading packages…</p>
          ) : rateLimits.length === 0 ? (
            <p className="empty-state">No rate limits configured yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Limit</th>
                    <th>Window</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rateLimits.map((rateLimit) => (
                    <tr key={rateLimit._id || rateLimit.package}>
                      <td>{rateLimit.package}</td>
                      <td>{rateLimit.limit}</td>
                      <td>{rateLimit.window}s</td>
                      <td className="actions">
                        <button type="button" className="link-button" onClick={() => handleEdit(rateLimit)}>
                          Edit
                        </button>
                        <button type="button" className="danger-button" onClick={() => handleDelete(rateLimit.package)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
