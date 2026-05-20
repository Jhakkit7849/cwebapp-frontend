import { useEffect, useState } from 'react'
import { api } from '../utils/api.js'
import useAuth from '../state/AuthContext.jsx'

/* ========== Password rule regex ========== */
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/* ✅ Pill แบบเรียบง่าย */
function Pill({ ok, text }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${ ok ? "rgba(34,197,94,.6)" : "rgba(255,255,255,.18)" }`,
        background: ok ? "rgba(34,197,94,.08)" : "transparent",
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
      title={text}
    >
      <span
        style={{
          width: 8, height: 8, borderRadius: 999,
          background: ok ? "#22c55e" : "transparent",
          border: `1px solid ${ok ? "#22c55e" : "rgba(255,255,255,.35)"}`,
        }}
      />
      {text}
    </span>
  );
}

/* ---------- ช่องรหัสผ่านพร้อมปุ่มแสดง/ซ่อน (ใช้ .pw-field / .icon-btn) ---------- */
function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete = 'new-password',
  disabled = false,
  name,
  id,
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw-field">
      <input
        id={id}
        name={name}
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <button
        type="button"
        className="icon-btn"
        aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        title={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

export default function Profile(){
  const { user, setUser } = useAuth()
  const [me, setMe] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pwsaving, setPwSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  // เปลี่ยนรหัสผ่าน
  const [pw, setPw] = useState({ current_password:'', new_password:'', confirm:'' })

  useEffect(()=>{ (async()=>{
    try{
      setErr('')
      const data = await api('/me') // ถ้า util ไม่เติม /api ให้เปลี่ยนเป็น /api/me
      setMe(data)
    }catch(e){ setErr(e.message) }
  })() },[])

  const onSave = async ()=>{
    try{
      setSaving(true); setErr(''); setOk('')
      const body = { first_name: me.first_name ?? '', last_name: me.last_name ?? '' }
      const updated = await api('/me', { method:'PUT', body })
      setMe(updated)
      setUser(prev => prev ? { ...prev, first_name: updated.first_name, last_name: updated.last_name } : prev)
      setOk('บันทึกโปรไฟล์แล้ว')
    }catch(e){ setErr(e.message) } finally{ setSaving(false) }
  }

  // ====== Password rules state ======
  const pass = pw.new_password || ''
  const rules = {
    len: pass.length >= 8,
    lower: /[a-z]/.test(pass),
    upper: /[A-Z]/.test(pass),
    digit: /\d/.test(pass),
    special: /[@$!%*?&]/.test(pass),
  }
  const allRulesOk = Object.values(rules).every(Boolean)
  const matchOk = pw.new_password.length > 0 && pw.new_password === pw.confirm
  const canSubmitPw = allRulesOk && matchOk && !pwsaving && !!pw.current_password

  const onChangePw = async ()=>{
    if (!pw.current_password) { setErr('กรุณากรอกรหัสผ่านปัจจุบัน'); return }
    if (!passwordRegex.test(pw.new_password)) {
      setErr('รูปแบบรหัสผ่านใหม่ไม่ปลอดภัย: ต้องมี ตัวพิมพ์เล็ก/ใหญ่ ตัวเลข อักขระพิเศษ และยาว ≥ 8')
      return
    }
    if (pw.new_password !== pw.confirm) { setErr('รหัสผ่านใหม่และยืนยันไม่ตรงกัน'); return }
    try{
      setPwSaving(true); setErr(''); setOk('')
      await api('/me/password', { method:'PUT', body:{ current_password:pw.current_password, new_password:pw.new_password } })
      setOk('เปลี่ยนรหัสผ่านสำเร็จ')
      setPw({ current_password:'', new_password:'', confirm:'' })
    }catch(e){ setErr(e.message) } finally { setPwSaving(false) }
  }

  // ===== Cloudinary Upload =====
  const pickFile = (e)=> uploadAvatar(e.target.files?.[0])
  const uploadAvatar = async (file)=>{
    if (!file) return
    if (!/^image\//.test(file.type)) { setErr('กรุณาเลือกรูปภาพ'); return }
    if (file.size > 2_000_000) { setErr('ไฟล์ใหญ่เกิน 2MB'); return }
    try{
      setUploading(true); setErr(''); setOk('')
      const sign = await api('/me/avatar/sign')
      const form = new FormData()
      form.append('file', file)
      form.append('api_key', sign.api_key)
      form.append('timestamp', sign.timestamp)
      form.append('signature', sign.signature)
      form.append('folder', sign.folder)
      const url = `https://api.cloudinary.com/v1_1/${sign.cloud_name}/image/upload`
      const resp = await fetch(url, { method:'POST', body: form })
      const data = await resp.json()
      if (!data.secure_url || !data.public_id) throw new Error(data.error?.message || 'Upload failed')
      const saved = await api('/me/avatar', { method:'PUT', body:{ secure_url: data.secure_url, public_id: data.public_id } })
      setMe(m => ({ ...m, profile_image: saved.profile_image }))
      setUser(prev => prev ? { ...prev, profile_image: saved.profile_image } : prev)
      setOk('อัปเดตรูปโปรไฟล์เรียบร้อย')
    }catch(e){ setErr(e.message) }finally{ setUploading(false) }
  }

  if (!user) return <div className="warning">ต้องเข้าสู่ระบบก่อน</div>
  if (!me) return <div className="muted">กำลังโหลด...</div>

  const avatarUrl = me.profile_image
    ? me.profile_image.replace('/upload/', '/upload/c_fill,w_200,h_200,q_auto,f_auto,g_face,r_max/')
    : ''

  return (
    <div className="grid">
      <h2>โปรไฟล์ของฉัน</h2>
      {(err || ok) && <div className={err ? 'warning' : 'success'}>{err || ok}</div>}

      {/* รูปโปรไฟล์ + อัปโหลด */}
      <div className="card">
        <h3>รูปโปรไฟล์</h3>
        <div className="flex items-center gap-3">
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" style={{height:80, width:80, borderRadius:'50%'}}/>
            : <div className="muted" style={{height:80, width:80, borderRadius:'50%', background:'#eee', display:'inline-block'}} />
          }
          <label className="btn">
            {uploading ? 'กำลังอัปโหลด…' : 'เลือกรูป…'}
            <input type="file" accept="image/*" style={{display:'none'}} onChange={pickFile} disabled={uploading}/>
          </label>
        </div>
        <div className="muted mt-1">ขนาดแนะนำ ≤ 2MB</div>
      </div>

      {/* ✅ การ์ดคะแนนรวม + อันดับ */}
      <div className="card">
        <h3>คะแนนรวม</h3>
        <div className="flex items-center gap-3" style={{alignItems:'baseline'}}>
          <div>
            <div style={{fontSize:28, fontWeight:700}}>{me.score ?? 0}</div>
            <div className="muted" style={{fontSize:12}}>
              อัพเดตล่าสุด: {me.score_updated_at ? new Date(me.score_updated_at).toLocaleString() : '—'}
            </div>
          </div>
          <div className="muted">•</div>
          <div>
            <span className="badge">อันดับ</span>
            <span style={{marginLeft:8, fontWeight:600}}>
              {me.rank ?? '—'}
            </span>
            <a href="/rankings" className="link" style={{marginLeft:12}}>ดูตารางอันดับ</a>
          </div>
        </div>
      </div>

      {/* ข้อมูลผู้ใช้ */}
      <div className="card">
        <h3>ข้อมูลผู้ใช้</h3>
        <div className="grid cols-2">
          <div>
            <label>Email</label>
            <input className="input" value={me.email} disabled />
          </div>
          <div>
            <label>สถานะอีเมล</label>
            <input className="input" value={me.is_verified ? 'Verified' : 'Unverified'} disabled />
          </div>
          <div>
            <label>ชื่อจริง</label>
            <input className="input" value={me.first_name || ''} onChange={e=>setMe({...me, first_name: e.target.value})}/>
          </div>
          <div>
            <label>นามสกุล</label>
            <input className="input" value={me.last_name || ''} onChange={e=>setMe({...me, last_name: e.target.value})}/>
          </div>
        </div>
        <button className="btn primary mt-2" onClick={onSave} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="card">
        <h3>เปลี่ยนรหัสผ่าน</h3>

        <div className="grid cols-3">
          <PasswordField
            placeholder="รหัสผ่านปัจจุบัน"
            value={pw.current_password}
            onChange={e=>setPw({...pw, current_password: e.target.value})}
            autoComplete="current-password"
            disabled={pwsaving}
          />
        </div>
        <div className="grid cols-3 mt-2">
          <PasswordField
            placeholder="รหัสผ่านใหม่ (≥ 8 ตัว)"
            value={pw.new_password}
            onChange={e=>setPw({...pw, new_password: e.target.value})}
            autoComplete="new-password"
            disabled={pwsaving}
          />
          <PasswordField
            placeholder="ยืนยันรหัสผ่านใหม่"
            value={pw.confirm}
            onChange={e=>setPw({...pw, confirm: e.target.value})}
            autoComplete="new-password"
            disabled={pwsaving}
          />
        </div>
        

        {/* ✅ แสดงสถานะกฎรหัสผ่านแบบเรียลไทม์ */}
        <div className="flex wrap gap-2 mt-2">
          <Pill ok={rules.len} text="≥ 8 ตัว" />
          <Pill ok={rules.lower} text="a-z" />
          <Pill ok={rules.upper} text="A-Z" />
          <Pill ok={rules.digit} text="0-9" />
          <Pill ok={rules.special} text="@ $ ! % * ? &" />
          <Pill ok={matchOk} text="รหัสผ่านตรงกัน" />
        </div>

        <button className="btn mt-2" onClick={onChangePw} disabled={!canSubmitPw}>
          {pwsaving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
        </button>
      </div>
    </div>
  )
}
