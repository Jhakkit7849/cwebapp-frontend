import { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api.js';

function StatusBadge({ user }) {
  const now = new Date();
  const suspended = user.suspended_until && new Date(user.suspended_until) > now;
  if (user.status === 'locked') return <span className="badge danger">locked</span>;
  if (suspended) return <span className="badge">suspended</span>;
  return <span className="badge">active</span>;
}

export default function AdminUsers(){
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');
  const [showSuspend, setShowSuspend] = useState(false);
  const [target, setTarget] = useState(null); // user to suspend
  const [form, setForm] = useState({ until:'', reason:'' });
  const [hideAdmins, setHideAdmins] = useState(true); // ✅ ซ่อน admin (ค่าเริ่มต้น)

  const load = async ()=>{
    try {
      setErr('');
      const qs = new URLSearchParams();
      if (q.trim()) qs.set('q', q.trim());
      if (status) qs.set('status', status);
      const rows = await api('/admin/users?' + qs.toString());
      setList(rows || []);
    } catch(e){ setErr(e.message) }
  };
  useEffect(()=>{ load(); },[]);

  const openSuspend = (u)=>{
    setTarget(u);
    setForm({ until:'', reason:'' });
    setShowSuspend(true);
  };

  const doLockToggle = async (u)=>{
    try {
      await api(`/admin/users/${u.id}/lock`, { method:'PUT', body:{ lock: u.status !== 'locked' }});
      await load();
    } catch(e){ setErr(e.message) }
  };

  const doSuspend = async ()=>{
    if (!target) return;
    if (!form.until) { setErr('กรุณากำหนดวันหมดอายุ'); return; }
    try {
      await api(`/admin/users/${target.id}/suspend`, { method:'POST', body:{ until: form.until, reason: form.reason }});
      setShowSuspend(false);
      await load();
    } catch(e){ setErr(e.message) }
  };

  const doUnsuspend = async (u)=>{
    try {
      await api(`/admin/users/${u.id}/unsuspend`, { method:'POST' });
      await load();
    } catch(e){ setErr(e.message) }
  };

  // ✅ กรอง: ซ่อนผู้ใช้ที่ role = admin เมื่อ hideAdmins = true
  const filtered = useMemo(()=>{
    const rows = Array.isArray(list) ? list : [];
    return rows.filter(u => !(hideAdmins && String(u.role) === 'admin'));
  }, [list, hideAdmins]);

  return (
    <div className="grid">
      <h2>Manage Users</h2>
      {err && <div className="warning">{err}</div>}

      <div className="card">
        <div className="grid cols-4">
          <input className="input" placeholder="ค้นหา ชื่อ/อีเมล" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">— ทุกสถานะ —</option>
            <option value="active">active</option>
            <option value="locked">locked</option>
          </select>
          <button className="btn" onClick={load}>ค้นหา</button>
          <button className="btn" onClick={()=>{ setQ(''); setStatus(''); load(); }}>ล้าง</button>
        </div>


      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>ผู้ใช้</th><th>อีเมล</th><th>บทบาท</th><th>สถานะ</th><th>ระงับจนถึง</th><th>เหตุผล</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="muted">ไม่มีข้อมูล</td></tr>}
            {filtered.map((u,i)=>{
              const isAdminUser = String(u.role) === 'admin';
              return (
                <tr key={u.id}>
                  <td>{i+1}</td>
                  <td>{[u.first_name,u.last_name].filter(Boolean).join(' ') || `User#${u.id}`}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge" title={u.role}>
                      {u.role || '—'}
                    </span>
                  </td>
                  <td><StatusBadge user={u} /></td>
                  <td>{u.suspended_until ? new Date(u.suspended_until).toLocaleString() : '—'}</td>
                  <td>{u.suspension_reason || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      {/* ❌ ปิดให้กดกับ admin (กันพลาดล็อก/ระงับแอดมิน) */}
                      <button className="btn" disabled={isAdminUser} title={isAdminUser ? 'ไม่อนุญาตให้จัดการ admin' : ''} onClick={()=>doLockToggle(u)}>
                        {u.status === 'locked' ? 'Unlock' : 'Lock'}
                      </button>
                      <button className="btn" disabled={isAdminUser} title={isAdminUser ? 'ไม่อนุญาตให้จัดการ admin' : ''} onClick={()=>openSuspend(u)}>ระงับ</button>
                      {(u.suspended_until) && (
                        <button className="btn" disabled={isAdminUser} title={isAdminUser ? 'ไม่อนุญาตให้จัดการ admin' : ''} onClick={()=>doUnsuspend(u)}>ยกเลิก</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Suspend */}
      {showSuspend && (
        <div className="card" style={{maxWidth:520}}>
          <h3>ระงับบัญชี: {target ? (target.email) : ''}</h3>
          <div className="grid">
            <label className="muted">วันหมดอายุ (ISO / ใช้ input type="datetime-local")</label>
            <input
              className="input"
              type="datetime-local"
              value={form.until}
              onChange={e=>setForm({...form, until: e.target.value})}
            />
            <label className="muted">เหตุผล</label>
            <textarea
              className="input"
              placeholder="เหตุผลการระงับ (จะแสดงตอนผู้ใช้พยายามเข้าระบบ)"
              value={form.reason}
              onChange={e=>setForm({...form, reason: e.target.value})}
              rows={3}
            />
            <div className="flex gap-2">
              <button className="btn" onClick={()=>setShowSuspend(false)}>ยกเลิก</button>
              <button className="btn primary" onClick={doSuspend}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
