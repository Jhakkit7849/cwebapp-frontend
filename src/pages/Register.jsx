import { useState } from "react";
import { api } from "../utils/api.js";
import { useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx"; // ⬅️

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function Pill({ ok, text }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 999,
        border: `1px solid ${ ok ? "rgba(34,197,94,.6)" : "var(--border-soft)" }`,
        background: ok ? "rgba(34,197,94,.08)" : "transparent",
        fontSize: 12, whiteSpace: "nowrap",
      }}
      title={text}
    >
      <span
        style={{
          width: 8, height: 8, borderRadius: 999,
          background: ok ? "#22c55e" : "transparent",
          border: `1px solid ${ok ? "#22c55e" : "var(--border-soft)"}`,
        }}
      />
      {text}
    </span>
  );
}

export default function Register() {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = {
    len: password.length >= 8,
    up: /[A-Z]/.test(password),
    low: /[a-z]/.test(password),
    num: /\d/.test(password),
    sp: /[@$!%*?&]/.test(password),
    match: password.length > 0 && password === confirm,
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwOk = passwordRegex.test(password);
  const allValid = firstName.trim() && lastName.trim() && emailOk && pwOk && checks.match;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!allValid || loading) return;
    setErr(""); setMsg("");
    try {
      setLoading(true);
      const body = {
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };
      const res = await api("/auth/register", {
        method: "POST",
        body, noAuth: true,
      });
      if (res?.user_id) localStorage.setItem("last_reset_user_id", res.user_id);
      setMsg("สมัครสำเร็จ! โปรดตรวจอีเมลเพื่อดูรหัส OTP");
      nav("/verify-otp");
    } catch (e) {
      setErr(e.message || "สมัครไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>สมัครสมาชิก</h2>
      <p className="muted" style={{ marginTop: -8 }}>สร้างบัญชีเพื่อเริ่มเรียน C และทำแบบทดสอบ</p>

      {(msg || err) && (
        <div style={{ marginTop: 12 }}>
          {msg && <div className="success">{msg}</div>}
          {err && <div className="warning">{err}</div>}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid" style={{ gap: 12, marginTop: 12 }} autoComplete="on">
        <div className="grid cols-2" style={{ gap: 12 }}>
          <div>
            <label className="muted">ชื่อ</label>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              required autoComplete="given-name" placeholder="ชื่อจริง" />
          </div>
          <div>
            <label className="muted">นามสกุล</label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)}
              required autoComplete="family-name" placeholder="นามสกุล" />
          </div>
        </div>

        <div>
          <label className="muted">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email" placeholder="you@example.com" />
        </div>

        <div>
          <label className="muted">Password</label>
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="อย่างน้อย 8 ตัวอักษร (A–Z, a–z, 0–9, อักขระพิเศษ)"
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            <Pill ok={checks.len}  text="≥ 8 ตัว" />
            <Pill ok={checks.up}   text="มี A–Z" />
            <Pill ok={checks.low}  text="มี a–z" />
            <Pill ok={checks.num}  text="มีตัวเลข" />
            <Pill ok={checks.sp}   text="มีอักขระพิเศษ" />
            <Pill ok={checks.match} text="ยืนยันรหัสผ่านตรงกัน" />
          </div>
        </div>

        <div>
          <label className="muted">ยืนยัน Password</label>
          <PasswordField
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="พิมพ์รหัสผ่านเดิมอีกครั้ง"
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn primary" disabled={!allValid || loading}>
            {loading ? "กำลังสมัคร…" : "สมัครสมาชิก"}
          </button>
        </div>
      </form>
    </div>
  );
}
