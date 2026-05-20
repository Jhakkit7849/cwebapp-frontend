// LessonDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import useAuth from "../state/AuthContext.jsx";

const getText = (b) => b?.content ?? b?.text ?? "";
const getCode = (b) => b?.content ?? b?.code ?? "";
const getItems = (b) =>
  Array.isArray(b?.items)
    ? b.items
    : typeof b?.content === "string"
    ? b.content
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

function ProgressSummary({ progress, isLoggedIn }) {
  if (!isLoggedIn) {
    return <span className="muted">ยังไม่มีความคืบหน้า (ต้องเข้าสู่ระบบ)</span>;
  }
  if (!progress) {
    return <span className="muted">ยังไม่มีความคืบหน้า</span>;
  }
  const raw = progress.best_score;
  const pct =
    raw == null ? null : raw > 1 ? Math.round(raw) : Math.round(raw * 100);
  const attempts = progress.attempts ?? 0;
  return (
    <div className="muted">
      สถานะ: {progress.passed ? "ผ่าน ✓" : "ยังไม่ผ่าน"}
      {pct != null ? ` · คะแนนดีที่สุด ${pct}%` : ""}
      {attempts ? ` · ลอง ${attempts} ครั้ง` : ""}
      {progress.completed_at
        ? ` · เมื่อ ${new Date(progress.completed_at).toLocaleString()}`
        : ""}
    </div>
  );
}

