import { useEffect, useState } from 'react'
import { api } from '../utils/api.js'
import { Link } from 'react-router-dom'

export default function Quizzes(){
  const [list, setList] = useState([]); const [err, setErr] = useState('')
  useEffect(()=>{ (async()=>{
    try{ setList(await api('/quizzes')) } catch(e){ setErr(e.message) }
  })() },[])
  return (
    <div className="grid">
      <h2>แบบทดสอบ (Quizzes)</h2>
      {err && <div className="warning">{err}</div>}
      <ul>
        {list.map(it=>(
          <li key={it.id}><Link className="link" to={`/quizzes/${it.id}`}>{it.title}</Link></li>
        ))}
      </ul>
    </div>
  )
}
