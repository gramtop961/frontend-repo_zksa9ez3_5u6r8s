import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'

function Feature({ title, desc }) {
  return (
    <div className="p-5 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:border-emerald-400/50 transition-all">
      <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
      <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])
  const [status, setStatus] = useState('')
  const [tools, setTools] = useState([])
  const [userId, setUserId] = useState('')
  const [creating, setCreating] = useState(false)
  const [coords, setCoords] = useState({ lat: null, lng: null })

  const [userForm, setUserForm] = useState({ name: '', email: '' })
  const [toolForm, setToolForm] = useState({ title: '', description: '', category: '' })

  useEffect(() => {
    // ping backend
    fetch(`${baseUrl}/api/hello`).then(async r => {
      const d = await r.json().catch(() => ({}))
      setStatus(d.message || 'Connected')
    }).catch(() => setStatus('Could not reach backend'))

    // try to get geolocation (non-blocking)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {}
      )
    }
  }, [baseUrl])

  const loadTools = async () => {
    const params = new URLSearchParams()
    if (coords.lat && coords.lng) {
      params.set('lat', coords.lat)
      params.set('lng', coords.lng)
      params.set('radius_km', '25')
    }
    const res = await fetch(`${baseUrl}/tools?${params.toString()}`)
    const data = await res.json()
    setTools(data.items || [])
  }

  useEffect(() => {
    loadTools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords.lat, coords.lng])

  const createUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          tokens: 10,
        }),
      })
      const data = await res.json()
      if (data.id) setUserId(data.id)
    } finally {
      setCreating(false)
    }
  }

  const createTool = async (e) => {
    e.preventDefault()
    if (!userId) {
      alert('Create/select a user first')
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${baseUrl}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: userId,
          title: toolForm.title,
          description: toolForm.description,
          category: toolForm.category,
          location: coords.lat && coords.lng ? { lat: coords.lat, lng: coords.lng } : undefined,
        }),
      })
      await res.json()
      setToolForm({ title: '', description: '', category: '' })
      loadTools()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/mwBbOy4jrazr59EO/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/10 via-neutral-950/40 to-neutral-950 pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 w-fit mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Secure sharing powered by Trust Tokens
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Share tools safely with your neighborhood
          </h1>
          <p className="text-white/70 mt-4 max-w-2xl">
            Earn tokens when you lend. Spend them to borrow. Ratings, availability, and location-aware matching keep exchanges effortless and fair.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Backend: {status || '...'}</span>
            {coords.lat && coords.lng ? (
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Location ready</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Waiting for location</span>
            )}
            <a href="/test" className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 transition">Diagnostics</a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Feature title="Trust Token System" desc="Earn tokens when lending, spend to borrow. A fair, closed-loop incentive model." />
        <Feature title="Ratings & Reviews" desc="Every exchange can be rated to build community reputation and accountability." />
        <Feature title="Geo Matching" desc="Find nearby tools to reduce travel time, powered by privacy-friendly location matching." />
        <Feature title="Availability" desc="Owners set when a tool is free. Borrowers book with confidence—no clashes." />
      </section>

      {/* Quick Start: Create user and list tools */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Create a demo user</h2>
            <form onSubmit={createUser} className="space-y-3">
              <input
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10 focus:border-emerald-400/60 outline-none"
                placeholder="Name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                required
              />
              <input
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10 focus:border-emerald-400/60 outline-none"
                placeholder="Email (optional)"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                type="email"
              />
              <button disabled={creating} className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-60">
                {userId ? 'User Created' : creating ? 'Creating...' : 'Create User'}
              </button>
              {userId && (
                <p className="text-xs text-white/60">Your user id: <span className="font-mono">{userId}</span></p>
              )}
            </form>

            <div className="h-px w-full bg-white/10 my-5" />

            <h2 className="text-xl font-semibold mb-4">Add a tool to share</h2>
            <form onSubmit={createTool} className="space-y-3">
              <input
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10 focus:border-emerald-400/60 outline-none"
                placeholder="Title (e.g., 6ft Ladder)"
                value={toolForm.title}
                onChange={(e) => setToolForm({ ...toolForm, title: e.target.value })}
                required
              />
              <input
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10 focus:border-emerald-400/60 outline-none"
                placeholder="Category (e.g., Garden, Power Tools)"
                value={toolForm.category}
                onChange={(e) => setToolForm({ ...toolForm, category: e.target.value })}
              />
              <textarea
                className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10 focus:border-emerald-400/60 outline-none min-h-[80px]"
                placeholder="Short description"
                value={toolForm.description}
                onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
              />
              <button disabled={creating || !userId} className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-60">
                {creating ? 'Adding...' : 'Add Tool'}
              </button>
              {!userId && <p className="text-xs text-amber-300/80">Create a user first</p>}
            </form>
          </div>

          <div className="lg:col-span-2 p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Nearby tools</h2>
              <button onClick={loadTools} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-sm">Refresh</button>
            </div>
            {tools.length === 0 ? (
              <p className="text-white/60">No tools yet. Add one to get started.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-4">
                {tools.map((t) => (
                  <li key={t.id} className="p-4 rounded-lg border border-white/10 bg-neutral-900/60">
                    <div className="text-sm text-white/50 mb-1">{t.category || 'Tool'}</div>
                    <div className="text-lg font-semibold">{t.title}</div>
                    {t.description && <p className="text-white/70 text-sm mt-1">{t.description}</p>}
                    {t.location && (
                      <p className="text-white/50 text-xs mt-2 font-mono">loc: {t.location.lat?.toFixed?.(4)}, {t.location.lng?.toFixed?.(4)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-white/60 text-sm">
        <p>
          Built for secure, sustainable sharing. By using this demo, you acknowledge the use of AI assistance and open-source tools.
        </p>
      </footer>
    </div>
  )
}

export default App
