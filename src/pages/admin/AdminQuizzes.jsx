// src/pages/admin/AdminQuizzes.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../utils/api.js";

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminQuizzes() {
  const [list, setList] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingQ, setLoadingQ] = useState(false);
  const [importing, setImporting] = useState(false);

  // --- Create quiz form ---
  const [form, setForm] = useState({
    title: "",
    is_active: true,
    lesson_id: "", // optional mapping on create
  });

  // --- Add question form ---
  const [qform, setQform] = useState({
    quiz_id: "",
    question: "",
    options: ["", "", "", ""],
    correct_index: 0,
  });
  const [questions, setQuestions] = useState([]);
  const [mapLessonId, setMapLessonId] = useState("");
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      setErr("");
      const [qs, ls] = await Promise.all([
        api("/quizzes/admin/all"),
        api("/lessons/admin/all"),
      ]);
      setList(qs || []);
      setLessons(ls || []);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      setQuestions([]);
      if (!qform.quiz_id) { setMapLessonId(""); return; }
      try {
        setLoadingQ(true); setErr("");
        const one = await api(`/quizzes/${qform.quiz_id}`);
        setQuestions(one.questions || []);
        setMapLessonId(one.lesson_id ?? "");
      } catch (e) { setErr(e.message); } finally { setLoadingQ(false); }
    })();
  }, [qform.quiz_id]);

  // ---------- Create quiz ----------
  const createQuiz = async () => {
    if (!form.title.trim()) { setErr("กรุณากรอกชื่อ Quiz"); return; }
    try {
      setCreating(true); setErr("");
      const body = {
        title: form.title.trim(),
        is_active: !!form.is_active,
        lesson_id: form.lesson_id ? Number(form.lesson_id) : null,
      };
      const created = await api("/quizzes", { method: "POST", body });
      await load();
      setQform((q) => ({ ...q, quiz_id: String(created.id) }));
      setForm((f) => ({ ...f, title: "", lesson_id: "" }));
      document.getElementById("add-question-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) { setErr(e.message); } finally { setCreating(false); }
  };

  // ---------- Reorder ----------
  const move = async (it, direction) => {
    try { await api(`/quizzes/${it.id}/reorder`, { method: "POST", body: { direction } }); load(); }
    catch (e) { setErr(e.message); }
  };

  // ---------- Add question ----------
  const allOptionsFilled = useMemo(
    () => Array.isArray(qform.options) && qform.options.length === 4 && qform.options.every((s) => String(s).trim().length > 0),
    [qform.options]
  );
  const canAddQuestion = useMemo(
    () => qform.quiz_id && !loadingQ && qform.question.trim().length > 0 && allOptionsFilled && qform.correct_index >= 0 && qform.correct_index <= 3,
    [qform.quiz_id, loadingQ, qform.question, allOptionsFilled, qform.correct_index]
  );
  const setOption = (idx, value) => {
    setQform((prev) => { const next = [...prev.options]; next[idx] = value; return { ...prev, options: next }; });
  };
  const addQuestion = async () => {
    if (!canAddQuestion) return;
    try {
      await api(`/quizzes/${qform.quiz_id}/questions`, {
        method: "POST",
        body: { question: qform.question.trim(), options: qform.options.map((s) => String(s).trim()), correct_index: Number(qform.correct_index) },
      });
      setQform((q) => ({ ...q, question: "", options: ["", "", "", ""], correct_index: 0 }));
      const one = await api(`/quizzes/${qform.quiz_id}`); setQuestions(one.questions || []);
    } catch (e) { setErr(e.message); }
  };

  // ---------- Delete ----------
  const removeQuiz = async (id) => {
    if (!confirm("ยืนยันลบ quiz นี้?")) return;
    try { await api(`/quizzes/${id}`, { method: "DELETE" }); if (String(qform.quiz_id) === String(id)) setQform({ ...qform, quiz_id: "" }); load(); }
    catch (e) { setErr(e.message); }
  };
  const deleteQuestion = async (qid) => {
    if (!confirm("ลบคำถามนี้?")) return;
    try { await api(`/quizzes/questions/${qid}`, { method: "DELETE" }); setQuestions((prev) => prev.filter((x) => x.id !== qid)); }
    catch (e) { setErr(e.message); }
  };
  const toggleActive = async (it) => {
    try { await api(`/quizzes/${it.id}`, { method: "PUT", body: { is_active: !it.is_active } }); load(); }
    catch (e) { setErr(e.message); }
  };

  // ---------- Mapping ----------
  // ชุดบทเรียนที่ถูกใช้อยู่แล้ว (โดยควิซใด ๆ)
  const usedLessonIds = useMemo(
    () => new Set((list || []).map(q => Number(q.lesson_id)).filter(Number.isFinite)),
    [list]
  );

  // เรียงบทเรียนตามลำดับ เพื่อแสดงใน dropdown
  const sortedLessons = useMemo(
    () => [...(lessons || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    [lessons]
  );

  // บทเรียนที่แสดงได้ตอน "สร้างควิซ" (ซ่อนของที่ถูกผูกแล้ว)
  const availableLessonsForCreate = useMemo(
    () => sortedLessons.filter(l => !usedLessonIds.has(Number(l.id)) || String(l.id) === String(form.lesson_id)),
    [sortedLessons, usedLessonIds, form.lesson_id]
  );

  // บทเรียนที่แสดงได้ใน panel "ผูกควิซกับบทเรียน" (ซ่อนของที่ถูกผูกแล้ว ยกเว้นของตัวเอง)
  const availableLessonsForMapping = useMemo(
    () => sortedLessons.filter(l => !usedLessonIds.has(Number(l.id)) || String(l.id) === String(mapLessonId)),
    [sortedLessons, usedLessonIds, mapLessonId]
  );

  const saveMapping = async () => {
    if (!qform.quiz_id) return;
    try {
      setErr("");
      await api(`/quizzes/${qform.quiz_id}`, {
        method: "PUT",
        body: { lesson_id: mapLessonId ? Number(mapLessonId) : null },
      });
      await load();
    } catch (e) { setErr(e.message); }
  };

  // แก้ race-condition: ยกเลิกการเชื่อม → เรียก API ใส่ null ตรง ๆ ก่อน แล้วค่อยอัปเดต state
  const unlinkLesson = async () => {
    if (!qform.quiz_id) return;
    try {
      await api(`/quizzes/${qform.quiz_id}`, { method: "PUT", body: { lesson_id: null } });
      setMapLessonId("");
      await load();
    } catch (e) { setErr(e.message); }
  };

  const selectedQuiz = useMemo(() => list.find((x) => String(x.id) === String(qform.quiz_id)), [list, qform.quiz_id]);
  const minOrder = useMemo(() => (list.length ? Math.min(...list.map((x) => x.order_index || 0)) : 0), [list]);
  const maxOrder = useMemo(() => (list.length ? Math.max(...list.map((x) => x.order_index || 0)) : 0), [list]);

  // ---------- Export / Import ----------
  const onExportJSON = () => {
    if (!qform.quiz_id) return setErr("กรุณาเลือก Quiz ก่อน");
    const payload = {
      meta: { quiz_id: Number(qform.quiz_id), title: selectedQuiz?.title || "", exported_at: new Date().toISOString() },
      questions: questions.map((q) => ({ question: q.question, options: q.options, correct_index: q.correct_index })),
    };
    const fn = `${(selectedQuiz?.title || "quiz").toLowerCase().replace(/\s+/g, "-")}-export.json`;
    downloadJSON(fn, payload);
  };
  const onDownloadTemplate = () => {
    downloadJSON("quiz-questions-template.json", [
      { question: "What is C?", options: ["A", "B", "C", "D"], correct_index: 2 },
      { question: "Who created C?", options: ["A", "B", "C", "D"], correct_index: 1 },
    ]);
  };
  const onPickJSON = () => fileInputRef.current?.click();
  const onImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { setErr("ไฟล์ใหญ่เกิน 2MB"); e.target.value = ""; return; }
    if (!qform.quiz_id) { setErr("กรุณาเลือก Quiz ก่อนนำเข้า"); e.target.value = ""; return; }
    try {
      setImporting(true); setErr("");
      const text = await file.text(); const data = JSON.parse(text);
      const rows = Array.isArray(data?.questions) ? data.questions : Array.isArray(data) ? data : [];
      rows.forEach((r, i) => {
        if (typeof r?.question !== "string") throw new Error(`แถวที่ ${i + 1}: question ต้องเป็น string`);
        if (!Array.isArray(r.options) || r.options.length !== 4) throw new Error(`แถวที่ ${i + 1}: options ต้องมี 4 ตัว`);
        if (![0,1,2,3].includes(Number(r.correct_index))) throw new Error(`แถวที่ ${i + 1}: correct_index ต้องเป็น 0-3`);
      });
      let ok = 0, fail = 0;
      for (const r of rows) {
        try {
          await api(`/quizzes/${qform.quiz_id}/questions`, { method: "POST", body: {
            question: r.question.trim(), options: r.options.map(String), correct_index: Number(r.correct_index)
          }});
          ok++;
        } catch { fail++; }
      }
      const one = await api(`/quizzes/${qform.quiz_id}`); setQuestions(one.questions || []);
      alert(`นำเข้าเสร็จ: เพิ่ม ${ok} ข้อ, ล้มเหลว ${fail} ข้อ`);
    } catch (e2) { setErr("นำเข้าไม่สำเร็จ: " + (e2.message || "Invalid JSON")); }
    finally { setImporting(false); e.target.value = ""; }
  };

  return (
    <div className="grid">
      <h2>Quizzes (Admin)</h2>
      {err && <div className="warning">{err}</div>}

      {/* Create Quiz */}
      <div className="card">
        <h3>สร้าง Quiz</h3>
        <div className="grid cols-4">
          <input
            className="input"
            placeholder="ชื่อ Quiz *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={200}
            required
          />
          <select
            className="input"
            value={form.is_active ? "1" : "0"}
            onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}
          >
            <option value="1">active</option>
            <option value="0">inactive</option>
          </select>

          {/* เลือกบทเรียนตอนสร้าง (ซ่อนบทที่ถูกผูกแล้ว) */}
          <div className="cols-2">
            <label className="muted">ผูกกับบทเรียน (ไม่บังคับ)</label>
            <select
              className="input"
              value={form.lesson_id}
              onChange={(e) => setForm({ ...form, lesson_id: e.target.value })}
            >
              <option value="">— ไม่ผูก —</option>
              {availableLessonsForCreate.map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.order_index} — {l.title}
                </option>
              ))}
            </select>
          </div>

          <button className="btn primary" onClick={createQuiz} disabled={creating || !form.title.trim()}>
            {creating ? "กำลังสร้าง…" : "สร้าง"}
          </button>
        </div>
        <div className="muted mt-1">* ระบบกำหนดลำดับให้อัตโนมัติ และกัน slug ซ้ำอัตโนมัติ</div>
      </div>

      {/* Add questions + JSON + mapping */}
      <div id="add-question-box" className="card">
        <h3>เพิ่มคำถามใน Quiz</h3>
        <div className="grid">
          {/* เลือกควิซ: แสดงเลขรัน 1..N */}
          <select
            className="input"
            value={qform.quiz_id}
            onChange={(e) => setQform({ ...qform, quiz_id: e.target.value })}
          >
            <option value="">— เลือก Quiz —</option>
            {list.map((it, idx) => (
              <option key={it.id} value={it.id}>
                #{idx + 1} • {it.title}
              </option>
            ))}
          </select>

          {/* Mapping panel */}
          {qform.quiz_id && (
            <div className="grid cols-3" style={{ alignItems: "end" }}>
              <div className="cols-2">
                <label>ผูก Quiz นี้กับบทเรียน</label>
                <select
                  className="input"
                  value={mapLessonId}
                  onChange={(e) => setMapLessonId(e.target.value)}
                >
                  <option value="">— ไม่ผูก —</option>
                  {availableLessonsForMapping.map((l) => (
                    <option key={l.id} value={l.id}>
                      #{l.order_index} — {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                <button className="btn" onClick={saveMapping} disabled={!qform.quiz_id}>
                  บันทึกการผูก
                </button>
                {mapLessonId && (
                  <button className="btn danger" onClick={unlinkLesson}>
                    ยกเลิกการเชื่อม
                  </button>
                )}
              </div>
            </div>
          )}

          {/* JSON tools */}
          <div className="flex gap-2">
            <button className="btn" onClick={onDownloadTemplate}>Template JSON</button>
            <button className="btn" onClick={onExportJSON} disabled={!qform.quiz_id || loadingQ}>Export JSON</button>
            <button className="btn" onClick={onPickJSON} disabled={!qform.quiz_id || importing}>
              {importing ? "กำลังนำเข้า…" : "Import JSON"}
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onImportJSON} />
          </div>

          {/* Question editor */}
          <label className="muted">คำถาม</label>
          <textarea
            className="input"
            placeholder="คำถาม (พิมพ์ได้หลายบรรทัด)"
            value={qform.question}
            onChange={(e) => setQform({ ...qform, question: e.target.value })}
            rows={4}
            style={{ resize: "vertical", whiteSpace: "pre-wrap" }}
          />

          <div className="grid cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <input
                key={i}
                className="input"
                placeholder={`ตัวเลือก ${i+1}`}
                value={qform.options[i]}
                onChange={(e) => setOption(i, e.target.value)}
              />
            ))}
          </div>

          <div className="card">
            <div className="muted" style={{ marginBottom: 6 }}>Preview ตัวเลือก</div>
            <pre style={{ whiteSpace: "pre-wrap", margin: "0 0 8px" }}>{qform.question || "—"}</pre>
            <div className="grid cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`badge ${qform.correct_index === i ? "" : "muted"}`}>ข้อ {i + 1}</span>
                  <span>{qform.options[i] || <em className="muted">—</em>}</span>
                </div>
              ))}
            </div>
            <div className="mt-1">
              <label className="muted">เฉลยข้อ</label>
              <select
                className="input"
                value={String(qform.correct_index)}
                onChange={(e) => setQform({ ...qform, correct_index: Number(e.target.value) })}
              >
                <option value="0">1</option><option value="1">2</option>
                <option value="2">3</option><option value="3">4</option>
              </select>
            </div>
          </div>

          <button className="btn primary" onClick={addQuestion} disabled={!canAddQuestion}>
            เพิ่มคำถาม
          </button>

          {/* Questions table */}
          {qform.quiz_id && (
            <div className="mt-2">
              <b>
                คำถามในชุด #{list.findIndex(x => String(x.id) === String(qform.quiz_id)) + 1}
                {selectedQuiz ? ` (${selectedQuiz.title})` : ""}
              </b>
              <table className="table mt-1">
                <thead><tr><th>#</th><th>คำถาม</th><th>ตัวเลือก</th><th>เฉลย</th><th></th></tr></thead>
                <tbody>
                  {loadingQ && (<tr><td colSpan={5} className="muted">กำลังโหลด...</td></tr>)}
                  {!loadingQ && questions.length === 0 && (<tr><td colSpan={5} className="muted">ยังไม่มีคำถาม</td></tr>)}
                  {questions.map((q, i) => {
                    const ansIdx = Number(q.correct_index ?? 0);
                    const opts = Array.isArray(q.options) ? q.options : [];
                    return (
                      <tr key={q.id}>
                        <td>{i + 1}</td>
                        <td><pre style={{whiteSpace:'pre-wrap', margin:0}}>{q.question}</pre></td>
                        <td>{opts.join(" | ")}</td>
                        <td><span className="badge">ข้อ {ansIdx + 1}</span><span style={{ marginLeft: 8 }}>{opts[ansIdx] ?? ""}</span></td>
                        <td><button className="btn danger" onClick={() => deleteQuestion(q.id)}>ลบ</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quiz list (เลขรัน) */}
      <div className="card">
        <h3>รายการ Quiz</h3>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>#</th>
              <th>ชื่อ</th>
              <th style={{ width: 180, textAlign: "center" }}>ลำดับ</th>
              <th style={{ width: 120, textAlign: "center" }}>สถานะ</th>
              <th style={{ width: 320 }}>คำสั่ง</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (<tr><td colSpan={5} className="muted">ยังไม่มีข้อมูล</td></tr>)}
            {list.map((it, idx) => {
              const L = lessons.find((l) => String(l.id) === String(it.lesson_id));
              return (
                <tr key={it.id}>
                  <td className="muted">#{idx + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <b>{it.title}</b>
                      {L && <span className="badge">{L.title}</span>} {/* แสดง badge ชื่อบทเรียนถ้ามี lesson #{L.order_index} — */ }
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button className="btn" title="เลื่อนขึ้น" onClick={() => move(it, "up")} disabled={it.order_index <= minOrder}>▲</button>
                      <button className="btn" title="เลื่อนลง" onClick={() => move(it, "down")} disabled={it.order_index >= maxOrder}>▼</button>
                    </div>
                  </td>
                  <td><div className="flex items-center justify-center"><span className={`badge ${it.is_active ? "" : "muted"}`}>{it.is_active ? "active" : "inactive"}</span></div></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn" onClick={() => toggleActive(it)}>{it.is_active ? "Deactivate" : "Activate"}</button>
                      <button className="btn" onClick={() => setQform((q) => ({ ...q, quiz_id: String(it.id) }))}>Edit</button>
                      <button className="btn danger" onClick={() => removeQuiz(it.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
