import { useState  } from "react";
import { api } from "../utils/api.js";
import { useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx"; // ⬅️

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; 
// อย่างน้อย 8 ตัว, มี A-Z, a-z, ตัวเลข, อักขระพิเศษ }

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

export default function ResetConfirm() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const user_id = localStorage.getItem("last_reset_user_id") || "";

  const checks = {
    len: password.length >= 8,
    up: /[A-Z]/.test(password),
    low: /[a-z]/.test(password),
    num: /\d/.test(password),
    sp: /[@$!%*?&]/.test(password),
    match: confirm.length > 0 && password === confirm,
  };

  const codeOk = /^\d{6}$/.test(code.trim());
  const pwOk = passwordRegex.test(password);
  const canSubmit = codeOk && pwOk && checks.match && !loading;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!user_id) return setErr("ไม่พบ user_id โปรดลองใหม่จากหน้าขอรหัส");
    if (!canSubmit) return;

    try {
      setLoading(true);
      await api("/auth/reset/confirm", {
        method: "POST",
        body: { user_id, code: code.trim(), new_password: password },
        noAuth: true,
      });
      setMsg("ตั้งรหัสผ่านใหม่สำเร็จ! คุณสามารถเข้าสู่ระบบด้วยรหัสใหม่ได้แล้ว");
      setPassword(""); setConfirm(""); setCode("");
      nav("/login");
    } catch (e) {
      setErr(e.message || "ตั้งรหัสผ่านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2>ยืนยันรีเซ็ตรหัสผ่าน</h2>
      {msg && <div className="success">{msg}</div>}
      {err && <div className="warning">{err}</div>}

      <form onSubmit={onSubmit} className="grid" style={{ gap: 12, marginTop: 8 }}>
        <div>
          <label className="muted">รหัสที่ได้รับทางอีเมล (6 หลัก)</label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]{6}"
            placeholder="123456"
            required
          />
        </div>

        <div>
          <label className="muted">รหัสผ่านใหม่</label>
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="อย่างน้อย 8 ตัว (A–Z, a–z, 0–9, อักขระพิเศษ)"
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

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn primary" disabled={!canSubmit}>
            {loading ? "กำลังตั้งรหัส…" : "ตั้งรหัสใหม่"}
          </button>
        </div>
      </form>
    </div>
  );
}
