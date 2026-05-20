// src/pages/QuizResult.jsx
import { useLocation, useParams, Link } from "react-router-dom";

const PASS_THRESHOLD = 0.8; // 80%

export default function QuizResult() {
  const { id } = useParams();
  const { state } = useLocation() || {};
  // state คาดว่า: { correct, total, score, ranking, lessonSlug? }

  if (!state) {
    return (
      <div className="grid">
        <div className="card">
          <h2>ไม่พบผลลัพธ์</h2>
          <p className="muted">กรุณาทำแบบทดสอบก่อน</p>
          <Link className="btn" to={`/quizzes/${id}`}>
            กลับไปทำแบบทดสอบ
          </Link>
        </div>
      </div>
    );
  }

  const correct = Number(state.correct || 0);
  const total = Math.max(0, Number(state.total || 0));
  const score = Number(state.score || 0);
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const passed = total ? correct / total >= PASS_THRESHOLD : false;

  return (
    <div className="grid">
      <div className="card">
        <div className="flex items-center gap-2">
          <h2 style={{ margin: 0 }}>ผลคะแนน</h2>
          <span className={`badge ${passed ? "" : "muted"}`}>
            {passed ? "ผ่าน" : "ยังไม่ผ่าน"}
          </span>
        </div>

        <p className="mt-1">
          ตอบถูก {correct} / {total} • {pct}%
        </p>
        <p>
          คะแนนที่ได้: <b>+{score}</b>
        </p>

        {state?.ranking?.total !== undefined && (
          <p className="muted">คะแนนรวมล่าสุด: {state.ranking.total}</p>
        )}

        <div className="mt-2 flex gap-2">
          <Link className="btn" to={`/quizzes/${id}`}>
            ทำใหม่
          </Link>
          {state?.lessonSlug ? (
            <Link className="btn" to={`/lessons/${state.lessonSlug}`}>
              กลับไปบทเรียน
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
