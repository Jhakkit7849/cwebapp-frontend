// src/pages/admin/AdminComments.jsx
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../utils/api.js'

export default function AdminComments(){
  const [posts, setPosts] = useState([])
  const [selected, setSelected] = useState('')
  const [comments, setComments] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // UI filter
  const [q, setQ] = useState('')
  const [onlyUnverified, setOnlyUnverified] = useState(false)
  const [sortBy, setSortBy] = useState('newest') // newest | oldest | verified_first | unverified_first

  useEffect(() => {
    (async () => {
      try {
        setErr('')
        setPosts(await api('/community/posts'))
      } catch (e) {
        setErr(e.message)
      }
    })()
  }, [])

  // โหลดคอมเมนต์เมื่อเลือกโพสต์
  useEffect(() => {
    if (!selected) {
      setComments([])
      return
    }
    loadComments(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const loadComments = async (postId = selected) => {
    try {
      setErr('')
      setLoading(true)
      const rows = await api(`/community/posts/${postId}/comments`)
      setComments(rows || [])
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const verify = async (id) => {
    try {
      await api(`/community/comments/${id}/verify`, { method: 'POST' })
      await loadComments()
    } catch (e) { setErr(e.message) }
  }

  const unverify = async (id) => {
    try {
      await api(`/community/comments/${id}/unverify`, { method: 'POST' })
      await loadComments()
    } catch (e) { setErr(e.message) }
  }

  // ยกเลิกการเลือกโพสต์
  const cancelSelect = () => {
    setSelected('')
    setComments([])
    setErr('')
    setQ('')
    setOnlyUnverified(false)
    setSortBy('newest')
  }

  // มุมมองหลังกรอง/เรียง
  const view = useMemo(() => {
    let rows = Array.isArray(comments) ? [...comments] : []

    // ค้นหาตามข้อความ
    const qq = q.trim().toLowerCase()
    if (qq) {
      rows = rows.filter(c =>
        String(c.content || '').toLowerCase().includes(qq) ||
        String(c.first_name || '').toLowerCase().includes(qq) ||
        String(c.last_name || '').toLowerCase().includes(qq)
      )
    }

    // เฉพาะที่ยังไม่ verify
    if (onlyUnverified) rows = rows.filter(c => !c.is_verified)

    // จัดเรียง
    rows.sort((a, b) => {
      const ta = new Date(a.created_at).getTime() || 0
      const tb = new Date(b.created_at).getTime() || 0
      if (sortBy === 'oldest') return ta - tb
      if (sortBy === 'verified_first') return (b.is_verified - a.is_verified) || (tb - ta)
      if (sortBy === 'unverified_first') return (a.is_verified - b.is_verified) || (tb - ta)
      // newest
      return tb - ta
    })
    return rows
  }, [comments, q, onlyUnverified, sortBy])

  const currentPost = posts.find(p => String(p.id) === String(selected))

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>ตรวจคอมเมนต์ (Admin)</h2>
          <div className="subtitle">
            เลือกโพสต์ → ตรวจสอบคอมเมนต์ทีละรายการ (verify / unverify)
          </div>
        </div>
        {/* แสดงจำนวนสรุป */}
        <div className="stats stats-inline">
          <div className="stat-card">
            <div className="stat-label">ทั้งหมด</div>
            <div className="stat-value">{comments.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ผ่านตรวจ</div>
            <div className="stat-value">{comments.filter(c => c.is_verified).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ยังไม่ตรวจ</div>
            <div className="stat-value">{comments.filter(c => !c.is_verified).length}</div>
          </div>
        </div>
      </div>

      {err && <div className="warning">{err}</div>}

      {/* แผงเลือกโพสต์ + ค้นหา/กรอง */}
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div className="flex" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input"
            value={selected || ''}
            onChange={e => setSelected(e.target.value)}
            style={{ minWidth: 260 }}
          >
            <option value="">-- เลือกโพสต์ --</option>
            {posts.map(p => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.title}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => loadComments()} disabled={!selected}>
            รีเฟรช
          </button>
          <button className="btn" onClick={cancelSelect} disabled={!selected}>
            ยกเลิก
          </button>
          {selected && (
            <small className="muted">กำลังดูโพสต์: <b>{currentPost?.title || selected}</b></small>
          )}
        </div>

        <div className="grid cols-3" style={{ gap: 12 }}>
          <div className="grid" style={{ gap: 6 }}>
            <label className="muted">ค้นหา</label>
            <input
              className="input"
              placeholder="ค้นหาคอนเทนต์/คนคอมเมนต์…"
              value={q}
              onChange={e => setQ(e.target.value)}
              disabled={!selected}
            />
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <label className="muted">เรียงลำดับ</label>
            <select
              className="input"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              disabled={!selected}
            >
              <option value="newest">ใหม่ → เก่า</option>
              <option value="oldest">เก่า → ใหม่</option>
              <option value="unverified_first">ยังไม่ตรวจก่อน</option>
              <option value="verified_first">ผ่านตรวจก่อน</option>
            </select>
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <label className="muted">ตัวเลือก</label>
            <label className="flex items-center" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={onlyUnverified}
                onChange={e => setOnlyUnverified(e.target.checked)}
                disabled={!selected}
              />
              แสดงเฉพาะยังไม่ตรวจ
            </label>
          </div>
        </div>
      </div>

      {/* รายการคอมเมนต์ */}
      <div className="card">
        {(!selected) && <div className="muted">โปรดเลือกโพสต์ก่อน</div>}
        {selected && loading && <div className="muted">กำลังโหลด…</div>}
        {selected && !loading && view.length === 0 && (
          <div className="muted">ไม่พบคอมเมนต์ตามเงื่อนไข</div>
        )}

        {selected && !loading && view.length > 0 && (
          <div className="grid" style={{ gap: 10 }}>
            {view.map(c => (
              <div key={c.id} className="tile" style={{ gridTemplateColumns: '1fr auto auto', gap: 12 }}>
                <div className="tile-main">
                  <h3 style={{ margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>{c.first_name} {c.last_name}</span>
                    {' '}
                    <small className="muted">· {new Date(c.created_at).toLocaleString()}</small>
                  </h3>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
                </div>
                <div className="flex" style={{ alignItems: 'center' }}>
                  {c.is_verified
                    ? <span className="badge" style={{ background: '#12381e', borderColor: '#1f6a39', color: '#9ae6b4' }}>verified ✓</span>
                    : <span className="badge muted">ยังไม่ตรวจ</span>
                  }
                </div>
                <div className="tile-arrow">
                  {!c.is_verified ? (
                    <button className="btn primary" onClick={() => verify(c.id)}>Verify</button>
                  ) : (
                    <button className="btn danger" onClick={() => unverify(c.id)}>ยกเลิก</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
