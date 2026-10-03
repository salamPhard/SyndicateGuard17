import { useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function UserLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Unable to sign in.')
      }

      localStorage.setItem('syndicate-user-token', data.token)
      setMessage('You are signed in successfully.')
      setForm({ email: '', password: '' })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
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

      {message && <p className="status success">{message}</p>}
      {error && <p className="status error">{error}</p>}
      <p className="inline-links">
        New here? <Link to="/user-account">Register for a user account</Link>
      </p>
    </section>
  )
}

export default UserLoginPage