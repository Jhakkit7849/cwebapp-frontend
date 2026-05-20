import { useState } from 'react'
import { api } from '../utils/api.js'
import { useNavigate } from 'react-router-dom'

export default function ResetRequest(){
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')

  const onSubmit = async (e)=>{
    e.preventDefault()
    try{
      const res = await api('/auth/reset/request', { method:'POST', body:{ email }, noAuth:true })
      localStorage.setItem('last_reset_user_id', res.user_id || '')
      setMsg('ส่งรหัสรีเซ็ตไปยังอีเมลแล้ว')
      nav('/reset/confirm')
    }catch(e){ setErr(e.message) }
  }
  return (
    <div className="card" style={{maxWidth:480, margin:'0 auto'}}>
      <h2>ขอรหัสรีเซ็ตรหัสผ่าน</h2>
      {msg && <div className="success">{msg}</div>}
      {err && <div className="warning">{err}</div>}
      <form onSubmit={onSubmit} className="grid">
        <label>Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="btn primary">ส่งรหัสรีเซ็ต</button>
      </form>
    </div>
  )
}
