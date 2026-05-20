// src/pages/Community.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";
import useAuth from "../state/AuthContext.jsx";

// helper ครอป Cloudinary เป็นวงกลม (รองรับกำหนดขนาด)
function avatarThumb(url, w = 28, h = 28) {
  if (!url) return null;
  return url.replace(
    "/upload/",
    `/upload/c_fill,w_${w},h_${h},q_auto,f_auto,g_face,r_max/`
  );
}
const AVATAR_FALLBACK =
  "https://ui-avatars.com/api/?background=21243d&color=fff&name=?";

export default function Community() {
  const { user } = useAuth();

  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ฟอร์มสร้าง
  const [form, setForm] = useState({ title: "", content: "", tags: "" });

  // ฟอร์มแก้ไข
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", tags: "" });

  // ความคิดเห็นของแต่ละโพสต์
  const [comments, setComments] = useState({}); // postId -> list
  const [openComments, setOpenComments] = useState({}); // postId -> bool

  // ฟิลเตอร์/ค้นหา/เรียง
  const [q, setQ] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | title

  const isOwnerOrAdmin = (p) =>
    user && (String(user.id) === String(p.user_id) || String(user.role) === "admin");

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const rows = await api("/community/posts");
      setList(rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  // รวมแท็กทั้งหมดเป็นชิปสำหรับกรอง
  const allTags = useMemo(() => {
    const s = new Set();
    (list || []).forEach((p) => {
      const tags = Array.isArray(p.tags)
        ? p.tags
        : typeof p.tags === "string"
          ? p.tags.split(",").map((x) => x.trim()).filter(Boolean)
          : [];
      tags.forEach((t) => s.add(t));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [list]);

  const filtered = useMemo(() => {
    let rows = Array.isArray(list) ? [...list] : [];
    // ค้นหาตามชื่อ + เนื้อหา
    const qq = q.trim().toLowerCase();
    if (qq) {
      rows = rows.filter(
        (p) =>
          String(p.title || "").toLowerCase().includes(qq) ||
          String(p.content || "").toLowerCase().includes(qq)
      );
    }
    // กรองเฉพาะของฉัน
    if (onlyMine && user?.id) rows = rows.filter((p) => String(p.user_id) === String(user.id));
    // กรองตามแท็ก
    if (tagFilter) {
      rows = rows.filter((p) => {
        const tags = Array.isArray(p.tags)
          ? p.tags
          : typeof p.tags === "string"
            ? p.tags.split(",").map((x) => x.trim()).filter(Boolean)
            : [];
        return tags.includes(tagFilter);
      });
    }
    // เรียง
    rows.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === "title") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      // newest
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return rows;
  }, [list, q, onlyMine, tagFilter, sortBy, user?.id]);

  const counts = useMemo(() => {
    const total = list.length;
    const mine = user?.id ? list.filter((p) => String(p.user_id) === String(user.id)).length : 0;
    return { total, mine };
  }, [list, user?.id]);

  const addPost = async () => {
    try {
      await api("/community/posts", { method: "POST", body: form });
      setForm({ title: "", content: "", tags: "" });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const removePost = async (id) => {
    if (!confirm("ยืนยันลบโพสต์นี้?")) return;
    try {
      await api(`/community/posts/${id}`, { method: "DELETE" });
      setList((prev) => prev.filter((p) => p.id !== id));
      setComments((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      setOpenComments((prev) => ({ ...prev, [id]: false }));
      if (editingId === id) {
        setEditingId(null);
        setEditForm({ title: "", content: "", tags: "" });
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  const loadComments = async (id) => {
    try {
      const cs = await api(`/community/posts/${id}/comments`);
      setComments((prev) => ({ ...prev, [id]: cs }));
    } catch (e) {
      setErr(e.message);
    }
  };

  const addComment = async (id, content) => {
    try {
      await api(`/community/posts/${id}/comments`, {
        method: "POST",
        body: { content },
      });
      loadComments(id);
    } catch (e) {
      setErr(e.message);
    }
  };

  // ✏️ เริ่มแก้ไขโพสต์
  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      title: p.title || "",
      content: p.content || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""),
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", content: "", tags: "" });
  };
  const saveEdit = async (id) => {
    try {
      const body = {
        title: editForm.title,
        content: editForm.content,
        tags: editForm.tags, // string (comma-separated)
      };
      const updated = await api(`/community/posts/${id}`, { method: "PUT", body });
      setList((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      setEditingId(null);
      setEditForm({ title: "", content: "", tags: "" });
    } catch (e) {
      setErr(e.message);
    }
  };

  const toggleComments = async (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
    // โหลดเมื่อเปิดครั้งแรก/ยังไม่มี
    if (!openComments[id] && !comments[id]) await loadComments(id);
  };

  return (
    <div className="grid">
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Community</h2>
          <div className="subtitle">พูดคุย แลกเปลี่ยน ไอเดียการเขียน C 🚀</div>
        </div>
        <div className="stats grid auto-fit" style={{ minWidth: 260 }}>
          <div className="stat-card">
            <div className="stat-label">โพสต์ทั้งหมด</div>
            <div className="stat-value">{counts.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ของฉัน</div>
            <div className="stat-value">{counts.mine}</div>
          </div>
        </div>
      </div>

      {err && <div className="warning">{err}</div>}

      {/* แถบค้นหา/กรอง */}
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div className="grid cols-3" style={{ gap: 12 }}>
          <div className="grid" style={{ gap: 6 }}>
            <label className="muted">ค้นหา</label>
            <input
              className="input"
              placeholder="ค้นหาด้วยหัวข้อหรือเนื้อหา..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <label className="muted">เรียงตาม</label>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">ใหม่ที่สุด</option>
              <option value="oldest">เก่าสุด</option>
              <option value="title">ชื่อ (A→Z)</option>
            </select>
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <label className="muted">&nbsp;</label>
            <label className="flex items-center" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
              />
              แสดงเฉพาะโพสต์ของฉัน
            </label>
          </div>
        </div>

        {/* ชิปแท็ก */}
        {allTags.length > 0 && (
          <div className="flex" style={{ flexWrap: "wrap", gap: 8 ,}}>
            <span className="muted">แท็ก:</span>
            <button
              className="badgeCommunityActive"
              style={{
                cursor: "pointer",
                borderColor: tagFilter === "" ? "var(--primary-2)" : undefined,
                boxShadow: tagFilter === "" ? "0 0 0 1px var(--primary-2) inset" : undefined,
              }}
              onClick={() => setTagFilter("")}
            >
              ทั้งหมด
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                className="badgeCommunityActive"
                style={{
                  cursor: "pointer",
                  borderColor: tagFilter === t ? "var(--primary-2)" : undefined,
                  boxShadow: tagFilter === t ? "0 0 0 1px var(--primary-2) inset" : undefined,
                }}
                onClick={() => setTagFilter((v) => (v === t ? "" : t))}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <div className="right">
          <button className="btn" onClick={load}>รีเฟรช</button>
        </div>
      </div>

      {/* ฟอร์มสร้างโพสต์ */}
      <div className="card">
        <h3>สร้างโพสต์</h3>
        {!user && <div className="warning">ต้องเข้าสู่ระบบเพื่อโพสต์</div>}
        <div className="grid">
          <input
            className="input"
            placeholder="หัวข้อ"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="input"
            placeholder="เนื้อหา"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <input
            className="input"
            placeholder="แท็ก (คั่นด้วย ,)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <button
            className="btn primary"
            onClick={addPost}
            disabled={!user || !form.title.trim() || !form.content.trim()}
          >
            โพสต์
          </button>
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ opacity: 0.6 }}>
              <div className="flex items-center gap-2">
                <div className="icon-wrap" style={{ width: 28, height: 28 }}>…</div>
                <div className="grow">
                  <div className="muted" style={{ height: 12, background: "#0e1530", borderRadius: 6 }} />
                  <div className="muted" style={{ height: 10, marginTop: 6, background: "#0e1530", borderRadius: 6 }} />
                </div>
              </div>
              <div className="muted" style={{ height: 60, marginTop: 12, background: "#0e1530", borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {/* รายการโพสต์ */}
      {!loading && filtered.map((p) => {
        const postAvatar = avatarThumb(p.profile_image, 28, 28);
        const editing = editingId === p.id;
        const tagsArr = Array.isArray(p.tags)
          ? p.tags
          : typeof p.tags === "string"
            ? p.tags.split(",").map((x) => x.trim()).filter(Boolean)
            : [];

        return (
          <div
            className="card"
            key={p.id}
            style={isOwnerOrAdmin(p) ? { borderColor: "#2d6bff" } : undefined}
          >
            {/* header */}
            <div className="flex items-center gap-2">
              <img
                src={postAvatar || AVATAR_FALLBACK}
                width={28}
                height={28}
                alt={`${p.first_name} ${p.last_name}`}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <div className="grow">
                <div style={{ lineHeight: 1.2, fontWeight: 600 }}>
                  {p.first_name} {p.last_name}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {new Date(p.created_at).toLocaleString()}
                  {p.updated_at && " · แก้ไข " + new Date(p.updated_at).toLocaleString()}
                </div>
              </div>

              {isOwnerOrAdmin(p) && !editing && (
                <>
                  <button className="btn" onClick={() => startEdit(p)}>แก้ไข</button>
                  <button className="btn danger" onClick={() => removePost(p.id)}>ลบโพสต์</button>
                </>
              )}
            </div>

            {/* โหมดดู / โหมดแก้ไข */}
            {!editing ? (
              <>
                <h3 style={{ margin: "12px 0 6px" }}>{p.title}</h3>
                <div className="mt-1" style={{ whiteSpace: "pre-wrap" }}>{p.content}</div>
                {tagsArr.length > 0 && (
                  <div className="mt-1 flex" style={{ flexWrap: "wrap", gap: 8 }}>
                    {tagsArr.map((t) => (
                      <button
                        key={t}
                        className="badgeCommunityActive"
                        style={{ cursor: "pointer" , background: tagFilter === t ? "#611296ff" : undefined }}
                        onClick={() => setTagFilter((v) => (v === t ? "" : t))}
                        title="คลิกเพื่อกรองตามแท็กนี้"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid mt-2">
                <input
                  className="input"
                  placeholder="หัวข้อ"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                />
                <textarea
                  className="input"
                  placeholder="เนื้อหา"
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="แท็ก (comma-separated)"
                  value={editForm.tags}
                  onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button
                    className="btn primary"
                    onClick={() => saveEdit(p.id)}
                    disabled={!editForm.title.trim() || !editForm.content.trim()}
                  >
                    บันทึก
                  </button>
                  <button className="btn" onClick={cancelEdit}>ยกเลิก</button>
                </div>
              </div>
            )}

            {/* คอมเมนต์ */}
            <div className="mt-2">
              <button className="btn" onClick={() => toggleComments(p.id)}>
                {openComments[p.id] ? "ซ่อนคอมเมนต์" : "แสดงคอมเมนต์"}
              </button>
            </div>

            {openComments[p.id] && (
              <div className="mt-2">
                <h4>ความคิดเห็น</h4>
                {(comments[p.id] || []).map((c) => {
                  const cAvatar = avatarThumb(c.profile_image, 24, 24);
                  return (
                    <div key={c.id} className="mt-1">
                      <div className="flex items-start gap-2">
                        <img
                          src={cAvatar || AVATAR_FALLBACK}
                          alt="avatar"
                          width={24}
                          height={24}
                          style={{ borderRadius: "50%", objectFit: "cover", marginTop: 2 }}
                        />
                        <div className="grow">
                          <div className="flex items-center gap-2" style={{ lineHeight: 1.2 }}>
                            <b>{c.first_name} {c.last_name}</b>
                            {c.is_verified && <span className="badge">verified</span>}
                            <span className="muted" style={{ fontSize: 12 }}>
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ whiteSpace: "pre-wrap" }}>{c.content}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {user && <AddComment onSubmit={(text) => addComment(p.id, text)} />}
              </div>
            )}
          </div>
        );
      })}

      {!loading && filtered.length === 0 && (
        <div className="card">
          <div className="muted">ยังไม่มีโพสต์ที่ตรงกับเงื่อนไข</div>
        </div>
      )}
    </div>
  );
}

function AddComment({ onSubmit }) {
  const [text, setText] = useState("");
  return (
    <div className="flex mt-2">
      <input
        className="input"
        placeholder="พิมพ์คอมเมนต์..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn primary"
        onClick={() => {
          if (text.trim()) onSubmit(text);
          setText("");
        }}
      >
        ส่ง
      </button>
    </div>
  );
}
