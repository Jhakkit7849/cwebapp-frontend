import { useState } from "react";
import useAuth from "../state/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx"; // ⬅️ เพิ่มบรรทัดนี้

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.role === "admin") nav("/admin");
      else nav("/");
    } catch (e) {
      const status = e?.status ?? e?.code;
      const data   = e?.data ?? e;
      const msg    = (e?.message || data?.message || "").toString();
      const code   = data?.code || "";

      if (code === "ACCOUNT_LOCKED") { setErr("บัญชีถูกล็อก กรุณาติดต่อผู้ดูแลระบบ"); return; }
      if (code === "ACCOUNT_SUSPENDED") {
        const until = data?.suspended_until ? new Date(data.suspended_until).toLocaleString() : "";
        setErr(`บัญชีถูกระงับชั่วคราว${until ? " ถึง " + until : ""}`); return;
      }

      const notVerified =
        status === 403 ||
        /not\s*verified/i.test(msg) ||
        data?.reason === "NOT_VERIFIED";

      if (notVerified) {
        const uid = data?.user_id || e?.user_id;
        if (uid) localStorage.setItem("last_reset_user_id", String(uid));
        nav("/verify-otp", { replace: true });
        return;
      }

      setErr(msg || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <h2>เข้าสู่ระบบ</h2>
      {err && <div className="warning">{err}</div>}
      <form onSubmit={onSubmit} className="grid">
        <div>
          <label>Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label>Password</label>
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="รหัสผ่าน"
          />
        </div>

        <button className="btn primary">เข้าสู่ระบบ</button>
      </form>
      <div className="mt-1">
        <Link to="/reset" className="link">ลืมรหัสผ่าน?</Link>
      </div>
    </div>
  );
}
