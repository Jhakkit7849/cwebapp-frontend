import { useState } from "react";

/** ช่องรหัสผ่านพร้อมปุ่ม "แสดง/ซ่อน" ทางขวา
 * props: value, onChange, placeholder, autoComplete, disabled, name, id
 */
export default function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "new-password",
  disabled = false,
  name,
  id,
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-field">
      <input
        id={id}
        name={name}
        className="input"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <button
        type="button"
        className="icon-btn"
        aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        title={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
