import { useEffect, useState } from "react";
import { api } from "../../utils/api.js";

export default function AdminBoard() {
  const [tab, setTab] = useState("lesson"); // 'lesson' | 'challenge' | 'overview'
  const [lessons, setLessons] = useState([]);
  const [challs, setChalls] = useState([]);
  const [pickLesson, setPickLesson] = useState("");
  const [pickChall, setPickChall] = useState("");

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [ls, cs] = await Promise.all([
          api("/admin/board/lessons"),
          api("/admin/board/challenges"),
        ]);
        setLessons(ls || []);
        setChalls(cs || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const loadLessonUsers = async (lessonId) => {
    setErr("");
    setRows([]);
    if (!lessonId) return;
    const r = await api(`/admin/board/lesson/${lessonId}/users`);
    setRows(r || []);
  };
  const loadChallUsers = async (cid) => {
    setErr("");
    setRows([]);
    if (!cid) return;
    const r = await api(`/admin/board/challenge/${cid}/users`);
    setRows(r || []);
  };
  const loadOverview = async () => {
    setErr("");
    setRows([]);
    const r = await api(`/admin/board/users/overview`);
    setRows(r || []);
  };

  useEffect(() => {
    if (tab === "lesson" && pickLesson) loadLessonUsers(pickLesson);
    if (tab === "challenge" && pickChall) loadChallUsers(pickChall);
    if (tab === "overview") loadOverview();
  }, [tab, pickLesson, pickChall]);

  return (
    <div className="grid">
      <h2>Admin Progress Board</h2>
      {err && <div className="warning">{err}</div>}

      <div className="flex gap-2">
        <button
          className={`btn ${tab === "lesson" ? "primary" : ""}`}
          onClick={() => setTab("lesson")}
        >
          Lesson → Users
        </button>
        <button
          className={`btn ${tab === "challenge" ? "primary" : ""}`}
          onClick={() => setTab("challenge")}
        >
          Challenge → Users
        </button>
        <button
          className={`btn ${tab === "overview" ? "primary" : ""}`}
          onClick={() => setTab("overview")}
        >
          Users Progress
        </button>
      </div>

      {tab === "lesson" && (
        <div className="card">
          <div className="flex items-center gap-2">
            <label>เลือกบทเรียน</label>
            <select
              className="input"
              value={pickLesson}
              onChange={(e) => setPickLesson(e.target.value)}
            >
              <option value="">— เลือก —</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.category} #{l.order_index} — {l.title}
                </option>
              ))}
            </select>
          </div>
          <table className="table mt-1">
            <thead>
              <tr>
                <th>User</th>
                <th>Passed</th>
                <th>Best</th>
                <th>Attempts</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td>
                    {r.first_name} {r.last_name}{" "}
                    <div className="muted" style={{ fontSize: 12 }}>
                      {r.email}
                    </div>
                  </td>
                  <td>{r.passed ? "✓" : "—"}</td>
                  <td>{r.best_score ?? 0}</td>
                  <td>{r.attempts ?? 0}</td>
                  <td>
                    {r.updated_at
                      ? new Date(r.updated_at).toLocaleString()
                      : ""}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "challenge" && (
        <div className="card">
          <div className="flex items-center gap-2">
            <label>เลือก Challenge</label>
            <select
              className="input"
              value={pickChall}
              onChange={(e) => setPickChall(e.target.value)}
            >
              <option value="">— เลือก —</option>
              {challs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.difficulty})
                </option>
              ))}
            </select>
          </div>

          <table className="table mt-1">
            <thead>
              <tr>
                <th>User</th>
                <th>Result (latest)</th>
                <th>Cases (latest)</th>
                <th>Best</th>
                <th>Points (latest)</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = String(r.latest_result || "").toLowerCase();
                const color =
                  status === "passed"
                    ? "var(--ok)"
                    : status === "failed"
                    ? "var(--danger)"
                    : "var(--warn)";
                return (
                  <tr key={r.user_id}>
                    <td>
                      {r.first_name} {r.last_name}
                      <div className="muted" style={{ fontSize: 12 }}>
                        {r.email}
                      </div>
                    </td>

                    {/* latest result = ทำสีตามสถานะล่าสุด */}
                    <td>
                      <span style={{ color, textTransform: "capitalize" }}>
                        {status || "—"}
                      </span>
                    </td>

                    {/* latest cases */}
                    <td>
                      {r.latest_passed_count}/{r.latest_total_count}
                    </td>

                    {/* best-ever cases */}
                    <td>
                      {r.best_passed_count}/{r.best_total_count}
                    </td>

                    {/* latest points */}
                    <td>{r.latest_points}</td>

                    {/* latest submitted time */}
                    <td>
                      {r.latest_submitted_at
                        ? new Date(r.latest_submitted_at).toLocaleString()
                        : ""}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "overview" && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>ผ่าน/ทั้งหมด</th>
                <th>ลำดับบทสูงสุดที่ผู้ใช้คนนั้นผ่าน</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td>
                    {r.first_name} {r.last_name}{" "}
                    <div className="muted" style={{ fontSize: 12 }}>
                      {r.email}
                    </div>
                  </td>
                  <td>
                    {r.lessons_passed}/{r.total_lessons}
                  </td>
                  <td>{r.max_order_reached || 0}</td>
                  <td>{r.total_score}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
