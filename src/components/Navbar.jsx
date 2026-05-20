import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../state/AuthContext.jsx";
import { api } from "../utils/api.js";

const VIEW_KEY = "view_as_user";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";
  // โหมดดูเว็บแบบผู้ใช้ (เฉพาะกรณีเป็นแอดมิน)
  const viewAsUser = isAdmin && localStorage.getItem(VIEW_KEY) === "true";

  const showUserMenus = !isAdmin || viewAsUser; // user ปกติ หรือ admin ที่สลับมา view as user
  const showAdminMenus = isAdmin && !viewAsUser; // admin ปกติ (ยังไม่สลับ)

  const handleViewSite = (e) => {
    e.preventDefault();
    localStorage.setItem(VIEW_KEY, "true");
    // ไปหน้าเดิมแต่ให้เรนเดอร์เป็นโหมด user (หรือจะไป "/" ก็ได้)
    nav("/", { replace: true });
  };

  const handleBackToAdmin = (e) => {
    e.preventDefault();
    localStorage.removeItem(VIEW_KEY);
    nav("/admin", { replace: true });
  };

  const doLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST", noAuth: true });
    } catch {}
    localStorage.removeItem(VIEW_KEY);
    logout();
    nav("/login");
  };

  return (
    <div className="navbar">
      <div className="wrap">
        {(!isAdmin || viewAsUser) && (
          <Link className="brand" to="/">
            C WebApp
          </Link>
        )}

        {/* เมนูฝั่งผู้ใช้ทั่วไป */}
        {showUserMenus && (
          <>
            <Link to="/lessons">Lessons</Link>
            {/* <Link to="/quizzes">Quizzes</Link> */}
            <Link to="/challenges">Challenges</Link>
            <Link to="/community">Community</Link>
            <Link to="/rankings" className="nav-item">
              Ranking
            </Link>
            {isLoggedIn && (
              <Link to="/sandbox" className="nav-item">
                Compiler
              </Link>
            )}
            {isLoggedIn && (
              <Link to="/profile" className="link">
                Profile
              </Link>
            )}
          </>
        )}

        {/* เมนูฝั่งแอดมิน (ปกติจะโชว์เฉพาะตอนยังไม่กด View Site) */}
        {showAdminMenus && (
          <>
            <Link to="/admin" style={{ marginLeft: 12 }}>
              Admin
            </Link>
            <Link to={"/admin/audit-logs"}>Logs</Link>
          </>
        )}

        <div className="grow" />

        {/* สวิทช์โหมดสำหรับแอดมิน */}

        {/* ปุ่มล็อกอิน/สมัคร หรือ Logout */}
        {!isLoggedIn ? (
          <>
            <Link to="/login">เข้าสู่ระบบ</Link>
            <Link to="/register" style={{ marginLeft: 8 }}>
              สมัครสมาชิก
            </Link>
          </>
        ) : (
          <>
            <span className="badge">Hi, {user.first_name}</span>
            <button
              className="btn"
              style={{ marginLeft: 12 }}
              onClick={doLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
