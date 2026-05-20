import { useEffect, useState } from "react";
import { api } from "../../utils/api.js";

export default function AdminChallenges() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [uploadInfo, setUploadInfo] = useState({ name: "", size: 0, count: 0 });
  const [testCases, setTestCases] = useState([]); // ชุดทดสอบใหม่ (ถ้าอัปไฟล์)
  const [editId, setEditId] = useState(null); // id ที่กำลังแก้
  const [form, setForm] = useState({
    title: "",
    description: "",
    sample_input: "",
    sample_output: "",
    difficulty: "easy",
    status: "draft",
  });

  const DIFF_POINTS = { easy: 10, medium: 20, hard: 30 };
  function DiffBadge({ d }) {
    const diff = String(d || "").toLowerCase();
    const base = {
      padding: "2px 8px",
      borderRadius: 999,
      border: "1px solid transparent",
    };
    const styles =
      diff === "easy"
        ? {
            ...base,
            background: "#12381e",
            borderColor: "#1f6a39",
            color: "#9ae6b4",
          }
        : diff === "medium"
        ? {
            ...base,
            background: "#2b2133",
            borderColor: "#5b3a77",
            color: "#d9c8ff",
          }
        : diff === "hard"
        ? {
            ...base,
            background: "#361c1c",
            borderColor: "#7a2e2e",
            color: "#f5b5b5",
          }
        : {
            ...base,
            background: "rgba(255,255,255,.08)",
            borderColor: "rgba(255,255,255,.18)",
            color: "#cbd5e1",
          };

    return (
      <span className="badge" style={styles}>
        {diff || "—"}
        {DIFF_POINTS[diff] ? ` (+${DIFF_POINTS[diff]})` : ""}
      </span>
    );
  }
  const load = async () => {
    try {
      setList(await api("/challenges/admin/all"));
    } catch (e) {
      setErr(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  // อ่านไฟล์ .json -> ตรวจโครง -> เซ็ตลง state
  const handleFile = async (e) => {
    setErr("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setErr("ไฟล์ใหญ่เกิน 1MB");
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("JSON ต้องเป็นอาเรย์");
      const bad = data.find(
        (it) =>
          typeof it?.input !== "string" ||
          typeof it?.expected_output !== "string"
      );
      if (bad)
        throw new Error(
          "แต่ละรายการต้องมี input และ expected_output เป็น string"
        );
      setTestCases(data);
      setUploadInfo({ name: file.name, size: file.size, count: data.length });
    } catch (e) {
      setTestCases([]);
      setUploadInfo({ name: "", size: 0, count: 0 });
      setErr("อ่านไฟล์ไม่สำเร็จ: " + (e?.message || "Invalid JSON"));
    }
  };
  const clearFile = () => {
    setTestCases([]);
    setUploadInfo({ name: "", size: 0, count: 0 });
    const el = document.getElementById("tc-file");
    if (el) el.value = "";
  };

  // สร้างใหม่
  const createOne = async () => {
    try {
      if (!form.title || !form.description)
        return setErr("กรอกชื่อและคำอธิบายก่อน");
      if (testCases.length === 0)
        return setErr("กรุณาอัปโหลดไฟล์ test_cases (.json)");
      const body = { ...form, test_cases: testCases };
      await api("/challenges", { method: "POST", body });
      resetForm();
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  // เข้าโหมดแก้ไข (ดึงข้อมูลจากแถวในตาราง)
  const startEdit = (it) => {
    setEditId(it.challenge_id);
    setForm({
      title: it.title || "",
      description: it.description || "",
      sample_input: it.sample_input || "",
      sample_output: it.sample_output || "",
      difficulty: it.difficulty || "easy",
      status: it.status || "draft",
    });
    clearFile(); // ไม่บังคับเปลี่ยน test_cases จนกว่าจะอัปไฟล์ใหม่
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // บันทึกแก้ไข (PUT)
  const saveEdit = async () => {
    try {
      if (!editId) return;
      const body = { ...form };
      // ส่ง test_cases เฉพาะเมื่อมีอัปไฟล์ใหม่เท่านั้น
      if (testCases.length > 0) body.test_cases = testCases;
      await api(`/challenges/${editId}`, { method: "PUT", body });
      resetForm();
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  // ลบ
  const removeOne = async (id) => {
    if (!confirm("ยืนยันลบ Challenge นี้?")) return;
    try {
      await api(`/challenges/${id}`, { method: "DELETE" });
      if (editId === id) resetForm();
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const publish = async (id) => {
    try {
      await api(`/challenges/${id}`, {
        method: "PUT",
        body: { status: "published" },
      });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      title: "",
      description: "",
      sample_input: "",
      sample_output: "",
      difficulty: "easy",
      status: "draft",
    });
    clearFile();
  };

  return (
    <div className="grid">
      <h2>Challenges (Admin)</h2>
      {err && <div className="warning">{err}</div>}

      <div className="card">
        <h3>{editId ? `แก้ไข Challenge #${editId}` : "สร้าง Challenge"}</h3>
        <div className="grid">
          <input
            className="input"
            placeholder="ชื่อ"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="input"
            placeholder="คำอธิบาย"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={6} // ความสูงตั้งต้น
            style={{
              resize: "vertical", // ให้ปรับได้เฉพาะแนวตั้ง
              minHeight: 120, // กัน矮เกิน
              maxHeight: 320, // กันสูงล้น
              overflow: "auto", // เลื่อนในกล่องเมื่อเกิน
              whiteSpace: "pre-wrap", // รักษาขึ้นบรรทัด/เว้นวรรค
            }}
          />

          <input
            className="input"
            placeholder="sample_input"
            value={form.sample_input}
            onChange={(e) => setForm({ ...form, sample_input: e.target.value })}
          />
          <input
            className="input"
            placeholder="sample_output"
            value={form.sample_output}
            onChange={(e) =>
              setForm({ ...form, sample_output: e.target.value })
            }
          />

          <select
            className="input"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            <option value="easy">easy(10 คะแนน)</option>
            <option value="medium">medium(20 คะแนน)</option>
            <option value="hard">hard(30 คะแนน)</option>
          </select>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>draft</option>
            <option>published</option>
          </select>

          {/* อัปโหลดไฟล์ JSON (สำหรับสร้างใหม่ หรืออยากเปลี่ยน test_cases ตอนแก้ไข) */}
          <div className="grid" style={{ gap: "0.5rem" }}>
            <label className="muted">
              อัปโหลดไฟล์ test_cases (.json){" "}
              {editId && "(อัปเฉพาะเมื่ออยากเปลี่ยนชุดทดสอบ)"}
            </label>
            <input
              id="tc-file"
              className="input"
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
            />
            {uploadInfo.name && (
              <div className="muted">
                ไฟล์: <b>{uploadInfo.name}</b> •{" "}
                {(uploadInfo.size / 1024).toFixed(1)} KB • เคส:{" "}
                <b>{uploadInfo.count}</b>
                <button
                  className="btn"
                  style={{ marginLeft: "0.5rem" }}
                  onClick={clearFile}
                >
                  ล้างไฟล์
                </button>
              </div>
            )}
            {testCases.length > 0 && (
              <details className="card">
                <summary>ดูตัวอย่าง test_cases (3 รายการแรก)</summary>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {JSON.stringify(testCases.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>

          {!editId ? (
            <button className="btn primary" onClick={createOne}>
              บันทึก
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="btn primary" onClick={saveEdit}>
                บันทึกการแก้ไข
              </button>
              <button className="btn" onClick={resetForm}>
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>รายการทั้งหมด</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อ</th>
              <th>ความยาก</th>
              <th>สถานะ</th>
              <th>คำสั่ง</th>
            </tr>
          </thead>
          <tbody>
            {list.map((it, idx) => (
              <tr key={it.challenge_id}>
                <td>{idx + 1}</td>
                <td>{it.title}</td>
                <td><DiffBadge d={it.difficulty} /></td>
                <td>{it.status}</td>
                <td className="flex gap-2">
                  <button className="btn" onClick={() => startEdit(it)}>
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => removeOne(it.challenge_id)}
                  >
                    Delete
                  </button>
                  {it.status !== "published" && (
                    <button
                      className="btn"
                      onClick={() => publish(it.challenge_id)}
                    >
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
