import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const packageOrder = ['free', 'pro', 'enterprise']

function UserDashboardPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [selectedPackage, setSelectedPackage] = useState('pro')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const profileSaveInFlight = useRef(false)

  const token = localStorage.getItem('syndicate-user-token')

  const loadProfile = useCallback(async () => {
    if (!token) {
      navigate('/user-login', { replace: true })
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Unable to load your profile.')
      }

      setProfile(data.user)
      setForm({
        name: data.user.name || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        address: data.user.address || '',
      })
      const nextPackage = packageOrder[packageOrder.indexOf(data.user.package) + 1]
      if (nextPackage) setSelectedPackage(nextPackage)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [navigate, token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (!profile) return

    const unchanged = ['name', 'email', 'phone', 'address'].every(
      (field) => form[field] === (profile[field] || '')
    )
    if (unchanged || profileSaveInFlight.current) return

    const timeout = setTimeout(async () => {
      profileSaveInFlight.current = true
      setSaving(true)
      setMessage('')
      setError('')

      try {
        const response = await fetch(`${API_URL}/api/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Unable to save your profile changes.')
        }
        setProfile((current) => ({ ...current, ...data.user }))
        setMessage('Profile changes saved to your account.')
      } catch (saveError) {
        setError(saveError.message)
      } finally {
        profileSaveInFlight.current = false
        setSaving(false)
      }
    }, 700)

    return () => clearTimeout(timeout)
  }, [form, profile, token])

  const requestUpgrade = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/users/me/upgrade-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ package: selectedPackage }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Unable to submit the upgrade request.')
      }
      setMessage(data.message)
      await loadProfile()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('syndicate-user-token')
    navigate('/user-login', { replace: true })
  }

  if (loading) {
    return <section className="page-card"><p>Loading your dashboard...</p></section>
  }

  if (!profile) {
    return (
      <section className="page-card">
        {error && <p className="status error">{error}</p>}
        <button type="button" className="secondary-btn" onClick={logout}>Log out</button>
      </section>
    )
  }

  const hasPendingRequest = profile.upgradeRequests?.some((request) => request.status === 'pending')
  const nextPackages = packageOrder.slice(packageOrder.indexOf(profile.package) + 1)

  return (
    <section className="page-card user-dashboard">
      <div className="card-header split-header">
        <div>
          <p className="eyebrow">User portal</p>
          <h1>Your dashboard</h1>
        </div>
        <button type="button" className="secondary-btn" onClick={logout}>Log out</button>
      </div>

      {message && <p className="status success" role="status">{message}</p>}
      {error && <p className="status error" role="alert">{error}</p>}

      <div className="user-dashboard-grid">
        <section className="panel-box plan-card">
          <p className="eyebrow">Current plan</p>
          <h2>{profile.package}</h2>
          {profile.loginLimit ? (
            <p>{profile.loginLimit.remaining} of {profile.loginLimit.limit} logins left today</p>
          ) : (
            <p>No daily login limit</p>
          )}

          {hasPendingRequest ? (
            <p className="upgrade-pending" role="status">Your package upgrade request is pending admin approval.</p>
          ) : nextPackages.length > 0 ? (
            <form className="auth-form" onSubmit={requestUpgrade}>
              <label>
                Request a plan upgrade
                <select
                  value={selectedPackage}
                  onChange={(event) => setSelectedPackage(event.target.value)}
                >
                  {nextPackages.map((packageName) => (
                    <option key={packageName} value={packageName}>{packageName}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Sending request...' : 'Request upgrade'}
              </button>
              <p className="profile-hint">An administrator must approve the request before your plan changes.</p>
            </form>
          ) : (
            <p>You are on the highest available plan.</p>
          )}

          {profile.upgradeRequests?.length > 0 && (
            <ul className="request-history">
              {profile.upgradeRequests.slice().reverse().map((request) => (
                <li key={request._id}>
                  {request.requestedPackage} request: {request.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-box profile-card">
          <h2>Contact details</h2>
          <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            <label>
              Phone number
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                autoComplete="tel"
              />
            </label>
            <label>
              Home address
              <textarea
                name="address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                rows="3"
                autoComplete="street-address"
              />
            </label>
            <p className="profile-hint" role="status">
              {saving ? 'Saving changes...' : 'Changes save automatically after you finish editing.'}
            </p>
          </form>
        </section>
      </div>
    </section>
  )
}

export default UserDashboardPage
