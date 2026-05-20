// src/pages/Rankings.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../utils/api.js'
import useAuth from '../state/AuthContext.jsx'

function avatarThumb(url, w=28, h=28) {
  if (!url) return null
  return url.replace('/upload/', `/upload/c_fill,w_${w},h_${h},q_auto,f_auto,g_face,r_max/`)
}
function medal(rank){
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

export default function Rankings(){
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // UI controls
  const [q, setQ] = useState('')                 // ค้นหาชื่อ
  const [showTopOnly, setShowTopOnly] = useState(false) // โชว์ Top 50 (หรือทั้งหมด)
  const myRowRef = useRef(null)

  const load = async ()=>{
    try{
      setErr(''); setLoading(true)
      const rows = await api('/rankings')
      setList(rows || [])
    }catch(e){ setErr(e.message) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const filtered = useMemo(()=>{
    let rows = Array.isArray(list) ? [...list] : []
    const qq = q.trim().toLowerCase()
    if (qq) {
      rows = rows.filter(it=>{
        const name = [it.first_name, it.last_name].filter(Boolean).join(' ')
        return name.toLowerCase().includes(qq)
      })
    }
    if (showTopOnly) rows = rows.filter(it => Number(it.rank) <= 10)
    return rows
  }, [list, q, showTopOnly])

  const stats = useMemo(()=>{
    const total = list.length
    const topScore = list[0]?.score ?? 0
    const lastUpdated = list[0]?.updated_at ? new Date(list[0].updated_at) : null
    return { total, topScore, lastUpdated }
  }, [list])

  const scrollToMe = ()=>{
    if (!myRowRef.current) return
    myRowRef.current.scrollIntoView({ behavior:'smooth', block:'center' })
    myRowRef.current.classList.add('pulse')
    setTimeout(()=> myRowRef.current?.classList.remove('pulse'), 900)
  }

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h2 style={{margin:0}}>อันดับผู้ใช้ (Leaderboard)</h2>
          <div className="subtitle">รวมแต้มจาก Challenges และ Quizzes</div>
        </div>
        <div className="stats stats-inline">
          <div className="stat-card">
            <div className="stat-label">ผู้เข้าร่วมทั้งหมด</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">คะแนนสูงสุด</div>
            <div className="stat-value">{Number(stats.topScore||0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">อัปเดตล่าสุด</div>
            <div className="stat-value" style={{fontSize:16}}>
              {stats.lastUpdated ? stats.lastUpdated.toLocaleString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* แผงค้นหา/ตัวเลือก */}
      <div className="card" style={{display:'grid', gap:12}}>
        <div className="grid cols-3" style={{gap:12}}>
          <div className="grid" style={{gap:6}}>
            <label className="muted">ค้นหาชื่อ</label>
            <input
              className="input"
              placeholder="พิมพ์ชื่อหรือสกุล…"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
          </div>
          <div className="grid" style={{gap:6}}>
            <label className="muted">ตัวกรอง</label>
            <label className="flex items-center" style={{gap:8}}>
              <input
                type="checkbox"
                checked={showTopOnly}
                onChange={e=>setShowTopOnly(e.target.checked)}
              />
              แสดงเฉพาะ Top 10
            </label>
          </div>
          <div className="grid" style={{gap:6}}>
            <label className="muted">การทำงาน</label>
            <div className="flex" style={{gap:8}}>
              <button className="btn" onClick={load} disabled={loading}>รีเฟรช</button>
              {!!user?.id && (
                <button className="btn" onClick={scrollToMe}>เลื่อนไปที่ฉัน</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ตาราง */}
      <div className="card">
        {err && <div className="warning">{err}</div>}
        {loading && <div className="muted">กำลังโหลด…</div>}

        <table className="table">
          <thead>
            <tr>
              <th style={{width:90}}>อันดับ</th>
              <th>ผู้ใช้</th>
              <th style={{width:160}}>คะแนนรวม</th>
              <th style={{width:220}}>อัปเดตล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4} className="muted">ยังไม่มีข้อมูลอันดับ</td></tr>
            )}

            {filtered.map(it => {
              const isMe = user?.id && String(user.id) === String(it.user_id)
              const name = [it.first_name, it.last_name].filter(Boolean).join(' ') || `User#${it.user_id}`
              const av = avatarThumb(it.profile_image)
              const m = medal(Number(it.rank))
              return (
                <tr
                  key={it.user_id}
                  ref={isMe ? myRowRef : undefined}
                  style={{
                    background: isMe ? 'rgba(79,140,255,0.08)' : undefined,
                    outline: isMe ? '1px solid #2d6bff' : undefined,
                  }}
                  title={isMe ? 'นี่คือคุณ' : undefined}
                >
                  <td style={{fontWeight:800}}>
                    {m ? <span style={{marginRight:6}}>{m}</span> : null}
                    {it.rank}
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {av ? (
                        <img
                          src={av}
                          alt={name}
                          width={28}
                          height={28}
                          style={{ borderRadius:'50%', display:'block' }}
                        />
                      ) : (
                        <span
                          aria-hidden
                          style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'inline-block' }}
                        />
                      )}
                      <span style={{fontWeight:600}}>
                        {name}{isMe ? ' (คุณ)' : ''}
                      </span>
                    </div>
                  </td>
                  <td><b>{Number(it.score||0).toLocaleString()}</b></td>
                  <td>{it.updated_at ? new Date(it.updated_at).toLocaleString() : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* pulse highlight effect */}
      <style>{`
        .pulse { box-shadow: 0 0 0 0 rgba(45,107,255,.7); animation: pulse 0.9s ease-out 1; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(45,107,255,.7); }
          100% { box-shadow: 0 0 0 16px rgba(45,107,255,0); }
        }
      `}</style>
    </div>
  )
}
