import React, { useEffect, useMemo, useState } from 'react'
import type { AgriUser } from './auth'

type FarmerTab = 'docs' | 'search' | 'track' | 'pay'

interface FarmerDashboardProps {
  user: AgriUser
  onLogout: () => void
}

interface UploadedDocs {
  aadhaar?: string
  passbook?: string
  affidavit?: string
}

interface CenterDef {
  id: string
  name: string
  authority: string
}

const CENTERS: CenterDef[] = [
  { id: 'A', name: 'FCI Ludhiana Mandi Yard', authority: 'Central — FCI' },
  { id: 'B', name: 'NAFED Karnal Procurement Hub', authority: 'Central — NAFED' },
  { id: 'C', name: 'CWC Hisar Warehouse Gate', authority: 'State — Punjab/Haryana CWC' },
  { id: 'D', name: 'MARKFED Bathinda Centre', authority: 'State — MARKFED' },
]

interface QueueRow {
  centerId: string
  position: number
  waitMinutes: number
  status: 'queued' | 'sold' | 'cleared'
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<FarmerTab>('docs')
  const [docs, setDocs] = useState<UploadedDocs>({})
  const [crop, setCrop] = useState('Wheat')
  const [variety, setVariety] = useState('PBW 725')
  const [qty, setQty] = useState('18')
  const [selectedCenters, setSelectedCenters] = useState<string[]>(['A', 'B', 'C'])
  const [applied, setApplied] = useState(false)
  const [queues, setQueues] = useState<QueueRow[]>([])
  const [soldAt, setSoldAt] = useState<string | null>(null)

