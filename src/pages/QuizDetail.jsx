import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../state/AuthContext.jsx";

/* ---------- Fisher-Yates shuffle ---------- */
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // raw จาก API (เก็บไว้เผื่อใช้ meta/top-level)
  const [quizRaw, setQuizRaw] = useState(null);

  // quiz สำหรับแสดง (ช้อยส์ถูกสุ่มแล้ว) และมี perm ต่อข้อ
  const [quizView, setQuizView] = useState(null);

  // answers เก็บ index ของ "ช้อยส์หลังสุ่ม"
  const [answers, setAnswers] = useState({});

  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ใช้ ts ใน query เพื่อบังคับให้รีสุ่มเมื่อเปลี่ยน
  const ts = useMemo(() => {
    const u = new URLSearchParams(location.search);
    return u.get("ts") || "";
  }, [location.search]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setErr("");
        setQuizRaw(null);
        setQuizView(null);
        setAnswers({});

        const data = await api("/quizzes/" + id);
        if (ignore) return;

        // สุ่มเฉพาะ "ช้อยส์ของแต่ละข้อ"
        // (ถ้าต้องการสุ่มลำดับ "ข้อ" ด้วย ให้เปิดคอมเมนต์สองบรรทัดด้านล่าง)
        const qList = (data.questions || []).map((q) => ({ ...q }));
        // shuffleInPlace(qList); // ← สุ่มลำดับข้อ (ถ้าต้องการ)

        const viewQuestions = qList.map((q) => {
          // ผูก text กับ original index
          const ops = (q.options || []).map((text, origIndex) => ({ text, origIndex }));
          const shuffled = [...ops];
          shuffleInPlace(shuffled);

          // perm: ตำแหน่งหลังสุ่ม -> index เดิม
          const perm = shuffled.map((o) => o.origIndex);

          return {
            ...q,
            options: shuffled.map((o) => o.text), // ใช้ options ที่สุ่มแล้วสำหรับแสดงผล
            __perm: perm, // สำหรับ map กลับตอนส่ง
          };
        });

        setQuizRaw(data);
        setQuizView({ ...data, questions: viewQuestions });
      } catch (e) {
        setErr(e.message || "โหลดควิซไม่สำเร็จ");
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id, ts]);

  const onSubmit = async () => {
    if (!user) return;
    if (!quizView) return;

    try {
      setSubmitting(true);
      setErr("");

      // แปลงคำตอบกลับเป็น original index ด้วย perm
      const payload = {
        answers: (quizView.questions || []).map((q) => {
          const chosenShuffled = answers[q.id];
          const selected_index =
            typeof chosenShuffled === "number" ? q.__perm[chosenShuffled] : -1;
          return {
            question_id: q.id,
            selected_index, // ← index เดิมที่ backend คาดหวัง
          };
        }),
      };

      const res = await api(`/quizzes/${id}/submit`, {
        method: "POST",
        body: payload,
      });

      navigate(`/quizzes/${id}/result`, {
        state: { ...res, lessonSlug: quizRaw?.lesson_slug },
      });
    } catch (e) {
      setErr(e.message || "ส่งคำตอบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (err) return <div className="warning">{err}</div>;
  if (!quizView) return <div className="muted">กำลังโหลด...</div>;

  return (
    <div className="grid">
      <div className="card">
        <h2>{quizView.title}</h2>
        <div className="muted">ตัวเลือกของแต่ละข้อจะถูกสุ่มใหม่ทุกครั้ง</div>
        {!user && <div className="warning">โปรดเข้าสู่ระบบเพื่อส่งคำตอบ</div>}

        {quizView.questions?.map((q, i) => {
          const isMultiline = /\n/.test(q.question || "");
          const [head, ...rest] = String(q.question || "").split("\n");
          const tail = rest.join("\n");

          return (
            <div key={q.id} style={{ marginTop: 16, marginBottom: 10 }}>
              {/* หัวข้อคำถาม */}
              <strong style={{ display: "block", lineHeight: 1.35, marginBottom: 6 }}>
                {i + 1}. {head}
              </strong>

              {/* ส่วนหลายบรรทัด/โค้ด */}
              {isMultiline && (
                <pre className="codearea-tight">{tail}</pre>
              )}

              {/* ตัวเลือก (ถูกสุ่มแล้ว) */}
              <div className="grid" style={{ gap: 8 }}>
                {q.options.map((op, idx) => (
                  <label
                    key={idx}
                    className="flex"
                    style={{ alignItems: "center", padding: "2px 0" }}
                  >
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      checked={Number(answers[q.id]) === idx}
                      onChange={() => setAnswers({ ...answers, [q.id]: idx })}
                      disabled={submitting}
                    />
                    <span style={{ marginLeft: 8, whiteSpace: "pre-wrap" }}>{op}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-2" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn primary"
            onClick={onSubmit}
            disabled={!user || submitting}
          >
            {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
          </button>

          <button
            className="btn"
            onClick={() => {
              // บังคับรีสุ่มใหม่: อัปเดต query ts ให้ต่างจากเดิม
              const u = new URL(window.location.href);
              u.searchParams.set("ts", Date.now().toString());
              navigate(u.pathname + u.search, { replace: true });
            }}
            disabled={submitting}
          >
            ทำใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
