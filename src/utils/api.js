const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path, { method='GET', body, token, noAuth=false } = {}) {
  const headers = {};
  const t = token || localStorage.getItem('token');
  if (!noAuth && t) headers['Authorization'] = 'Bearer ' + t;

  const isForm = (typeof FormData !== 'undefined') && body instanceof FormData;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    credentials: 'include', // ส่ง cookie ด้วยเสมอ
  });

  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.message || msg } catch {}
    throw new Error(msg + ` (${res.status})`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}
