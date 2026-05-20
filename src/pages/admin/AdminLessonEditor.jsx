// AdminLessonEditor.jsx
import { useEffect, useState } from "react";
import LessonRenderer from "../../components/LessonRenderer.jsx";
import { api } from "../../utils/api.js";

export default function AdminLessonEditor({
  initial = null,
  onSaved,
  onClose,
}) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    order_index: "",
    is_published: false,
    content_json: { blocks: [] },
  });
  const [block, setBlock] = useState({ type: "p", content: "" });
  const [msg, setMsg] = useState("");

  const swap = (arr, i, j) => {
    const a = arr.slice();
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  };

  useEffect(() => {
    if (!initial) return;
    const cj = initial.content_json || { blocks: [] };
    setForm({
      title: initial.title || "",
      category: initial.category || "",
      order_index: initial.order_index ?? "",
      is_published: !!initial.is_published,
      content_json: { blocks: cj.blocks || [] },
    });
  }, [initial]);

  const moveBlock = (i, dir) => {
    setForm((f) => {
      const blocks = f.content_json.blocks || [];
      if (dir === "up" && i > 0)
        return {
          ...f,
          content_json: { ...f.content_json, blocks: swap(blocks, i, i - 1) },
        };
      if (dir === "down" && i < blocks.length - 1)
        return {
          ...f,
          content_json: { ...f.content_json, blocks: swap(blocks, i, i + 1) },
        };
      return f;
    });
  };

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api("/files/upload", { method: "POST", body: formData });
    return { url: res.url, public_id: res.public_id };
  }

  const addBlock = async () => {
    setMsg("");
    let b = null;

    if (["p", "note", "h2", "h3"].includes(block.type)) {
      if (!block.content?.trim()) return setMsg("กรุณากรอกเนื้อหา");
      // ✅ เก็บเนื้อหาได้หลายบรรทัด (มี \n)
      b = { type: block.type, content: block.content };
    } else if (block.type === "code") {
      if (!block.content) return setMsg("กรุณาใส่โค้ด");
      b = { type: "code", lang: block.lang || "c", content: block.content };
    } else if (block.type === "ul" || block.type === "ol") {
      // ✅ รับรายการเป็นหลายบรรทัด
      const items = (block.items || []).map((s) => s.trim()).filter(Boolean);
      if (!items.length) return setMsg("รายการต้องมีอย่างน้อย 1 บรรทัด");
      b = { type: block.type, items };
    } else if (block.type === "img") {
      if (!block.file) return setMsg("กรุณาเลือกไฟล์รูปภาพ");
      try {
        const { url, public_id } = await uploadImage(block.file);
        b = {
          type: "img",
          src: url,
          public_id,
          caption: (block.caption || "").trim() || undefined,
        };
      } catch (e) {
        return setMsg("อัปโหลดรูปไม่สำเร็จ: " + (e?.message || "error"));
      }
    }

    setForm((f) => ({
      ...f,
      content_json: {
        ...f.content_json,
        blocks: [...(f.content_json.blocks || []), b],
      },
    }));
    setBlock({ type: "p", content: "" });
  };

  const removeBlock = (i) => {
    setForm((f) => ({
      ...f,
      content_json: {
        ...f.content_json,
        blocks: (f.content_json.blocks || []).filter((_, idx) => idx !== i),
      },
    }));
  };

  const save = async () => {
    setMsg("");
    try {
      const body = {
        title: form.title.trim(),
        category: form.category.trim(),
        is_published: !!form.is_published,
        ...(String(form.order_index).trim()
          ? { order_index: Number(form.order_index) }
          : {}),
        content_json: { blocks: form.content_json.blocks || [] },
      };
      if (!body.title || !body.category)
        return setMsg("กรุณากรอก Title และ Category");

      if (initial) {
        const titleChanged = String(initial.title || "").trim() !== body.title;
        const payload = titleChanged ? { ...body, slug: "" } : body;
        await api(`/lessons/${initial.slug}`, { method: "PUT", body: payload });
      } else {
        await api(`/lessons`, { method: "POST", body });
      }

      setMsg("✅ บันทึกแล้ว");
      onSaved?.();
      onClose?.();
    } catch (e) {
      setMsg("❌ " + (e?.message || "บันทึกไม่สำเร็จ"));
    }
  };

  const delLesson = async () => {
    if (!initial?.id) return;
    if (!confirm(`ลบบทเรียน "${initial.title}" ?`)) return;
    try {
      await api(`/lessons/${initial.id}`, { method: "DELETE" });
      onSaved?.();
      onClose?.();
    } catch (e) {
      setMsg("❌ " + (e?.message || "ลบไม่สำเร็จ"));
    }
  };

  const blocks = form.content_json.blocks || [];

  // ===== helper: mini preview per block (รองรับหลายบรรทัด) =====
  const BlockPreview = ({ b }) => {
    if (b.type === "p" || b.type === "note") {
      return (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            margin: 0,
            padding: 0,
            ...(b.type === "note"
              ? {
                  background: "rgba(255,255,255,.06)",
                  padding: "8px 10px",
                  borderRadius: 8,
                }
              : {}),
          }}
        >
          {b.content || ""}
        </pre>
      );
    }
    if (b.type === "h2") return <h3 style={{ margin: 0 }}>{b.content}</h3>;
    if (b.type === "h3") return <h4 style={{ margin: 0 }}>{b.content}</h4>;
    if (b.type === "code") {
      return (
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{b.content}</pre>
      );
    }
    if (b.type === "ul") {
      return (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(b.items || []).map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    }
    if (b.type === "ol") {
      return (
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {(b.items || []).map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      );
    }
    if (b.type === "img") {
      return (
        <figure style={{ margin: 0 }}>
          <img
            src={b.src}
            alt={b.caption || ""}
            style={{ maxWidth: "100%", borderRadius: 8 }}
          />
          {b.caption ? (
            <figcaption className="muted" style={{ marginTop: 6 }}>
              {b.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    return <code style={{ margin: 0 }}>{b.type}</code>;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3>{initial ? "แก้ไขบทเรียน" : "สร้างบทเรียนใหม่"}</h3>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>

      <div className="grid cols-2">
        <div>
          <label>Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <label className="mt-1">Category</label>
          <input
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <label className="mt-1">Order (ว่าง = auto)</label>
          <input
            className="input"
            type="number"
            value={form.order_index}
            onChange={(e) => setForm({ ...form, order_index: e.target.value })}
          />

          <label className="mt-1">Status</label>
          <select
            className="input"
            value={form.is_published ? "1" : "0"}
            onChange={(e) =>
              setForm({ ...form, is_published: e.target.value === "1" })
            }
          >
            <option value="0">unpublished</option>
            <option value="1">published</option>
          </select>
        </div>

        {/* เพิ่มบล็อก */}
        <div>
          <h4>เพิ่มบล็อก</h4>
          <select
            className="input"
            value={block.type}
            onChange={(e) => setBlock({ type: e.target.value, content: "" })}
          >
            <option value="p">Paragraph</option>
            <option value="note">Note</option>
            <option value="code">Code</option>
            <option value="h2">Heading</option>
            <option value="ul">List</option>
            <option value="ol">Numbered List</option>
            <option value="img">Image</option>
          </select>

          {["p", "note", "h2", "h3"].includes(block.type) && (
            <textarea
              className="input mt-1"
              rows={4}
              placeholder="ข้อความ… (รองรับขึ้นบรรทัดใหม่ด้วย Enter)"
              value={block.content || ""}
              onChange={(e) =>
                setBlock((b) => ({ ...b, content: e.target.value }))
              }
              style={{ resize: "vertical" }} // ✅ ขยายเฉพาะแนวตั้ง
            />
          )}

          {block.type === "code" && (
            <>
              <input
                className="input mt-1"
                placeholder="ภาษา (เช่น c)"
                value={block.lang || "c"}
                onChange={(e) =>
                  setBlock((b) => ({ ...b, lang: e.target.value }))
                }
              />
              <textarea
                className="input mt-1"
                rows={6}
                placeholder="วางโค้ดที่นี่…"
                value={block.content || ""}
                onChange={(e) =>
                  setBlock((b) => ({ ...b, content: e.target.value }))
                }
                style={{ resize: "vertical" }}
              />
            </>
          )}

          {(block.type === "ul" || block.type === "ol") && (
            <textarea
              className="input mt-1"
              rows={4}
              placeholder="ใส่รายการแต่ละบรรทัด…"
              value={(block.items || []).join("\n")}
              onChange={(e) =>
                setBlock((b) => ({
                  ...b,
                  items: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              style={{ resize: "vertical" }}
            />
          )}

          {block.type === "img" && (
            <>
              <input
                className="input mt-1"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setBlock((b) => ({ ...b, file: e.target.files?.[0] || null }))
                }
              />
              <input
                className="input mt-1"
                placeholder="Caption (คำบรรยายใต้ภาพ)"
                value={block.caption || ""}
                onChange={(e) =>
                  setBlock((b) => ({ ...b, caption: e.target.value }))
                }
              />
            </>
          )}

          <div className="mt-1">
            <button className="btn" onClick={addBlock}>
              Add Block
            </button>
          </div>
        </div>
      </div>

      {/* รายการ/ลำดับ + พรีวิว (ปุ่มอยู่ขวาบนของแต่ละบล็อก) */}
      <div className="mt-2">
        {blocks.map((b, i) => (
          <div
            key={i}
            className="card"
            style={{
              position: "relative",
              padding: "12px 12px 12px 12px",
              marginBottom: 10,
            }}
          >
            {/* ปุ่มจัดลำดับด้านขวาบน */}
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                gap: 6,
              }}
            >
              <button
                className="btn"
                onClick={() => moveBlock(i, "up")}
                disabled={i === 0}
                title="เลื่อนขึ้น"
              >
                ↑
              </button>
              <button
                className="btn"
                onClick={() => moveBlock(i, "down")}
                disabled={i === blocks.length - 1}
                title="เลื่อนลง"
              >
                ↓
              </button>
              <button className="btn" onClick={() => removeBlock(i)} title="ลบ">
                ✕
              </button>
            </div>

            {/* ชนิดบล็อก */}
            <div className="muted" style={{ marginBottom: 6 }}>
              <code>{b.type}</code>
            </div>

            {/* พรีวิวเนื้อหา (รองรับหลายบรรทัด) */}
            <BlockPreview b={b} />
          </div>
        ))}

        {/* พรีวิวรวมทั้งบทเรียน (Renderer เดิม) */}
        <div className="mt-2">
          <LessonRenderer content={form.content_json} />
        </div>
      </div>

      {msg && <div className="mt-2">{msg}</div>}

      <div className="mt-2">
        <button className="btn primary" onClick={save}>
          {initial ? "อัปเดต" : "บันทึก"}
        </button>
        {initial?.id ? (
          <button
            className="btn danger"
            style={{ marginLeft: 8 }}
            onClick={delLesson}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
    
  );
}
