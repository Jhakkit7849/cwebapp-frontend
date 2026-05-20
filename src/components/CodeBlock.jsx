import React from "react";
import { useNavigate } from "react-router-dom";

export default function CodeBlock({ code, lang = "c" }) {
  const navigate = useNavigate();

  const goTryIt = () => {
    const encoded = encodeURIComponent(code || "");
    navigate(`/sandbox?lang=${encodeURIComponent(lang)}&code=${encoded}`);
  };

  return (
    <div className="block codewrap">
      <div className="codehead">
        <span className="lang">{(lang || "c").toUpperCase()}</span>
        <button className="try-btn" onClick={goTryIt}>Try it yourself</button>
      </div>
      <div className="codebox">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
}
