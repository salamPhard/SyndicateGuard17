import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function UserLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [loginInfo, setLoginInfo] = useState(null)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setLoginInfo(null)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Unable to sign in.')
      }

      localStorage.setItem('syndicate-user-token', data.token)
      setLoginInfo(data.loginLimit || {
        package: 'free',
        remaining: null,
        limit: 5,
        resetsAt: null,
      })
      setForm({ email: '', password: '' })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  const continueToDashboard = () => {
    setLoginInfo(null)
    navigate('/user-dashboard', { replace: true })
  }

  return (
    <section className="page-card">
      <div className="card-header">
        <p className="eyebrow">User portal</p>
        <h1>Log in to your account</h1>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="jane@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Log in'}
        </button>
      </form>

      {error && <p className="status error">{error}</p>}
      <p className="inline-links">
        New here? <Link to="/user-account">Register for a user account</Link>
      </p>

      {loginInfo && (
        <div
          className="login-notice-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setLoginInfo(null)
            }
          }}
        >
          <section
            className="login-notice"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-notice-title"
          >
            <button
              type="button"
              className="login-notice-close"
              aria-label="Close login information"
              onClick={continueToDashboard}
            >
              ×
            </button>
            <p className="eyebrow">Signed in</p>
            <h2 id="login-notice-title">Login information</h2>
            {loginInfo.package === 'free' && Number.isInteger(loginInfo.remaining) ? (
              <>
                <p className="login-notice-count">
                  {loginInfo.remaining} of {loginInfo.limit} logins left today
                </p>
                <p className="login-notice-detail">
                  Your login allowance resets at{' '}
                  {new Date(loginInfo.resetsAt).toLocaleString()}.
                </p>
              </>
            ) : loginInfo.limit === null ? (
              <p className="login-notice-detail">
                Your {loginInfo.package} package has no daily login limit.
              </p>
            ) : (
              <p className="login-notice-detail">
                You are signed in, but your remaining login allowance could not be loaded.
              </p>
            )}
            <button
              type="button"
              className="primary-btn"
              onClick={continueToDashboard}
            >
              Continue
            </button>
          </section>
        </div>
      )}
    </section>
  )
}

export default UserLoginPage