function ContentRenderer({ content }) {
  if (!content) return <div className="muted">ไม่มีเนื้อหา</div>;
  let data = content;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {}
  }
  const blocks = Array.isArray(data?.blocks) ? data.blocks : null;
  if (!blocks)
    return (
      <pre className="codearea" style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(content, null, 2)}
      </pre>
    );

  return (
    <div className="grid">
      {blocks.map((b, i) => {
        const text = getText(b);
        switch (b.type) {
          case "h1":
            return <h1 key={i}>{text}</h1>;
          case "h2":
            return <h2 key={i}>{text}</h2>;
          case "h3":
            return <h3 key={i}>{text}</h3>;
          case "p":
            return (
              <p key={i} style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {text}
              </p>
            );
          case "note":
            return (
              <div
                key={i}
                className="BoxNote"
                style={{ whiteSpace: "pre-wrap" }}
              >
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</pre>
              </div>
            );
          case "code": {
            const code = getCode(b);
            const lang = b.lang || "c";
            return (
              <div key={i} className="card">
                <div className="muted" style={{ marginBottom: 6 }}>
                  {lang}
                </div>
                <pre
                  className="codearea"
                  style={{ overflowX: "auto", margin: 0 }}
                >
                  {code}
                </pre>
                <div className="mt-1">
                  <Link
                    className="btn"
                    to={`/sandbox?lang=${encodeURIComponent(
                      lang
                    )}&code=${encodeURIComponent(code)}`}
                  >
                    Try it yourself
                  </Link>
                </div>
              </div>
            );
          }
          case "img":
            return (
              <figure key={i}>
                <img
                  src={b.src}
                  alt={b.alt || ""}
                  style={{ maxWidth: "100%", borderRadius: 12 }}
                />
                {b.caption && (
                  <figcaption className="muted">{b.caption}</figcaption>
                )}
              </figure>
            );
          case "ul":
            return (
              <ul key={i}>
                {getItems(b).map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {getItems(b).map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ol>
            );
          default:
            return (
              <pre
                key={i}
                className="codearea"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {JSON.stringify(b, null, 2)}
              </pre>
            );
        }
      })}
    </div>
  );
}

export default function LessonDetail() {
  const { user } = useAuth(); // ✅ ใช้ใน component เท่านั้น
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  let slug = params?.slug;
  const fallbackSlug = useMemo(() => {
    const m = location.pathname.match(/\/lessons\/([^/?#]+)/i);
    return m?.[1];
  }, [location.pathname]);
  if (!slug && fallbackSlug) slug = fallbackSlug;

  const [data, setData] = useState(null); // { lesson, quiz, progress, prev, next }
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setErr("");
      setNotFound(false);
      setData(null);
      if (!slug) return;
      try {
        setLoading(true);
        const res = await api(`/lessons/${encodeURIComponent(slug)}`);
        if (!ignore) {
          setData(res);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e) {
        if (!ignore) {
          const msg = String(e?.message || "");
          if (msg.toLowerCase().includes("not found") || msg.includes("404"))
            setNotFound(true);
          else setErr(msg);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [slug, user?.id]); // ✅ เปลี่ยน user -> รีโหลด progress

  if (!slug) {
    return (
      <div className="warning">
        ไม่พบ slug ของบทเรียนใน URL
        <div className="mt-1">
          <button className="btn" onClick={() => navigate("/lessons")}>
            กลับไปหน้ารายการ
          </button>
        </div>
      </div>
    );
  }
  if (loading) return <div className="muted">กำลังโหลด...</div>;
  if (notFound) {
    return (
      <div className="warning">
        ไม่พบบทเรียนนี้ (404)
        <div className="mt-1">
          <button className="btn" onClick={() => navigate("/lessons")}>
            กลับไปหน้ารายการ
          </button>
        </div>
      </div>
    );
  }
  if (err) return <div className="warning">{err}</div>;
  if (!data) return null;

  const { lesson, quiz, progress, prev, next } = data;

  const goPrev = () => {
    if (prev?.slug) navigate(`/lessons/${prev.slug}`);
  };
  const goNext = () => {
    if (next?.slug) navigate(`/lessons/${next.slug}`);
  };
  return (
    <div className="grid">
      <div className="card">
        <div className="flex items-center gap-2">
          <h2 style={{ margin: 0 }}>{lesson.title}</h2>
          <span className="badge">{lesson.category}</span>
          <span className="muted">#{lesson.order_index}</span>
        </div>

        <div className="mt-1">
          <ProgressSummary progress={progress} isLoggedIn={!!user?.id} />
        </div>

      </div>

      <div key={lesson.slug} className="card">
        <div className="flex gap-2">
          <Link
            className={`btn ${!prev?.slug ? "muted" : ""}`}
            to={prev?.slug ? `/lessons/${prev.slug}` : "#"}
            onClick={(e) => {
              if (!prev?.slug) e.preventDefault();
            }}
            aria-disabled={!prev?.slug}
          >
            ← ก่อนหน้า
          </Link>

          <Link
            className={`btn ${!next?.slug ? "muted" : ""}`}
            to={next?.slug ? `/lessons/${next.slug}` : "#"}
            onClick={(e) => {
              if (!next?.slug) e.preventDefault();
            }}
            aria-disabled={!next?.slug}
          >
            ถัดไป →
          </Link>
        </div>

        <ContentRenderer content={lesson.content_json} />

        <div className="flex gap-2">
          <Link
            className={`btn ${!prev?.slug ? "muted" : ""}`}
            to={prev?.slug ? `/lessons/${prev.slug}` : "#"}
            onClick={(e) => {
              if (!prev?.slug) e.preventDefault();
            }}
            aria-disabled={!prev?.slug}
          >
            ← ก่อนหน้า
          </Link>

          <Link
            className={`btn ${!next?.slug ? "muted" : ""}`}
            to={next?.slug ? `/lessons/${next.slug}` : "#"}
            onClick={(e) => {
              if (!next?.slug) e.preventDefault();
            }}
            aria-disabled={!next?.slug}
          >
            ถัดไป →
          </Link>
        </div>
        {quiz ? (
          <div className="mt-1">
            <Link className="btn" to={`/quizzes/${quiz.id}`}>
              ทำควิซของบทนี้: {quiz.title}
            </Link>
          </div>
        ) : (
          <div className="muted mt-1">ยังไม่มีควิซสำหรับบทนี้</div>
        )}
      </div>
    </div>
  );
}
