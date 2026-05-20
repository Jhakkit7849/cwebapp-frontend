// Lessons.jsx (stacked list)
import { useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'
import { Link, useSearchParams } from 'react-router-dom'
import useAuth from '../state/AuthContext.jsx'

function ProgressBadge({ progress }) {
  if (!progress) return null
  const raw = progress.best_score
  const pct = raw == null ? null : (raw > 1 ? Math.round(raw) : Math.round(raw * 100))
  const attempts = progress.attempts ?? 0
  const passed = !!progress.passed
  return (
    <span
      className="badge"
      style={{
        marginLeft: 8,
        background: passed ? 'rgba(34,197,94,.15)' : 'rgba(245,158,11,.12)',
        border: passed ? '1px solid rgba(34,197,94,.35)' : '1px solid rgba(245,158,11,.35)',
        color: passed ? 'var(--ok)' : 'var(--warn)',
      }}
      title={`attempts: ${attempts || 0}${pct!=null ? ` • best: ${pct}%` : ''}`}
    >
      {passed ? `ผ่าน${pct!=null ? ` ${pct}%` : ''} ✓` : `ยังไม่ผ่าน${pct!=null ? ` (${pct}%)` : ''}${attempts ? ` · ลอง ${attempts} ครั้ง` : ''}`}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:12, opacity:.7 }}>
      <div className="badge" style={{ width:52, textAlign:'center' }}>#</div>
      <div style={{ flex:1 }}>
        <div style={{ height:14, width:'60%', background:'#1b2650', borderRadius:6 }} />
        <div style={{ marginTop:8, height:12, width:'30%', background:'#101938', borderRadius:6 }} />
      </div>
      <div className="muted">→</div>
    </div>
  )
}

function LessonRow({ it, showProgress }) {
  return (
    <Link to={`/lessons/${it.slug}`} className="card" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
      <div className="badge" style={{ minWidth:52, textAlign:'center' }}>#{it.order_index}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <h3 style={{ margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.title}</h3>
          <span className="badge">{it.category}</span>
          {showProgress && it.progress && <ProgressBadge progress={it.progress} />}
        </div>
      </div>
      <div className="muted" style={{ fontWeight:700 }}>เรียนรู้ →</div>
    </Link>
  )
}

export default function Lessons(){
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [params, setParams] = useSearchParams()
  const [localQ, setLocalQ] = useState('')

  const category = params.get('category') || ''

  const load = async () => {
    try{
      setLoading(true); setErr('')
      const path = category ? `/lessons?category=${encodeURIComponent(category)}` : '/lessons'
      const rows = await api(path)
      setList(rows || [])
    }catch(e){ setErr(e.message) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [category, user?.id])

  const categories = useMemo(()=>{
    const s = new Set()
    list.forEach(it => { if (it.category) s.add(it.category) })
    return Array.from(s).sort()
  }, [list])

  const filtered = useMemo(()=>{
    const q = localQ.trim().toLowerCase()
    if (!q) return list
    return list.filter(it =>
      (it.title || '').toLowerCase().includes(q) ||
      (it.category || '').toLowerCase().includes(q)
    )
  }, [list, localQ])

  const onPickCategory = (val)=>{
    const p = new URLSearchParams(params)
    if (val) p.set('category', val); else p.delete('category')
    setParams(p, { replace: true })
  }

  return (
    <div className="grid">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ margin:0 }}>บทเรียน (Lessons)</h2>
        </div>
        <div className="flex" style={{ gap:10 }}>
          <select
            className="input"
            value={category}
            onChange={e=>onPickCategory(e.target.value)}
            style={{ minWidth: 160 }}
            aria-label="เลือกหมวดบทเรียน"
          >
            <option value="">หมวดทั้งหมด</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="input"
            placeholder="ค้นหาบทเรียน..."
            value={localQ}
            onChange={e=>setLocalQ(e.target.value)}
            style={{ minWidth: 220 }}
          />
        </div>
      </div>

      {/* Error */}
      {err && <div className="card" style={{ borderColor:'var(--danger)', background:'rgba(239,68,68,.08)' }}>{err}</div>}

      {/* Stats (optional) */}
      <div className="grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">จำนวนบทเรียน</div>
          <div className="stat-value">{list.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ตัวกรอง</div>
          <div className="stat-value" style={{ fontSize:18 }}>
            {category || 'ทั้งหมด'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{user?.id ? 'ผู้ใช้' : 'สถานะ'}</div>
          <div className="stat-value" style={{ fontSize:18 }}>
            {user?.id ? 'กำลังเรียน' : 'Guest'}
          </div>
        </div>
      </div>

      {/* Stacked list */}
      <div className="grid">
        {loading && [1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)}
        {!loading && filtered.length === 0 && (
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:700 }}>ยังไม่พบบทเรียนที่ตรงเงื่อนไข</div>
            <div className="muted mt-1">ลองล้างตัวกรอง หรือพิมพ์คำค้นหาอย่างอื่น</div>
          </div>
        )}
        {!loading && filtered.map(it => (
          <LessonRow key={it.id} it={it} showProgress={!!user?.id} />
        ))}
      </div>
    </div>
  )
}
