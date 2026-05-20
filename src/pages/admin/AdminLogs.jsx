import { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api.js";
import { Link } from "react-router-dom";

function Field({ label, children }) {
  return (
    <div>
      {label && <label className="muted">{label}</label>}
      {children}
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="badge" style={{ whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function JsonInline({ value }) {
  const [open, setOpen] = useState(false);
  const text =
    !value || (typeof value === "object" && Object.keys(value).length === 0)
      ? "—"
      : JSON.stringify(value).slice(0, 60) + (JSON.stringify(value).length > 60 ? "…" : "");
  return (
    <div>
      <code className="kbd" title="คลิกเพื่อดูเต็ม" onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {text}
      </code>
      {open && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <strong>Meta</strong>
            <button className="btn" onClick={() => setOpen(false)}>ปิด</button>
          </div>
          <pre className="BoxCode" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AdminAuditLogs() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState("");     // YYYY-MM-DD

  // paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const canPrev = page > 1;
  const canNext = useMemo(() => {
    if (total == null) return rows.length === limit; // ถ้า backend ไม่ส่ง total ให้เดาตามจำนวนรายการ
    return page * limit < total;
  }, [page, limit, total, rows]);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q.trim()) qs.set("q", q.trim());
      if (action.trim()) qs.set("action", action.trim());
      if (entity.trim()) qs.set("entity", entity.trim());
      if (actorEmail.trim()) qs.set("actor_email", actorEmail.trim());
      if (targetEmail.trim()) qs.set("target_email", targetEmail.trim());
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);

      // ปรับ path ให้ตรงกับ backend ของคุณ
      // แนะนำ: GET /admin/audit-logs
      const res = await api(`/admin/audit-logs?${qs.toString()}`);
      if (Array.isArray(res)) {
        setRows(res);
        setTotal(null);
      } else {
        setRows(res?.items || []);
        setTotal(typeof res?.total === "number" ? res.total : null);
      }
    } catch (e) {
      setErr(e.message || "โหลด Audit Logs ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, limit]);

  const onSearch = async () => {
    setPage(1);
    await load();
  };

  const onClear = async () => {
    setQ(""); setAction(""); setEntity("");
    setActorEmail(""); setTargetEmail("");
    setDateFrom(""); setDateTo("");
    setPage(1);
    await load();
  };

  return (
    <div className="grid">
      <div className="flex" style={{ alignItems: "baseline", gap: 12 }}>
        <h2>Audit Logs</h2>
        <Pill>{total != null ? `รวม ${total.toLocaleString()} รายการ` : `${rows.length.toLocaleString()} รายการ`}</Pill>
        <div className="right" />
        <Link to="/admin" className="btn">ย้อนกลับ Admin</Link>
      </div>

      {err && <div className="warning">{err}</div>}

      {/* Filters */}
      <div className="card">
        <div className="grid cols-3">
          <Field label="ค้นหา (ค้นทุกช่อง)">
            <input className="input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="เช่น 'login' หรือ user@email.com"/>
          </Field>
          <Field label="Action (เช่น auth.login, lesson.update)">
            <input className="input" value={action} onChange={(e)=>setAction(e.target.value)} placeholder="auth.login / admin.user.lock"/>
          </Field>
          <Field label="Entity (เช่น user, lesson, quiz)">
            <input className="input" value={entity} onChange={(e)=>setEntity(e.target.value)} placeholder="user / lesson / quiz / comment"/>
          </Field>

          <Field label="Actor Email">
            <input className="input" value={actorEmail} onChange={(e)=>setActorEmail(e.target.value)} placeholder="ผู้ที่กระทำ"/>
          </Field>
          <Field label="Target Email">
            <input className="input" value={targetEmail} onChange={(e)=>setTargetEmail(e.target.value)} placeholder="ผู้ที่ถูกกระทำ (ถ้ามี)"/>
          </Field>

          <div className="grid cols-2">
            <Field label="จากวันที่">
              <input className="input" type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
            </Field>
            <Field label="ถึงวันที่">
              <input className="input" type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex" style={{ marginTop: 10 }}>
          <button className="btn" onClick={onSearch} disabled={loading}>ค้นหา</button>
          <button className="btn" onClick={onClear} disabled={loading}>ล้าง</button>
          <div className="right" />
          <label className="muted" style={{ marginRight: 8 }}>แสดงต่อหน้า</label>
          <select className="input" style={{ width: 120 }} value={limit} onChange={(e)=>setLimit(Number(e.target.value)||20)}>
            {[10,20,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>เวลา</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Actor</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={7} className="muted">ไม่พบข้อมูล</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id || i}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                </td>
                <td><code className="kbd">{r.action || "—"}</code></td>
                <td>{r.entity || "—"}</td>
                <td>{r.entity_id ?? "—"}</td>
                <td>
                  <div className="grid" style={{ gap: 2 }}>
                    <div>{r.actor_email || "—"}</div>
                    <small className="muted">
                      {r.actor_role ? `role: ${r.actor_role}` : r.actor_id ? `id: ${r.actor_id}` : " "}
                    </small>
                  </div>
                </td>
                <td>{r.target_user_email || "—"}</td>
                
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex" style={{ marginTop: 12 }}>
          <button className="btn" disabled={!canPrev || loading} onClick={()=>setPage(p=>Math.max(1,p-1))}>ก่อนหน้า</button>
          <div className="right" />
          <span className="muted">หน้า</span>
          <input
            className="input"
            type="number"
            min={1}
            value={page}
            onChange={(e)=>setPage(Math.max(1, Number(e.target.value)||1))}
            style={{ width: 90, margin: "0 8px" }}
          />
          <button className="btn" disabled={!canNext || loading} onClick={()=>setPage(p=>p+1)}>ถัดไป</button>
        </div>
      </div>
    </div>
  );
}