  const storageKey = `agriprocure_farmer_${user.name}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw)
        setDocs(saved.docs ?? {})
        setCrop(saved.crop ?? 'Wheat')
        setSelectedCenters(saved.selectedCenters ?? ['A', 'B', 'C'])
        setApplied(Boolean(saved.applied))
        setQueues(saved.queues ?? [])
        setSoldAt(saved.soldAt ?? null)
      }
    } catch {
      /* ignore */
    }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ docs, crop, selectedCenters, applied, queues, soldAt }),
    )
  }, [storageKey, docs, crop, selectedCenters, applied, queues, soldAt])

  useEffect(() => {
    if (!applied || soldAt) return
    const timer = setInterval(() => {
      setQueues((prev) =>
        prev.map((q) =>
          q.status === 'queued'
            ? {
                ...q,
                waitMinutes: Math.max(8, q.waitMinutes - 1),
                position: q.position > 1 && Math.random() > 0.7 ? q.position - 1 : q.position,
              }
            : q,
        ),
      )
    }, 4000)
    return () => clearInterval(timer)
  }, [applied, soldAt])

  const nav = [
    { id: 'docs' as const, label: 'Document Upload Hub' },
    { id: 'search' as const, label: 'Smart Search & Multi-Centre' },
    { id: 'track' as const, label: 'Live Procurement Track' },
    { id: 'pay' as const, label: 'Payment Status' },
  ]

  const onFile = (key: keyof UploadedDocs, file?: File) => {
    if (!file) return
    setDocs((d) => ({ ...d, [key]: file.name }))
  }

  const toggleCenter = (id: string) => {
    setSelectedCenters((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const applyCenters = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCenters.length === 0) return
    const next: QueueRow[] = selectedCenters.map((id, i) => ({
      centerId: id,
      position: 12 + i * 7,
      waitMinutes: 45 + i * 18,
      status: 'queued',
    }))
    setQueues(next)
    setApplied(true)
    setSoldAt(null)
    setTab('track')
  }

  const markSold = (centerId: string) => {
    setSoldAt(centerId)
    setQueues((prev) =>
      prev.map((q) => {
        if (q.centerId === centerId) return { ...q, status: 'sold', position: 0, waitMinutes: 0 }
        return { ...q, status: 'cleared', position: 0, waitMinutes: 0 }
      }),
    )
  }

  const soldCenterName = CENTERS.find((c) => c.id === soldAt)?.name

  const receipts = useMemo(() => {
    const payout = Number(qty) * 2275
    return [
      {
        id: 'MSP-4821',
        type: 'Crop sale disbursement',
        amount: soldAt ? `₹${payout.toLocaleString('en-IN')}` : 'Pending sale',
        destination: `${user.name} — linked passbook A/C (landlord blocked)`,
        status: soldAt ? 'Settled to farmer' : 'Awaiting procurement',
      },
      {
        id: 'PMFBY-1904',
        type: 'Disaster crop insurance',
        amount: '₹42,500',
        destination: `${user.name} — direct benefit transfer`,
        status: 'Mapped away from landlord · Paid',
      },
    ]
  }, [qty, soldAt, user.name])

  return (
    <div className="farmer-shell min-h-screen flex flex-col md:flex-row">
      <aside className="farmer-sidebar">
        <div>
          <p className="text-amber-200/80 text-xs uppercase tracking-widest">100% free for farmers</p>
          <h1 className="text-2xl font-semibold text-white mt-1">AgriProcure AI</h1>
          <p className="text-amber-100/80 text-sm mt-2">{user.name}</p>
          <p className="text-amber-200/70 text-xs">Role: Farmer</p>
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`farmer-nav ${tab === item.id ? 'farmer-nav-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="mt-auto agri-btn-ghost w-full" onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {tab === 'docs' && (
          <section className="space-y-6 max-w-3xl">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Document Upload Hub</h2>
              <p className="text-amber-900/80 mt-1">
                Tenant farmers can complete land verification without any landlord signature.
              </p>
            </header>
            <UploadField
              title="Aadhaar Card"
              hint="Identity for MSP and DBT mapping"
              fileName={docs.aadhaar}
              onChange={(f) => onFile('aadhaar', f)}
            />
            <UploadField
              title="Bank Passbook"
              hint="Disbursements go only to this account"
              fileName={docs.passbook}
              onChange={(f) => onFile('passbook', f)}
            />
            <UploadField
              title="Tenant Farmer Affidavit / Land Verification Document"
              hint="Self-attested cultivation proof. Landlord signature is not required."
              fileName={docs.affidavit}
              onChange={(f) => onFile('affidavit', f)}
              emphasis
            />
          </section>
        )}

        {tab === 'search' && (
          <section className="space-y-6 max-w-3xl">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Smart Search & Multi-Centre Counseling</h2>
              <p className="text-amber-900/80 mt-1">
                Apply to several state and central procurement centres at once and bypass commission agents.
              </p>
            </header>
            <form onSubmit={applyCenters} className="glass-card p-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-amber-900">Crop details</span>
                <select className="agri-input mt-1" value={crop} onChange={(e) => setCrop(e.target.value)}>
                  <option>Wheat</option>
                  <option>Paddy</option>
                  <option>Rice</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-amber-900">Variety</span>
                <input className="agri-input mt-1" value={variety} onChange={(e) => setVariety(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-amber-900">Quantity (quintals)</span>
                <input className="agri-input mt-1" value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>
              <fieldset>
                <legend className="text-sm font-medium text-amber-900 mb-2">Apply to centres</legend>
                <div className="space-y-2">
                  {CENTERS.map((center) => (
                    <label key={center.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedCenters.includes(center.id)}
                        onChange={() => toggleCenter(center.id)}
                      />
                      <span>
                        <span className="font-medium text-amber-950">{center.name}</span>
                        <span className="block text-xs text-amber-800">{center.authority}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="agri-btn-primary">
                Submit parallel applications
              </button>
            </form>
          </section>
        )}

        {tab === 'track' && (
          <section className="space-y-6">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Live Procurement Track & Dynamic Queue Management</h2>
              <p className="text-amber-900/80 mt-1">
                Parallel queues update together. Selling at one centre immediately clears you from the others.
              </p>
            </header>
            {!applied && (
              <p className="glass-card p-6 text-amber-900">Apply from Smart Search first to join live queues.</p>
            )}
            {applied && (
              <div className="grid lg:grid-cols-2 gap-6">
                {queues.map((q) => {
                  const center = CENTERS.find((c) => c.id === q.centerId)
                  return (
                    <article key={q.centerId} className="queue-card">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-amber-700">Centre {q.centerId}</p>
                          <h3 className="text-xl font-semibold text-amber-950">{center?.name}</h3>
                        </div>
                        <span className={`queue-pill queue-pill-${q.status}`}>{q.status}</span>
                      </div>
                      {q.status === 'queued' ? (
                        <>
                          <p className="text-5xl font-semibold text-amber-900 mt-4">#{q.position}</p>
                          <p className="text-amber-800">Expected wait ≈ {q.waitMinutes} min</p>
                          <button className="agri-btn-primary mt-4" onClick={() => markSold(q.centerId)}>
                            Mark harvest sold here
                          </button>
                        </>
                      ) : q.status === 'sold' ? (
                        <p className="mt-4 text-emerald-800 font-medium">Sold. Direct MSP path opened for your passbook.</p>
                      ) : (
                        <p className="mt-4 text-slate-600">Name cleared from this queue after sale at another centre.</p>
                      )}
                    </article>
                  )
                })}
                <article className="queue-card lg:col-span-2">
                  <h3 className="text-xl font-semibold text-amber-950">Optimized shortest-path navigation</h3>
                  <p className="text-sm text-amber-800 mb-3">Placeholder simulating a Google Maps grain-haul route.</p>
                  <svg viewBox="0 0 640 220" className="w-full h-48 rounded-xl bg-[#e8f3e4] border border-amber-200">
                    <path d="M40 160 C 140 40, 240 200, 340 90 S 520 40, 600 130" fill="none" stroke="#b45309" strokeWidth="4" strokeDasharray="8 6" />
                    <circle cx="40" cy="160" r="10" fill="#166534" />
                    <circle cx="340" cy="90" r="8" fill="#ca8a04" />
                    <circle cx="600" cy="130" r="10" fill="#9a3412" />
                    <text x="52" y="155" fontSize="12" fill="#14532d">Farm gate</text>
                    <text x="300" y="72" fontSize="12" fill="#854d0e">Bypass agent corridor</text>
                    <text x="500" y="118" fontSize="12" fill="#7c2d12">
                      {soldCenterName ?? 'Nearest selected centre'}
                    </text>
                  </svg>
                </article>
              </div>
            )}
          </section>
        )}

        {tab === 'pay' && (
          <section className="space-y-6 max-w-4xl">
            <header>
              <h2 className="text-3xl font-semibold text-amber-950">Payment Status</h2>
              <p className="text-amber-900/80 mt-1">
                Crop sales and insurance payouts are mapped to the farmer bank account, not the landlord.
              </p>
            </header>
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-amber-100 text-amber-950">
                  <tr>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id} className="border-t border-amber-100">
                      <td className="p-3 font-mono">{r.id}</td>
                      <td className="p-3">{r.type}</td>
                      <td className="p-3">{r.amount}</td>
                      <td className="p-3">{r.destination}</td>
                      <td className="p-3 text-emerald-800">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function UploadField({
  title,
  hint,
  fileName,
  onChange,
  emphasis,
}: {
  title: string
  hint: string
  fileName?: string
  onChange: (file?: File) => void
  emphasis?: boolean
}) {
  return (
    <label className={`glass-card p-6 block cursor-pointer ${emphasis ? 'ring-2 ring-amber-400' : ''}`}>
      <span className="block text-lg font-semibold text-amber-950">{title}</span>
      <span className="block text-sm text-amber-800 mt-1">{hint}</span>
      <input
        type="file"
        className="mt-4 block w-full text-sm"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {fileName && <span className="mt-2 inline-block text-emerald-800 text-sm">Uploaded: {fileName}</span>}
    </label>
  )
}

export default FarmerDashboard
