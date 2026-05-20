import { useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'
import { Link } from 'react-router-dom'

const POINTS = { easy: 10, medium: 20, hard: 30 }

export default function Challenges(){
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  // UI controls
  const [q, setQ] = useState('')
  const [diff, setDiff] = useState('')               // กรองความยาก
  const [onlyUnpassed, setOnlyUnpassed] = useState(false)
  const [sortBy, setSortBy] = useState('id_asc')

  const load = async(d='')=>{
    try{
      setErr('')
      setLoading(true)
      const qs = d ? `?difficulty=${encodeURIComponent(d)}` : ''
      const rows = await api('/challenges'+qs)
      setList(rows || [])
    }catch(e){ setErr(e.message) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load(diff) },[diff])

  const filtered = useMemo(()=>{
    let rows = Array.isArray(list) ? [...list] : []
    const query = q.trim().toLowerCase()
    if (query) rows = rows.filter(it => String(it.title||'').toLowerCase().includes(query))
    if (onlyUnpassed) rows = rows.filter(it => !it.done)

    rows.sort((a,b)=>{
      switch (sortBy) {
        case 'id_desc': return Number(b.challenge_id) - Number(a.challenge_id)
        case 'title_asc': return String(a.title||'').localeCompare(String(b.title||''))
        case 'title_desc': return String(b.title||'').localeCompare(String(a.title||''))
        case 'diff_asc': return diffWeight(a.difficulty) - diffWeight(b.difficulty)
        case 'diff_desc': return diffWeight(b.difficulty) - diffWeight(a.difficulty)
        default: return Number(a.challenge_id) - Number(b.challenge_id) // id_asc
      }
    })
    return rows
  }, [list, q, onlyUnpassed, sortBy])

  const grouped = useMemo(()=>{
    return {
      easy: filtered.filter(it => it.difficulty === 'easy'),
      medium: filtered.filter(it => it.difficulty === 'medium'),
      hard: filtered.filter(it => it.difficulty === 'hard'),
    }
  }, [filtered])

  const counts = useMemo(()=>{
    const total = list.length
    const done = list.filter(it => it.done).length
    return { total, done, left: total - done }
  }, [list])

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h2 style={{margin:0}}>Challenges</h2>
          <div className="subtitle">ฝึกเขียน C ให้แข็งแรง — ผ่านแต่ละข้อได้แต้ม (+{POINTS.easy}/+{POINTS.medium}/+{POINTS.hard})</div>
        </div>
        <div className="stats stats-inline">
          <div className="stat-card"><div className="stat-label">ทั้งหมด</div><div className="stat-value">{counts.total}</div></div>
          <div className="stat-card"><div className="stat-label">ผ่านแล้ว</div><div className="stat-value">{counts.done}</div></div>
          <div className="stat-card"><div className="stat-label">ค้างอยู่</div><div className="stat-value">{counts.left}</div></div>
        </div>
      </div>

      {/* แผงกรอง/ค้นหา */}
      <div className="card" style={{display:'grid', gap:12}}>
        <div className="grid cols-3" style={{gap:12}}>
          <div className="grid" style={{gap:6}}>
            <label className="muted">ค้นหา</label>
            <input className="input" placeholder="พิมพ์ชื่อโจทย์..." value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="grid" style={{gap:6}}>
            <label className="muted">ความยาก</label>
            <select className="input" value={diff} onChange={e=>setDiff(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="easy">ง่าย (easy) +{POINTS.easy}</option>
              <option value="medium">ปานกลาง (medium) +{POINTS.medium}</option>
              <option value="hard">ยาก (hard) +{POINTS.hard}</option>
            </select>
          </div>
        </div>

        <label className="flex items-center" style={{gap:8}}>
          <input type="checkbox" checked={onlyUnpassed} onChange={e=>setOnlyUnpassed(e.target.checked)} />
          แสดงเฉพาะที่ยังไม่ผ่าน
        </label>

        <div className="right">
          <button className="btn" onClick={()=>load(diff)}>รีเฟรช</button>
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="row-scroller">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="tile tile--fixed" style={{opacity:.6}}>
              <div className="icon-wrap">…</div>
              <div className="tile-main">
                <h3 style={{margin:0, height:18, background:'#0e1530', borderRadius:6}} />
                <div className="muted" style={{height:14, marginTop:8, background:'#0e1530', borderRadius:6}} />
              </div>
              <div className="tile-arrow">→</div>
            </div>
          ))}
        </div>
      )}

      {/* แสดงเป็น "แถวเลื่อน" */}
      {!loading && (
        <>
          {filtered.length === 0 ? (
            <div className="card"><div className="muted">ไม่พบโจทย์ตามเงื่อนไข</div></div>
          ) : (
            <>
              {/* ถ้าเลือกกรอง diff แล้ว แสดงแถวเดียว */}
              {diff ? (
                <DifficultyRow
                  title={rowTitle(diff)}
                  points={POINTS[diff] || 0}
                  items={grouped[diff]}
                />
              ) : (
                <>
                  {grouped.easy.length > 0 && (
                    <DifficultyRow title="Easy" points={POINTS.easy} items={grouped.easy} />
                  )}
                  {grouped.medium.length > 0 && (
                    <DifficultyRow title="Medium" points={POINTS.medium} items={grouped.medium} />
                  )}
                  {grouped.hard.length > 0 && (
                    <DifficultyRow title="Hard" points={POINTS.hard} items={grouped.hard} />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function DifficultyRow({ title, points, items }){
  return (
    <section className="row-section">
      <div className="row-head">
        <h3 style={{margin:0}}>{title}</h3>
        <span className="badge">+{points} pts</span>
      </div>
      <div className="row-scroller">
        {items.map(it => <ChallengeTile key={it.challenge_id} item={it} />)}
      </div>
    </section>
  )
}

function ChallengeTile({ item }){
  const label = diffLabel(item.difficulty)
  const pts = POINTS[item.difficulty] || 0
  return (
    <div className="tile tile--fixed">
      <div className="icon-wrap" title={item.difficulty.toUpperCase()}>
        {label.emoji}
      </div>
      <div className="tile-main">
        <h3 style={{margin:'0 0 6px'}}>{item.title}</h3>
        <div className="flex" style={{gap:8, flexWrap:'wrap'}}>
          <span className="badge">{item.difficulty}</span>
          <span className="badge">{`+${pts} pts`}</span>
          {item.done
            ? <span className="badge" style={{background:'#12381e', borderColor:'#1f6a39', color:'#9ae6b4'}}>ผ่านแล้ว ✓</span>
            : <span className="badge" style={{background:'#2b2133', borderColor:'#5b3a77', color:'#d9c8ff'}}>ยังไม่ผ่าน</span>}
        </div>
      </div>
      <div className="tile-arrow">
        <Link className="btn" to={`/challenges/${item.challenge_id}`}>เริ่มทำ</Link>
      </div>
    </div>
  )
}

function diffWeight(d){ return d==='easy'?1 : d==='medium'?2 : d==='hard'?3 : 99 }
function diffLabel(d){ if(d==='easy')return{emoji:'🌱'}; if(d==='medium')return{emoji:'🛠️'}; if(d==='hard')return{emoji:'🔥'}; return{emoji:'❔'} }
function rowTitle(d){ return d==='easy'?'Easy': d==='medium'?'Medium': d==='hard'?'Hard':'All' }
