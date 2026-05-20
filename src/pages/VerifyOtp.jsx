import { useEffect, useState } from 'react'
import { api } from '../utils/api.js'
import { useNavigate } from 'react-router-dom'
const COOLDOWN_SEC = 30
const COOLDOWN_KEY = 'otp_resend_cooldown_at' // timestamp (ms)

export default function VerifyOtp(){
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [loadingVerify, setLoadingVerify] = useState(false)
  const [loadingResend, setLoadingResend] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const user_id = localStorage.getItem('last_reset_user_id') || ''

  // โหลดอีเมล (mask) ของ user ที่จะยืนยัน
  useEffect(()=>{
    (async ()=>{
      if (!user_id) return
      try{
        const info = await api(`/auth/lookup-email?user_id=${encodeURIComponent(user_id)}`, { noAuth:true })
        setMaskedEmail(info.masked || info.email || '')
      }catch{/* เงียบได้ ไม่ critical */}
    })()
  },[user_id])

  // นับถอยหลังคูลดาวน์จาก localStorage
  useEffect(()=>{
    const tick = () => {
      const startedAt = Number(localStorage.getItem(COOLDOWN_KEY) || 0)
      if (!startedAt) return setCooldown(0)
      const passed = Math.floor((Date.now() - startedAt)/1000)
      const remain = Math.max(0, COOLDOWN_SEC - passed)
      setCooldown(remain)
      if (remain === 0) localStorage.removeItem(COOLDOWN_KEY)
    }
    tick()
    const id = setInterval(tick, 500)
    return ()=>clearInterval(id)
  },[])

  const onSubmit = async (e)=>{
    e.preventDefault()
    setErr(''); setMsg('')
    if (!user_id) return setErr('ไม่พบ user_id โปรดลองสมัครใหม่')
    if (!/^\d{6}$/.test(code.trim())) return setErr('กรุณากรอก OTP 6 หลัก')

    try{
      setLoadingVerify(true)
      await api('/auth/verify-otp', { method:'POST', body:{ user_id, code: code.trim() }, noAuth:true })
      setMsg('ยืนยันอีเมลสำเร็จ! สามารถเข้าสู่ระบบได้แล้ว')
      // ล้างคูลดาวน์/โค้ดเมื่อสำเร็จ
      localStorage.removeItem(COOLDOWN_KEY)
      setCode('')
      nav('/login')
    }catch(e){
      setErr(e.message || 'ยืนยันไม่สำเร็จ')
    }finally{
      setLoadingVerify(false)
    }
  }

  const resend = async ()=>{
    setErr(''); setMsg('')
    if (!user_id) return setErr('ไม่พบ user_id โปรดลองสมัครใหม่')
    if (cooldown > 0) return

    try{
      setLoadingResend(true)
      await api('/auth/otp/resend', { method:'POST', body:{ user_id, purpose:'register' }, noAuth:true })
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
      setCooldown(COOLDOWN_SEC)
      setMsg('ส่งรหัสใหม่ทางอีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย/สแปม')
    }catch(e){
      setErr(e.message || 'ไม่สามารถส่งรหัสใหม่ได้')
    }finally{
      setLoadingResend(false)
    }
  }

  return (
    <div className="card" style={{maxWidth:420, margin:'0 auto'}}>
      <h2>ยืนยัน OTP</h2>
      <small className="muted">
        กรอกรหัส 6 หลักที่ส่งไปที่ {maskedEmail || '(อีเมลไม่ทราบ)'}
      </small>

      {msg && <div className="success" style={{marginTop:8}}>{msg}</div>}
      {err && <div className="warning" style={{marginTop:8}}>{err}</div>}

      <form onSubmit={onSubmit} className="grid" style={{marginTop:12}}>
        <input
          className="input"
          placeholder="123456"
          value={code}
          onChange={e=>setCode(e.target.value.replace(/\D/g,''))}
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]{6}"
          required
        />
        <button className="btn primary" disabled={loadingVerify}>
          {loadingVerify ? 'กำลังยืนยัน...' : 'ยืนยัน'}
        </button>
      </form>

      <div className="mt-1" style={{display:'flex', gap:12, alignItems:'center'}}>
        <button
          className="btn"
          onClick={resend}
          disabled={cooldown > 0 || loadingResend}
          title={cooldown > 0 ? `รอได้อีก ${cooldown}s` : 'ขอรหัสใหม่'}
        >
          {loadingResend ? 'กำลังส่ง...' : (cooldown > 0 ? `ขอรหัสใหม่ (${cooldown}s)` : 'ขอรหัสใหม่')}
        </button>
        <small className="muted">รอคูลดาวน์ 30 วินาทีก่อนขอรหัสใหม่</small>
      </div>
    </div>
  )
}
