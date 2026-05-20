import { Link } from "react-router-dom";

export default function AdminHome({ stats }) {
  // ค่าเริ่มต้น ถ้ายังไม่มี data จริงจาก backend
  const s = {
    users: stats?.users ?? 0,
    lessons: stats?.lessons ?? 0,
    quizzes: stats?.quizzes ?? 0,
    challenges: stats?.challenges ?? 0,
    comments: stats?.comments ?? 0,
  };

  return (
    <div className="grid" style={{ gap: 18 }}>
      {/* Header */}
      <div className="page-header card">
        <div>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <p className="subtitle">จัดการคอนเทนต์ ผู้ใช้ และความคืบหน้าทั้งหมดในระบบ</p>
        </div>
      </div>


      {/* Quick sections */}
      <div className="grid auto-fit" style={{ gap: 16 }}>
        <Tile
          title="Lessons"
          desc="เพิ่ม แก้ไข และจัดหมวดหมู่บทเรียน"
          to="/admin/lessons"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          }
        />
        <Tile
          title="Quizzes"
          desc="สร้างข้อสอบ ตรวจคำตอบ และคะแนน"
          to="/admin/quizzes"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M8 9h8M8 13h5M6 3h12a1 1 0 0 1 1 1v16l-4-3-4 3-4-3-4 3V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <Tile
          title="Challenges"
          desc="โจทย์เขียนโค้ด พร้อม test cases"
          to="/admin/challenges"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 8l-4 4 4 4M17 8l4 4-4 4M10 4l4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <Tile
          title="Comments"
          desc="ตรวจคอมเมนต์ไม่เหมาะสม และลบได้"
          to="/admin/comments"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 4V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <Tile
          title="Progress Board"
          desc="ดูบอร์ดความคืบหน้าและอันดับ"
          to="/admin/board"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V10M10 20V4M16 20v-6M22 20v-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          }
        />
        <Tile
          title="Users"
          desc="จัดการสิทธิ์ แบน/ปลดแบนผู้ใช้งาน"
          to="/admin/users"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
      </div>
      
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function Tile({ title, desc, to, icon }) {
  return (
    <Link to={to} className="tile">
      <div className="icon-wrap">{icon}</div>
      <div className="tile-main">
        <h3>{title}</h3>
        <p className="muted" style={{ margin: 0 }}>{desc}</p>
      </div>
      <span className="tile-arrow">→</span>
    </Link>
  );
}
