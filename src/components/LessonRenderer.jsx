// LessonRenderer.jsx
import React from "react";
import CodeBlock from "./CodeBlock";

export default function LessonRenderer({ content }) {
  if (!content) return <div className="muted">ไม่มีเนื้อหา</div>;

  // รองรับกรณี backend ส่ง string JSON
  let data = content;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch {}
  }

  const blocks = Array.isArray(data?.blocks) ? data.blocks : null;
  if (!blocks) {
    return (
      <pre className="codearea" style={{ whiteSpace: "pre-wrap" }}>
        {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  const txt = (b) => b.text ?? b.content ?? "";
  const getItems = (b) =>
    Array.isArray(b?.items)
      ? b.items
      : typeof b?.content === "string"
      ? b.content.split("\n").map(s => s.trim()).filter(Boolean)
      : [];

  return (
    <div>
      {blocks.map((b, idx) => {
        if (b.type === "h1") return <h1 className="block" key={idx}>{txt(b)}</h1>;
        if (b.type === "h2") return <h2 className="block" key={idx}>{txt(b)}</h2>;
        if (b.type === "h3") return <h3 className="block" key={idx}>{txt(b)}</h3>;

        // ✅ ย่อหน้า: แสดงหลายบรรทัด (รักษา \n)
        if (b.type === "p")
          return (
            <div className="block" key={idx}>
              <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                {txt(b)}
              </p>
            </div>
          );

        // ✅ Note: แสดงหลายบรรทัด (รักษา \n)
        if (b.type === "note")
          return (
            <div className="BoxNote" key={idx}>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                {txt(b)}
              </pre>
            </div>
          );

        if (b.type === "code") {
          const code = b.content ?? b.code ?? "";
          return <CodeBlock key={idx} lang={b.lang || "c"} code={code} />;
        }

        if (b.type === "img")
          return (
            <figure className="block" key={idx}>
              <img src={b.src} alt={b.alt || ""} style={{ maxWidth: "100%", borderRadius: 12 }} />
              {b.caption && <figcaption className="muted">{b.caption}</figcaption>}
            </figure>
          );

        if (b.type === "ul")
          return (
            <ul className="block" key={idx}>
              {getItems(b).map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          );

        if (b.type === "ol")
          return (
            <ol className="block" key={idx}>
              {getItems(b).map((it, i) => <li key={i}>{it}</li>)}
            </ol>
          );

        // fallback
        return (
          <pre className="codearea block" key={idx} style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(b, null, 2)}
          </pre>
        );
      })}
    </div>
  );
}
