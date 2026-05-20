import { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useParams } from "react-router-dom";
import useAuth from "../state/AuthContext.jsx";

// CodeMirror
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [d, setD] = useState(null);
  const [code, setCode] = useState(
    `#include <stdio.h>\nint main(){ return 0; }`
  );
  const [resu, setResu] = useState(null);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setD(await api("/challenges/" + id));
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  const onSubmit = async () => {
    if (!user) return;
    try {
      setSubmitting(true);
      setErr("");
      setResu(null);
      const r = await api(`/challenges/${id}/submit`, {
        method: "POST",
        body: { code },
      });
      setResu(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (err) return <div className="warning">{err}</div>;
  if (!d) return <div className="muted">กำลังโหลด...</div>;

  //  ปิด paste
  const antiClipboard = EditorView.domEventHandlers({
    paste: (e) => {
      e.preventDefault();
      return true;
    },
  });

  //  บล็อกคีย์ลัด Ctrl/ + V
  const blockClipboardKeys = keymap.of([
    { key: "Mod-v", preventDefault: true, run: () => true },
  ]);

  return (
    <div className="grid">
      <div className="card">
        <h2>
          {d.title} <span className="badge">{d.difficulty}</span>
        </h2>
        {/* คำอธิบาย (รองรับ \n) */}
        {d.description && <pre className="codearea-tight">{d.description}</pre>}
        {d.sample_input && (
          <p>
            <b>Sample Input:</b>{" "}
            <span className="kbd">{String(d.sample_input)}</span>
          </p>
        )}
        {d.sample_output && (
          <p>
            <b>Sample Output:</b>{" "}
            <span className="kbd">{String(d.sample_output)}</span>
          </p>
        )}

        <hr className="hr" />

        <label className="mb-1">โค้ดภาษา C</label>
        <CodeMirror
          value={code}
          height="360px"
          extensions={[cpp(),  blockClipboardKeys]}
          theme={oneDark}
          basicSetup={{ lineNumbers: true }}
          onChange={(v) => setCode(v)}
        />

        <button
          className="btn primary mt-2"
          onClick={onSubmit}
          disabled={!user || submitting}
        >
          {submitting ? "กำลังตรวจ…" : "ส่งตรวจ"}
        </button>
        {!user && <div className="warning mt-1">ต้องเข้าสู่ระบบก่อน</div>}
      </div>

      {resu && (
        <div className="card">
          <h3>ผลตรวจ</h3>

          {/* กรณีคอมไพล์ไม่ผ่าน */}
          {resu.compile_error ? (
            <>
              <p className="warning">คอมไพล์ไม่สำเร็จ</p>
              {resu.stderr && resu.stderr.trim() && (
                <details className="mt-1" open>
                  <summary className="muted">รายละเอียด (stderr)</summary>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {resu.stderr}
                  </pre>
                </details>
              )}
            </>
          ) : (
            <>
              <p>
                ผ่าน {resu.passed} / {resu.total} cases
              </p>
              <p>
                ได้คะแนน +{resu.points_awarded}{" "}
                {/*<span className="muted">(เพิ่มจริง: +{resu.points_added})</span>*/}
              </p>
              {resu?.ranking?.total !== undefined && (
                <p className="muted">คะแนนรวมล่าสุด: {resu.ranking.total}</p>
              )}

              {/* ตารางรายเคส */}
              {Array.isArray(resu.cases) && resu.cases.length > 0 && (
                <div className="mt-1">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 72 }}>#</th>
                        <th>ผล</th>
                        <th>Expected</th>
                        <th>Got</th>
                        {/*<th style={{ width: 110 }}>Exit</th>*/}
                      </tr>
                    </thead>
                    <tbody>
                      {resu.cases.map((c) => (
                        <tr key={c.index}>
                          <td>#{c.index}</td>
                          <td>
                            <span
                              className={`badge ${c.passed ? "" : "danger"}`}
                            >
                              {c.passed ? "passed" : "failed"}
                            </span>
                          </td>
                          <td>
                            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                              {c.expected}
                            </pre>
                          </td>
                          <td>
                            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                              {c.got}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* รายละเอียดเพิ่มเติมต่อเคส (input/stderr) */}
                  <details className="mt-1">
                    <summary className="muted">
                      แสดง Input / stderr ต่อเคส
                    </summary>
                    <div className="grid">
                      {resu.cases.map((c) => (
                        <div key={c.index} className="card">
                          <b>Case #{c.index}</b>
                          <div className="grid cols-2">
                            <div>
                              <div className="muted">Input</div>
                              <pre
                                style={{ whiteSpace: "pre-wrap", margin: 0 }}
                              >
                                {String(c.input ?? "")}
                              </pre>
                            </div>
                            {c.stderr && c.stderr.trim() && (
                              <div>
                                <div className="muted">stderr</div>
                                <pre
                                  style={{ whiteSpace: "pre-wrap", margin: 0 }}
                                >
                                  {c.stderr}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
