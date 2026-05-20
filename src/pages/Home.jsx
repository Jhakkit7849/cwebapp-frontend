// Home.jsx
import { Link } from 'react-router-dom'
import useAuth from '../state/AuthContext.jsx'

export default function Home(){
  const { user } = useAuth()        // ⬅️ เช็คสถานะล็อกอิน

  return (
    <div className="grid">
      <div className="card">
        <h2>เริ่มต้นเรียนภาษา C</h2>
        <p>ศึกษาเนื้อหาพื้นฐาน → ทำ Quiz → ทำ Challenge เพื่อเก็บคะแนน Ranking</p>
        <div className="mt-2"><Link className="btn primary" to="/lessons">ไปที่บทเรียน</Link></div>
      </div>

      {!user && (                        /* ⬅️ แสดงเฉพาะ guest */
        <div className="card">
          <h3>ก่อนเริ่มใช้งาน</h3>
          <p>หากยังไม่มีบัญชีให้ <Link to="/register" className="link">สมัครสมาชิก</Link> แล้วตรวจอีเมลเพื่อกรอก OTP</p>
          <p>มีบัญชีแล้ว? <Link to="/login" className="link">เข้าสู่ระบบ</Link></p>
        </div>
      )}
    </div>
  )
}