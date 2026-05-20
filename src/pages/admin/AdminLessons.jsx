// AdminLessons.jsx (เฉพาะส่วนเปลี่ยน)
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import AdminLessonEditor from './AdminLessonEditor.jsx'

export default function AdminLessons(){
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState(null) // เก็บบทเรียนที่กำลังแก้ไข

  const load = async()=>{ try{ setList(await api('/lessons/admin/all')) }catch(e){ setErr(e.message) } }
  useEffect(()=>{ load() },[])

  const openCreate = ()=>{ setEditing(null); setShowEditor(true) }
  const openEdit = async (slug)=>{
  try{
    const lesson = await api(`/lessons/admin/by-slug/${slug}`)
    setEditing(lesson)
    setShowEditor(true)
  }catch(e){ setErr(e.message) }

}
  const del = async (id, title)=>{
   if (!confirm(`ลบบทเรียน "${title}" ?`)) return
   try{
     await api(`/lessons/${id}`, { method:'DELETE' })
     await load()
   }catch(e){ setErr(e.message) }
  }
  
  const onSaved = ()=> load()
  const onClose = ()=> setShowEditor(false)

  return (
    <div className="grid">
      <h2>Lessons (Admin)</h2>
      {err && <div className="warning">{err}</div>}

      <div className="card">
        <button className="btn primary" onClick={openCreate}>+ สร้างบทเรียนใหม่</button>
      </div>

      {showEditor && (
        <div className="card">
          <AdminLessonEditor initial={editing} onSaved={onSaved} onClose={onClose} />
        </div>
      )}
      
      <div className="card">
        <h3>รายการทั้งหมด</h3>
        <table className="table">
          <thead>
            <tr><th>#</th><th>ชื่อ</th><th>slug</th><th>หมวด</th><th>สถานะ</th><th></th></tr>
          </thead>
          <tbody>
            {list.map(it=>(
              <tr key={it.id}>
                <td>{it.order_index}</td>
                <td>{it.title}</td>
                <td>{it.slug}</td>
                <td>{it.category}</td>
                <td>{it.is_published ? 'published' : 'unpublished'}</td>
                <td className="flex gap-2">
                  <button className="btn" onClick={()=>openEdit(it.slug)}>Edit</button>
                  <button className="btn danger" onClick={()=>del(it.id, it.title)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
