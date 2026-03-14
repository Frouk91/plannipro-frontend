import React, { useState, useEffect, useMemo, useCallback } from "react";

const API = "https://plannipro-backend.onrender.com/api";
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const COLORS = [
  "#6366f1", "#818cf8", "#3b82f6", "#0ea5e9", "#06b6d4", "#8b5cf6", "#a855f7", "#d946ef",
  "#10b981", "#14b8a6", "#22c55e", "#84cc16", "#65a30d",
  "#f59e0b", "#eab308", "#f97316", "#fb923c",
  "#ef4444", "#dc2626", "#ec4899", "#f43f5e",
  "#64748b", "#475569", "#1e293b", "#78716c", "#92400e",
];
const AGENT_ALLOWED_CODES = ["cp", "_cp", "rtt", "_rtt", "teletravail", "pont", "veille_de_cp", "veille_de_ferie"];
const PRESENCE_CODES = ["rueil", "paris"];
function isPresenceType(t) { return PRESENCE_CODES.includes((t.code || "").toLowerCase()) || ["rueil", "paris"].includes((t.label || "").toLowerCase()); }
function isPresenceCode(code, label) { return PRESENCE_CODES.includes((code || "").toLowerCase()) || ["rueil", "paris"].includes((label || "").toLowerCase()); }
const PRESENCE_COLORS = { rueil: "#0d9488", paris: "#7c3aed" };
const PRESENCE_MAX_PER_WEEK = 2;
const DEMO_USERS = [
  { email: "redouane@entreprise.fr", password: "admin1234" },
  { email: "sophie@entreprise.fr", password: "sophie123" },
  { email: "lucas@entreprise.fr", password: "lucas123" },
  { email: "emma@entreprise.fr", password: "emma1234" },
];

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Outfit:wght@300;400;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', sans-serif; background: #060818; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(6,8,24,0.8); border-radius: 10px; }
  ::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #818cf8; }
  ::-webkit-scrollbar-corner { background: transparent; }

  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
  @keyframes modalPop { from { opacity:0; } to { opacity:1; } }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
  .cell-hover:hover { background: rgba(59,130,246,0.15) !important; }
  .btn-primary { transition: all 0.2s ease; }
  .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,0.4) !important; }
  .nav-btn { transition: all 0.15s ease; }
  .nav-btn:hover { background: rgba(59,130,246,0.1) !important; }
  .card { transition: all 0.2s ease; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.2) !important; }
  input:focus, textarea:focus, select:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.2) !important; outline: none; }
  .half-tooltip { position: relative; }
  .half-tooltip::before { content: ''; position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: rgba(15,23,42,0.92); pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 9999; }
  .half-tooltip::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%); background: rgba(15,23,42,0.92); color: #fff; font-size: 11px; font-weight: 600; font-family: 'Outfit', sans-serif; padding: 6px 12px; border-radius: 8px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 9999; letter-spacing: 0.2px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); }
  .half-tooltip:hover::after, .half-tooltip:hover::before { opacity: 1; }
  .btn-conge-expand { display:flex; align-items:center; justify-content:flex-start; width:30px; height:30px; padding:0 8px; background:linear-gradient(135deg,#6366f1,#818cf8); color:white; border:none; border-radius:15px; cursor:pointer; overflow:hidden; transition:width 0.3s ease-out, box-shadow 0.2s; box-shadow:0 3px 12px rgba(99,102,241,0.4); flex-shrink:0; }
  .btn-conge-expand svg { flex-shrink:0; width:14px; height:14px; }
  .btn-conge-expand .btn-label { font-family:'Outfit',sans-serif; font-weight:700; font-size:12px; white-space:nowrap; opacity:0; transition:opacity 0.15s ease-out 0.1s; margin-left:7px; }
  .btn-conge-expand:hover { width:175px; box-shadow:0 4px 18px rgba(99,102,241,0.55); }
  .btn-conge-expand:hover .btn-label { opacity:1; }
`;

// ─── JOURS FÉRIÉS FRANÇAIS ───
function getEaster(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
}
function getFeries(year) {
  const e = getEaster(year);
  const add = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };
  const k = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    [k(new Date(year, 0, 1))]: "Nouvel An",
    [k(add(e, 1))]: "Lundi de Pâques",
    [k(new Date(year, 4, 1))]: "Fête du Travail",
    [k(new Date(year, 4, 8))]: "Victoire 1945",
    [k(add(e, 39))]: "Ascension",
    [k(add(e, 50))]: "Lundi de Pentecôte",
    [k(new Date(year, 6, 14))]: "Fête Nationale",
    [k(new Date(year, 7, 15))]: "Assomption",
    [k(new Date(year, 10, 1))]: "Toussaint",
    [k(new Date(year, 10, 11))]: "Armistice",
    [k(new Date(year, 11, 25))]: "Noël",
  };
}

const LEAVE_ORDER = ["cp", "congé payé", "rtt", "½ cp", "½cp", "1/2 cp", "½ rtt", "½rtt", "1/2 rtt", "veille de cp", "veille de férié", "absence", "pont", "formation", "rueil", "paris"];
function sortLeaveTypes(lts) {
  return [...lts].sort((a, b) => {
    const ai = LEAVE_ORDER.indexOf((a.label || "").toLowerCase().trim());
    const bi = LEAVE_ORDER.indexOf((b.label || "").toLowerCase().trim());
    if (ai === -1 && bi === -1) return (a.label || "").localeCompare(b.label || "");
    if (ai === -1) return 1; if (bi === -1) return -1; return ai - bi;
  });
}

function hexToLight(hex) {
  try { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},0.1)`; }
  catch { return "#f3f4f6"; }
}
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { let d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function dateKey(y, m, d) { return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
function isWeekend(y, m, d) { const w = new Date(y, m, d).getDay(); return w === 0 || w === 6; }
function formatDate(s) { if (!s) return ""; const p = s.split("T")[0].split("-"); return `${p[2]}/${p[1]}/${p[0]}`; }
function getInitials(name) { return (name || "?").split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2); }
function agentHue(id) { return Math.abs((id || "").toString().split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360; }
function teamGradient(team) {
  const map = {
    "Css Digital":      "linear-gradient(135deg,#3b82f6,#60a5fa)",
    "Mailing Solution": "linear-gradient(135deg,#7c3aed,#a78bfa)",
    "MANAGER":            "linear-gradient(135deg,#059669,#34d399)",
  };
  if (map[team]) return map[team];
  const hue = Math.abs((team || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  return "linear-gradient(135deg,hsl(" + hue + ",55%,50%),hsl(" + (hue + 30) + ",65%,62%))";
}
function addDays(dateStr, n) { const d = new Date(dateStr); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function compareDates(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function getHalfDayPeriod(leave) {
  var r = (leave && leave.reason) ? leave.reason : "";
  if (r.startsWith("[matin]")) return "matin";
  if (r.startsWith("[apres-midi]")) return "apres-midi";
  return "matin";
}
function isHalfDay(leave) {
  if (!leave) return false;
  var label = (leave.label || "").toLowerCase();
  var code = (leave.code || "").toLowerCase();
  return (label.includes("1/2") || label.includes("½") || code.startsWith("_") || code === "veille_de_cp" || code === "veille_de_ferie" || label === "veille de cp" || label === "veille de férié");
}
function HalfDayCell({ color, label, isMatin, size, fontSize, pad }) {
  var w = "calc(100% - " + (pad * 2) + "px)";
  var r = size === 24 ? 4 : 3;
  var m = "0 " + pad + "px";
  var topBg = isMatin ? color : "#fff";
  var botBg = isMatin ? "#fff" : color;
  var topColor = isMatin ? "#fff" : color;
  var botColor = isMatin ? color : "#fff";
  return (
    <div style={{ width: w, height: size, margin: m, borderRadius: r, overflow: "hidden", background: "#fff", border: "1px solid " + color }}>
      <div style={{ height: "50%", background: topBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: fontSize, fontWeight: 800, color: topColor, lineHeight: 1 }}>½</span>
      </div>
      <div style={{ height: "50%", background: botBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: fontSize, fontWeight: 800, color: botColor, lineHeight: 1 }}>{label}</span>
      </div>
    </div>
  );
}
function teamPalette(teamName) {
  const palettes = {
    "Css Digital":      { row: "#eef5ff", wk: "#d8e8f8", header: "#bfdbfe", border: "#3b82f6", text: "#1e40af", accent: "#3b82f6" },
    "Mailing Solution": { row: "#f2eeff", wk: "#e0d4f8", header: "#ddd6fe", border: "#7c3aed", text: "#5b21b6", accent: "#7c3aed" },
    "MANAGER":          { row: "#ecfdf5", wk: "#c6f0de", header: "#a7f3d0", border: "#059669", text: "#065f46", accent: "#059669" },
  };
  const defaults = [
    { row: "#edfdf4", wk: "#cef0dc", header: "#bbf7d0", border: "#22c55e", text: "#166534", accent: "#22c55e" },
    { row: "#fff4e6", wk: "#fde4c0", header: "#fed7aa", border: "#f97316", text: "#9a3412", accent: "#f97316" },
    { row: "#fef0f8", wk: "#f9d5ec", header: "#fbcfe8", border: "#ec4899", text: "#9d174d", accent: "#ec4899" },
    { row: "#e8fafa", wk: "#c4eaec", header: "#a5f3fc", border: "#06b6d4", text: "#0e7490", accent: "#06b6d4" },
  ];
  if (palettes[teamName]) return palettes[teamName];
  const idx = Math.abs((teamName||"").split("").reduce((a,c) => a + c.charCodeAt(0), 0)) % defaults.length;
  return defaults[idx];
}
function leaveAbbr(label) {
  if (!label) return "???";
  const map = { "½ CP": "½CP", "½ RTT": "½RTT", "Congé payé": "CP", "CP": "CP", "RTT": "RTT", "Pont": "Pt", "Formation": "FOR", "Absence": "ABS", "Rueil": "R", "Paris": "P", "Veille de CP": "VCP", "Veille de Férié": "VDF" };
  if (map[label]) return map[label];
  return label.replace(/[^a-zA-Z0-9½]/g, "").slice(0, 4).toUpperCase() || label.slice(0, 3).toUpperCase();
}
function getWeekDays(year, month, day) {
  const date = new Date(year, month, day);
  const dow = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const mon = new Date(date); mon.setDate(date.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}
function dKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

function leaveFromBackend(l) {
  // Fallback si code NULL (type créé avant le fix backend)
  const code = l.leave_type_code || (l.leave_type_label || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return { id: code, code, label: l.leave_type_label, color: l.color, bg: hexToLight(l.color) };
}
function requestFromBackend(l) {
  return {
    id: l.id, agentId: l.agent_id, agentName: `${l.first_name || ""} ${l.last_name || ""}`.trim(),
    agentAvatar: l.avatar_initials || getInitials(`${l.first_name || ""} ${l.last_name || ""}`),
    agentTeam: l.team_name || "", leaveType: leaveFromBackend(l),
    start: (l.start_date || "").split("T")[0], end: (l.end_date || "").split("T")[0],
    reason: l.reason || "", status: l.status, createdAt: l.created_at
  };
}
async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || `Erreur ${res.status}`);
  return data;
}

// ─── LOGIN ───
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [showPwd, setShowPwd] = useState(false); const [showDemo, setShowDemo] = useState(false);
  async function handleLogin() {
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", null, { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
      if (data.accessToken) onLogin({ ...data.agent, token: data.accessToken });
      else setError("Email ou mot de passe incorrect.");
    } catch { setError("Erreur de connexion au serveur."); }
    setLoading(false);
  }
  return (
    <div style={{ minHeight: "100vh", background: "#060818", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Vignette bords */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none", zIndex: 1 }} />
      <style>{GLOBAL_STYLE}</style>
      <style>{`
        @keyframes aurora1 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(60px,-40px) scale(1.15);} 66%{transform:translate(-30px,50px) scale(0.9);} }
        @keyframes aurora2 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(-80px,30px) scale(1.1);} 66%{transform:translate(50px,-60px) scale(1.2);} }
        @keyframes aurora3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,40px) scale(1.25);} }
        @keyframes gridPulse { 0%,100%{opacity:0.03;} 50%{opacity:0.07;} }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes particle { 0%{transform:translateY(0px) scale(1);opacity:0;} 20%{opacity:1;} 80%{opacity:1;} 100%{transform:translateY(-120px) scale(0.4);opacity:0;} }
        @keyframes shimmer { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 40px rgba(99,102,241,0.3),0 25px 50px rgba(0,0,0,0.5);} 50%{box-shadow:0 0 80px rgba(99,102,241,0.5),0 25px 50px rgba(0,0,0,0.5);} }
        @keyframes clockRing { 0%,100%{transform:rotate(0deg);} 10%{transform:rotate(-8deg);} 20%{transform:rotate(8deg);} 30%{transform:rotate(-6deg);} 40%{transform:rotate(6deg);} 50%{transform:rotate(-3deg);} 60%{transform:rotate(3deg);} 70%,100%{transform:rotate(0deg);} }
        @keyframes bellBounce { 0%,100%{transform:translateY(0);} 25%{transform:translateY(-3px);} 75%{transform:translateY(2px);} }
        @keyframes handTick { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        @keyframes handTickMin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        @keyframes floatIllus { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-8px);} }
        @keyframes pencilWiggle { 0%,90%,100%{transform:rotate(-18deg);} 92%{transform:rotate(-22deg);} 96%{transform:rotate(-14deg);} }
        @keyframes markPop { 0%,100%{transform:scale(1);opacity:0.7;} 50%{transform:scale(1.3);opacity:1;} }
      `}</style>

      {/* Aurora blobs */}
      <div style={{position:"absolute",top:"-20%",left:"-10%",width:"70vw",height:"70vw",background:"radial-gradient(ellipse,rgba(99,102,241,0.35) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(60px)",animation:"aurora1 18s ease-in-out infinite",willChange:"transform"}} />
      <div style={{position:"absolute",bottom:"-20%",right:"-15%",width:"65vw",height:"65vw",background:"radial-gradient(ellipse,rgba(6,182,212,0.25) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(70px)",animation:"aurora2 22s ease-in-out infinite",willChange:"transform"}} />
      <div style={{position:"absolute",top:"30%",right:"10%",width:"40vw",height:"40vw",background:"radial-gradient(ellipse,rgba(139,92,246,0.2) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(50px)",animation:"aurora3 15s ease-in-out infinite",willChange:"transform"}} />

      {/* Grille */}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",backgroundSize:"48px 48px",animation:"gridPulse 8s ease-in-out infinite"}} />

      {/* Particules */}
      {[...Array(12)].map((_,i) => (
        <div key={i} style={{
          position:"absolute",
          left:`${8+i*7.5}%`,
          bottom:`${10+Math.sin(i*1.3)*15}%`,
          width: i%3===0?3:2,
          height: i%3===0?3:2,
          borderRadius:"50%",
          background: i%2===0 ? "rgba(99,102,241,0.8)" : "rgba(6,182,212,0.6)",
          animation:`particle ${4+i*0.7}s ease-in-out infinite`,
          animationDelay:`${i*0.4}s`,
          willChange:"transform,opacity"
        }} />
      ))}

      <div style={{ width: "100%", maxWidth: "960px", padding: "20px 40px", position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 0, minHeight: "100vh" }}>

        {/* COLONNE GAUCHE — Illustration */}
        <div style={{ flex: "0 0 45%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 48px 40px 0", borderRight: "1px solid rgba(165,180,252,0.1)", minHeight: "60vh" }}>

        {/* En-tête + Illustration */}
        <div style={{ marginBottom: "28px", textAlign: "center", animation: "slideInUp 0.7s ease both" }}>

          {/* Illustration SVG */}
          <div style={{ display: "inline-block", animation: "floatIllus 5s ease-in-out infinite", marginBottom: 32, filter: "drop-shadow(0 20px 50px rgba(99,102,241,0.4))" }}>
            <svg width="280" height="195" viewBox="0 0 240 165" fill="none" xmlns="http://www.w3.org/2000/svg">

              {/* ── CALENDRIER ── */}
              {/* Ombre portée calendrier */}
              <ellipse cx="110" cy="152" rx="65" ry="7" fill="rgba(0,0,0,0.25)" />
              {/* Corps */}
              <rect x="48" y="30" width="114" height="112" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(99,102,241,0.6)" strokeWidth="2" />
              <rect x="48" y="30" width="114" height="112" rx="10" fill="url(#calGrad)" />
              {/* En-tête calendrier */}
              <rect x="48" y="30" width="114" height="28" rx="10" fill="rgba(99,102,241,0.75)" />
              <rect x="48" y="44" width="114" height="14" fill="rgba(99,102,241,0.75)" />
              {/* Anneaux calendrier */}
              <rect x="75" y="22" width="8" height="16" rx="4" fill="rgba(99,102,241,0.9)" />
              <rect x="127" y="22" width="8" height="16" rx="4" fill="rgba(99,102,241,0.9)" />
              {/* Texte mois */}
              {/* Jour de la semaine */}
              <text x="110" y="42" textAnchor="middle" fontSize="7.5" fontWeight="400" fill="rgba(255,255,255,0.7)" fontFamily="'Space Grotesk', sans-serif" letterSpacing="2.5">{new Date().toLocaleDateString("fr-FR",{weekday:"long"}).toUpperCase()}</text>
              {/* Jour numéro + mois */}
              <text x="110" y="52" textAnchor="middle" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.98)" fontFamily="'Space Grotesk', sans-serif" letterSpacing="1">{new Date().getDate()+" "+new Date().toLocaleDateString("fr-FR",{month:"long"}).toUpperCase()+" "+new Date().getFullYear()}</text>

              {/* Grille jours */}
              {/* Ligne 1 */}
              <rect x="56" y="66" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="74" y="66" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="92" y="66" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="110" y="66" width="14" height="14" rx="3" fill="rgba(99,102,241,0.5)" />
              <rect x="128" y="66" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="146" y="66" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              {/* Croix rouge l1 */}
              <line x1="58" y1="68" x2="68" y2="78" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              <line x1="68" y1="68" x2="58" y2="78" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              <line x1="94" y1="68" x2="104" y2="78" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              <line x1="104" y1="68" x2="94" y2="78" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="135" cy="73" r="5" fill="rgba(99,102,241,0.7)" style={{animation:"markPop 2.5s ease-in-out infinite", animationDelay:"0.3s"}} />
              {/* Ligne 2 */}
              <rect x="56" y="84" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="74" y="84" width="14" height="14" rx="3" fill="rgba(6,182,212,0.35)" />
              <rect x="92" y="84" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="110" y="84" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="128" y="84" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="146" y="84" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <line x1="130" y1="86" x2="140" y2="96" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              <line x1="140" y1="86" x2="130" y2="96" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              {/* Ligne 3 */}
              <rect x="56" y="102" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="74" y="102" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="92" y="102" width="14" height="14" rx="3" fill="rgba(245,158,11,0.5)" />
              <rect x="110" y="102" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="128" y="102" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="146" y="102" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <circle cx="81" cy="109" r="5" fill="rgba(6,182,212,0.8)" style={{animation:"markPop 2.5s ease-in-out infinite", animationDelay:"1s"}} />
              <line x1="58" y1="104" x2="68" y2="114" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              <line x1="68" y1="104" x2="58" y2="114" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
              {/* Ligne 4 */}
              <rect x="56" y="120" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="74" y="120" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="92" y="120" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <rect x="110" y="120" width="14" height="14" rx="3" fill="rgba(99,102,241,0.5)" />
              <rect x="128" y="120" width="14" height="14" rx="3" fill="rgba(255,255,255,0.06)" />
              <circle cx="146" cy="121" r="5" fill="rgba(245,158,11,0.8)" style={{animation:"markPop 2.5s ease-in-out infinite", animationDelay:"1.7s"}} />

              {/* ── RÉVEIL (animation ring) ── */}
              <g style={{transformOrigin:"34px 98px", animation:"clockRing 4s ease-in-out infinite", animationDelay:"2s"}}>
                {/* Ombre */}
                <ellipse cx="34" cy="118" rx="20" ry="4" fill="rgba(0,0,0,0.2)" />
                {/* Clochettes */}
                <g style={{animation:"bellBounce 0.2s ease-in-out infinite", animationDelay:"2s"}}>
                  <circle cx="18" cy="82" r="5" fill="rgba(99,102,241,0.8)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <circle cx="50" cy="82" r="5" fill="rgba(99,102,241,0.8)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  {/* Marteaux */}
                  <rect x="13" y="84" width="5" height="3" rx="1.5" fill="rgba(165,180,252,0.9)" transform="rotate(-20,13,84)" />
                  <rect x="50" y="84" width="5" height="3" rx="1.5" fill="rgba(165,180,252,0.9)" transform="rotate(20,50,84)" />
                </g>
                {/* Corps réveil */}
                <circle cx="34" cy="100" r="22" fill="rgba(30,41,59,0.9)" stroke="rgba(99,102,241,0.7)" strokeWidth="2.5" />
                <circle cx="34" cy="100" r="18" fill="rgba(15,23,42,0.95)" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
                {/* Graduations */}
                {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
                  const r1 = i%3===0 ? 14 : 15.5, r2 = 17;
                  const rad = (deg-90)*Math.PI/180;
                  return <line key={deg} x1={34+r1*Math.cos(rad)} y1={100+r1*Math.sin(rad)} x2={34+r2*Math.cos(rad)} y2={100+r2*Math.sin(rad)} stroke={i%3===0?"rgba(165,180,252,0.8)":"rgba(148,163,184,0.3)"} strokeWidth={i%3===0?1.5:1} />;
                })}
                {/* Aiguille minutes */}
                <line x1="34" y1="100" x2="34" y2="86" stroke="rgba(165,180,252,0.95)" strokeWidth="1.5" strokeLinecap="round" style={{transformOrigin:"34px 100px", animation:"handTickMin 60s linear infinite"}} />
                {/* Aiguille heures */}
                <line x1="34" y1="100" x2="40" y2="94" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" style={{transformOrigin:"34px 100px", animation:"handTick 12s linear infinite"}} />
                {/* Aiguille secondes */}
                <line x1="34" y1="104" x2="34" y2="85" stroke="rgba(239,68,68,0.9)" strokeWidth="1" strokeLinecap="round" style={{transformOrigin:"34px 100px", animation:"handTick 1s linear infinite"}} />
                {/* Centre */}
                <circle cx="34" cy="100" r="2.5" fill="rgba(239,68,68,0.9)" />
                {/* Pied */}
                <path d="M26,120 Q34,124 42,120" stroke="rgba(99,102,241,0.7)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>



              {/* Lignes ondulées décoratives (traits de texte) */}
              <line x1="56" y1="57" x2="90" y2="57" stroke="rgba(165,180,252,0.4)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="56" y1="61" x2="78" y2="61" stroke="rgba(165,180,252,0.25)" strokeWidth="1" strokeLinecap="round" />

              {/* Dégradé fond calendrier */}
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(15,23,42,0.85)" />
                  <stop offset="100%" stopColor="rgba(30,41,59,0.7)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "52px",
            fontWeight: "800",
            margin: "0 0 10px",
            letterSpacing: "-3px",
            background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 40%, #a5b4fc 70%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 20px rgba(165,180,252,0.4))",
            lineHeight: 1.1
          }}>Planning</h1>
          <p style={{ margin: "10px 0 0", animation: "slideInUp 0.7s ease 0.15s both", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 28, height: 1, background: "linear-gradient(90deg,transparent,rgba(165,180,252,0.5))" }} />
            <span style={{ color: "rgba(165,180,252,0.7)", fontSize: "12px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>Présences & Congés</span>
            <span style={{ display: "inline-block", width: 28, height: 1, background: "linear-gradient(90deg,rgba(165,180,252,0.5),transparent)" }} />
          </p>
        </div>

        </div>{/* fin colonne gauche */}

        {/* COLONNE DROITE — Formulaire */}
        <div style={{ flex: "0 0 55%", padding: "40px 0 40px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* Titre colonne droite */}
        <div style={{ marginBottom: 28, animation: "slideInUp 0.6s ease both" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Bienvenue 👋</h2>
          <p style={{ fontSize: 13, color: "rgba(148,163,184,0.7)", margin: 0 }}>Connectez-vous pour accéder à votre espace</p>
        </div>

        {/* Formulaire */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(165,180,252,0.15)", borderRadius: "28px", padding: "40px 36px 32px", backdropFilter: "blur(32px)", animation: "slideInUp 0.7s ease 0.25s both, glowPulse 4s ease-in-out infinite", boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset" }}>

          {/* Email */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", fontWeight: "600", color: "rgba(165,180,252,0.8)", marginBottom: "8px", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}><span style={{ width: 3, height: 12, background: "linear-gradient(180deg,#6366f1,#06b6d4)", borderRadius: 2, display: "inline-block" }} />Identifiant</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", zIndex: 5 }}>✉️</span>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="vous@quadient.com"
                style={{ width: "100%", padding: "15px 16px 15px 48px", borderRadius: "14px", border: "1.5px solid rgba(99,102,241,0.2)", background: "rgba(15,23,42,0.6)", fontSize: "14px", color: "#f1f5f9", transition: "all 0.3s", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }}
                onFocus={e => { e.target.style.border = "1.5px solid #6366f1"; e.target.style.background = "rgba(30,41,59,0.8)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={e => { e.target.style.border = "1.5px solid rgba(148,163,184,0.15)"; e.target.style.background = "rgba(30,41,59,0.5)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", fontWeight: "600", color: "rgba(165,180,252,0.8)", marginBottom: "8px", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}><span style={{ width: 3, height: 12, background: "linear-gradient(180deg,#6366f1,#06b6d4)", borderRadius: 2, display: "inline-block" }} />Mot de passe</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔐</span>
              <input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                style={{ width: "100%", padding: "15px 48px 15px 48px", borderRadius: "14px", border: "1.5px solid rgba(99,102,241,0.2)", background: "rgba(15,23,42,0.6)", fontSize: "14px", color: "#f1f5f9", transition: "all 0.3s", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }}
                onFocus={e => { e.target.style.border = "1.5px solid #3b82f6"; e.target.style.background = "rgba(30,41,59,0.8)"; e.target.style.boxShadow = "0 0 20px rgba(59, 130, 246, 0.2)"; }}
                onBlur={e => { e.target.style.border = "1.5px solid rgba(148,163,184,0.2)"; e.target.style.background = "rgba(30,41,59,0.5)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Message d'erreur */}
          {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "14px", padding: "13px 16px", marginBottom: "20px", fontSize: "13px", color: "#fca5a5", display: "flex", alignItems: "center", gap: "10px", backdropFilter: "blur(8px)", boxShadow: "0 4px 20px rgba(239,68,68,0.1)" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{error}</span>
          </div>}

          {/* Bouton de connexion */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", padding: "14px 0", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: loading ? "default" : "pointer", transition: "all 0.3s", boxShadow: "0 8px 32px rgba(99,102,241,0.4)", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: "0.3px", position: "relative", overflow: "hidden" }}
            onMouseEnter={e => !loading && (e.target.style.boxShadow = "0 15px 40px rgba(59, 130, 246, 0.4)")}
            onMouseLeave={e => !loading && (e.target.style.boxShadow = "0 10px 30px rgba(59, 130, 246, 0.3)")}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: "8px", animation: "spin 1s linear infinite" }}>
                  <circle cx="8" cy="8" r="6" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="10,16" />
                </svg>
                Connexion...
              </>
            ) : "Se connecter →"}
          </button>
        </div>

        {/* Comptes démo repliés */}
        <div style={{ marginTop: "20px", animation: "slideInUp 0.7s ease 0.4s both" }}>
          <button onClick={() => setShowDemo(s => !s)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 0" }}>
            <span style={{ display: "inline-block", flex: 1, height: 1, background: "rgba(148,163,184,0.15)" }} />
            <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>Comptes de test {showDemo ? "▴" : "▾"}</span>
            <span style={{ display: "inline-block", flex: 1, height: 1, background: "rgba(148,163,184,0.15)" }} />
          </button>
          {showDemo && (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DEMO_USERS.map((u, i) => (
                <button key={i} onClick={() => { setEmail(u.email); setPassword(u.password); setError(""); }}
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; }}>
                  <div style={{ color: "#e2e8f0", fontSize: "11px", fontWeight: "700", fontFamily: "'Space Grotesk', sans-serif" }}>{u.email.split("@")[0]}</div>
                  <div style={{ color: "rgba(148,163,184,0.6)", fontSize: "10px", marginTop: 2 }}>{u.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        </div>{/* fin colonne droite */}

      </div>
    </div>
  );
}

function Modal({ title, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
      <div style={{ background: "linear-gradient(145deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, width: 480, maxWidth: "95vw", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto", animation: "slideIn 0.2s ease" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
function ModalButtons({ onCancel, onConfirm, confirmLabel, confirmColor, disabled }) {
  return (<div style={{ display: "flex", gap: 10 }}>
    <button onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>Annuler</button>
    <button onClick={onConfirm} disabled={disabled} className="btn-primary" style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: disabled ? "rgba(255,255,255,0.05)" : (confirmColor || "linear-gradient(135deg,#6366f1,#818cf8)"), color: disabled ? "#475569" : "#fff", cursor: disabled ? "default" : "pointer", fontSize: 14, fontWeight: 600 }}>{confirmLabel}</button>
  </div>);
}
function Field({ label, value, onChange, placeholder, style = {} }) {
  return (<div style={style}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</label>}
    <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 14, transition: "all 0.2s" }} />
  </div>);
}

function ContextMenu({ x, y, leave, onDeleteDay, onDeleteAll, onClose }) {
  const isMultiDay = leave.leaveStart !== leave.leaveEnd;
  const menuW = 240;
  const menuH = isMultiDay ? 140 : 100;
  const safeX = Math.min(x, window.innerWidth - menuW - 8);
  const safeY = Math.min(y, window.innerHeight - menuH - 8);
  return (
    <div onClick={e => e.stopPropagation()}
      style={{ position: "fixed", top: safeY, left: safeX, background: "linear-gradient(145deg,#0f172a,#1e293b)", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", zIndex: 99999, minWidth: menuW, overflow: "hidden", animation: "slideIn 0.15s ease" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "#94a3b8", fontWeight: 600, background: "rgba(255,255,255,0.04)" }}>
        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: leave.color, marginRight: 8 }}></span>{leave.label}
      </div>
      <button onClick={e => { e.stopPropagation(); onDeleteDay(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#d97706", fontWeight: 500 }}>✂️ Supprimer ce jour seulement</button>
      {isMultiDay && <button onClick={e => { e.stopPropagation(); onDeleteAll(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 16px", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", fontWeight: 500 }}>🗑 Supprimer toute la période</button>}
      <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 16px", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", background: "none", cursor: "pointer", fontSize: 13, color: "#475569" }}>✕ Annuler</button>
    </div>
  );
}

// ─── ADMIN ───
function ColorPicker({ selected, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)} style={{
          width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer",
          border: selected === c ? "3px solid #1e293b" : "2px solid transparent",
          boxShadow: selected === c ? "0 0 0 2px #fff inset" : "none",
          flexShrink: 0, transition: "transform 0.1s"
        }} />
      ))}
    </div>
  );
}

function LeaveTypeEditRow({ lt, onSave, onCancel }) {
  const [label, setLabel] = useState(lt.label);
  const [color, setColor] = useState(lt.color);
  return (
    <div style={{ padding: "12px 16px", background: "#f8fafc" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
          autoFocus
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <ColorPicker selected={color} onChange={setColor} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" onClick={() => onSave(label, color)} style={{ flex: 1, padding: "5px", borderRadius: 6, border: "none", background: "#1e293b", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Enregistrer</button>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: "5px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 11, color: "#475569" }}>Annuler</button>
      </div>
    </div>
  );
}


function AdminPanel({ agents, teams, leaveTypes, token, onAgentAdded, onAgentUpdated, onAgentDeleted, onTeamAdded, onTeamDeleted, onLeaveTypeAdded, onLeaveTypeUpdated, onLeaveTypeDeleted, showNotif }) {
  const [tab, setTab] = useState("agents");
  const [addModal, setAddModal] = useState(false); const [editModal, setEditModal] = useState(null); const [deleteModal, setDeleteModal] = useState(null); const [editLT, setEditLT] = useState(null);
  const [newAgent, setNewAgent] = useState({ first_name: "", last_name: "", email: "", password: "", role: "agent", team: "" }); const [editData, setEditData] = useState({});
  const [newTeam, setNewTeam] = useState(""); const [newLT, setNewLT] = useState({ label: "", color: COLORS[0] }); const [showAddLTModal, setShowAddLTModal] = useState(false); const [loading, setLoading] = useState(false);
  const [teamModal, setTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  async function handleAddAgent() {
    if (!newAgent.first_name || !newAgent.email || !newAgent.password) return; setLoading(true);
    try {
      const data = await apiFetch("/auth/register", token, { method: "POST", body: JSON.stringify(newAgent) });
      if (data.agent) { onAgentAdded({ id: data.agent.id, name: `${newAgent.first_name} ${newAgent.last_name}`, email: newAgent.email, role: newAgent.role, team: newAgent.team, avatar: getInitials(`${newAgent.first_name} ${newAgent.last_name}`) }); setAddModal(false); setNewAgent({ first_name: "", last_name: "", email: "", password: "", role: "agent", team: "" }); showNotif("Agent ajouté ✅"); }
      else showNotif(data.errors?.[0]?.msg || "Erreur", "error");
    } catch { showNotif("Erreur", "error"); } setLoading(false);
  }
  async function handleAddTeam() { if (!newTeam.trim()) return; try { const data = await apiFetch("/teams", token, { method: "POST", body: JSON.stringify({ name: newTeam.trim() }) }); if (data.id) { onTeamAdded(data); setNewTeam(""); showNotif("Équipe ajoutée ✅"); } } catch { showNotif("Erreur", "error"); } }
  async function handleDeleteTeam(team) { try { await apiFetch(`/teams/${team.id}`, token, { method: "DELETE" }); onTeamDeleted(team.id); showNotif("Équipe supprimée", "error"); } catch { showNotif("Erreur", "error"); } }
  async function handleAddLT() { if (!newLT.label.trim()) return; try { const data = await apiFetch("/leave-types", token, { method: "POST", body: JSON.stringify({ label: newLT.label.trim(), color: newLT.color }) }); if (data.id) { onLeaveTypeAdded({ ...data, bg: hexToLight(data.color) }); setNewLT({ label: "", color: COLORS[0] }); showNotif("Type ajouté ✅"); } } catch { showNotif("Erreur", "error"); } }
  async function handleUpdateLT(lt, newLabel, newColor) { try { await apiFetch(`/leave-types/${lt.id}`, token, { method: "PATCH", body: JSON.stringify({ label: newLabel, color: newColor }) }); onLeaveTypeUpdated(lt.id, { label: newLabel, color: newColor, bg: hexToLight(newColor) }); setEditLT(null); showNotif("Modifié ✅"); } catch { showNotif("Erreur", "error"); } }
  async function handleAssignAgentTeam(agentId, teamName) {
    try {
      await apiFetch(`/agents/${agentId}`, token, { method: "PATCH", body: JSON.stringify({ team: teamName }) });
      onAgentUpdated(agentId, { team: teamName });
      showNotif("Équipe mise à jour ✅");
    } catch { showNotif("Erreur", "error"); }
  }
  async function handleDeleteLT(lt) { try { await apiFetch(`/leave-types/${lt.id}`, token, { method: "DELETE" }); onLeaveTypeDeleted(lt.id); showNotif("Type supprimé", "error"); } catch { showNotif("Erreur", "error"); } }

  const TAB_CONFIG = [
    { id: "agents",     label: "👥 Agents",          color: "#6366f1" },
    { id: "teams",      label: "🏷 Équipes",          color: "#0d9488" },
    { id: "leavetypes", label: "📋 Types de congés",  color: "#f59e0b" },
  ];
  const adminStyle = { padding: 24, animation: "fadeIn 0.3s ease", maxWidth: 900 };
  return (
    <div style={adminStyle}>
      {/* ── Onglets ── */}
      <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 0, padding: "12px 16px", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {TAB_CONFIG.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "5px 13px", borderRadius: 9, border: `2px solid ${tab === t.id ? t.color : "#e2e8f0"}`,
              background: tab === t.id ? t.color : "#f8fafc",
              color: tab === t.id ? "#fff" : "#64748b",
              cursor: "pointer", fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
              boxShadow: tab === t.id ? `0 3px 12px ${t.color}40` : "none",
              transition: "all 0.15s"
            }}
            onMouseEnter={e => { if (tab !== t.id) { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.color = t.color; e.currentTarget.style.background = "#fff"; }}}
            onMouseLeave={e => { if (tab !== t.id) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#f8fafc"; }}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "agents" && (
        <div>
          <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 0, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 18px", background: "linear-gradient(135deg,#eef2ff,#f8fafc)", borderBottom: "1px solid #e8edf5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4338ca" }}>👥 {agents.length} agent{agents.length > 1 ? "s" : ""}</span>
              <button onClick={() => setAddModal(true)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: "0 2px 10px rgba(99,102,241,0.35)", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>＋ Ajouter un agent</button>
            </div>
            {agents.map((a, i) => (
              <div key={a.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr auto", alignItems: "center", gap: 14, padding: "11px 16px", borderBottom: i < agents.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{a.avatar}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{a.name}</span>
                    <span style={{ background: a.role === "admin" ? "#fef3c7" : a.role === "manager" ? "#ede9fe" : a.role === "coordinator" ? "#e0f2fe" : "#f1f5f9", color: a.role === "admin" ? "#92400e" : a.role === "manager" ? "#5b21b6" : a.role === "coordinator" ? "#0369a1" : "#64748b", padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{a.role === "admin" ? "Admin" : a.role === "manager" ? "Manager" : a.role === "coordinator" ? "Coordinateur" : "Agent"}</span>
                    {a.role === "agent" && a.can_book_presence_sites && <span style={{ background: "#dbeafe", color: "#0369a1", padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>🏢 Présences</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{a.email}{a.team && <span style={{ marginLeft: 8, color: "#64748b" }}>· {a.team}</span>}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { const parts = a.name.split(" "); setEditModal(a); setEditData({ first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "", email: a.email, team: a.team, role: a.role, password: "", can_book_presence_sites: a.can_book_presence_sites || false }); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #c7d2fe", background: "#eef2ff", cursor: "pointer", fontSize: 11, color: "#4338ca", fontWeight: 600, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#6366f1"; }} onMouseLeave={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.color = "#4338ca"; e.currentTarget.style.borderColor = "#c7d2fe"; }}>✏️ Modifier</button>
                  {a.role !== "admin" && <button onClick={() => setDeleteModal(a)} style={{ padding: "5px 9px", borderRadius: 7, border: "1.5px solid #fca5a5", background: "#fef2f2", cursor: "pointer", fontSize: 12, color: "#ef4444", fontWeight: 700, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}>✕</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "teams" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0d9488" }}>{teams.length} équipe{teams.length > 1 ? "s" : ""}</span>
            <button onClick={() => { setNewTeam(""); setTeamModal(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 10px rgba(13,148,136,0.35)", transition: "all 0.15s" }}>
              ＋ Nouvelle équipe
            </button>
          </div>
          {!selectedTeam && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {teams.map(t => {
                const tAgents = agents.filter(a => a.team === t.name && a.role !== "admin");
                return (
                  <div key={t.id || t.name}
                    onClick={() => setSelectedTeam(t)}
                    style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 0, padding: "18px 16px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", transition: "all 0.18s", position: "relative", overflow: "hidden" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(13,148,136,0.15)"; e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = "#e8edf5"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: teamGradient(t.name), borderRadius: "14px 14px 0 0" }} />
                    <div style={{ display: "flex", marginBottom: 10, marginTop: 4 }}>
                      {tAgents.slice(0, 4).map((a, i) => (
                        <div key={a.id} style={{ width: 28, height: 28, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, border: "2px solid #fff", marginLeft: i === 0 ? 0 : -8, flexShrink: 0, zIndex: 4 - i }}>{a.avatar}</div>
                      ))}
                      {tAgents.length > 4 && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 9, fontWeight: 700, border: "2px solid #fff", marginLeft: -8, flexShrink: 0 }}>+{tAgents.length - 4}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{t.name}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{tAgents.length} agent{tAgents.length !== 1 ? "s" : ""}</span>
                      {t.name !== "Admin" && (
                        <button onClick={e => { e.stopPropagation(); handleDeleteTeam(t); }}
                          style={{ padding: "2px 8px", borderRadius: 6, border: "1.5px solid #fca5a5", background: "#fef2f2", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 600, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}>
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {selectedTeam && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <button onClick={() => setSelectedTeam(null)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", cursor: "pointer", fontSize: 12, color: "#94a3b8", fontWeight: 600, transition: "all 0.15s", flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.color = "#0d9488"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#94a3b8"; }}>
                  ← Retour
                </button>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.3px" }}>{selectedTeam.name}</span>
                <span style={{ fontSize: 11, color: "#0d9488", background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)", padding: "2px 9px", borderRadius: 20, fontWeight: 700 }}>
                  {agents.filter(a => a.team === selectedTeam.name && a.role !== "admin").length} agent{agents.filter(a => a.team === selectedTeam.name && a.role !== "admin").length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 0, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "10px 16px", background: "linear-gradient(135deg,#f0fdfa,#f8fafc)", borderBottom: "1px solid #e8edf5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0d9488" }}>Membres</span>
                  {agents.filter(a => a.role !== "admin" && a.team !== selectedTeam.name).length > 0 && (
                    <select onChange={e => { if (e.target.value) handleAssignAgentTeam(e.target.value, selectedTeam.name); e.target.value = ""; }}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid #0d9488", background: "#fff", fontSize: 11, color: "#0d9488", cursor: "pointer", fontWeight: 600, outline: "none" }}>
                      <option value="">＋ Ajouter un agent...</option>
                      {agents.filter(a => a.role !== "admin" && a.team !== selectedTeam.name).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </div>
                {agents.filter(a => a.team === selectedTeam.name && a.role !== "admin").length === 0 && (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>Aucun agent dans cette équipe</div>
                )}
                {agents.filter(a => a.team === selectedTeam.name && a.role !== "admin").map((a, i, arr) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{a.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.email}</div>
                    </div>
                    <span style={{ background: a.role === "manager" ? "#ede9fe" : a.role === "coordinator" ? "#e0f2fe" : "#f1f5f9", color: a.role === "manager" ? "#5b21b6" : a.role === "coordinator" ? "#0369a1" : "#64748b", padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600 }}>
                      {a.role === "manager" ? "Manager" : a.role === "coordinator" ? "Coordinateur" : "Agent"}
                    </span>
                    <button onClick={() => handleAssignAgentTeam(a.id, "")}
                      style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 11, color: "#475569", fontWeight: 500, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#fff"; }}>
                      ↩ Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {teamModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(6px)" }}
              onClick={() => setTeamModal(false)}>
              <div style={{ background: "linear-gradient(145deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "28px 28px 24px", width: 360, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", animation: "slideIn 0.2s ease" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏷</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>Nouvelle équipe</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Saisissez le nom de l équipe</div>
                  </div>
                </div>
                <input autoFocus value={newTeam} onChange={e => setNewTeam(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { handleAddTeam(); setTeamModal(false); } if (e.key === "Escape") setTeamModal(false); }}
                  placeholder="Ex: Développement, Marketing..."
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box", marginBottom: 16, transition: "border 0.15s" }}
                  onFocus={e => e.target.style.borderColor = "#0d9488"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setTeamModal(false)}
                    style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                    Annuler
                  </button>
                  <button onClick={() => { handleAddTeam(); setTeamModal(false); }}
                    style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 10px rgba(13,148,136,0.35)" }}>
                    ＋ Créer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === "leavetypes" && (
        <div>
          {/* Bouton Ajouter */}
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { setNewLT({ label: "", color: COLORS[0] }); setShowAddLTModal(true); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 3px 12px rgba(245,158,11,0.4)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 5px 18px rgba(245,158,11,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 3px 12px rgba(245,158,11,0.4)"; }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> Nouveau type de congé
            </button>
          </div>

          {/* POPUP AJOUT TYPE DE CONGÉ */}
          {showAddLTModal && (
            <div onClick={() => setShowAddLTModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.15s ease" }}>
              <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px", width: 420, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", animation: "modalPop 0.2s ease" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${newLT.color},${newLT.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 4px 16px ${newLT.color}60`, transition: "all 0.2s" }}>🏷</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "-0.3px" }}>Nouveau type de congé</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Donnez un nom et choisissez une couleur</div>
                  </div>
                  <button onClick={() => setShowAddLTModal(false)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#f1f5f9"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#64748b"; }}>✕</button>
                </div>

                {/* Champ nom */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Nom du type</label>
                  <input
                    autoFocus
                    value={newLT.label}
                    onChange={e => setNewLT(p => ({ ...p, label: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter" && newLT.label.trim()) { handleAddLT(); setShowAddLTModal(false); } }}
                    placeholder="Ex : Congé exceptionnel..."
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Outfit',sans-serif", transition: "border 0.15s", caretColor: newLT.color }}
                    onFocus={e => e.target.style.borderColor = newLT.color}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>

                {/* Aperçu couleur choisie */}
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "1px" }}>Couleur</label>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: newLT.color, boxShadow: `0 0 8px ${newLT.color}80` }} />
                    <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{newLT.color}</span>
                  </div>
                </div>

                {/* Palette de couleurs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 8, padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 28 }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setNewLT(p => ({ ...p, color: c }))} title={c} style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", background: c, border: newLT.color === c ? `3px solid #fff` : "3px solid transparent", cursor: "pointer", transition: "all 0.15s", boxShadow: newLT.color === c ? `0 0 0 2px ${c}, 0 4px 12px ${c}60` : "none", transform: newLT.color === c ? "scale(1.2)" : "scale(1)" }} />
                  ))}
                </div>

                {/* Aperçu du badge */}
                <div style={{ marginBottom: 24, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Aperçu :</span>
                  <span style={{ padding: "3px 10px", borderRadius: 6, background: newLT.color + "30", color: newLT.color, fontSize: 12, fontWeight: 700, border: `1px solid ${newLT.color}50` }}>{newLT.label || "Nom du type"}</span>
                  <div style={{ width: 28, height: 22, borderRadius: 4, background: newLT.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 800 }}>{newLT.label ? newLT.label.slice(0,3).toUpperCase() : "???"}</div>
                </div>

                {/* Boutons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowAddLTModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f1f5f9"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}>Annuler</button>
                  <button onClick={() => { if (newLT.label.trim()) { handleAddLT(); setShowAddLTModal(false); } }} disabled={!newLT.label.trim()} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: newLT.label.trim() ? `linear-gradient(135deg,${newLT.color},${newLT.color}cc)` : "rgba(255,255,255,0.05)", color: newLT.label.trim() ? "#fff" : "#475569", cursor: newLT.label.trim() ? "pointer" : "default", fontSize: 13, fontWeight: 700, boxShadow: newLT.label.trim() ? `0 4px 16px ${newLT.color}50` : "none", transition: "all 0.2s" }}>✓ Créer ce type de congé</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 0, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            {sortLeaveTypes(leaveTypes).map((lt, i) => (
              <div key={lt.id} style={{ borderBottom: i < leaveTypes.length - 1 ? "1px solid #f8fafc" : "none" }}>
                {editLT === lt.id ? (
                  <LeaveTypeEditRow
                    lt={lt}
                    onSave={(label, color) => { handleUpdateLT(lt, label, color); setEditLT(null); }}
                    onCancel={() => setEditLT(null)}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: lt.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{lt.label}</span>
                    <div style={{ fontSize: 10, color: "#94a3b8", background: hexToLight(lt.color), padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{leaveAbbr(lt.label)}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => setEditLT(lt.id)} style={{ padding: "4px 11px", borderRadius: 7, border: "1.5px solid #c7d2fe", background: "#eef2ff", cursor: "pointer", fontSize: 11, color: "#4338ca", fontWeight: 600, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#6366f1"; }} onMouseLeave={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.color = "#4338ca"; e.currentTarget.style.borderColor = "#c7d2fe"; }}>✏️ Modifier</button>
                      <button type="button" onClick={() => handleDeleteLT(lt)} style={{ padding: "4px 9px", borderRadius: 7, border: "1.5px solid #fca5a5", background: "#fef2f2", cursor: "pointer", fontSize: 12, color: "#ef4444", fontWeight: 700, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {addModal && <Modal title="➕ Ajouter un agent">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Prénom" value={newAgent.first_name} onChange={v => setNewAgent(p => ({ ...p, first_name: v }))} placeholder="Jean" />
          <Field label="Nom" value={newAgent.last_name} onChange={v => setNewAgent(p => ({ ...p, last_name: v }))} placeholder="Dupont" />
        </div>
        <Field label="Email" value={newAgent.email} onChange={v => setNewAgent(p => ({ ...p, email: v }))} placeholder="jean@entreprise.fr" style={{ marginBottom: 12 }} />
        <Field label="Mot de passe (min 8 car.)" value={newAgent.password} onChange={v => setNewAgent(p => ({ ...p, password: v }))} placeholder="motdepasse123" style={{ marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Équipe</label>
            <select value={newAgent.team} onChange={e => setNewAgent(p => ({ ...p, team: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, transition: "all 0.2s" }}>
              <option value="">-- Choisir --</option>{teams.map(t => <option key={t.id || t.name} value={t.name}>{t.name}</option>)}
            </select></div>
          <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Rôle</label>
            <select value={newAgent.role} onChange={e => setNewAgent(p => ({ ...p, role: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, transition: "all 0.2s" }}>
              <option value="agent">Agent</option><option value="coordinator">Coordinateur</option><option value="manager">Manager 👑</option>
            </select></div>
        </div>
        <ModalButtons onCancel={() => setAddModal(false)} onConfirm={handleAddAgent} confirmLabel={loading ? "En cours..." : "Ajouter"} disabled={loading} />
      </Modal>}
      {editModal && <Modal title={`✏️ Modifier — ${editModal.name}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Prénom" value={editData.first_name} onChange={v => setEditData(p => ({ ...p, first_name: v }))} placeholder="Jean" />
          <Field label="Nom" value={editData.last_name} onChange={v => setEditData(p => ({ ...p, last_name: v }))} placeholder="Dupont" />
        </div>
        <Field label="Email" value={editData.email} onChange={v => setEditData(p => ({ ...p, email: v }))} style={{ marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Équipe</label>
            <select value={editData.team || ""} onChange={e => setEditData(p => ({ ...p, team: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 14, transition: "all 0.2s" }}>
              <option value="">-- Aucune équipe --</option>{teams.map(t => <option key={t.id || t.name} value={t.name}>{t.name}</option>)}
            </select></div>
          <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Rôle</label>
            <select value={editData.role || "agent"} onChange={e => setEditData(p => ({ ...p, role: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 14, transition: "all 0.2s" }}>
              <option value="agent">Agent</option><option value="coordinator">Coordinateur</option><option value="manager">Manager 👑</option>
            </select></div>
        </div>
        <Field label="Nouveau mot de passe (vide = inchangé)" value={editData.password} onChange={v => setEditData(p => ({ ...p, password: v }))} placeholder="••••••••" style={{ marginBottom: 12 }} />
        {editData.role === "agent" && (
          <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "12px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="presence_sites" checked={editData.can_book_presence_sites || false} onChange={e => setEditData(p => ({ ...p, can_book_presence_sites: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#6366f1" }} />
            <label htmlFor="presence_sites" style={{ fontSize: 12, fontWeight: 500, color: "#4338ca", cursor: "pointer", flex: 1, margin: 0 }}>🏢 Autoriser cet agent à gérer ses présences site (Rueil/Paris)</label>
          </div>
        )}
        <ModalButtons onCancel={() => setEditModal(null)} onConfirm={async () => {
          try {
            await apiFetch(`/agents/${editModal.id}`, token, { method: "PATCH", body: JSON.stringify({ first_name: editData.first_name, last_name: editData.last_name, team: editData.team, role: editData.role, email: editData.email, can_book_presence_sites: editData.can_book_presence_sites, ...(editData.password ? { password: editData.password } : {}) }) });
          } catch (e) { console.error(e); }
          const newName = `${editData.first_name} ${editData.last_name}`.trim();
          onAgentUpdated(editModal.id, { ...editData, name: newName, avatar: getInitials(newName) });
          setEditModal(null); showNotif("Agent modifié ✅");
        }} confirmLabel="Enregistrer" />
      </Modal>}
      {deleteModal && <Modal title="🗑 Supprimer l'agent">
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 20px" }}>Supprimer <strong>{deleteModal.name}</strong> ? Cette action est irréversible.</p>
        <ModalButtons onCancel={() => setDeleteModal(null)} onConfirm={async () => {
          try { await apiFetch(`/agents/${deleteModal.id}`, token, { method: "DELETE" }); } catch (e) { console.error(e); }
          onAgentDeleted(deleteModal.id); setDeleteModal(null); showNotif("Agent supprimé", "error");
        }} confirmLabel="Supprimer" confirmColor="#ef4444" />
      </Modal>}
    </div>
  );
}

// ─── APP PRINCIPALE ───
function MiniCalendarPicker({ value, onChange, minDate }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const parsed = value ? new Date(value + "T00:00:00") : today;
  const [viewYear, setViewYear] = React.useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(parsed.getMonth());
  const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS = ["Lu","Ma","Me","Je","Ve","Sa","Di"];
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const selDate = value ? new Date(value + "T00:00:00") : null;
  const minD = minDate ? new Date(minDate + "T00:00:00") : null;
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };
  const fmt = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  return (
    <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, boxShadow:"0 8px 30px rgba(0,0,0,0.12)", padding:"14px", width:280, userSelect:"none" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#64748b" }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#64748b" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:6 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#94a3b8", padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = fmt(viewYear, viewMonth, d);
          const date = new Date(dateStr + "T00:00:00");
          const isSelected = selDate && selDate.getTime() === date.getTime();
          const isToday = date.getTime() === today.getTime();
          const isWe = date.getDay() === 0 || date.getDay() === 6;
          const isDisabled = minD && date < minD;
          return (
            <button key={i} onClick={() => !isDisabled && onChange(dateStr)}
              style={{ width:"100%", aspectRatio:"1", borderRadius:8, border:"none", cursor: isDisabled ? "not-allowed" : "pointer", fontSize:12, fontWeight: isSelected ? 700 : 400,
                background: isSelected ? "#6366f1" : isToday ? "#eef2ff" : "transparent",
                color: isDisabled ? "#d1d5db" : isSelected ? "#fff" : isWe ? "#94a3b8" : "#1e293b",
                outline: isToday && !isSelected ? "1.5px solid #6366f1" : "none",
                transition:"all 0.1s" }}
              onMouseEnter={e => { if (!isDisabled && !isSelected) e.currentTarget.style.background="#f1f5f9"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background= isToday ? "#eef2ff" : "transparent"; }}>
              {d}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:"1px solid #f1f5f9" }}>
        <button onClick={() => onChange("")} style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", padding:"2px 6px", borderRadius:6 }}>Effacer</button>
        <button onClick={() => onChange(fmt(today.getFullYear(), today.getMonth(), today.getDate()))} style={{ fontSize:11, color:"#6366f1", background:"none", border:"none", cursor:"pointer", fontWeight:600, padding:"2px 6px", borderRadius:6 }}>Aujourd'hui</button>
      </div>
    </div>
  );
}

function PlanningApp({ currentUser, onLogout }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [agents, setAgents] = useState([]);
  const [agentsOrder, setAgentsOrder] = useState([]);  // Ordre personnalisé des agents
  const [dragAgentId, setDragAgentId] = useState(null);
  const [dragOverAgentId, setDragOverAgentId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaves, setLeaves] = useState({});
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState("planning");
  const [planView, setPlanView] = useState("month");
  const [weekAnchor, setWeekAnchor] = useState(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const [filterTeam, setFilterTeam] = useState("Tous");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [showAbsentBanner, setShowAbsentBanner] = useState(true);
  const [selectedLTId, setSelectedLTId] = useState(null);
  const [selectedAgentRow, setSelectedAgentRow] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [halfDayPeriod, setHalfDayPeriod] = useState(null);
  const [expandedLeaveType, setExpandedLeaveType] = useState(null);
  const [requestReason, setRequestReason] = useState("");
  const [halfDayPendingType, setHalfDayPendingType] = useState(null);
  const [addLeaveModal, setAddLeaveModal] = useState(false);
  const [addLeaveForm, setAddLeaveForm] = useState({ agentId: null, startDate: "", endDate: "", leaveTypeId: null, reason: "", _period: null });
  const [alSearchQuery, setAlSearchQuery] = useState("");
  const [alShowAgentDrop, setAlShowAgentDrop] = useState(false);
  const [alShowStartCal, setAlShowStartCal] = useState(false);
  const [alShowEndCal, setAlShowEndCal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [notification, setNotification] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingYearStats, setLoadingYearStats] = useState(false);  // Indicateur de chargement année
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [statsFilter, setStatsFilter] = useState("month");
  const [statsCustomMonth, setStatsCustomMonth] = useState(null); // { year, month } quand filter="custom"
  const [statsPickerOpen, setStatsPickerOpen] = useState(false);
  const [statsAgentDropOpen, setStatsAgentDropOpen] = useState(false);
  const [statsAgentSearch, setStatsAgentSearch] = useState("");
  const [selectedAgentForStats, setSelectedAgentForStats] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [astreintes, setAstreintes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("astreintes") || "{}"); }
    catch { return {}; }
  });
  // astreintes key format: "teamName|rowType|dateKey"  rowType: "astreinte"|"action_serveur"|"mail"|"es"
  const ASTREINTE_TEAMS = ["Css Digital", "Mailing Solution"];
  const MAILING_EXTRA_ROWS = [
    { id: "action_serveur", label: "Action Serveur / Admin" },
    { id: "mail", label: "Mail" },
    { id: "es", label: "ES" },
  ];
  const [astreinteDropdown, setAstreinteDropdown] = useState(null); // { key, teamName, rowType, x, y }
  const [astreinteFilter, setAstreinteFilter] = useState("all"); // "all"|"Css Digital"|"Mailing Solution"
  const [astreinteSelStart, setAstreinteSelStart] = useState(null); // { aKey base, rowType, teamName }
  const [astreinteHovered, setAstreinteHovered] = useState(null); // dateKey hovered
  const [astreinteEraseStart, setAstreinteEraseStart] = useState(null); // { teamName, rowId, key } mode effacement plage
  const [showBilanAstreinte, setShowBilanAstreinte] = useState(false);
  const [seenRejected, setSeenRejected] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`seenRejected_${currentUser.id}`) || "[]"); }
    catch { return []; }
  });

  const token = currentUser.token;
  const isManager = currentUser.role === "manager" || currentUser.role === "admin";
  const isAdmin = currentUser.role === "admin";
  const isCoordinator = currentUser.role === "coordinator";
  const canValidateRequests = currentUser.role === "manager" || currentUser.role === "admin";
  const canManageAstreintes = currentUser.role === "manager" || currentUser.role === "admin" || currentUser.role === "coordinator";
  const feries = getFeries(year);

  function getDaysForLeaveType(leave) {
    const label = (leave.label || "").toLowerCase();
    if (label.includes("1/2") || label.includes("½") || label === "veille de cp" || label === "veille de férié") return 0.5;
    return 1;
  }

  function getAvailableLeaveTypesForAgent(agentId) {
    if (isManager) {
      // Manager : Rueil/Paris seulement en mode présence, types normaux seulement en mode planning
      if (filterMode === "presence") return leaveTypes.filter(t => isPresenceType(t));
      return leaveTypes.filter(t => !isPresenceType(t));
    }
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return leaveTypes.filter(t => AGENT_ALLOWED_CODES.includes(t.code) && !isPresenceType(t));
    return leaveTypes.filter(t => {
      const isAllowed = AGENT_ALLOWED_CODES.includes(t.code);
      const isPresence = isPresenceType(t);
      if (isPresence) return filterMode === "presence" && agent.can_book_presence_sites;
      return isAllowed && filterMode !== "presence";
    });
  }

  // Tri des agents - SIMPLE ET EFFICACE
  const moveAgent = (agentId, direction) => {
    const current = agentsOrder.length > 0 ? agentsOrder : agents.map(a => a.id);
    const idx = current.indexOf(agentId);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === current.length - 1) return;

    const newOrder = [...current];
    if (direction === "up") {
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[idx - 1];
      newOrder[idx - 1] = temp;
    } else {
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[idx + 1];
      newOrder[idx + 1] = temp;
    }
    setAgentsOrder(newOrder);
    setTimeout(() => localStorage.setItem("agentsOrder", JSON.stringify(newOrder)), 0);
  };

  const dragReorder = (fromId, toId) => {
    if (fromId === toId) return;
    const current = agentsOrder.length > 0 ? agentsOrder : agents.map(a => a.id);
    const newOrder = [...current];
    const fromIdx = newOrder.indexOf(fromId);
    const toIdx = newOrder.indexOf(toId);
    if (fromIdx < 0 || toIdx < 0) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, fromId);
    setAgentsOrder(newOrder);
    setTimeout(() => localStorage.setItem("agentsOrder", JSON.stringify(newOrder)), 0);
  };

  const sortedAgents = useMemo(() => {
    if (agentsOrder.length === 0) return agents;
    return agents.slice().sort((a, b) => agentsOrder.indexOf(a.id) - agentsOrder.indexOf(b.id));
  }, [agentsOrder, agents]);

  function getStatsCounts(filterType, agentId) {
    const stats = { cp: 0, cp_current: 0, cp_next: 0, rtt: 0, pont: 0, absence: 0, veille_cp: 0, veille_ferie: 0 };
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return stats;
    // Période CP courante : juin N → mai N+1, où N = année si mois >= juin, sinon N-1
    const todayPeriodYear = (new Date().getMonth() >= 5) ? new Date().getFullYear() : new Date().getFullYear() - 1;
    Object.entries(leaves[agentId] || {}).forEach(([dateKey, leave]) => {
      if (!leave) return;
      const [y, m, d] = dateKey.split("-");
      const leaveYear = parseInt(y);
      const leaveMonth = parseInt(m) - 1;
      if (filterType === "month") { if (leaveYear !== year || leaveMonth !== month) return; }
      else if (filterType === "year") { if (leaveYear !== year) return; }
      else if (filterType === "custom" && statsCustomMonth) { if (leaveYear !== statsCustomMonth.year || leaveMonth !== statsCustomMonth.month) return; }
      const dow = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).getDay();
      if (dow === 0 || dow === 6) return;
      if (leave.status === "pending") return;
      const days = getDaysForLeaveType(leave);
      const code = (leave.code || "").toLowerCase();
      const lbl = (leave.label || "").toLowerCase();
      if (code === "veille_de_cp" || lbl === "veille de cp") { stats.veille_cp += days; }
      else if (code === "veille_de_ferie" || lbl === "veille de férié") { stats.veille_ferie += days; }
      else if (code.includes("cp") || lbl.includes("congé payé") || lbl === "cp") {
        stats.cp += days;
        // Période CP : juin N → mai N+1
        const leavePeriodYear = leaveMonth >= 5 ? leaveYear : leaveYear - 1;
        if (leavePeriodYear === todayPeriodYear) stats.cp_current += days;
        else if (leavePeriodYear === todayPeriodYear + 1) stats.cp_next += days;
      }
      else if (code.includes("rtt") || lbl.includes("rtt")) { stats.rtt += days; }
      else if (code.includes("pont") || lbl.includes("pont")) { stats.pont += days; }
      else if (code.includes("absence") || lbl.includes("absence")) { stats.absence += days; }
    });
    return stats;
  }

  // ─── FONCTION MANQUANTE : getAgentsByTeam ───
  function getAgentsByTeam() {
    const sorted = sortedAgents;
    let filtered;
    if (filterTeam.startsWith("agent-")) {
      // Filtre "Moi" - afficher seulement l'agent connecté
      const agentId = filterTeam.replace("agent-", "");
      filtered = sorted.filter(a => a.id === agentId);
    } else {
      // Filtres normaux par équipe
      filtered = (filterTeam === "Tous" ? sorted : sorted.filter(a => a.team === filterTeam)).filter(a => a.role !== "admin");
    }
    const grouped = [];
    const teamMap = {};
    filtered.forEach(agent => {
      const teamName = agent.team || "Sans équipe";
      if (!teamMap[teamName]) {
        teamMap[teamName] = [];
        grouped.push([teamName, teamMap[teamName]]);
      }
      teamMap[teamName].push(agent);
    });
    grouped.sort(([a], [b]) => {
      if (a === "Sans équipe") return 1;
      if (b === "Sans équipe") return -1;
      return a.localeCompare(b);
    });
    return grouped;
  }

  useEffect(() => {
    async function loadAll() {
      try {
        const [teamsData, ltData, agentsData] = await Promise.all([apiFetch("/teams", token), apiFetch("/leave-types", token), apiFetch("/agents", token)]);
        const teamsResult = Array.isArray(teamsData) ? teamsData : []; setTeams(teamsResult);
        const ltResult = Array.isArray(ltData) ? ltData : [];
        const ltFormatted = ltResult.map(lt => ({
          ...lt,
          code: lt.code || (lt.label || "").toLowerCase()
            .normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, ""),
          bg: hexToLight(lt.color)
        })); setLeaveTypes(ltFormatted);
        const allowedFirst = ltFormatted.find(t => AGENT_ALLOWED_CODES.includes(t.code));
        if (ltFormatted.length > 0) setSelectedLTId((allowedFirst || ltFormatted[0]).id);
        const agentsRaw = agentsData.agents || (Array.isArray(agentsData) ? agentsData : []);
        const agentsList = agentsRaw.map(a => ({ id: a.id, name: `${a.first_name || ""} ${a.last_name || ""}`.trim(), email: a.email, role: a.role || "agent", team: a.team_name || a.team || "", avatar: a.avatar_initials || getInitials(`${a.first_name || ""} ${a.last_name || ""}`), can_book_presence_sites: a.can_book_presence_sites || false }));
        setAgents(agentsList);
        // Charger l'ordre personnalisé depuis localStorage
        const savedOrder = localStorage.getItem("agentsOrder");
        if (savedOrder) {
          try {
            const parsedOrder = JSON.parse(savedOrder);
            setAgentsOrder(parsedOrder);
          } catch (e) { console.log("Erreur chargement ordre agents:", e); }
        }
        await loadLeaves(ltFormatted, token, now.getFullYear(), now.getMonth());
        await loadRequests(token);
      } catch (e) { console.error("Erreur chargement:", e); }
      setDataLoaded(true);
    }
    loadAll();
  }, [token]);

  useEffect(() => {
    if (!dataLoaded || leaveTypes.length === 0) return;
    if (statsFilter === "year" || statsFilter === "custom") {
      // Vérifier si on a déjà les données de cette année en cache
      const cacheKey = `yearLeaves_${year}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setLeaves(JSON.parse(cached));
        setLoadingYearStats(false);
        return;
      }

      // Charger tous les mois de l'année EN PARALLÈLE (plus rapide)
      const loadAllMonths = async () => {
        setLoadingYearStats(true);
        try {
          const monthRequests = [];
          for (let m = 0; m < 12; m++) {
            const monthStr = `${year}-${String(m + 1).padStart(2, "0")}`;
            monthRequests.push(apiFetch(`/leaves?month=${monthStr}`, token));
          }
          const allMonthsData = await Promise.all(monthRequests);
          const allLeavesMap = {};

          allMonthsData.forEach(data => {
            const leavesData = (Array.isArray(data) ? data : (data.leaves || [])).filter(l => l.status !== "cancelled" && l.status !== "rejected");
            leavesData.forEach(l => {
              if (!allLeavesMap[l.agent_id]) allLeavesMap[l.agent_id] = {};
              const lt = leaveFromBackend(l);
              const leaveStart = l.start_date.split("T")[0], leaveEnd = l.end_date.split("T")[0];
              const isPresence = PRESENCE_CODES.includes((l.leave_type_code || "").toLowerCase());
              for (let d = new Date(l.start_date); d <= new Date(l.end_date); d.setDate(d.getDate() + 1)) {
                const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "00")}-${String(d.getDate()).padStart(2, "0")}`;
                const entry = { ...lt, status: l.status, leaveId: l.id, leaveStart, leaveEnd, leaveCode: l.leave_type_code, agentId: l.agent_id, reason: l.reason };
                if (isPresence) {
                  allLeavesMap[l.agent_id][k + "__presence"] = entry;
                } else {
                  allLeavesMap[l.agent_id][k] = entry;
                }
              }
            });
          });
          setLeaves(allLeavesMap);
          // Mettre en cache pour cette session
          sessionStorage.setItem(cacheKey, JSON.stringify(allLeavesMap));
        } catch (e) { console.error("Erreur chargement année:", e); } finally {
          setLoadingYearStats(false);
        }
      };
      loadAllMonths();
    } else {
      // Mode mois : charger juste le mois actuel
      setLoadingYearStats(false);
      loadLeaves(leaveTypes, token, year, month);
    }
  }, [year, month, statsFilter, dataLoaded, leaveTypes.length]);

  async function loadLeaves(ltList, tok, y, m) {
    try {
      const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
      const data = await apiFetch(`/leaves?month=${monthStr}`, tok);
      const leavesData = (Array.isArray(data) ? data : (data.leaves || [])).filter(l => l.status !== "cancelled" && l.status !== "rejected");
      const leavesMap = {};
      leavesData.forEach(l => {
        if (!leavesMap[l.agent_id]) leavesMap[l.agent_id] = {};
        const lt = leaveFromBackend(l);
        const leaveStart = l.start_date.split("T")[0], leaveEnd = l.end_date.split("T")[0];
        const isPresence = PRESENCE_CODES.includes((l.leave_type_code || "").toLowerCase());
        for (let d = new Date(l.start_date); d <= new Date(l.end_date); d.setDate(d.getDate() + 1)) {
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "00")}-${String(d.getDate()).padStart(2, "0")}`;
          const entry = { ...lt, status: l.status, leaveId: l.id, leaveStart, leaveEnd, leaveCode: l.leave_type_code, agentId: l.agent_id, reason: l.reason };
          if (isPresence) {
            // Stocker les présences avec clé dédiée __presence pour ne pas écraser CP/RTT
            leavesMap[l.agent_id][k + "__presence"] = entry;
          } else {
            // Stocker le congé normal (CP/RTT etc)
            leavesMap[l.agent_id][k] = entry;
          }
        }
      });
      setLeaves(leavesMap);
    } catch (e) { console.error("Erreur congés:", e); }
  }

  async function loadRequests(tok) {
    try {
      const [pendingData, allData] = await Promise.all([apiFetch("/leaves?status=pending", tok), apiFetch("/leaves", tok)]);
      const pending = (Array.isArray(pendingData) ? pendingData : (pendingData.leaves || [])).map(requestFromBackend);
      const others = (Array.isArray(allData) ? allData : (allData.leaves || [])).filter(l => l.status !== "pending").map(requestFromBackend);
      setRequests([...pending, ...others]);
    } catch (e) { console.error("Erreur demandes:", e); }
  }

  function showNotif(msg, type = "success") { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3500); }

  useEffect(() => {
    try { localStorage.setItem("astreintes", JSON.stringify(astreintes)); } catch { }
  }, [astreintes]);

  // Touche Échap pour annuler la sélection en cours


  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Escape") {
        // Annuler la sélection de congés en cours
        if (selectedAgent || selectionStart) {
          setSelectedAgent(null);
          setSelectionStart(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAgent, selectionStart]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const allTeams = useMemo(() => ["Tous", ...teams.filter(t => t.name !== "Admin").map(t => t.name)], [teams]);
  const filteredAgents = useMemo(() => {
    let result = filterTeam.startsWith("agent-") ? agents.filter(a => a.id === filterTeam.replace("agent-", "")) : ((filterTeam === "Tous" ? agents : agents.filter(a => a.team === filterTeam)));
    result = result.filter(a => a.role !== "admin");
    return result;
  }, [agents, filterTeam, currentUser.id]);

  // Cache les agents groupés par équipe pour éviter les recalculs
  const agentsByTeam = useMemo(() => getAgentsByTeam(), [sortedAgents, filterTeam]);
  const pendingRequests = useMemo(() => requests.filter(r => r.status === "pending"), [requests]);
  const myRequests = useMemo(() => requests.filter(r => r.agentId === currentUser.id), [requests, currentUser.id]);
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;
  const currentLT = leaveTypes.find(t => t.id === selectedLTId) || leaveTypes[0];
  const validationBadge = isManager ? pendingRequests.length : myRequests.filter(r => r.status === "pending" || (r.status === "rejected" && !seenRejected.includes(r.id))).length;

  const weekDays = getWeekDays(weekAnchor.getFullYear(), weekAnchor.getMonth(), weekAnchor.getDate());

  function getAllLeavesForKey(agentId, k) {
    // Retourne toutes les entrées pour un agent+jour (peut y avoir présence + CP/RTT)
    const agentLeaves = leaves[agentId] || {};
    // On stocke par leaveId pour éviter les doublons de plage
    const seen = {};
    const result = [];
    // L'entrée principale
    const main = agentLeaves[k];
    if (main) { seen[main.leaveId] = true; result.push(main); }
    // Chercher d'autres entrées avec un leaveId différent sur la même clé
    // (stockées avec suffix si overlap - non implémenté, donc on cherche dans leaves brut)
    return result;
  }

  function getLeaveForDay(agentId, day) {
    const k = dateKey(year, month, day);
    if (filterMode === "presence") {
      // Mode présence : chercher dans __presence d'abord, puis k normal si présence
      const pLeave = leaves[agentId]?.[k + "__presence"];
      const nLeave = leaves[agentId]?.[k];
      const leave = pLeave || (nLeave && isPresenceCode(nLeave.code, nLeave.label) ? nLeave : null);
      if (!leave) return null;
      if (!isManager && !isPresenceCode(leave.code, leave.label)) return null;
      if (filterStatus === "approved" && leave.status !== "approved") return null;
      if (filterStatus === "pending" && leave.status !== "pending") return null;
      return leave;
    } else {
      // Mode normal : chercher le congé non-présence (k), ignorer __presence
      const leave = leaves[agentId]?.[k];
      if (!leave) return null;
      if (isPresenceCode(leave.code, leave.label)) return null;
      if (filterStatus === "approved" && leave.status !== "approved") return null;
      if (filterStatus === "pending" && leave.status !== "pending") return null;
      return leave;
    }
  }

  function getPresenceLeaveForDay(agentId, day) {
    // Retourne la présence (Rueil/Paris) si elle existe ce jour, indépendamment du filterMode
    const k = dateKey(year, month, day);
    const allForAgent = leaves[agentId] || {};
    // Chercher dans presenceLeaves (stocké séparément)
    const pKey = k + "__presence";
    if (allForAgent[pKey]) return allForAgent[pKey];
    return null;
  }

  function getLeaveForKey(agentId, k) {
    if (filterMode === "presence") {
      const pLeave = leaves[agentId]?.[k + "__presence"];
      const nLeave = leaves[agentId]?.[k];
      const leave = pLeave || (nLeave && isPresenceCode(nLeave.code, nLeave.label) ? nLeave : null);
      if (!leave) return null;
      if (!isManager && !isPresenceCode(leave.code, leave.label)) return null;
      if (filterStatus === "approved" && leave.status !== "approved") return null;
      if (filterStatus === "pending" && leave.status !== "pending") return null;
      return leave;
    } else {
      const leave = leaves[agentId]?.[k];
      if (!leave) return null;
      if (isPresenceCode(leave.code, leave.label)) return null;
      if (filterStatus === "approved" && leave.status !== "approved") return null;
      if (filterStatus === "pending" && leave.status !== "pending") return null;
      return leave;
    }
  }

  function getWeekPresenceCount(agentId, days) {
    let count = 0;
    days.forEach(d => {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const l = leaves[agentId]?.[k];
      if (l && isPresenceCode(l.code, l.label) && (l.status === "approved" || l.status === "pending")) count++;
    });
    return count;
  }

  function countAbsents(k) {
    return filteredAgents.filter(a => {
      const l = leaves[a.id]?.[k];
      return l && (l.status === "approved" || (l.status === "pending" && isManager));
    }).length;
  }

  function countPresence(k, siteCode) {
    return filteredAgents.filter(a => {
      const l = leaves[a.id]?.[k + "__presence"] || leaves[a.id]?.[k];
      if (!l) return false;
      if (!isPresenceCode(l.code, l.label)) return false;
      if (l.status !== "approved" && !(l.status === "pending" && isManager)) return false;
      return (l.code || "").toLowerCase() === siteCode || (l.label || "").toLowerCase() === siteCode;
    }).length;
  }

  async function handleCellClick(agentId, day) {
    if (contextMenu) { setContextMenu(null); return; }
    if (isWeekend(year, month, day)) return;
    const k = dateKey(year, month, day);
    if (feries[k] && !isManager) return;
    if (!isManager && currentUser.id !== agentId) return;
    // Mode normal : bloquer les types présence pour les agents
    if (filterMode !== "presence" && !isManager && currentLT && isPresenceType(currentLT)) return;
    if (!selectedAgent || selectedAgent !== agentId) { setSelectedAgent(agentId); setSelectionStart(day); }
    else {
      const start = Math.min(selectionStart, day), end = Math.max(selectionStart, day);
      setSelectionStart(null); setSelectedAgent(null);
      // Toujours ouvrir la popup (agent ou manager)
      setRequestModal({ agentId, start: dateKey(year, month, start), end: dateKey(year, month, end), x: null, y: null }); setRequestReason("");
    }
  }

  const [weekSelStart, setWeekSelStart] = useState(null);
  const [weekSelAgent, setWeekSelAgent] = useState(null);
  const [weekHovered, setWeekHovered] = useState(null);

  async function handleWeekCellClick(agentId, dateObj) {
    if (contextMenu) { setContextMenu(null); return; }
    const dow = dateObj.getDay(); if (dow === 0 || dow === 6) return;
    const k = dKey(dateObj);
    const feriesWeek = getFeries(dateObj.getFullYear());
    if (feriesWeek[k] && !isManager) return;
    if (!isManager && currentUser.id !== agentId) return;
    // Mode normal : bloquer les types présence pour les agents
    if (filterMode !== "presence" && !isManager && currentLT && isPresenceType(currentLT)) return;
    if (!weekSelAgent || weekSelAgent !== agentId) { setWeekSelAgent(agentId); setWeekSelStart(k); }
    else {
      const start = weekSelStart < k ? weekSelStart : k;
      const end = weekSelStart < k ? k : weekSelStart;
      setWeekSelStart(null); setWeekSelAgent(null);
      // Mode présence + agent autorisé : dépôt direct sans modale, approuvé immédiatement
      setRequestModal({ agentId, start, end, x: null, y: null }); setRequestReason("");
    }
  }

  function isWeekInSel(agentId, k) {
    if (weekSelAgent !== agentId || !weekSelStart || !weekHovered) return false;
    const [s, e] = weekSelStart < weekHovered ? [weekSelStart, weekHovered] : [weekHovered, weekSelStart];
    return k >= s && k <= e;
  }

  function handleCellRightClick(e, agentId, day) {
    e.preventDefault(); e.stopPropagation();
    if (currentUser.id !== agentId && !isManager) return;
    const k = dateKey(year, month, day);
    // En mode présence : chercher la présence (__presence key)
    const leave = filterMode === "presence"
      ? (leaves[agentId]?.[k + "__presence"] || leaves[agentId]?.[k])
      : leaves[agentId]?.[k];
    if (!leave || !leave.leaveId) return;
    setContextMenu({ x: e.clientX, y: e.clientY, agentId, day, leave, leaveId: leave.leaveId, clickedDate: k });
  }

  function handleWeekCellRightClick(e, agentId, dateObj) {
    e.preventDefault(); e.stopPropagation();
    if (currentUser.id !== agentId && !isManager) return;
    const k = dKey(dateObj);
    const leave = filterMode === "presence"
      ? (leaves[agentId]?.[k + "__presence"] || leaves[agentId]?.[k])
      : leaves[agentId]?.[k];
    if (!leave || !leave.leaveId) return;
    setContextMenu({ x: e.clientX, y: e.clientY, agentId, leave, leaveId: leave.leaveId, clickedDate: k });
  }

  async function handleDeleteAll() {
    if (!contextMenu) return; const { leaveId } = contextMenu; setContextMenu(null);
    try { await apiFetch(`/leaves/${leaveId}`, token, { method: "DELETE" }); setRequests(prev => prev.filter(r => r.id !== leaveId)); await loadLeaves(leaveTypes, token, year, month); showNotif("Congé supprimé ✅"); }
    catch { showNotif("Erreur", "error"); }
  }

  async function handleDeleteDay() {
    if (!contextMenu) return; const { leaveId, clickedDate, leave, agentId } = contextMenu; setContextMenu(null);
    try {
      await apiFetch(`/leaves/${leaveId}`, token, { method: "DELETE" }); setRequests(prev => prev.filter(r => r.id !== leaveId));
      const start = leave.leaveStart, end = leave.leaveEnd, code = leave.leaveCode || leave.code;
      if (compareDates(start, clickedDate) < 0) await apiFetch("/leaves", token, { method: "POST", body: JSON.stringify({ leave_type_code: code, start_date: start, end_date: addDays(clickedDate, -1), agent_id: agentId }) });
      if (compareDates(clickedDate, end) < 0) await apiFetch("/leaves", token, { method: "POST", body: JSON.stringify({ leave_type_code: code, start_date: addDays(clickedDate, 1), end_date: end, agent_id: agentId }) });
      await loadLeaves(leaveTypes, token, year, month); showNotif("Jour supprimé ✅");
    } catch (e) { console.error(e); showNotif("Erreur", "error"); }
  }

  async function submitRequest(leaveType, reason, overrideModal) {
    const modal = overrideModal || requestModal;
    if (!modal || !leaveType) return;
    const { agentId, start, end } = modal; const agent = agents.find(a => a.id === agentId);
    try {
      const data = await apiFetch("/leaves", token, { method: "POST", body: JSON.stringify({ leave_type_id: leaveType.id, leave_type_code: leaveType.code, start_date: start, end_date: end, reason: reason || null, agent_id: agentId }) });
      if (data.leave) {
        const agentCanPresence = agents.find(a => a.id === agentId)?.can_book_presence_sites;
        const isPont = (leaveType.code || "").toLowerCase().includes("pont") || (leaveType.label || "").toLowerCase().includes("pont");
        const autoApprove = (isManager && !isPont) || (filterMode === "presence" && agentCanPresence && isPresenceType(leaveType));
        if (autoApprove) {
          try {
            await apiFetch(`/leaves/${data.leave.id}/approve`, token, { method: "PATCH", body: JSON.stringify({}) });
          } catch (approveErr) {
            console.warn("Approve échoué (non bloquant):", approveErr);
          }
          showNotif(filterMode === "presence" ? "Présence enregistrée ✅" : "Congé sauvegardé ✅");
        } else {
          setRequests(prev => [...prev, { id: data.leave.id, agentId, agentName: agent.name, agentAvatar: agent.avatar, agentTeam: agent.team, leaveType, start, end, reason: reason || null, status: "pending", createdAt: new Date().toISOString() }]);
          showNotif("Demande envoyée au manager !");
        }
        await loadLeaves(leaveTypes, token, year, month);
      }
    } catch (e) { console.error("submitRequest error:", e); showNotif(e.message || "Erreur sauvegarde", "error"); }
    setRequestModal(null);
  }

  async function approveRequest(reqId) {
    try {
      await apiFetch(`/leaves/${reqId}/approve`, token, { method: "PATCH", body: JSON.stringify({}) });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "approved" } : r));
      await loadLeaves(leaveTypes, token, year, month); showNotif("Demande approuvée ✅");
    } catch { showNotif("Erreur", "error"); }
  }

  async function rejectRequest(reqId) {
    try {
      await apiFetch(`/leaves/${reqId}/reject`, token, { method: "PATCH", body: JSON.stringify({ manager_comment: rejectComment }) });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "rejected", comment: rejectComment } : r));
      await loadLeaves(leaveTypes, token, year, month); setRejectModal(null); showNotif("Demande refusée", "error");
    } catch { showNotif("Erreur", "error"); }
  }

  function isInSelection(agentId, day) {
    if (selectedAgent !== agentId || selectionStart === null || hoveredDay === null) return false;
    return day >= Math.min(selectionStart, hoveredDay) && day <= Math.max(selectionStart, hoveredDay);
  }

  function weekLabel() {
    const f = weekDays[0], l = weekDays[6];
    if (f.getMonth() === l.getMonth()) return `${f.getDate()} – ${l.getDate()} ${MONTHS_FR[f.getMonth()]} ${f.getFullYear()}`;
    return `${f.getDate()} ${MONTHS_FR[f.getMonth()]} – ${l.getDate()} ${MONTHS_FR[l.getMonth()]} ${f.getFullYear()}`;
  }

  const navItems = [
    { id: "planning", icon: "📆", label: "Planning" },
    { id: "validations", icon: "✅", label: "Validations", badge: validationBadge },
    { id: "stats", icon: "📊", label: "Statistiques" },
    ...(isManager ? [{ id: "admin", icon: "⚙️", label: "Administration" }] : []),
  ];

  if (!dataLoaded) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060818", fontFamily: "'Outfit',sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{GLOBAL_STYLE}</style>
      <style>{`
        @keyframes gearCW  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes gearCCW { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes gearMD  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes loadBar { 0%{width:0%} 100%{width:100%} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
        @keyframes auroraL { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,-30px) scale(1.1);} }
        @keyframes auroraR { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-40px,30px) scale(1.15);} }
      `}</style>

      {/* Auroras */}
      <div style={{position:"absolute",top:"-20%",left:"-15%",width:"60vw",height:"60vw",background:"radial-gradient(ellipse,rgba(99,102,241,0.3) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(60px)",animation:"auroraL 16s ease-in-out infinite"}} />
      <div style={{position:"absolute",bottom:"-20%",right:"-15%",width:"55vw",height:"55vw",background:"radial-gradient(ellipse,rgba(6,182,212,0.22) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(70px)",animation:"auroraR 20s ease-in-out infinite"}} />
      {/* Grille */}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"48px 48px"}} />

      <div style={{ textAlign: "center", position: "relative", zIndex: 10, animation: "fadeUp 0.7s ease both" }}>

        {/* Engrenages SVG */}
        <div style={{ position: "relative", width: 180, height: 160, margin: "0 auto 36px" }}>

          {/* Grand engrenage gauche */}
          <svg width="110" height="110" style={{ position: "absolute", top: 25, left: 0, animation: "gearCW 4s linear infinite", filter: "drop-shadow(0 0 12px rgba(99,102,241,0.5))" }} viewBox="0 0 100 100">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <path fill="url(#g1)" d="M43 5h14l2 10a33 33 0 0 1 8 3l9-5 10 10-5 9a33 33 0 0 1 3 8l10 2v14l-10 2a33 33 0 0 1-3 8l5 9-10 10-9-5a33 33 0 0 1-8 3l-2 10H43l-2-10a33 33 0 0 1-8-3l-9 5-10-10 5-9a33 33 0 0 1-3-8L6 57V43l10-2a33 33 0 0 1 3-8l-5-9 10-10 9 5a33 33 0 0 1 8-3z" opacity="0.95"/>
            <circle cx="50" cy="50" r="16" fill="#0f172a" />
            <circle cx="50" cy="50" r="5" fill="url(#g1)" opacity="0.7"/>
          </svg>

          {/* Petit engrenage droite-haut */}
          <svg width="72" height="72" style={{ position: "absolute", top: 0, right: 8, animation: "gearCCW 2.67s linear infinite", filter: "drop-shadow(0 0 8px rgba(6,182,212,0.5))" }} viewBox="0 0 100 100">
            <defs>
              <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            </defs>
            <path fill="url(#g2)" d="M43 5h14l2 10a33 33 0 0 1 8 3l9-5 10 10-5 9a33 33 0 0 1 3 8l10 2v14l-10 2a33 33 0 0 1-3 8l5 9-10 10-9-5a33 33 0 0 1-8 3l-2 10H43l-2-10a33 33 0 0 1-8-3l-9 5-10-10 5-9a33 33 0 0 1-3-8L6 57V43l10-2a33 33 0 0 1 3-8l-5-9 10-10 9 5a33 33 0 0 1 8-3z" opacity="0.9"/>
            <circle cx="50" cy="50" r="16" fill="#0f172a" />
            <circle cx="50" cy="50" r="5" fill="url(#g2)" opacity="0.7"/>
          </svg>

          {/* Engrenage mini droite-bas */}
          <svg width="52" height="52" style={{ position: "absolute", bottom: 0, right: 24, animation: "gearCW 1.78s linear infinite", filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }} viewBox="0 0 100 100">
            <defs>
              <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
            <path fill="url(#g3)" d="M43 5h14l2 10a33 33 0 0 1 8 3l9-5 10 10-5 9a33 33 0 0 1 3 8l10 2v14l-10 2a33 33 0 0 1-3 8l5 9-10 10-9-5a33 33 0 0 1-8 3l-2 10H43l-2-10a33 33 0 0 1-8-3l-9 5-10-10 5-9a33 33 0 0 1-3-8L6 57V43l10-2a33 33 0 0 1 3-8l-5-9 10-10 9 5a33 33 0 0 1 8-3z" opacity="0.85"/>
            <circle cx="50" cy="50" r="16" fill="#0f172a" />
            <circle cx="50" cy="50" r="5" fill="url(#g3)" opacity="0.7"/>
          </svg>
        </div>

        {/* Titre */}
        <div style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "700", marginBottom: 6, letterSpacing: "-0.3px", animation: "fadeUp 0.7s ease 0.15s both" }}>Chargement en cours</div>
        <div style={{ color: "rgba(148,163,184,0.7)", fontSize: "12px", marginBottom: 28, animation: "fadeUp 0.7s ease 0.25s both" }}>Veuillez patienter…</div>

        {/* Barre de progression */}
        <div style={{ width: 200, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, margin: "0 auto 20px", overflow: "hidden", animation: "fadeUp 0.7s ease 0.35s both" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#6366f1,#06b6d4)", borderRadius: 99, animation: "loadBar 2.5s cubic-bezier(0.4,0,0.2,1) infinite" }} />
        </div>

        {/* Points */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, animation: "fadeUp 0.7s ease 0.4s both" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i===1?"#06b6d4":"#6366f1", animation: `dotBounce 1.2s ease-in-out infinite`, animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Outfit','Segoe UI',sans-serif", minHeight: "100vh", background: "#060818", display: "flex", position: "relative" }}
      onClick={() => { if (contextMenu) setContextMenu(null); if (showMonthPicker) setShowMonthPicker(false); if (alShowAgentDrop) setAlShowAgentDrop(false); if (statsPickerOpen) setStatsPickerOpen(false); if (statsAgentDropOpen) setStatsAgentDropOpen(false); if (astreinteDropdown) setAstreinteDropdown(null); if (astreinteEraseStart) { setAstreinteEraseStart(null); setAstreinteHovered(null); } }}>
      <style>{GLOBAL_STYLE}</style>
      <style>{`::-webkit-scrollbar-thumb{background:${filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#f59e0b":"#6366f1"}!important;border-radius:10px}::-webkit-scrollbar-thumb:hover{background:${filterMode==="presence"?"#14b8a6":filterMode==="astreinte"?"#fbbf24":"#818cf8"}!important}`}</style>

      {/* Auroras fond */}
      <div style={{position:"fixed",top:"-20%",left:"-15%",width:"60vw",height:"60vw",background:"radial-gradient(ellipse,rgba(99,102,241,0.18) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(70px)",animation:"aurora1 18s ease-in-out infinite",pointerEvents:"none",zIndex:0}} />
      <div style={{position:"fixed",bottom:"-20%",right:"-15%",width:"55vw",height:"55vw",background:"radial-gradient(ellipse,rgba(6,182,212,0.12) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(80px)",animation:"aurora2 22s ease-in-out infinite",pointerEvents:"none",zIndex:0}} />
      <div style={{position:"fixed",top:"30%",right:"5%",width:"35vw",height:"35vw",background:"radial-gradient(ellipse,rgba(139,92,246,0.1) 0%,transparent 65%)",borderRadius:"50%",filter:"blur(60px)",animation:"aurora3 15s ease-in-out infinite",pointerEvents:"none",zIndex:0}} />
      {/* Grille */}
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none",zIndex:0}} />

      {notification && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: notification.type === "error" ? "rgba(239,68,68,0.9)" : "rgba(16,185,129,0.9)", backdropFilter: "blur(10px)", border: `1px solid ${notification.type === "error" ? "rgba(239,68,68,0.5)" : "rgba(16,185,129,0.5)"}`, color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: notification.type === "error" ? "0 8px 24px rgba(239,68,68,0.4)" : "0 8px 24px rgba(16,185,129,0.4)", animation: "slideIn 0.3s ease" }}>{notification.msg}</div>}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} leave={contextMenu.leave} onDeleteDay={handleDeleteDay} onDeleteAll={handleDeleteAll} onClose={() => setContextMenu(null)} />}

      {/* SIDEBAR */}
      <aside style={{ width: 230, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(20px)", border: "1px solid rgba(148,163,184,0.1)", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div><div style={{ fontSize: 16, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.3px" }}>Planning {new Date().getFullYear()}</div></div>
          </div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: teamGradient(currentUser.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                {currentUser.avatar_initials || getInitials(`${currentUser.first_name || ""} ${currentUser.last_name || ""}`)}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#10b981", border: "2px solid #0f172a" }} />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.first_name} {currentUser.last_name}</div>
              <div style={{ fontSize: 10, color: currentUser.role === "admin" ? "#fbbf24" : currentUser.role === "manager" ? "#a78bfa" : currentUser.role === "coordinator" ? "#38bdf8" : "#6ee7b7", fontWeight: 500 }}>{currentUser.role === "admin" ? "👑 Admin" : currentUser.role === "manager" ? "👑 Manager" : currentUser.role === "coordinator" ? "📋 Coordinateur" : "👤 Agent"}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", padding: "6px 0", background: "transparent", borderRadius: 8, background: "transparent", border: "1px solid transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.15)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; e.currentTarget.style.color = "#cbd5e1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>🚪 Déconnexion</button>
        </div>
        <nav style={{ padding: "12px", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} className="nav-btn" onClick={() => {
              setView(item.id);
              if (item.id === "validations" && !isManager) {
                const newSeen = myRequests.filter(r => r.status === "rejected").map(r => r.id);
                setSeenRejected(newSeen);
                localStorage.setItem(`seenRejected_${currentUser.id}`, JSON.stringify(newSeen));
              }
            }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", border: "none", borderRadius: 10, background: view === item.id ? "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.2))" : "transparent", color: view === item.id ? "#f1f5f9" : "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: view === item.id ? 600 : 400, marginBottom: 2, boxShadow: view === item.id ? "inset 0 0 0 1px rgba(59,130,246,0.3)" : "none", transition: "all 0.2s" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span><span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(148,163,184,0.15)" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Légende</div>
          {leaveTypes.filter(t => !isPresenceType(t)).map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} /><span style={{ fontSize: 11, color: "#cbd5e1" }}>{t.label}</span>
            </div>
          ))}
          {leaveTypes.filter(t => isPresenceType(t)).length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.15)" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>🏢 Présences site</div>
              {sortLeaveTypes(leaveTypes.filter(t => isPresenceType(t))).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} /><span style={{ fontSize: 11, color: "#cbd5e1" }}>{t.label}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, border: "1.5px dashed #fbbf24", background: "#fef9ec" }} /><span style={{ fontSize: 11, color: "#cbd5e1" }}>Jour férié</span>
          </div>
          {isManager && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.15)" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>🔔 Astreintes vendredi</div>
              <div style={{ fontSize: 11, color: "#cbd5e1" }}>Cliquez sur 🔔 Astreintes puis sur un vendredi pour assigner</div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main id="main-scroll" style={{ flex: 1, overflow: "auto", background: "linear-gradient(180deg,rgba(15,23,42,0.2) 0%,rgba(30,58,138,0.15) 100%)" }}>
        <div style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(148,163,184,0.1)", borderBottom: "2px solid rgba(59,130,246,0.2)", padding: "11px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{view === "planning" ? "Planning" : view === "validations" ? "Demandes de congés" : view === "stats" ? "Statistiques" : "Administration"}</h1>
          {view === "validations" && <span style={{ fontSize: 12, color: "#94a3b8" }}>{canValidateRequests ? `${pendingRequests.length} en attente` : `${myRequests.length} demande(s)`}</span>}
        </div>

        {view === "admin" && isManager && <AdminPanel agents={agents} teams={teams} leaveTypes={leaveTypes} token={token} showNotif={showNotif}
          onAgentAdded={a => setAgents(prev => [...prev, a])}
          onAgentUpdated={(id, data) => setAgents(prev => prev.map(a => a.id === id ? { ...a, ...(data.name ? { name: data.name, avatar: getInitials(data.name) } : {}), email: data.email || a.email, team: data.team !== undefined ? data.team : a.team, role: data.role || a.role, can_book_presence_sites: data.can_book_presence_sites !== undefined ? data.can_book_presence_sites : a.can_book_presence_sites } : a))}
          onAgentDeleted={id => setAgents(prev => prev.filter(a => a.id !== id))}
          onTeamAdded={t => setTeams(prev => [...prev, t])}
          onTeamDeleted={id => setTeams(prev => prev.filter(t => t.id !== id))}
          onLeaveTypeAdded={lt => setLeaveTypes(prev => [...prev, lt])}
          onLeaveTypeUpdated={(id, data) => setLeaveTypes(prev => prev.map(lt => lt.id === id ? { ...lt, ...data } : lt))}
          onLeaveTypeDeleted={id => setLeaveTypes(prev => prev.filter(lt => lt.id !== id))}
        />}

        {view === "planning" && (
          <div style={{ padding: 24, animation: "fadeIn 0.3s ease" }}>
            {/* BANDE COLORÉE INDICATEUR MODE */}
            <div style={{ height: 4, borderRadius: 4, marginBottom: 12, background: filterMode === "presence" ? "linear-gradient(90deg,#0d9488,#14b8a6)" : filterMode === "astreinte" ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#6366f1,#818cf8)", boxShadow: filterMode === "presence" ? "0 2px 8px rgba(13,148,136,0.4)" : filterMode === "astreinte" ? "0 2px 8px rgba(245,158,11,0.4)" : "0 2px 8px rgba(99,102,241,0.4)" }} />
            {/* BARRE DE CONTRÔLES */}
            <div style={{ background: "#ffffff", border: "1px solid #e8edf5", borderRadius: 0, padding: "12px 16px", marginBottom: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
              {/* ONGLETS Planning / Présences sur site / Astreintes */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
                {[
                  { mode: "all",       label: "Planning",          icon: "📅", activeColor: "#4f46e5", activeBg: "linear-gradient(145deg,#6366f1,#4f46e5)", shadow: "rgba(99,102,241,0.45)" },
                  { mode: "presence",  label: "Présences sur site", icon: "🏢", activeColor: "#0f766e", activeBg: "linear-gradient(145deg,#14b8a6,#0d9488)", shadow: "rgba(13,148,136,0.45)" },
                  { mode: "astreinte", label: "Astreintes",         icon: "🔔", activeColor: "#b45309", activeBg: "linear-gradient(145deg,#f59e0b,#d97706)", shadow: "rgba(245,158,11,0.45)" },
                ].map(tab => {
                  const isActive = filterMode === tab.mode;
                  return (
                    <button key={tab.mode} onClick={() => {
                      setFilterMode(tab.mode);
                      if (tab.mode === "presence") { const pt = leaveTypes.find(t => isPresenceType(t)); if (pt) setSelectedLTId(pt.id); }
                    }} style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "6px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: isActive ? "#fff" : "#64748b",
                      background: isActive ? tab.activeBg : "#f8fafc",
                      border: isActive ? "none" : "1.5px solid #e2e8f0",
                      boxShadow: isActive
                        ? `0 4px 0 0 ${tab.shadow.replace("0.45","0.6")}, 0 6px 20px ${tab.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)`
                        : "0 2px 0 0 #d1d5db, 0 1px 3px rgba(0,0,0,0.06)",
                      transform: isActive ? "translateY(-1px)" : "translateY(0px)",
                      transition: "all 0.15s ease",
                      letterSpacing: "0.1px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.transform = "translateY(0px)"; }}}>
                      <span style={{ fontSize: 13 }}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              {/* Ligne 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {/* Toggle Mois/Semaine */}
                <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 2, gap: 2 }}>
                  {[{ v: "month", l: "Mois" }, { v: "week", l: "Semaine" }].map(({ v, l }) => (
                    <button key={v} onClick={() => setPlanView(v)} style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: planView === v ? "#fff" : "transparent", color: planView === v ? "#1e293b" : "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: planView === v ? 700 : 400, boxShadow: planView === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>{l}</button>
                  ))}
                </div>
                {/* Navigation date */}
                <div style={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
                  <button onClick={() => { if (planView === "month") { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); } else { const d = new Date(weekAnchor); d.setDate(d.getDate() - 7); setWeekAnchor(d); setYear(d.getFullYear()); setMonth(d.getMonth()); } }} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", padding: "2px 8px", fontSize: 13, color: "#64748b", lineHeight: 1, transition: "all 0.15s" }} onMouseEnter={e => { const c = filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#f59e0b":"#6366f1"; e.currentTarget.style.background = filterMode==="presence"?"#f0fdfa":filterMode==="astreinte"?"#fffbeb":"#eef2ff"; e.currentTarget.style.color = c; e.currentTarget.style.borderColor = c; }} onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>‹</button>
                  <button onClick={() => setShowMonthPicker(p => !p)} style={{ background: "#fff", border: `2px solid ${filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#f59e0b":"#6366f1"}`, cursor: "pointer", padding: "5px 12px", fontSize: 13, fontWeight: 700, color: filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#d97706":"#4338ca", minWidth: planView === "month" ? 130 : 180, textAlign: "center", borderRadius: 8, transition: "all 0.15s", boxShadow: filterMode==="presence"?"0 1px 6px rgba(13,148,136,0.2)":filterMode==="astreinte"?"0 1px 6px rgba(245,158,11,0.2)":"0 1px 6px rgba(99,102,241,0.2)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = filterMode==="presence"?"#f0fdfa":filterMode==="astreinte"?"#fffbeb":"#eef2ff"; }} onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                    {planView === "month" ? `${MONTHS_FR[month]} ${year}` : weekLabel()} <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>
                  </button>
                  <button onClick={() => { if (planView === "month") { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); } else { const d = new Date(weekAnchor); d.setDate(d.getDate() + 7); setWeekAnchor(d); setYear(d.getFullYear()); setMonth(d.getMonth()); } }} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", padding: "2px 8px", fontSize: 13, color: "#64748b", lineHeight: 1, transition: "all 0.15s" }} onMouseEnter={e => { const c = filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#f59e0b":"#6366f1"; e.currentTarget.style.background = filterMode==="presence"?"#f0fdfa":filterMode==="astreinte"?"#fffbeb":"#eef2ff"; e.currentTarget.style.color = c; e.currentTarget.style.borderColor = c; }} onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>›</button>
                  {showMonthPicker && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, padding: 12, width: 240, animation: "slideIn 0.15s ease" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
                        <button onClick={() => setYear(y => y - 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", padding: "0 6px" }}>‹</button>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{year}</span>
                        <button onClick={() => setYear(y => y + 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", padding: "0 6px" }}>›</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                        {MONTHS_FR.map((m_label, m_idx) => {
                          const isCurrent = m_idx === month;
                          const isNow = m_idx === now.getMonth() && year === now.getFullYear();
                          return (
                            <button key={m_idx} onClick={() => { setMonth(m_idx); setShowMonthPicker(false); }} style={{
                              padding: "5px 4px", borderRadius: 6, border: "none",
                              background: isCurrent ? "#1e293b" : isNow ? "#eef2ff" : "transparent",
                              color: isCurrent ? "#fff" : isNow ? "#4338ca" : "#475569",
                              cursor: "pointer", fontSize: 11, fontWeight: isCurrent || isNow ? 700 : 400,
                              transition: "background 0.1s"
                            }}
                              onMouseEnter={e => { if (!isCurrent) e.target.style.background = "#f1f5f9"; }}
                              onMouseLeave={e => { if (!isCurrent) e.target.style.background = isNow ? "#eef2ff" : "transparent"; }}>
                              {m_label.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setWeekAnchor(new Date(now.getFullYear(), now.getMonth(), now.getDate())); }} style={{ padding: "2px 10px", borderRadius: 7, border: `1.5px solid ${filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#f59e0b":"#6366f1"}`, background: filterMode==="presence"?"#f0fdfa":filterMode==="astreinte"?"#fffbeb":"#eef2ff", cursor: "pointer", fontSize: 11, fontWeight: 600, color: filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#d97706":"#6366f1", transition: "all 0.15s" }} onMouseEnter={e => { const c = filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#f59e0b":"#6366f1"; e.currentTarget.style.background = c; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { const bg = filterMode==="presence"?"#f0fdfa":filterMode==="astreinte"?"#fffbeb":"#eef2ff"; const c = filterMode==="presence"?"#0d9488":filterMode==="astreinte"?"#d97706":"#6366f1"; e.currentTarget.style.background = bg; e.currentTarget.style.color = c; }}>Aujourd'hui</button>

                {/* Filtres équipe - masqués en mode astreinte */}
                {filterMode !== "astreinte" && filterMode === "all" && (
                  <button onClick={() => {
                    const defaultAgent = isManager ? null : currentUser.id;
                    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
                    const defaultLT = isManager ? leaveTypes.filter(t => !isPresenceType(t))[0] : leaveTypes.find(t => AGENT_ALLOWED_CODES.includes(t.code) && !isPresenceType(t));
                    setAddLeaveForm({ agentId: defaultAgent, startDate: today, endDate: today, leaveTypeId: defaultLT?.id || null, reason: "" });
                    setAddLeaveModal(true);
                  }} className="btn-conge-expand" title="Demander un congé" style={{ marginLeft: "auto" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
                    <span className="btn-label">Demander un congé</span>
                  </button>
                )}
              </div>
              {filterMode === "astreinte" && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Filtrer :</span>
                {["all", "Css Digital", "Mailing Solution"].map(f => (
                  <button key={f} onClick={() => setAstreinteFilter(f)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid", fontSize: 11, cursor: "pointer", fontWeight: astreinteFilter === f ? 700 : 400, background: astreinteFilter === f ? "#1e293b" : "#fff", color: astreinteFilter === f ? "#fff" : "#64748b", borderColor: astreinteFilter === f ? "#1e293b" : "#e2e8f0", transition: "all 0.15s" }}>{f === "all" ? "Tous" : f}</button>
                ))}
              </div>}
              {filterMode !== "astreinte" && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                {filterMode === "presence" && !(isManager || isCoordinator || agents.find(a => a.id === currentUser.id)?.can_book_presence_sites) && (
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>🔒 Consultation uniquement</span>
                )}
                {filterMode === "presence" && <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Filtrer :</span>}
                {filterMode === "all" && <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Filtrer :</span>}
                <div style={{ display: "flex", gap: 4 }}>
                  {allTeams.map(t => (
                    <button key={t} onClick={() => setFilterTeam(t)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid", fontSize: 11, cursor: "pointer", fontWeight: filterTeam === t ? 700 : 400, background: filterTeam === t ? "#1e293b" : "#fff", color: filterTeam === t ? "#fff" : "#64748b", borderColor: filterTeam === t ? "#1e293b" : "#e2e8f0", transition: "all 0.15s" }}>{t}</button>
                  ))}
                  {!isAdmin && (
                    <button onClick={() => setFilterTeam(`agent-${currentUser.id}`)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid", fontSize: 11, cursor: "pointer", fontWeight: filterTeam === `agent-${currentUser.id}` ? 700 : 400, background: filterTeam === `agent-${currentUser.id}` ? "#6366f1" : "#fff", color: filterTeam === `agent-${currentUser.id}` ? "#fff" : "#64748b", borderColor: filterTeam === `agent-${currentUser.id}` ? "#6366f1" : "#e2e8f0", transition: "all 0.15s" }}>👤 Moi</button>
                  )}
                </div>
              </div>}
            </div>

            {/* BANDE ABSENTS DU JOUR */}
            {filterMode === "all" && (() => {
              const todayKey = dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
              const absentAgents = agents.filter(a => {
                if (a.role === "admin") return false;
                const aLeaves = leaves[a.id] || {};
                const l = aLeaves[todayKey];
                if (!l) return false;
                if (Array.isArray(l)) return l.some(x => x.status !== "rejected" && !isPresenceCode(x.leaveType, x.leaveLabel));
                return l.status !== "rejected" && !isPresenceCode(l.leaveType, l.leaveLabel);
              });
              if (absentAgents.length === 0) return null;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e8edf5", borderRadius: 10, padding: "6px 12px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Absents :</span>
                    <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, border: "1px solid #fecaca" }}>{absentAgents.length}</span>
                  </span>
                  <div style={{ width: 1, height: 16, background: "#e2e8f0", flexShrink: 0 }} />
                  {absentAgents.map(a => {
                    const l = (leaves[a.id] || {})[todayKey];
                    const leaveArr = Array.isArray(l) ? l : (l ? [l] : []);
                    const leave = leaveArr.find(x => x.status !== "rejected");
                    return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: "2px 8px 2px 4px" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 7, fontWeight: 700, flexShrink: 0 }}>{a.avatar}</div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{a.first_name || a.name.split(" ")[0]}</span>
                        {leave?.leaveLabel && <span style={{ fontSize: 10, color: "#94a3b8" }}>· {leave.leaveLabel}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* VUE SEMAINE ASTREINTE */}
            {planView === "week" && filterMode === "astreinte" && (() => {
              const cssAgents = agents.filter(a => a.team === "Css Digital" && a.role !== "admin");
              const mailAgents = agents.filter(a => a.team === "Mailing Solution" && a.role !== "admin");
              const mailingRows = [
                { id: "astreinte",      label: "Astreinte vendredi",    fridayOnly: true,  color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", textColor: "#92400e" },
                { id: "action_serveur", label: "Action Serveur / Admin", fridayOnly: false, color: "#8b5cf6", bg: "#f5f3ff", border: "#c4b5fd", textColor: "#5b21b6" },
                { id: "mail",           label: "Mail",                   fridayOnly: false, color: "#06b6d4", bg: "#ecfeff", border: "#67e8f9", textColor: "#0e7490" },
                { id: "es",             label: "ES",                     fridayOnly: false, color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7", textColor: "#065f46" },
              ];
              const showCss  = astreinteFilter === "all" || astreinteFilter === "Css Digital";
              const showMail = astreinteFilter === "all" || astreinteFilter === "Mailing Solution";

              function AstreinteWeekRow({ teamName, rowId, rowLabel, fridayOnly, color, bg, border, textColor, teamAgentsList }) {
                return (
                  <tr style={{ borderBottom: "1px solid #f1f5f9", height: 52 }}>
                    <td style={{ padding: "4px 12px", background: "#fff", fontSize: 11, fontWeight: 600, color: textColor, whiteSpace: "nowrap", minWidth: 160 }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 6 }} />
                      {rowLabel}
                    </td>
                    {weekDays.map((d, i) => {
                      const k = dKey(d);
                      const wk = d.getDay() === 0 || d.getDay() === 6;
                      const isFriday = d.getDay() === 5;
                      const isToday = k === dKey(now);
                      const eligible = !wk && (fridayOnly ? isFriday : true);
                      const canClick = canManageAstreintes && eligible;
                      const aKey = `${teamName}|${rowId}|${k}`;
                      const aAgentId = astreintes[aKey];
                      const aAgent = aAgentId ? agents.find(a => a.id === aAgentId) : null;
                      const inSel = astreinteSelStart && astreinteSelStart.teamName === teamName && astreinteSelStart.rowId === rowId && astreinteHovered && eligible && k >= Math.min(astreinteSelStart.key, astreinteHovered) && k <= Math.max(astreinteSelStart.key, astreinteHovered);
                      const inErase = astreinteEraseStart && astreinteEraseStart.teamName === teamName && astreinteEraseStart.rowId === rowId && astreinteHovered && eligible && k >= Math.min(astreinteEraseStart.key, astreinteHovered) && k <= Math.max(astreinteEraseStart.key, astreinteHovered);
                      return (
                        <td key={i}
                          onMouseDown={e => {
                            if (!canClick) return; e.preventDefault();
                            if (astreinteEraseStart && astreinteEraseStart.teamName === teamName && astreinteEraseStart.rowId === rowId) {
                              const s = astreinteEraseStart.key, en = k;
                              const minK = s < en ? s : en, maxK = s < en ? en : s;
                              setAstreintes(prev => { const n = { ...prev }; weekDays.forEach(dd => { const dk = dKey(dd); if (dk >= minK && dk <= maxK) delete n[`${teamName}|${rowId}|${dk}`]; }); return n; });
                              setAstreinteEraseStart(null); setAstreinteHovered(null);
                            } else if (astreinteSelStart && astreinteSelStart.teamName === teamName && astreinteSelStart.rowId === rowId) {
                              const s = astreinteSelStart.key, en = k;
                              const minK = s < en ? s : en, maxK = s < en ? en : s;
                              if (astreinteSelStart.agentId) {
                                setAstreintes(prev => { const n = { ...prev }; weekDays.forEach(dd => { const dk = dKey(dd), dow2 = dd.getDay(), wk2 = dow2===0||dow2===6, isFri2 = dow2===5; if (dk >= minK && dk <= maxK && !wk2 && (fridayOnly ? isFri2 : true)) n[`${teamName}|${rowId}|${dk}`] = astreinteSelStart.agentId; }); return n; });
                              }
                              setAstreinteSelStart(null); setAstreinteHovered(null);
                            } else {
                              setAstreinteDropdown({
                                aKey, teamName, rowId, rowType: rowId, key: k, x: e.clientX, y: e.clientY, fridayOnly,
                                onAgentPicked: fridayOnly ? null : (agentId) => { setAstreinteSelStart({ teamName, rowId, key: k, agentId }); setAstreinteHovered(k); },
                                onErasePicked: () => { setAstreinteEraseStart({ teamName, rowId, key: k }); setAstreinteHovered(k); }
                              });
                            }
                          }}
                          onContextMenu={e => { e.preventDefault(); if (!canClick) return; setAstreintes(prev => { const n = { ...prev }; delete n[aKey]; return n; }); }}
                          onMouseEnter={() => {
                            if ((astreinteSelStart && astreinteSelStart.teamName === teamName && astreinteSelStart.rowId === rowId) ||
                              (astreinteEraseStart && astreinteEraseStart.teamName === teamName && astreinteEraseStart.rowId === rowId)) { if (eligible) setAstreinteHovered(k); }
                          }}
                          className={canClick ? "cell-hover" : ""}
                          style={{
                            textAlign: "center", cursor: canClick ? "pointer" : "default",
                            background: inErase ? "#fee2e2" : inSel ? "#fde68a" : isToday ? "#fffbeb" : wk ? "#fafafa" : "#fff",
                            borderLeft: "1px solid #f8fafc", height: 52, verticalAlign: "middle",
                            outline: inErase ? "2px solid #ef4444" : inSel ? "2px solid #f59e0b" : "none", outlineOffset: "-2px",
                            opacity: (!eligible && !wk) ? 0.25 : 1
                          }}>
                          {eligible && (aAgent ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 2px" }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: teamGradient(aAgent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>{aAgent.avatar}</div>
                              <span style={{ fontSize: 9, color: textColor, fontWeight: 700, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{aAgent.name.split(" ")[0]}</span>
                            </div>
                          ) : (
                            canManageAstreintes && !astreinteSelStart && (
                              <div style={{ width: "calc(100% - 8px)", height: 36, margin: "0 4px", borderRadius: 6, border: `1.5px dashed ${border}`, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 16, color: border, fontWeight: 700 }}>+</span>
                              </div>
                            )
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              }

              return (
                <div style={{ background: "#fff", borderRadius: 0, overflow: "hidden", border: "2px solid #f59e0b", boxShadow: "0 2px 24px rgba(245,158,11,0.15)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff" }}>
                      <tr>
                        <th style={{ width: 160, padding: "12px 16px", textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9", background: "#fef9ec", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔔 ÉQUIPE / RÔLE</th>
                        {weekDays.map((d, i) => {
                          const k = dKey(d), wk = d.getDay()===0||d.getDay()===6, isToday = k===dKey(now), isFriday = d.getDay()===5;
                          return (
                            <th key={i} style={{ padding: "10px 6px", textAlign: "center", fontSize: 10, fontWeight: 600, background: isFriday && !wk ? "#fef3c7" : isToday ? "#fffbeb" : wk ? "#fafafa" : "#f8fafc", color: isFriday && !wk ? "#d97706" : isToday ? "#f59e0b" : wk ? "#d1d5db" : "#94a3b8", borderBottom: `2px solid ${isFriday && !wk ? "#f59e0b" : isToday ? "#fbbf24" : "#f1f5f9"}`, borderLeft: "1px solid #f8fafc", minWidth: 80 }}>
                              <div style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{DAYS_FR[i]}</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: isFriday && !wk ? "#d97706" : isToday ? "#f59e0b" : wk ? "#e2e8f0" : "#1e293b", marginTop: 2 }}>{d.getDate()}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{MONTHS_FR[d.getMonth()].slice(0,3)}</div>
                              {isFriday && !wk && <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, marginTop: 2 }}>🔔 Astreinte</div>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {showCss && (
                        <React.Fragment>
                          <tr style={{ background: "#f0f9ff", borderBottom: "2px solid #bae6fd" }}>
                            <td colSpan={8} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔔 Css Digital — Astreinte vendredi</td>
                          </tr>
                          <AstreinteWeekRow teamName="Css Digital" rowId="astreinte" rowLabel="Agent d'astreinte" fridayOnly={true} color="#3b82f6" bg="#eff6ff" border="#93c5fd" textColor="#1d4ed8" teamAgentsList={cssAgents} />
                        </React.Fragment>
                      )}
                      {showMail && (
                        <React.Fragment>
                          <tr style={{ background: "#fdf4ff", borderBottom: "2px solid #e9d5ff" }}>
                            <td colSpan={8} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔔 Mailing Solution</td>
                          </tr>
                          {mailingRows.map(row => (
                            <AstreinteWeekRow key={row.id} teamName="Mailing Solution" rowId={row.id} rowLabel={row.label} fridayOnly={row.fridayOnly} color={row.color} bg={row.bg} border={row.border} textColor={row.textColor} teamAgentsList={mailAgents} />
                          ))}
                        </React.Fragment>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* VUE MOIS */}
            {planView === "month" && filterMode === "astreinte" && (
              <React.Fragment>
                <div style={{
                  background: "#fff", borderRadius: 0,
                  border: `2px solid ${filterMode === "presence" ? "#0d9488" : filterMode === "astreinte" ? "#f59e0b" : "#6366f1"}`,
                  overflow: "auto",
                  boxShadow: filterMode === "presence" ? "0 2px 24px rgba(13,148,136,0.15)" : filterMode === "astreinte" ? "0 2px 24px rgba(245,158,11,0.15)" : "0 2px 24px rgba(99,102,241,0.15)"
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup><col style={{ width: 200 }} />{Array.from({ length: daysInMonth }, (_, i) => <col key={i} />)}</colgroup>
                    <thead>
                      <tr>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9", background: "#fef9ec", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔔 ÉQUIPE / RÔLE</th>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1, k = dateKey(year, month, day), wk = isWeekend(year, month, day), isToday = todayDay === day;
                          const isFriday = new Date(year, month, day).getDay() === 5;
                          return <th key={i} style={{
                            padding: "4px 2px", textAlign: "center", fontSize: 9, fontWeight: 600,
                            background: isFriday && !wk ? "#fef3c7" : isToday ? "#eef2ff" : wk ? "#fafafa" : "#f8fafc",
                            color: isFriday && !wk ? "#d97706" : isToday ? "#6366f1" : wk ? "#d1d5db" : "#94a3b8",
                            borderBottom: `2px solid ${isFriday && !wk ? "#f59e0b" : isToday ? "#6366f1" : "#f1f5f9"}`,
                            borderLeft: "1px solid #f8fafc", minWidth: 26
                          }}>
                            <div style={{ textTransform: "uppercase" }}>{DAYS_FR[(i + firstDay) % 7].slice(0, 1)}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isFriday && !wk ? "#d97706" : isToday ? "#6366f1" : wk ? "#e2e8f0" : "#475569", marginTop: 1 }}>{day}</div>
                          </th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* helper: render one astreinte row */}
                      {(() => {
                        function AstreinteRow({ teamName, rowId, rowLabel, fridayOnly, color, bg, border, textColor, teamAgentsList }) {
                          return (
                            <tr style={{ borderBottom: "1px solid #f1f5f9", height: 48 }}>
                              <td style={{ padding: "4px 10px", background: "#fff", fontSize: 11, fontWeight: 600, color: textColor, whiteSpace: "nowrap" }}>
                                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 6 }} />
                                {rowLabel}
                              </td>
                              {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1, k = dateKey(year, month, day), wk = isWeekend(year, month, day);
                                const dow = new Date(year, month, day).getDay();
                                const isFriday = dow === 5;
                                const isWorkday = !wk;
                                const eligible = isWorkday && (fridayOnly ? isFriday : true);
                                const canClick = canManageAstreintes && eligible;
                                const aKey = `${teamName}|${rowId}|${k}`;
                                const aAgentId = astreintes[aKey];
                                const aAgent = aAgentId ? agents.find(a => a.id === aAgentId) : null;
                                // drag selection highlight
                                const inSel = astreinteSelStart && astreinteSelStart.teamName === teamName && astreinteSelStart.rowId === rowId && astreinteHovered && eligible && (() => {
                                  const s = astreinteSelStart.key, e = astreinteHovered;
                                  return k >= Math.min(s, e) && k <= Math.max(s, e);
                                })();
                                const inErase = astreinteEraseStart && astreinteEraseStart.teamName === teamName && astreinteEraseStart.rowId === rowId && astreinteHovered && eligible && (() => {
                                  const s = astreinteEraseStart.key, e = astreinteHovered;
                                  return k >= Math.min(s, e) && k <= Math.max(s, e);
                                })();
                                return <td key={i}
                                  onMouseDown={e => {
                                    if (!canClick) return; e.preventDefault();
                                    // Mode effacement plage : second clic = effacer la plage
                                    if (astreinteEraseStart && astreinteEraseStart.teamName === teamName && astreinteEraseStart.rowId === rowId) {
                                      const s = astreinteEraseStart.key, en = k;
                                      const minK = s < en ? s : en, maxK = s < en ? en : s;
                                      setAstreintes(prev => {
                                        const n = { ...prev };
                                        for (let d = 1; d <= daysInMonth; d++) {
                                          const dk = dateKey(year, month, d), dow2 = new Date(year, month, d).getDay(), wk2 = dow2 === 0 || dow2 === 6;
                                          const isFri2 = dow2 === 5;
                                          if (dk >= minK && dk <= maxK && !wk2 && (fridayOnly ? isFri2 : true)) {
                                            delete n[`${teamName}|${rowId}|${dk}`];
                                          }
                                        }
                                        return n;
                                      });
                                      setAstreinteEraseStart(null); setAstreinteHovered(null);
                                      // Mode assignation : second clic = assigner la plage
                                    } else if (astreinteSelStart && astreinteSelStart.teamName === teamName && astreinteSelStart.rowId === rowId) {
                                      const s = astreinteSelStart.key, en = k;
                                      const minK = s < en ? s : en, maxK = s < en ? en : s;
                                      if (astreinteSelStart.agentId) {
                                        setAstreintes(prev => {
                                          const n = { ...prev };
                                          for (let d = 1; d <= daysInMonth; d++) {
                                            const dk = dateKey(year, month, d), dow2 = new Date(year, month, d).getDay(), wk2 = dow2 === 0 || dow2 === 6;
                                            const isFri2 = dow2 === 5;
                                            if (dk >= minK && dk <= maxK && !wk2 && (fridayOnly ? isFri2 : true)) {
                                              n[`${teamName}|${rowId}|${dk}`] = astreinteSelStart.agentId;
                                            }
                                          }
                                          return n;
                                        });
                                      }
                                      setAstreinteSelStart(null); setAstreinteHovered(null);
                                    } else {
                                      // Premier clic : ouvrir dropdown
                                      // fridayOnly = assignation directe (1 clic), sinon mode glisser
                                      setAstreinteDropdown({
                                        aKey, teamName, rowId, rowType: rowId, key: k, x: e.clientX, y: e.clientY, fridayOnly,
                                        onAgentPicked: fridayOnly ? null : (agentId) => {
                                          setAstreinteSelStart({ teamName, rowId, key: k, agentId });
                                          setAstreinteHovered(k);
                                        },
                                        onErasePicked: () => {
                                          setAstreinteEraseStart({ teamName, rowId, key: k });
                                          setAstreinteHovered(k);
                                        }
                                      });
                                    }
                                  }}
                                  onContextMenu={e => {
                                    e.preventDefault(); if (!canClick) return;
                                    // Clic droit = supprimer ce jour uniquement
                                    setAstreintes(prev => { const n = { ...prev }; delete n[aKey]; return n; });
                                  }}
                                  onMouseEnter={() => {
                                    if ((astreinteSelStart && astreinteSelStart.teamName === teamName && astreinteSelStart.rowId === rowId) ||
                                      (astreinteEraseStart && astreinteEraseStart.teamName === teamName && astreinteEraseStart.rowId === rowId)) { if (eligible) setAstreinteHovered(k); }
                                  }}
                                  className={canClick ? "cell-hover" : ""}
                                  style={{
                                    padding: "2px 1px", textAlign: "center", cursor: canClick ? "pointer" : "default",
                                    background: inErase ? "#fee2e2" : inSel ? "#fde68a" : wk ? "#fafafa" : fridayOnly && !isFriday ? "#fff" : eligible ? "#fff" : "#fff",
                                    borderLeft: "1px solid #f8fafc", height: 48, verticalAlign: "middle",
                                    outline: inErase ? "2px solid #ef4444" : inSel ? "2px solid #f59e0b" : "none", outlineOffset: "-2px"
                                  }}>
                                  {eligible && (aAgent ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: teamGradient(aAgent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>{aAgent.avatar}</div>
                                      <span style={{ fontSize: 7, color: textColor, fontWeight: 700 }}>{aAgent.name.split(" ")[0]}</span>
                                    </div>
                                  ) : (
                                    canManageAstreintes && !astreinteSelStart && <div style={{ width: "calc(100% - 4px)", height: 30, margin: "0 2px", borderRadius: 3, border: `1.5px dashed ${border}`, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <span style={{ fontSize: 12, color: border, fontWeight: 700 }}>+</span>
                                    </div>
                                  ))}
                                </td>;
                              })}
                            </tr>
                          );
                        }

                        const showCss = astreinteFilter === "all" || astreinteFilter === "Css Digital";
                        const showMail = astreinteFilter === "all" || astreinteFilter === "Mailing Solution";
                        const cssAgents = agents.filter(a => a.team === "Css Digital" && a.role !== "admin");
                        const mailAgents = agents.filter(a => a.team === "Mailing Solution" && a.role !== "admin");
                        const mailingRows = [
                          { id: "astreinte", label: "Astreinte vendredi", fridayOnly: true, color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", textColor: "#92400e" },
                          { id: "action_serveur", label: "Action Serveur / Admin", fridayOnly: false, color: "#8b5cf6", bg: "#f5f3ff", border: "#c4b5fd", textColor: "#5b21b6" },
                          { id: "mail", label: "Mail", fridayOnly: false, color: "#06b6d4", bg: "#ecfeff", border: "#67e8f9", textColor: "#0e7490" },
                          { id: "es", label: "ES", fridayOnly: false, color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7", textColor: "#065f46" },
                        ];
                        return (
                          <React.Fragment>
                            {showCss && (
                              <React.Fragment>
                                <tr style={{ background: "#f0f9ff", borderBottom: "2px solid #bae6fd" }}>
                                  <td colSpan={daysInMonth + 1} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔔 Css Digital — Astreinte vendredi</td>
                                </tr>
                                <AstreinteRow teamName="Css Digital" rowId="astreinte" rowLabel="Agent d'astreinte" fridayOnly={true} color="#3b82f6" bg="#eff6ff" border="#93c5fd" textColor="#1d4ed8" teamAgentsList={cssAgents} />
                              </React.Fragment>
                            )}
                            {showMail && (
                              <React.Fragment>
                                <tr style={{ background: "#fdf4ff", borderBottom: "2px solid #e9d5ff" }}>
                                  <td colSpan={daysInMonth + 1} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔔 Mailing Solution</td>
                                </tr>
                                {mailingRows.map(row => (
                                  <AstreinteRow key={row.id} teamName="Mailing Solution" rowId={row.id} rowLabel={row.label} fridayOnly={row.fridayOnly} color={row.color} bg={row.bg} border={row.border} textColor={row.textColor} teamAgentsList={mailAgents} />
                                ))}
                              </React.Fragment>
                            )}
                          </React.Fragment>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* BILAN ANNUEL ASTREINTES */}
                {(() => {
                  // Calculer le cumul par agent sur toute l'année pour toutes les clés astreintes
                  const bilanByTeam = {};
                  ASTREINTE_TEAMS.forEach(teamName => {
                    const teamAgentsList = agents.filter(a => a.team === teamName && a.role !== "admin");
                    // ✅ MODIFICATION : Toutes les équipes n'affichent que "astreinte" (vendredi)
                    const rows = ["astreinte"];
                    const rowLabels = { "astreinte": "Astreinte vendredi", "action_serveur": "Action Serveur / Admin", "mail": "Mail", "es": "ES" };
                    // Compter sur toute l'année (toutes les clés du localStorage)
                    const agentCounts = {};
                    teamAgentsList.forEach(a => { agentCounts[a.id] = {}; rows.forEach(r => { agentCounts[a.id][r] = 0; }); });
                    Object.entries(astreintes).forEach(([key, agentId]) => {
                      const parts = key.split("|");
                      if (parts.length !== 3) return;
                      const [kTeam, kRow, kDate] = parts;
                      if (kTeam !== teamName) return;
                      if (!agentCounts[agentId]) return;
                      if (agentCounts[agentId][kRow] !== undefined) agentCounts[agentId][kRow]++;
                    });
                    bilanByTeam[teamName] = { agents: teamAgentsList, rows, rowLabels, agentCounts };
                  });
                  const showCssBilan = astreinteFilter === "all" || astreinteFilter === "Css Digital";
                  const showMailBilan = astreinteFilter === "all" || astreinteFilter === "Mailing Solution";
                  return (
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => setShowBilanAstreinte(p => !p)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "#fff", border: "2px solid #f59e0b", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#92400e", boxShadow: "0 1px 6px rgba(245,158,11,0.15)" }}>
                        <span>📊 Bilan annuel des astreintes {year}</span>
                        <span style={{ marginLeft: "auto", fontSize: 14, transition: "transform 0.2s", display: "inline-block", transform: showBilanAstreinte ? "rotate(180deg)" : "none" }}>▾</span>
                      </button>
                      {showBilanAstreinte && (
                        <div style={{ background: "#fff", border: "2px solid #f59e0b", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden", boxShadow: "0 4px 16px rgba(245,158,11,0.1)" }}>
                          {[...(showCssBilan ? ["Css Digital"] : []), ...(showMailBilan ? ["Mailing Solution"] : [])].map(teamName => {
                            const { agents: tAgents, rows, rowLabels, agentCounts } = bilanByTeam[teamName];
                            const teamColor = teamName === "Css Digital" ? "#3b82f6" : "#7c3aed";
                            const teamBg = teamName === "Css Digital" ? "#eff6ff" : "#fdf4ff";
                            return (
                              <div key={teamName}>
                                <div style={{ padding: "8px 16px", background: teamBg, borderTop: "1px solid #f1f5f9", fontSize: 11, fontWeight: 700, color: teamColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  🔔 {teamName}
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
                                    <colgroup>
                                      <col style={{ width: "60%" }} />
                                      {rows.map(r => <col key={`col-${r}`} style={{ width: `${20 / rows.length}%` }} />)}
                                      {rows.length > 1 && <col style={{ width: "20%" }} />}
                                    </colgroup>
                                    <thead style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff" }}>
                                      <tr style={{ background: "#fafafa" }}>
                                        <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 11, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 21, background: "#fafafa" }}>Agent</th>
                                        {rows.map(r => (
                                          <th key={r} style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#64748b", fontSize: 11, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{rowLabels[r]}</th>
                                        ))}
                                        {rows.length > 1 && <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#1e293b", fontSize: 11, borderBottom: "1px solid #f1f5f9" }}>Total</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {tAgents
                                        // ✅ MODIFICATION : Filtrer les agents ayant au moins 1 astreinte du vendredi
                                        .filter(a => agentCounts[a.id]?.["astreinte"] > 0)
                                        .sort((a, b) => {
                                          const totA = rows.reduce((s, r) => s + (agentCounts[a.id]?.[r] || 0), 0);
                                          const totB = rows.reduce((s, r) => s + (agentCounts[b.id]?.[r] || 0), 0);
                                          return totB - totA;
                                        }).map((agent, i) => {
                                          const total = rows.reduce((s, r) => s + (agentCounts[agent.id]?.[r] || 0), 0);
                                          const maxTotal = Math.max(...tAgents.map(a => rows.reduce((s, r) => s + (agentCounts[a.id]?.[r] || 0), 0)), 1);
                                          return (
                                            <tr key={agent.id} style={{ borderBottom: "1px solid #f8fafc", transition: "all 0.15s" }}
                                              onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; Array.from(e.currentTarget.querySelectorAll("td")).forEach((td, idx) => { if (idx === 0) td.style.background = "#fafafa"; }); }}
                                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; Array.from(e.currentTarget.querySelectorAll("td")).forEach((td, idx) => { if (idx === 0) td.style.background = "transparent"; }); }}>
                                              <td style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, background: "transparent" }}>
                                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: teamGradient(agent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{agent.avatar}</div>
                                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{agent.name}</span>
                                              </td>
                                              {rows.map(r => {
                                                const count = agentCounts[agent.id]?.[r] || 0;
                                                return (
                                                  <td key={r} style={{ padding: "8px 12px", textAlign: "center" }}>
                                                    {count > 0
                                                      ? <span style={{ display: "inline-block", background: teamBg, color: teamColor, borderRadius: 6, padding: "2px 10px", fontWeight: 700, fontSize: 12, border: `1px solid ${teamColor}30` }}>{count}</span>
                                                      : <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
                                                    }
                                                  </td>
                                                );
                                              })}
                                              {rows.length > 1 && (
                                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                                                    <div style={{ flex: 1, maxWidth: 60, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                                                      <div style={{ height: "100%", background: teamColor, borderRadius: 3, width: `${Math.round((total / maxTotal) * 100)}%`, transition: "width 0.3s" }} />
                                                    </div>
                                                    <span style={{ fontWeight: 700, color: teamColor, minWidth: 20, textAlign: "right" }}>{total}</span>
                                                  </div>
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </React.Fragment>
            )}
            {planView === "month" && filterMode !== "astreinte" && (
              <div style={{
                background: "#fff", borderRadius: 0, overflow: "hidden",
                border: `2px solid ${filterMode === "presence" ? "#0d9488" : filterMode === "astreinte" ? "#f59e0b" : "#6366f1"}`,
                boxShadow: filterMode === "presence" ? "0 2px 24px rgba(13,148,136,0.15)" : filterMode === "astreinte" ? "0 2px 24px rgba(245,158,11,0.15)" : "0 2px 24px rgba(99,102,241,0.15)"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup><col style={{ width: 160 }} />{Array.from({ length: daysInMonth }, (_, i) => <col key={i} />)}</colgroup>
                  <thead style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff" }}>
                    <tr>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9", background: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.5px" }}>AGENT</th>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1, k = dateKey(year, month, day), wk = isWeekend(year, month, day), isToday = todayDay === day, isFer = !!feries[k];
                        const absent = countAbsents(k);
                        const isFriday = new Date(year, month, day).getDay() === 5;
                        const isAstrDay = filterMode === "astreinte" && isFriday && !wk;
                        return <th key={i} style={{ padding: "4px 2px", textAlign: "center", fontSize: 9, fontWeight: 600, background: isAstrDay ? "#fef3c7" : isToday ? "#eef2ff" : isFer ? "#fef9ec" : wk ? "#fafafa" : "#f8fafc", color: isAstrDay ? "#d97706" : isToday ? "#6366f1" : isFer ? "#d97706" : wk ? "#d1d5db" : "#94a3b8", borderBottom: `2px solid ${isAstrDay ? "#f59e0b" : isToday ? "#6366f1" : isFer ? "#fde68a" : "#f1f5f9"}`, borderLeft: "1px solid #f8fafc", minWidth: 26 }}>
                          <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
                            {filterMode !== "presence" && !wk && !isFer && absent > 0 && (
                              <div style={{ fontSize: 9, color: "#fff", background: absent >= 3 ? "#ef4444" : absent >= 2 ? "#f97316" : "#6366f1", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>{absent}</div>
                            )}
                            {filterMode === "presence" && !wk && (() => {
                              const nRueil = countPresence(k, "rueil");
                              const nParis = countPresence(k, "paris");
                              const rueilColor = leaveTypes.find(t => (t.code || "").toLowerCase() === "rueil" || (t.label || "").toLowerCase() === "rueil")?.color || "#0d9488";
                              const parisColor = leaveTypes.find(t => (t.code || "").toLowerCase() === "paris" || (t.label || "").toLowerCase() === "paris")?.color || "#7c3aed";
                              return (
                                <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                                  {nRueil > 0 && <div style={{ fontSize: 8, fontWeight: 800, color: "#fff", background: rueilColor, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>{nRueil}</div>}
                                  {nParis > 0 && <div style={{ fontSize: 8, fontWeight: 800, color: "#fff", background: parisColor, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>{nParis}</div>}
                                </div>
                              );
                            })()}
                          </div>
                          <div style={{ textTransform: "uppercase" }}>{DAYS_FR[(i + firstDay) % 7].slice(0, 1)}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#6366f1" : isFer ? "#d97706" : wk ? "#e2e8f0" : "#475569", marginTop: 1 }}>{day}</div>
                          {isFer && !wk && <div title={feries[k]} style={{ fontSize: 8, color: "#f59e0b" }}>🗓</div>}
                          {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", margin: "1px auto 0" }} />}
                        </th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {agentsByTeam.map(([teamName, teamAgents], teamIdx) => {
                      let agentIndex = 0;
                      // Calculer l'index global des agents
                      if (teamIdx > 0) {
                        agentIndex = agentsByTeam.slice(0, teamIdx).reduce((sum, [_, agents]) => sum + agents.length, 0);
                      }
                      return (
                        <React.Fragment key={teamName}>
                          {(() => { const tp = teamPalette(teamName); return (
                          <tr style={{ background: tp.header, borderBottom: "2px solid " + tp.border }}>
                            <td colSpan={daysInMonth + 1} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: tp.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>🏢 {teamName}</td>
                          </tr>
                          ); })()}
                          {teamAgents.map((agent, i) => {
                            // Calculer l'index DIRECTEMENT depuis sortedAgents (plus fiable)
                            // Tri désactivé
                            const tp = teamPalette(teamName);
                            const rowBg = tp.row;
                            return (
                              <tr key={agent.id} style={{ borderBottom: "1px solid " + tp.border + "40", height: 36, background: rowBg, transition: "all 0.2s", outline: selectedAgentRow === agent.id ? "2px solid " + tp.border : "none", outlineOffset: -2, opacity: selectedAgentRow && selectedAgentRow !== agent.id ? 0.45 : 1 }}>
                                <td style={{ padding: "0 10px", verticalAlign: "middle", background: rowBg, fontSize: 12, position: "relative", cursor: "pointer" }}
                                  onClick={() => setSelectedAgentRow(selectedAgentRow === agent.id ? null : agent.id)}
                                  draggable={isAdmin}
                                  onDragStart={e => { if (!isAdmin) return; e.stopPropagation(); setDragAgentId(agent.id); e.dataTransfer.effectAllowed = "move"; }}
                                  onDragOver={e => { if (!isAdmin || !dragAgentId) return; e.preventDefault(); setDragOverAgentId(agent.id); }}
                                  onDragLeave={() => setDragOverAgentId(null)}
                                  onDrop={e => { e.preventDefault(); e.stopPropagation(); if (dragAgentId) dragReorder(dragAgentId, agent.id); setDragAgentId(null); setDragOverAgentId(null); }}
                                  onDragEnd={() => { setDragAgentId(null); setDragOverAgentId(null); }}
                                  style={{ display: "flex", alignItems: "center", height: "100%", minHeight: 36, gap: 6, paddingLeft: 6, opacity: dragAgentId === agent.id ? 0.4 : 1, background: dragOverAgentId === agent.id ? "#eef2ff" : "inherit", transition: "background 0.15s, opacity 0.15s", cursor: isAdmin ? "grab" : "pointer" }}>
                                  {isAdmin && <span style={{ fontSize: 13, color: "#64748b", flexShrink: 0, cursor: "grab", userSelect: "none", marginRight: 6 }}>⠿</span>}
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: teamGradient(agent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0, boxShadow: selectedAgentRow === agent.id ? "0 0 0 2px #3b82f6" : "none" }}>{agent.avatar}</div>
                                  <div style={{ minWidth: 0, flex: 1, marginLeft: 7 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: agent.id === currentUser.id ? "#6366f1" : selectedAgentRow === agent.id ? "#3b82f6" : "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{agent.name.split(" ")[0]} {agent.role === "manager" ? "👑" : ""}</div>
                                  </div>
                                </td>
                                {Array.from({ length: daysInMonth }, (_, i) => {
                                  const day = i + 1, k = dateKey(year, month, day), wk = isWeekend(year, month, day), isFer = !!feries[k];
                                  const leave = getLeaveForDay(agent.id, day), inSel = isInSelection(agent.id, day), isToday = todayDay === day;
                                  const agentCanPresence = !!agents.find(a => a.id === agent.id)?.can_book_presence_sites;
                                  const isFridayCell = new Date(year, month, day).getDay() === 5;
                                  const canInteract = filterMode === "astreinte" ? (canManageAstreintes && isFridayCell && !wk) : (filterMode === "presence" ? (isManager || (currentUser.id === agent.id && agentCanPresence)) : (isManager || (isCoordinator && currentUser.id === agent.id))) && !wk && (!isFer || isManager);
                                  return <td key={i}
                                    onClick={e => { if (filterMode === "astreinte" && canInteract) { e.stopPropagation(); setAstreinteDropdown(d => d && d.key === dateKey(year, month, day) ? null : { key: dateKey(year, month, day), x: e.clientX, y: e.clientY }); } else canInteract && handleCellClick(agent.id, day); }}
                                    onContextMenu={e => !wk && handleCellRightClick(e, agent.id, day)}
                                    onMouseEnter={() => { if (selectedAgent === agent.id) setHoveredDay(day); }}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    className={canInteract ? "cell-hover" : ""}
                                    title={isFer ? `🗓 ${feries[k]}` : (leave && isHalfDay(leave) ? (getHalfDayPeriod(leave) === "matin" ? `${leave.label} — Matin` : `${leave.label} — Après-midi`) : "")}
                                    style={{ padding: "2px 1px", textAlign: "center", cursor: canInteract ? "pointer" : "default", background: selectedAgentRow === agent.id ? tp.header : wk ? tp.wk : isFer ? "#fef9ec" : inSel ? "#e0e7ff" : isToday ? tp.header : rowBg, borderLeft: "1px solid " + tp.border + "25", height: 36, position: "relative", transition: "background 0.15s" }}>
                                    {filterMode === "astreinte" && isFridayCell && !wk && (() => {
                                      const aKey = dateKey(year, month, day);
                                      const aAgentId = astreintes[aKey];
                                      const aAgent = aAgentId ? agents.find(a => a.id === aAgentId) : null;
                                      return aAgent ? (
                                        <div style={{ width: "calc(100% - 2px)", height: 20, margin: "0 1px", borderRadius: 3, background: "#fef3c7", border: "1.5px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                          <span style={{ fontSize: 8, fontWeight: 800, color: "#92400e" }}>{aAgent.avatar}</span>
                                        </div>
                                      ) : (
                                        <div style={{ width: "calc(100% - 2px)", height: 20, margin: "0 1px", borderRadius: 3, border: "1px dashed #fcd34d", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                          <span style={{ fontSize: 9, color: "#fcd34d" }}>+</span>
                                        </div>
                                      );
                                    })()}
                                    {filterMode !== "astreinte" && isFer && !wk && <div style={{ width: "calc(100% - 2px)", height: 20, margin: "0 1px", background: "rgba(251,191,36,0.15)", border: "1px dashed #fbbf24", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 8, color: "#d97706", fontWeight: 700 }}>🗓</span></div>}
                                    {filterMode !== "astreinte" && leave && !wk && !isFer && (
                                      filterMode === "presence" && isPresenceCode(leave.code, leave.label) ? (
                                        <div style={{
                                          width: "calc(100% - 2px)", height: 20, margin: "0 1px", borderRadius: 3, overflow: "hidden", position: "relative",
                                          background: leave.status === "pending" ? "#fff" : leave.color,
                                          border: `1.5px solid ${leave.color}`,
                                          boxShadow: leave.status === "pending" ? "none" : `0 1px 3px ${leave.color}50`
                                        }}>
                                          {leave.status !== "pending" && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.15)" }} />}
                                          <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.3px", color: leave.status === "pending" ? leave.color : "#fff", textTransform: "uppercase" }}>
                                              {leave.status === "pending" ? "…" : leave.label.slice(0, 1).toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                      ) : isHalfDay(leave) && leave.status === "pending" ? (
                                        <div className="half-tooltip" data-tip={`${leaveAbbr(leave.label)} · ${getHalfDayPeriod(leave) === "matin" ? "Matin" : "Après-midi"}`} style={{ width: "calc(100% - 2px)", height: 20, margin: "0 1px", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: hexToLight(leave.color), border: `1px dashed ${leave.color}` }}>
                                          <span style={{ fontSize: 7, fontWeight: 700, color: leave.color }}>?</span>
                                        </div>
                                      ) : isHalfDay(leave) ? (
                                        <div className="half-tooltip" data-tip={`${leaveAbbr(leave.label)} · ${getHalfDayPeriod(leave) === "matin" ? "Matin" : "Après-midi"}`} style={{ display: "contents" }}>
                                        <HalfDayCell color={leave.color} label={leaveAbbr(leave.label).replace("½","").trim()} isMatin={getHalfDayPeriod(leave) === "matin"} size={20} fontSize={6} pad={1} />
                                        </div>
                                      ) : (
                                        <div style={{
                                          width: "calc(100% - 2px)", height: 20, margin: "0 1px",
                                          background: filterMode === "presence" ? hexToLight(leave.color) : (leave.status === "pending" ? hexToLight(leave.color) : leave.color),
                                          borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
                                          border: filterMode === "presence" ? `1px dashed ${leave.color}` : (leave.status === "pending" ? `1px dashed ${leave.color}` : "none"),
                                          opacity: filterMode === "presence" ? 0.75 : 1,
                                          boxShadow: filterMode !== "presence" && leave.status !== "pending" ? `0 1px 4px ${leave.color}40` : "none"
                                        }}>
                                          <span style={{
                                            fontSize: 7, fontWeight: 700,
                                            color: filterMode === "presence" || leave.status === "pending" ? leave.color : "#fff"
                                          }}>
                                            {leave.status === "pending" ? "?" : leaveAbbr(leave.label)}
                                          </span>
                                        </div>
                                      )
                                    )}
                                    {filterMode !== "astreinte" && inSel && !leave && !isFer && <div style={{ width: "calc(100% - 2px)", height: 20, margin: "0 1px", borderRadius: 3, background: "#c7d2fe", border: "1px solid #818cf8" }} />}
                                  </td>;
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* VUE SEMAINE */}
            {planView === "week" && (
              <div style={{
                background: "#fff", borderRadius: 0, overflow: "hidden",
                border: `2px solid ${filterMode === "presence" ? "#0d9488" : filterMode === "astreinte" ? "#f59e0b" : "#6366f1"}`,
                boxShadow: filterMode === "presence" ? "0 2px 24px rgba(13,148,136,0.15)" : filterMode === "astreinte" ? "0 2px 24px rgba(245,158,11,0.15)" : "0 2px 24px rgba(99,102,241,0.15)"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff" }}>
                    <tr>
                      <th style={{ width: 160, padding: "12px 16px", textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9", background: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.5px" }}>AGENT</th>
                      {weekDays.map((d, i) => {
                        const k = dKey(d), wk = d.getDay() === 0 || d.getDay() === 6, isToday = k === dKey(now);
                        const feriesDay = getFeries(d.getFullYear());
                        const isFer = !!feriesDay[k];
                        const absent = countAbsents(k);
                        return <th key={i} style={{ padding: "10px 4px", textAlign: "center", fontSize: 10, fontWeight: 600, background: isToday ? "#eef2ff" : isFer ? "#fef9ec" : wk ? "#fafafa" : "#f8fafc", color: isToday ? "#6366f1" : isFer ? "#d97706" : wk ? "#d1d5db" : "#94a3b8", borderBottom: `2px solid ${isToday ? "#6366f1" : isFer ? "#fde68a" : "#f1f5f9"}`, borderLeft: "1px solid #f8fafc" }}>
                          <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                            {filterMode !== "presence" && !wk && !isFer && absent > 0 && (
                              <div style={{ fontSize: 10, color: "#fff", background: absent >= 3 ? "#ef4444" : absent >= 2 ? "#f97316" : "#6366f1", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{absent}</div>
                            )}
                            {filterMode === "presence" && !wk && (() => {
                              const nRueil = countPresence(k, "rueil");
                              const nParis = countPresence(k, "paris");
                              const rueilColor = leaveTypes.find(t => (t.code || "").toLowerCase() === "rueil" || (t.label || "").toLowerCase() === "rueil")?.color || "#0d9488";
                              const parisColor = leaveTypes.find(t => (t.code || "").toLowerCase() === "paris" || (t.label || "").toLowerCase() === "paris")?.color || "#7c3aed";
                              return (
                                <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                                  {nRueil > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: rueilColor, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{nRueil}</div>}
                                  {nParis > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: parisColor, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{nParis}</div>}
                                </div>
                              );
                            })()}
                          </div>
                          <div style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{DAYS_FR[i]}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: isToday ? "#6366f1" : isFer ? "#d97706" : wk ? "#e2e8f0" : "#1e293b", marginTop: 2 }}>{d.getDate()}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{MONTHS_FR[d.getMonth()].slice(0, 3)}</div>
                          {isFer && <div style={{ fontSize: 9, color: "#d97706", marginTop: 2 }} title={feriesDay[k]}>🗓 {feriesDay[k]}</div>}
                        </th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {agentsByTeam.map(([teamName, teamAgents], teamIdx) => {
                      let agentIndex = 0;
                      if (teamIdx > 0) {
                        agentIndex = agentsByTeam.slice(0, teamIdx).reduce((sum, [_, agents]) => sum + agents.length, 0);
                      }
                      return (
                        <React.Fragment key={teamName}>
                          {(() => { const tp = teamPalette(teamName); return (
                          <tr style={{ background: tp.header, borderBottom: "2px solid " + tp.border }}>
                            <td colSpan={8} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: tp.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>🏢 {teamName}</td>
                          </tr>
                          ); })()}
                          {teamAgents.map((agent, i) => {
                            // Calculer l'index DIRECTEMENT depuis sortedAgents (plus fiable)
                            // Tri désactivé
                            const tp = teamPalette(teamName);
                            const rowBg = tp.row;
                            return (
                              <tr key={agent.id} style={{ borderBottom: "1px solid " + tp.border + "40", height: 38, background: rowBg, transition: "all 0.2s", outline: selectedAgentRow === agent.id ? "2px solid " + tp.border : "none", outlineOffset: -2, opacity: selectedAgentRow && selectedAgentRow !== agent.id ? 0.45 : 1 }}>
                                <td style={{ padding: "0 10px", verticalAlign: "middle", background: rowBg, fontSize: 12, position: "relative", cursor: "pointer" }}
                                  onClick={() => setSelectedAgentRow(selectedAgentRow === agent.id ? null : agent.id)}
                                  draggable={isAdmin}
                                  onDragStart={e => { if (!isAdmin) return; e.stopPropagation(); setDragAgentId(agent.id); e.dataTransfer.effectAllowed = "move"; }}
                                  onDragOver={e => { if (!isAdmin || !dragAgentId) return; e.preventDefault(); setDragOverAgentId(agent.id); }}
                                  onDragLeave={() => setDragOverAgentId(null)}
                                  onDrop={e => { e.preventDefault(); e.stopPropagation(); if (dragAgentId) dragReorder(dragAgentId, agent.id); setDragAgentId(null); setDragOverAgentId(null); }}
                                  onDragEnd={() => { setDragAgentId(null); setDragOverAgentId(null); }}
                                  style={{ display: "flex", alignItems: "center", height: "100%", minHeight: 36, gap: 6, paddingLeft: 6, opacity: dragAgentId === agent.id ? 0.4 : 1, background: dragOverAgentId === agent.id ? "#eef2ff" : "inherit", transition: "background 0.15s, opacity 0.15s", cursor: isAdmin ? "grab" : "pointer" }}>
                                  {isAdmin && <span style={{ fontSize: 13, color: "#64748b", flexShrink: 0, cursor: "grab", userSelect: "none", marginRight: 6 }}>⠿</span>}
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: teamGradient(agent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0, boxShadow: selectedAgentRow === agent.id ? "0 0 0 2px #3b82f6" : "none" }}>{agent.avatar}</div>
                                  <div style={{ minWidth: 0, flex: 1, marginLeft: 7 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: agent.id === currentUser.id ? "#6366f1" : selectedAgentRow === agent.id ? "#3b82f6" : "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{agent.name.split(" ")[0]} {agent.role === "manager" ? "👑" : ""}</div>
                                  </div>
                                </td>
                                {weekDays.map((d, i) => {
                                  const k = dKey(d), wk = d.getDay() === 0 || d.getDay() === 6;
                                  const feriesDay = getFeries(d.getFullYear());
                                  const isFer = !!feriesDay[k];
                                  const leave = getLeaveForKey(agent.id, k);
                                  const inSel = isWeekInSel(agent.id, k);
                                  const isToday = k === dKey(now);
                                  const agentCanPresence = !!agents.find(a => a.id === agent.id)?.can_book_presence_sites;
                                  const canInteract = (filterMode === "presence" ? (isManager || (currentUser.id === agent.id && agentCanPresence)) : (isManager || (isCoordinator && currentUser.id === agent.id))) && !wk && (!isFer || isManager);
                                  return <td key={i}
                                    onClick={() => canInteract && handleWeekCellClick(agent.id, d)}
                                    onContextMenu={e => !wk && handleWeekCellRightClick(e, agent.id, d)}
                                    onMouseEnter={() => { if (weekSelAgent === agent.id) setWeekHovered(k); }}
                                    onMouseLeave={() => setWeekHovered(null)}
                                    className={canInteract ? "cell-hover" : ""}
                                    title={isFer ? `🗓 ${feriesDay[k]}` : (leave && isHalfDay(leave) ? (getHalfDayPeriod(leave) === "matin" ? `${leave.label} — Matin` : `${leave.label} — Après-midi`) : "")}
                                    style={{ padding: "2px 2px", textAlign: "center", cursor: canInteract ? "pointer" : "default", background: selectedAgentRow === agent.id ? tp.header : wk ? tp.wk : isFer ? "#fef9ec" : inSel ? "#e0e7ff" : isToday ? tp.header : rowBg, borderLeft: "1px solid " + tp.border + "25", height: 38, verticalAlign: "middle", transition: "background 0.15s" }}>
                                    {isFer && !wk && <div style={{ width: "calc(100% - 4px)", height: 24, margin: "0 2px", background: "rgba(251,191,36,0.15)", border: "1px dashed #fbbf24", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, color: "#d97706", fontWeight: 700 }}>🗓</span></div>}
                                    {leave && !wk && !isFer && (
                                      filterMode === "presence" && isPresenceCode(leave.code, leave.label) ? (
                                        <div style={{
                                          width: "calc(100% - 4px)", height: 24, margin: "0 2px", borderRadius: 4, overflow: "hidden", position: "relative",
                                          background: leave.status === "pending" ? "#fff" : leave.color,
                                          border: `1.5px solid ${leave.color}`,
                                          boxShadow: leave.status === "pending" ? "none" : `0 1px 3px ${leave.color}40`
                                        }}>
                                          {leave.status !== "pending" && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.12)" }} />}
                                          <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2px", color: leave.status === "pending" ? leave.color : "#fff", textTransform: "uppercase" }}>
                                              {leave.status === "pending" ? "…" : leave.label.slice(0, 1).toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                      ) : isHalfDay(leave) && leave.status === "pending" ? (
                                        <div className="half-tooltip" data-tip={`${leaveAbbr(leave.label)} · ${getHalfDayPeriod(leave) === "matin" ? "Matin" : "Après-midi"}`} style={{ width: "calc(100% - 4px)", height: 24, margin: "0 2px", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: hexToLight(leave.color), border: `1px dashed ${leave.color}` }}>
                                          <span style={{ fontSize: 8, fontWeight: 700, color: leave.color }}>?</span>
                                        </div>
                                      ) : isHalfDay(leave) ? (
                                        <div className="half-tooltip" data-tip={`${leaveAbbr(leave.label)} · ${getHalfDayPeriod(leave) === "matin" ? "Matin" : "Après-midi"}`} style={{ display: "contents" }}>
                                        <HalfDayCell color={leave.color} label={leaveAbbr(leave.label).replace("½","").trim()} isMatin={getHalfDayPeriod(leave) === "matin"} size={24} fontSize={7} pad={2} />
                                        </div>
                                      ) : (
                                        <div style={{
                                          width: "calc(100% - 4px)", height: 24, margin: "0 2px",
                                          background: filterMode === "presence" ? hexToLight(leave.color) : (leave.status === "pending" ? hexToLight(leave.color) : leave.color),
                                          borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                                          border: filterMode === "presence" ? `1px dashed ${leave.color}` : (leave.status === "pending" ? `1px dashed ${leave.color}` : "none"),
                                          opacity: filterMode === "presence" ? 0.75 : 1,
                                          boxShadow: filterMode !== "presence" && leave.status !== "pending" ? `0 1px 3px ${leave.color}30` : "none"
                                        }}>
                                          <span style={{
                                            fontSize: 7, fontWeight: 700,
                                            color: filterMode === "presence" || leave.status === "pending" ? leave.color : "#fff"
                                          }}>
                                            {leave.status === "pending" ? "?" : leaveAbbr(leave.label)}
                                          </span>
                                        </div>
                                      )
                                    )}
                                    {inSel && !leave && !isFer && <div style={{ width: "calc(100% - 4px)", height: 24, margin: "0 2px", borderRadius: 4, background: "#c7d2fe", border: "1px solid #818cf8" }} />}
                                  </td>;
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === "validations" && (
          <ValidationsView
            isManager={isManager}
            isAdmin={isAdmin}
            requests={requests}
            pendingRequests={pendingRequests}
            myRequests={myRequests}
            onApprove={approveRequest}
            onReject={(id) => { setRejectModal(id); setRejectComment(""); }}
            onClearHistory={async () => {
              const toDelete = requests.filter(r => r.status === "rejected");
              setRequests(prev => prev.filter(r => r.status !== "rejected"));
              await Promise.all(toDelete.map(r => apiFetch(`/leaves/${r.id}`, token, { method: "DELETE" }).catch(() => { })));
              await loadRequests(token);
              showNotif("Historique des validations effacé ✅");
            }}
            onClearPlanningData={async () => {
              const allLeaves = requests;
              setRequests([]);
              setLeaves({});
              setAstreintes({});
              localStorage.removeItem("astreintes");
              await Promise.all(allLeaves.map(r => apiFetch(`/leaves/${r.id}`, token, { method: "DELETE" }).catch(() => { })));
              await loadRequests(token);
              showNotif("Données du planning et astreintes supprimées ✅");
            }}
          />
        )}

        {view === "stats" && (
          <div style={{ padding: 24, animation: "fadeIn 0.3s ease" }}>
            {(() => {
              /* ── Calculs agent ── */
              const selAgent = selectedAgentForStats ? agents.find(a => a.id === selectedAgentForStats) : null;
              const teamMap = {};
              agents.filter(a => a.role !== "admin").forEach(a => {
                const t = a.team || "Sans équipe";
                if (!teamMap[t]) teamMap[t] = [];
                teamMap[t].push(a);
              });
              const filteredAgents = statsAgentSearch
                ? agents.filter(a => a.role !== "admin" && (a.name.toLowerCase().includes(statsAgentSearch.toLowerCase()) || (a.team||"").toLowerCase().includes(statsAgentSearch.toLowerCase())))
                : null;

              /* ── Calculs dates ── */
              const displayAgentIdForPicker = isManager ? (selectedAgentForStats || currentUser.id) : currentUser.id;
              const agentLeaves = leaves[displayAgentIdForPicker] || {};
              const monthsWithLeaves = {};
              Object.entries(agentLeaves).forEach(([dateKey]) => {
                if (dateKey.endsWith("__presence")) return;
                const [y, m] = dateKey.split("-");
                const key = `${y}-${m}`;
                if (!monthsWithLeaves[key]) monthsWithLeaves[key] = { year: parseInt(y), month: parseInt(m) - 1 };
              });
              const yearsAvailable = [...new Set(Object.values(monthsWithLeaves).map(x => x.year))].sort((a,b) => b-a);
              if (!yearsAvailable.includes(year)) yearsAvailable.push(year);
              yearsAvailable.sort((a,b) => b-a);
              const navMonth = statsFilter === "custom" && statsCustomMonth ? statsCustomMonth.month : month;
              const navYear  = statsFilter === "custom" && statsCustomMonth ? statsCustomMonth.year  : year;
              const isYearMode = statsFilter === "year";
              function navPrev() {
                setStatsPickerOpen(false);
                if (isYearMode) return;
                let nm = navMonth - 1, ny = navYear;
                if (nm < 0) { nm = 11; ny--; }
                if (nm === month && ny === year) { setStatsFilter("month"); setStatsCustomMonth(null); }
                else { setStatsFilter("custom"); setStatsCustomMonth({ year: ny, month: nm }); }
              }
              function navNext() {
                setStatsPickerOpen(false);
                if (isYearMode) return;
                let nm = navMonth + 1, ny = navYear;
                if (nm > 11) { nm = 0; ny++; }
                if (nm === month && ny === year) { setStatsFilter("month"); setStatsCustomMonth(null); }
                else { setStatsFilter("custom"); setStatsCustomMonth({ year: ny, month: nm }); }
              }

              return (
                <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 0, padding: "10px 14px", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>

                  {/* ── Sélecteur agent (managers uniquement) ── */}
                  {isManager && (<>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 3, height: 10, background: "#6366f1", borderRadius: 2, display: "inline-block" }} /> Agent
                      </div>
                      <div onClick={() => { setStatsAgentDropOpen(p => !p); setStatsAgentSearch(""); }}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, border: "1.5px solid " + (statsAgentDropOpen ? "#6366f1" : "#e2e8f0"), background: "#fff", cursor: "pointer", boxShadow: statsAgentDropOpen ? "0 0 0 3px rgba(99,102,241,0.1)" : "0 1px 3px rgba(0,0,0,0.05)", transition: "all 0.15s", userSelect: "none", minWidth: 200 }}>
                        {selAgent ? (<>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: teamGradient(selAgent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{selAgent.avatar}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selAgent.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{selAgent.team}</div>
                          </div>
                        </>) : (<>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: teamGradient(currentUser.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{currentUser.avatar}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{currentUser.first_name} {currentUser.last_name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>Mon profil</div>
                          </div>
                        </>)}
                        <span style={{ fontSize: 11, color: "#94a3b8", transform: statsAgentDropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>▾</span>
                      </div>
                      {statsAgentDropOpen && (
                        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.14)", border: "1px solid #e2e8f0", zIndex: 9999, overflow: "hidden", animation: "slideIn 0.15s ease", minWidth: 220 }}>
                          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                            <div style={{ position: "relative" }}>
                              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", flexShrink: 0 }} width="14" height="14" viewBox="0 0 20 20" fill="none">
                                <circle cx="8.5" cy="8.5" r="5.5" stroke="#94a3b8" strokeWidth="2"/>
                                <path d="M13 13l3.5 3.5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <input autoFocus value={statsAgentSearch} onChange={e => setStatsAgentSearch(e.target.value)} placeholder="Rechercher un agent ou une équipe..."
                                style={{ width: "100%", padding: "9px 34px 9px 34px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontSize: 12, color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                                onFocus={e => e.target.style.borderColor = "#6366f1"}
                                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                              />
                              {statsAgentSearch && (
                                <button onClick={() => setStatsAgentSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "rgba(148,163,184,0.15)", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", color: "#64748b", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>✕</button>
                              )}
                            </div>
                          </div>
                          <div style={{ maxHeight: 320, overflowY: "auto" }}>
                            {(!statsAgentSearch) && (
                              <button onClick={() => { setSelectedAgentForStats(null); setStatsAgentDropOpen(false); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: !selectedAgentForStats ? "#eef2ff" : "none", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}
                                onMouseEnter={e => { if (selectedAgentForStats) e.currentTarget.style.background = "#f8fafc"; }}
                                onMouseLeave={e => { if (selectedAgentForStats) e.currentTarget.style.background = "none"; }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: teamGradient(currentUser.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{currentUser.avatar}</div>
                                <div style={{ flex: 1, textAlign: "left" }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{currentUser.first_name} {currentUser.last_name}</div>
                                  <div style={{ fontSize: 10, color: "#94a3b8" }}>Mon profil</div>
                                </div>
                                {!selectedAgentForStats && <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 700 }}>✓</span>}
                              </button>
                            )}
                            {filteredAgents ? filteredAgents.map(a => (
                              <button key={a.id} onClick={() => { setSelectedAgentForStats(a.id); setStatsAgentDropOpen(false); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", border: "none", background: selectedAgentForStats === a.id ? "#eef2ff" : "none", cursor: "pointer" }}
                                onMouseEnter={e => { if (selectedAgentForStats !== a.id) e.currentTarget.style.background = "#f8fafc"; }}
                                onMouseLeave={e => { if (selectedAgentForStats !== a.id) e.currentTarget.style.background = selectedAgentForStats === a.id ? "#eef2ff" : "none"; }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{a.avatar}</div>
                                <div style={{ flex: 1, textAlign: "left" }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{a.name}</div>
                                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{a.team}</div>
                                </div>
                                {selectedAgentForStats === a.id && <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 700 }}>✓</span>}
                              </button>
                            )) : Object.entries(teamMap).sort(([a],[b]) => a.localeCompare(b)).map(([teamName, teamAgents]) => {
                              const tp = teamPalette(teamName);
                              return (
                                <div key={teamName}>
                                  <div style={{ padding: "6px 14px 4px", fontSize: 10, fontWeight: 800, color: tp.text, textTransform: "uppercase", letterSpacing: "0.6px", background: tp.header, borderTop: "1px solid " + tp.border + "40" }}>{teamName}</div>
                                  {teamAgents.map(a => (
                                    <button key={a.id} onClick={() => { setSelectedAgentForStats(a.id); setStatsAgentDropOpen(false); }}
                                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", border: "none", background: selectedAgentForStats === a.id ? "#eef2ff" : "none", cursor: "pointer" }}
                                      onMouseEnter={e => { if (selectedAgentForStats !== a.id) e.currentTarget.style.background = "#f8fafc"; }}
                                      onMouseLeave={e => { if (selectedAgentForStats !== a.id) e.currentTarget.style.background = selectedAgentForStats === a.id ? "#eef2ff" : "none"; }}>
                                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{a.avatar}</div>
                                      <div style={{ flex: 1, textAlign: "left" }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{a.name}</div>
                                      </div>
                                      {selectedAgentForStats === a.id && <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 700 }}>✓</span>}
                                    </button>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Séparateur vertical ── */}
                    <div style={{ width: 1, height: 36, background: "#e8edf5", borderRadius: 1, flexShrink: 0 }} />
                  </>)}

                  {/* ── Navigateur mois ‹ / label / › ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 3, height: 10, background: "#6366f1", borderRadius: 2, display: "inline-block" }} /> Période
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", borderRadius: 10, border: "1.5px solid " + (!isYearMode ? "#6366f1" : "#e2e8f0"), overflow: "visible", boxShadow: !isYearMode ? "0 2px 10px rgba(99,102,241,0.2)" : "none", transition: "all 0.2s" }}>
                        <button onClick={navPrev} title="Mois précédent"
                          style={{ padding: "5px 10px", border: "none", borderRight: "1px solid #e8edf5", background: "none", cursor: "pointer", color: !isYearMode ? "#6366f1" : "#cbd5e1", fontSize: 15, fontWeight: 700, lineHeight: 1, userSelect: "none", borderRadius: "8px 0 0 8px", transition: "background 0.15s" }}
                          onMouseEnter={e => { if (!isYearMode) e.currentTarget.style.background = "#eef2ff"; }}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}>‹</button>
                        <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { if (!isYearMode) { setStatsFilter("month"); setStatsCustomMonth(null); } setStatsPickerOpen(p => !p); }}
                            style={{ padding: "5px 12px", border: "none", background: statsPickerOpen && !isYearMode ? "#eef2ff" : "none", color: !isYearMode ? "#4338ca" : "#94a3b8", cursor: !isYearMode ? "pointer" : "default", fontSize: 13, fontWeight: 700, minWidth: 130, textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.2px", transition: "background 0.15s" }}>
                            📅 {MONTHS_FR[navMonth]} {navYear}
                            {!isYearMode && <span style={{ fontSize: 9, marginLeft: 5, opacity: 0.5 }}>{statsPickerOpen ? "▲" : "▼"}</span>}
                          </button>
                          {statsPickerOpen && (
                            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", zIndex: 9999, width: 272, animation: "slideIn 0.15s ease" }}>
                              {yearsAvailable.map(yr => (
                                <div key={yr}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 8px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: yr === yearsAvailable[0] ? "14px 14px 0 0" : 0 }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: "#1e293b" }}>{yr}</span>
                                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{Object.values(monthsWithLeaves).filter(x => x.year === yr).length} mois avec congés</span>
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, padding: "10px 12px 12px" }}>
                                    {Array.from({ length: 12 }, (_, mi) => {
                                      const hasLeave = !!monthsWithLeaves[`${yr}-${String(mi+1).padStart(2,"0")}`];
                                      const isAct = (!isYearMode && navYear === yr && navMonth === mi);
                                      const isCurrMth = yr === year && mi === month;
                                      return (
                                        <button key={mi}
                                          onClick={() => {
                                            if (mi === month && yr === year) { setStatsFilter("month"); setStatsCustomMonth(null); }
                                            else { setStatsFilter("custom"); setStatsCustomMonth({ year: yr, month: mi }); }
                                            setStatsPickerOpen(false);
                                          }}
                                          style={{ padding: "7px 4px", borderRadius: 8, border: isAct ? "2px solid #6366f1" : isCurrMth ? "1.5px solid #c7d2fe" : "1.5px solid transparent", background: isAct ? "#6366f1" : isCurrMth ? "#eef2ff" : "none", color: isAct ? "#fff" : isCurrMth ? "#4338ca" : hasLeave ? "#1e293b" : "#cbd5e1", cursor: "pointer", fontSize: 11, fontWeight: isAct || isCurrMth ? 700 : hasLeave ? 500 : 400, textAlign: "center", transition: "all 0.1s" }}
                                          onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = "#e0e7ff"; e.currentTarget.style.color = "#4338ca"; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = isAct ? "#6366f1" : isCurrMth ? "#eef2ff" : "none"; e.currentTarget.style.color = isAct ? "#fff" : isCurrMth ? "#4338ca" : hasLeave ? "#1e293b" : "#cbd5e1"; }}>
                                          {MONTHS_FR[mi].slice(0,3)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={navNext} title="Mois suivant"
                          style={{ padding: "5px 10px", border: "none", borderLeft: "1px solid #e8edf5", background: "none", cursor: "pointer", color: !isYearMode ? "#6366f1" : "#cbd5e1", fontSize: 15, fontWeight: 700, lineHeight: 1, userSelect: "none", borderRadius: "0 8px 8px 0", transition: "background 0.15s" }}
                          onMouseEnter={e => { if (!isYearMode) e.currentTarget.style.background = "#eef2ff"; }}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}>›</button>
                      </div>

                      {/* ── Séparateur ── */}
                      <div style={{ width: 1, height: 28, background: "#e8edf5", borderRadius: 1 }} />

                      {/* ── Bouton Année ── */}
                      <button
                        onClick={() => { setStatsFilter(isYearMode ? "month" : "year"); setStatsPickerOpen(false); }}
                        style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid " + (isYearMode ? "#6366f1" : "#e2e8f0"), background: isYearMode ? "#6366f1" : "#fff", color: isYearMode ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: isYearMode ? "0 3px 12px rgba(99,102,241,0.35)" : "none", transition: "all 0.18s", whiteSpace: "nowrap", letterSpacing: "0.1px" }}
                        onMouseEnter={e => { if (!isYearMode) { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#4338ca"; e.currentTarget.style.background = "#eef2ff"; }}}
                        onMouseLeave={e => { if (!isYearMode) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#fff"; }}}>
                        📆 Année {navYear}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })()}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
              {loadingYearStats && (statsFilter === "year" || statsFilter === "custom") && (
                <div style={{ gridColumn: "1 / -1", padding: 24, textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 8 }}>
                    <div style={{ width: 16, height: 16, border: "2px solid #6366f1", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600 }}>Chargement des statistiques de l'année...</span>
                  </div>
                </div>
              )}
              {!loadingYearStats && (() => {
                const displayAgentId = isManager ? (selectedAgentForStats || currentUser.id) : currentUser.id;
                const displayAgent = agents.find(a => a.id === displayAgentId);
                if (!displayAgent) return <div style={{ color: "#94a3b8", fontSize: 12 }}>Agent non trouvé</div>;
                const counts = getStatsCounts(statsFilter, displayAgentId);
                const veilleCpLT     = leaveTypes.find(t => (t.code||"") === "veille_de_cp"    || (t.label||"").toLowerCase() === "veille de cp");
                const veilleEFerieLT = leaveTypes.find(t => (t.code||"") === "veille_de_ferie" || (t.label||"").toLowerCase() === "veille de férié");
                const cpLT           = leaveTypes.find(t => (t.code||"") === "cp"   || (t.label||"").toLowerCase() === "congé payé" || (t.label||"").toUpperCase() === "CP");
                const rttLT          = leaveTypes.find(t => (t.code||"") === "rtt"  || (t.label||"").toUpperCase() === "RTT");
                const pontLT         = leaveTypes.find(t => (t.code||"") === "pont" || (t.label||"").toLowerCase() === "pont");
                const absenceLT      = leaveTypes.find(t => (t.code||"") === "absence" || (t.label||"").toLowerCase() === "absence");
                const stats = [
                  { key: "cp",           label: "Congés Payés",    color: cpLT?.color           || "#6366f1", icon: "✏️", days: counts.cp },
                  { key: "rtt",          label: "RTT",             color: rttLT?.color          || "#10b981", icon: "⏱️", days: counts.rtt },
                  { key: "pont",         label: "Ponts",           color: pontLT?.color         || "#f59e0b", icon: "🌉", days: counts.pont },
                  { key: "absence",      label: "Absences",        color: absenceLT?.color      || "#ef4444", icon: "❌", days: counts.absence },
                  { key: "veille_cp",    label: "Veille de CP",    color: veilleCpLT?.color     || "#8b5cf6", icon: "🌙", days: counts.veille_cp },
                  { key: "veille_ferie", label: "Veille de Férié", color: veilleEFerieLT?.color || "#f97316", icon: "🎉", days: counts.veille_ferie },
                ];
                const periodLabel = statsFilter === "month" ? `${MONTHS_FR[month]} ${year}` : statsFilter === "custom" && statsCustomMonth ? `${MONTHS_FR[statsCustomMonth.month]} ${statsCustomMonth.year}` : `Année ${year}`;
                const totalDays = stats.reduce((s, x) => s + x.days, 0);
                return (
                  <>
                    {/* Bandeau agent si manager */}
                    {isManager && selectedAgentForStats && (
                      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: teamGradient(displayAgent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>{displayAgent.avatar}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{displayAgent.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{displayAgent.team} · {periodLabel}</div>
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#64748b" }}>{totalDays.toLocaleString("fr-FR", { minimumFractionDigits: totalDays % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })} j total</div>
                      </div>
                    )}
                    {stats.map(s => {
                      const isCp = s.key === "cp";
                      const todayPeriodYear = (new Date().getMonth() >= 5) ? new Date().getFullYear() : new Date().getFullYear() - 1;
                      const periodCurrent = `Juin ${todayPeriodYear} → Mai ${todayPeriodYear + 1}`;
                      const periodNext    = `Juin ${todayPeriodYear + 1} → Mai ${todayPeriodYear + 2}`;
                      return (
                      <div key={s.key} style={{ background: "#fff", borderRadius: 0, border: "1px solid #f1f5f9", borderLeft: "3px solid " + s.color, padding: "20px 22px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>

                        {/* Label + valeur */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>{s.label}</div>
                            {isCp ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                                  <div>
                                    <span style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.5px", lineHeight: 1 }}>{counts.cp_current.toLocaleString("fr-FR", { minimumFractionDigits: counts.cp_current % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}</span>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", marginLeft: 4 }}>j</span>
                                  </div>
                                  <span style={{ fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap" }}>{periodCurrent}</span>
                                </div>
                                <div style={{ height: 1, background: "#f1f5f9" }} />
                                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                                  <div>
                                    <span style={{ fontSize: 26, fontWeight: 800, color: s.color + "99", letterSpacing: "-0.5px", lineHeight: 1 }}>{counts.cp_next.toLocaleString("fr-FR", { minimumFractionDigits: counts.cp_next % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}</span>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", marginLeft: 4 }}>j</span>
                                  </div>
                                  <span style={{ fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap" }}>{periodNext}</span>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: "-0.5px", lineHeight: 1 }}>
                                {s.days.toLocaleString("fr-FR", { minimumFractionDigits: s.days % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#94a3b8", marginLeft: 5 }}>j</span>
                              </div>
                            )}
                          </div>
                          {/* Indicateur couleur */}
                          <div style={{ width: 38, height: 38, borderRadius: 0, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: s.color }} />
                          </div>
                        </div>
                        {/* Barre de progression */}
                        {!isCp && totalDays > 0 && (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ height: 3, background: "#f1f5f9", borderRadius: 0, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: Math.round((s.days / totalDays) * 100) + "%", background: s.color, borderRadius: 0, transition: "width 0.6s ease" }} />
                            </div>
                            <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 5, textAlign: "right" }}>{periodLabel}</div>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* DROPDOWN ASTREINTE */}
      {astreinteDropdown && (() => {
        const { aKey, teamName: aTeamName, rowType, rowId, key: aDateKey, onAgentPicked } = astreinteDropdown;
        const ASTREINTE_EXCLUDED = ["carol horlaville", "yannick loubery"];
        const aTeamAgents = agents.filter(a => a.team === aTeamName && a.role !== "admin" && !ASTREINTE_EXCLUDED.includes(a.name.toLowerCase()));
        const rowLabels = { "astreinte": "Astreinte vendredi", "action_serveur": "Action Serveur / Admin", "mail": "Mail", "es": "ES" };
        const [ay, am, ad] = (aDateKey || "").split("-");
        const dateLabel = `${ad}/${am}`;
        return (
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", top: Math.min(astreinteDropdown.y, window.innerHeight - 320), left: Math.min(astreinteDropdown.x, window.innerWidth - 240), background: "#fff", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #f1f5f9", zIndex: 99999, minWidth: 230, maxHeight: 360, overflowY: "auto", animation: "slideIn 0.15s ease" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", fontSize: 12, color: "#1e293b", fontWeight: 700, background: "#fef3c7", position: "sticky", top: 0 }}>
              🔔 {aTeamName} — {rowLabels[rowType || rowId] || rowType || rowId}<br />
              {astreinteDropdown.fridayOnly
                ? <span style={{ fontSize: 10, color: "#92400e", fontWeight: 400 }}>Cliquez sur un agent pour l'assigner à ce vendredi</span>
                : <span style={{ fontSize: 10, color: "#92400e", fontWeight: 400 }}>Cliquez sur un agent puis glissez jusqu'à la date de fin</span>
              }
            </div>
            {!onAgentPicked && astreintes[aKey] && (
              <button onClick={() => { setAstreintes(prev => { const n = { ...prev }; delete n[aKey]; return n; }); setAstreinteDropdown(null); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", border: "none", borderBottom: "1px solid #f8fafc", background: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>✕ Retirer ce jour uniquement</button>
            )}
            <button onClick={() => {
              const { teamName: tn, rowId: ri, key: k } = astreinteDropdown;
              setAstreinteEraseStart({ teamName: tn, rowId: ri, key: k });
              setAstreinteHovered(k);
              setAstreinteDropdown(null);
            }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", border: "none", borderBottom: "1px solid #f8fafc", background: "#fef2f2", cursor: "pointer", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>🗑 Effacer une plage → cliquer la date de fin</button>
            {aTeamAgents.length === 0 && <div style={{ padding: "16px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Aucun agent dans cette équipe</div>}
            {aTeamAgents.map(a => (
              <button key={a.id} onClick={() => {
                if (onAgentPicked) {
                  // Mode glisser : choisir agent puis glisser jusqu'à la date de fin
                  onAgentPicked(a.id);
                  setAstreinteDropdown(null);
                } else {
                  // Mode direct (fridayOnly ou simple) : assigner ce jour uniquement
                  setAstreintes(prev => ({ ...prev, [aKey]: a.id }));
                  setAstreinteDropdown(null);
                }
              }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 16px", border: "none", borderBottom: "1px solid #f8fafc", background: astreintes[aKey] === a.id ? "#fef3c7" : "none", cursor: "pointer", fontSize: 12, color: "#1e293b", fontWeight: astreintes[aKey] === a.id ? 700 : 400, transition: "background 0.1s" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{a.avatar}</div>
                <span style={{ flex: 1, textAlign: "left" }}>{a.name}</span>
                {astreintes[aKey] === a.id && <span style={{ color: "#f59e0b" }}>✓</span>}
                {onAgentPicked && <span style={{ fontSize: 10, color: "#94a3b8" }}>→ puis glisser</span>}
              </button>
            ))}
            <button onClick={() => { setAstreinteDropdown(null); setAstreinteSelStart(null); setAstreinteEraseStart(null); setAstreinteHovered(null); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#94a3b8" }}>✕ Annuler</button>
          </div>
        );
      })()}

      {requestModal && (() => {
        const allAvail = sortLeaveTypes(getAvailableLeaveTypesForAgent(requestModal.agentId || currentUser.id));
        // Séparer les types "groupés" (CP, RTT et leurs ½) des autres
        const isCpFamily  = t => /^(cp|_cp|congé payé)$/i.test((t.code||"").trim()) || /^(cp|½ cp|congé payé)$/i.test((t.label||"").trim());
        const isRttFamily = t => /^(rtt|_rtt)$/i.test((t.code||"").trim()) || /^(rtt|½ rtt)$/i.test((t.label||"").trim());
        const isHalfCp    = t => /^_cp$/i.test(t.code) || /^½ cp$/i.test(t.label);
        const isHalfRtt   = t => /^_rtt$/i.test(t.code) || /^½ rtt$/i.test(t.label);
        // Types affichés dans la liste (sans les ½ CP et ½ RTT)
        const displayTypes = allAvail.filter(t => !isHalfCp(t) && !isHalfRtt(t));
        // Trouver les types ½ correspondants
        const halfCpType  = allAvail.find(isHalfCp)  || allAvail.find(t => (t.code||"").includes("cp") && isHalfDay(t));
        const halfRttType = allAvail.find(isHalfRtt) || allAvail.find(t => (t.code||"").includes("rtt") && isHalfDay(t));
        function handleTypeClick(t) {
          if (isCpFamily(t) || isRttFamily(t)) {
            setExpandedLeaveType(expandedLeaveType === t.id ? null : t.id);
          } else if (isHalfDay(t)) {
            setRequestModal(null); setExpandedLeaveType(null); setHalfDayPendingType({ ...t, _overrideModal: requestModal }); setHalfDayPeriod(null);
          } else {
            setRequestModal(null); setExpandedLeaveType(null); submitRequest(t, requestReason);
          }
        }
        function submitPeriod(t, period) {
          setRequestModal(null);
          if (period === "journee") {
            submitRequest(t, requestReason);
          } else {
            const halfType = isCpFamily(t) ? halfCpType : halfRttType;
            if (halfType) {
              const finalReason = "[" + period + "]" + (requestReason ? " " + requestReason : "");
              submitRequest(halfType, finalReason);
            } else {
              setHalfDayPendingType(t); setHalfDayPeriod(period);
            }
          }
        }
        return (
          <div onClick={e => e.stopPropagation()} style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "linear-gradient(145deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            zIndex: 99999, width: 310, overflow: "hidden", animation: "slideIn 0.2s ease"
          }}>
            {/* Header */}
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 500, marginBottom: 2 }}>{isManager ? "Poser un congé" : "Nouvelle demande"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                {requestModal.start === requestModal.end ? formatDate(requestModal.start) : `${formatDate(requestModal.start)} → ${formatDate(requestModal.end)}`}
              </div>
            </div>
            {/* Liste des types */}
            <div style={{ padding: "6px 0", background: "transparent" }}>
              {displayTypes.map(t => {
                const isGrouped = isCpFamily(t) || isRttFamily(t);
                const isOpen = expandedLeaveType === t.id;
                return (
                  <div key={t.id}>
                    <button onClick={() => handleTypeClick(t)} style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 16px",
                      border: "none", background: isOpen ? t.color + "25" : "none", cursor: "pointer",
                      textAlign: "left", transition: "background 0.1s"
                    }}
                      onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "none"; }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.color, flexShrink: 0, boxShadow: `0 0 0 3px ${t.color}25` }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", flex: 1 }}>{t.label}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8", background: "rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{leaveAbbr(t.label)}</span>
                      {isGrouped && <span style={{ fontSize: 10, color: t.color, marginLeft: 2, transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>}
                    </button>
                    {/* Sous-menu Matin / Après-midi / Journée */}
                    {isGrouped && isOpen && (
                      <div style={{ background: t.color + "20", borderTop: `1px solid ${t.color}40`, borderBottom: `1px solid ${t.color}40`, padding: "8px 16px 10px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7 }}>Choisir la période</div>
                        <div style={{ display: "flex", gap: 7 }}>
                          {[
                            { key: "journee",    label: "☀️ Journée",      sub: "complète"  },
                            { key: "matin",      label: "Matin",        sub: "½ journée" },
                            { key: "apres-midi", label: "Après-midi",   sub: "½ journée" },
                          ].map(opt => (
                            <button key={opt.key} onClick={() => submitPeriod(t, opt.key)} style={{
                              flex: 1, padding: "8px 4px", borderRadius: 9, border: `1.5px solid ${t.color}50`,
                              background: "rgba(255,255,255,0.05)", cursor: "pointer", textAlign: "center", transition: "all 0.15s"
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = t.color; e.currentTarget.style.color = "#fff"; Array.from(e.currentTarget.querySelectorAll("span")).forEach(s => s.style.color = "rgba(255,255,255,0.8)"); }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = ""; Array.from(e.currentTarget.querySelectorAll("span")).forEach(s => s.style.color = ""); }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>{opt.label}</div>
                              <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 500 }}>{opt.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Raison */}
            <div style={{ padding: "8px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <input onChange={e => setRequestReason(e.target.value)} placeholder="Raison (optionnel)..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", fontSize: 12, color: "#cbd5e1", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={() => { setRequestModal(null); setExpandedLeaveType(null); setRequestReason(""); }} style={{ width: "100%", padding: "10px", border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", background: "none", cursor: "pointer", fontSize: 12, color: "#475569", fontWeight: 500 }}>✕ Annuler</button>
          </div>
        );
      })()}
      {addLeaveModal && (() => {
        const availLTs = isManager
          ? leaveTypes.filter(t => !isPresenceType(t))
          : leaveTypes.filter(t => AGENT_ALLOWED_CODES.includes(t.code) && !isPresenceType(t));
        const selectedAlAgent = addLeaveForm.agentId ? agents.find(a => a.id === addLeaveForm.agentId) : null;
        return (
          <>
            <div onClick={() => setAddLeaveModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.75)", zIndex: 99998, backdropFilter: "blur(6px)" }} />
            <div onClick={e => e.stopPropagation()} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "linear-gradient(145deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", zIndex: 99999, width: 440, maxWidth: "95vw", animation: "modalPop 0.15s ease" }}>
              <div style={{ padding: "20px 24px 16px", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>📅 Poser un congé</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Remplissez les informations ci-dessous</div>
                  </div>
                  <button onClick={() => setAddLeaveModal(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 16, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, background: "transparent" }}>
                {isManager && (
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Agent</label>
                    <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                      <div onClick={() => { setAlShowAgentDrop(p => !p); setAlSearchQuery(""); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, border: "`1.5px solid ${alShowAgentDrop ? \"#6366f1\" : \"rgba(255,255,255,0.12)\"}`", background: "rgba(255,255,255,0.05)", cursor: "pointer" }}>
                        {selectedAlAgent ? (
                          <>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: teamGradient(selectedAlAgent.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{selectedAlAgent.avatar}</div>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{selectedAlAgent.name}</span>
                            <span style={{ fontSize: 10, color: "#94a3b8", background: "#f1f5f9", padding: "1px 7px", borderRadius: 4 }}>{selectedAlAgent.team}</span>
                          </>
                        ) : (
                          <span style={{ flex: 1, fontSize: 13, color: "#64748b" }}>Choisir un agent...</span>
                        )}
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>▾</span>
                      </div>
                      {alShowAgentDrop && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 99999, overflow: "hidden", animation: "slideIn 0.15s ease" }}>
                          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <input autoFocus value={alSearchQuery} onChange={e => setAlSearchQuery(e.target.value)} placeholder="🔍 Rechercher..." style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ maxHeight: 220, overflowY: "auto" }}>
                            {agents.filter(a => a.role !== "admin" && (!alSearchQuery || a.name.toLowerCase().includes(alSearchQuery.toLowerCase()) || (a.team||"").toLowerCase().includes(alSearchQuery.toLowerCase()))).map(a => (
                              <button key={a.id} onClick={() => { setAddLeaveForm(f => ({ ...f, agentId: a.id })); setAlShowAgentDrop(false); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", border: "none", background: addLeaveForm.agentId === a.id ? "rgba(99,102,241,0.2)" : "none", cursor: "pointer" }}
                                onMouseEnter={e => { if (addLeaveForm.agentId !== a.id) e.currentTarget.style.background = "#f8fafc"; }}
                                onMouseLeave={e => { if (addLeaveForm.agentId !== a.id) e.currentTarget.style.background = "none"; }}>
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: teamGradient(a.team), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{a.avatar}</div>
                                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#f1f5f9", textAlign: "left" }}>{a.name}</span>
                                <span style={{ fontSize: 10, color: "#94a3b8" }}>{a.team}</span>
                                {addLeaveForm.agentId === a.id && <span style={{ color: "#6366f1" }}>✓</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Date de début</label>
                    <button onClick={() => { setAlShowStartCal(p => !p); setAlShowEndCal(false); }}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${alShowStartCal ? "#6366f1" : "rgba(255,255,255,0.12)"}`, background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 13, color: addLeaveForm.startDate ? "#f1f5f9" : "#475569", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{addLeaveForm.startDate ? new Date(addLeaveForm.startDate + "T00:00:00").toLocaleDateString("fr-FR") : "Choisir..."}</span>
                      <span style={{ fontSize: 14 }}>📅</span>
                    </button>
                    {alShowStartCal && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 999999 }}>
                        <MiniCalendarPicker value={addLeaveForm.startDate} onChange={v => { setAddLeaveForm(f => ({ ...f, startDate: v, endDate: f.endDate < v ? v : f.endDate })); setAlShowStartCal(false); }} />
                      </div>
                    )}
                  </div>
                  <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Date de fin</label>
                    <button onClick={() => { setAlShowEndCal(p => !p); setAlShowStartCal(false); }}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${alShowEndCal ? "#6366f1" : "rgba(255,255,255,0.12)"}`, background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 13, color: addLeaveForm.endDate ? "#f1f5f9" : "#475569", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{addLeaveForm.endDate ? new Date(addLeaveForm.endDate + "T00:00:00").toLocaleDateString("fr-FR") : "Choisir..."}</span>
                      <span style={{ fontSize: 14 }}>📅</span>
                    </button>
                    {alShowEndCal && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 999999 }}>
                        <MiniCalendarPicker value={addLeaveForm.endDate} minDate={addLeaveForm.startDate} onChange={v => { setAddLeaveForm(f => ({ ...f, endDate: v })); setAlShowEndCal(false); }} />
                      </div>
                    )}
                  </div>
                </div>
                {(() => {
                  const isCpType   = t => /^(cp|congé payé)$/i.test((t.label||"").trim()) || (t.code === "cp");
                  const isRttType  = t => /^rtt$/i.test((t.label||"").trim()) || (t.code === "rtt");
                  const isHalfCpT  = t => /^½ cp$/i.test((t.label||"").trim()) || t.code === "_cp";
                  const isHalfRttT = t => /^½ rtt$/i.test((t.label||"").trim()) || t.code === "_rtt";
                  const halfCp  = availLTs.find(isHalfCpT);
                  const halfRtt = availLTs.find(isHalfRttT);
                  // Masquer ½ CP et ½ RTT de la liste principale
                  const displayLTs = sortLeaveTypes(availLTs).filter(t => !isHalfCpT(t) && !isHalfRttT(t));
                  // Quel type "parent" est ouvert pour montrer Matin/AM/Journée
                  const openParentId = addLeaveForm.leaveTypeId &&
                    displayLTs.find(t => t.id === addLeaveForm.leaveTypeId && (isCpType(t) || isRttType(t))) ? addLeaveForm.leaveTypeId : null;
                  return (
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Type de congé</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {displayLTs.map(t => {
                          const isGrouped = isCpType(t) || isRttType(t);
                          const isSelected = addLeaveForm.leaveTypeId === t.id;
                          return (
                            <button key={t.id} onClick={() => setAddLeaveForm(f => ({ ...f, leaveTypeId: t.id, _period: null }))}
                              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `2px solid ${isSelected ? t.color : "rgba(255,255,255,0.1)"}`, background: isSelected ? t.color + "30" : "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isSelected ? t.color : "#94a3b8", transition: "all 0.15s" }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                              {t.label}
                              {isGrouped && <span style={{ fontSize: 9, opacity: 0.55, marginLeft: 1 }}>▾</span>}
                            </button>
                          );
                        })}
                      </div>
                      {/* Sous-menu période si CP ou RTT sélectionné */}
                      {openParentId && (() => {
                        const parentType = displayLTs.find(t => t.id === openParentId);
                        const halfType = isCpType(parentType) ? halfCp : halfRtt;
                        return (
                          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: hexToLight(parentType.color), border: `1.5px solid ${parentType.color}30` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: parentType.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Choisir la période</div>
                            <div style={{ display: "flex", gap: 7 }}>
                              {[
                                { key: "journee",    label: "☀️ Journée",    sub: "complète"  },
                                { key: "matin",      label: "Matin",      sub: "½ journée" },
                                { key: "apres-midi", label: "Après-midi", sub: "½ journée" },
                              ].map(opt => {
                                const isSelPeriod = addLeaveForm._period === opt.key;
                                return (
                                  <button key={opt.key}
                                    onClick={() => setAddLeaveForm(f => ({ ...f, _period: opt.key, leaveTypeId: opt.key === "journee" ? parentType.id : (halfType ? halfType.id : parentType.id) }))}
                                    style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: `1.5px solid ${isSelPeriod ? parentType.color : parentType.color + "40"}`, background: isSelPeriod ? parentType.color : "#fff", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: isSelPeriod ? "#fff" : "#1e293b", lineHeight: 1.3 }}>{opt.label}</div>
                                    <span style={{ fontSize: 9, color: isSelPeriod ? "rgba(255,255,255,0.75)" : "#94a3b8", fontWeight: 500 }}>{opt.sub}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Raison <span style={{ fontWeight: 400, color: "#475569", textTransform: "none" }}>(optionnel)</span></label>
                  <input value={addLeaveForm.reason} onChange={e => setAddLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Motif du congé..."
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.12)", fontSize: 13, color: "#f1f5f9", background: "rgba(255,255,255,0.05)", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>
              </div>
              {(() => {
                const isWE = (d) => { const day = new Date(d).getDay(); return day === 0 || day === 6; };
                const startWE = addLeaveForm.startDate && isWE(addLeaveForm.startDate);
                const endWE = addLeaveForm.endDate && isWE(addLeaveForm.endDate);
                if (!startWE && !endWE) return null;
                return (
                  <div style={{ margin: "0 24px 12px", padding: "10px 14px", background: "rgba(220,38,38,0.15)", border: "1.5px solid rgba(220,38,38,0.4)", borderRadius: 9, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 12, color: "#fca5a5", fontWeight: 600 }}>
                      {startWE && endWE ? "Les dates de début et de fin tombent un week-end." : startWE ? "La date de début tombe un week-end." : "La date de fin tombe un week-end."}{" "}Veuillez choisir des jours ouvrés.
                    </span>
                  </div>
                );
              })()}
              <div style={{ padding: "0 24px 20px", display: "flex", gap: 10 }}>
                <button onClick={() => setAddLeaveModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 500 }}>Annuler</button>
                <button onClick={async () => {
                  const agentId = addLeaveForm.agentId || currentUser.id;
                  const lt = availLTs.find(t => t.id === addLeaveForm.leaveTypeId) || availLTs[0];
                  if (!agentId || !lt || !addLeaveForm.startDate || !addLeaveForm.endDate) return;
                  const isWE = (d) => { const day = new Date(d).getDay(); return day === 0 || day === 6; };
                  if (isWE(addLeaveForm.startDate) || isWE(addLeaveForm.endDate)) return;
                  const period = addLeaveForm._period;
                  // Si demi-journée via période sélectionnée
                  const finalReason = (period && period !== "journee")
                    ? "[" + period + "]" + (addLeaveForm.reason ? " " + addLeaveForm.reason : "")
                    : addLeaveForm.reason;
                  if (isHalfDay(lt) && !period) {
                    // Cas ½ CP / ½ RTT sélectionné directement sans période → ouvrir modale période
                    setAddLeaveModal(false);
                    setHalfDayPendingType({ ...lt, _overrideModal: { agentId, start: addLeaveForm.startDate, end: addLeaveForm.endDate }, _reason: addLeaveForm.reason });
                    setHalfDayPeriod(null);
                  } else {
                    setAddLeaveModal(false);
                    await submitRequest({ ...lt }, finalReason, { agentId, start: addLeaveForm.startDate, end: addLeaveForm.endDate });
                  }
                }} disabled={(() => {
                  const isWE = (d) => { const day = new Date(d).getDay(); return day === 0 || day === 6; };
                  return !addLeaveForm.startDate || !addLeaveForm.endDate || (isManager && !addLeaveForm.agentId) || isWE(addLeaveForm.startDate) || isWE(addLeaveForm.endDate);
                })()}
                  className="btn-primary" style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 14px rgba(99,102,241,0.35)", opacity: (() => { const isWE = (d) => { const day = new Date(d).getDay(); return day === 0 || day === 6; }; return (!addLeaveForm.startDate || !addLeaveForm.endDate || (isManager && !addLeaveForm.agentId) || isWE(addLeaveForm.startDate) || isWE(addLeaveForm.endDate)) ? 0.5 : 1; })() }}>
                  ✅ Valider le congé
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {halfDayPendingType && (
        <div onClick={e => e.stopPropagation()} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "linear-gradient(145deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", zIndex: 100000, width: 300, overflow: "hidden", animation: "slideIn 0.2s ease" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 500, marginBottom: 2 }}>Demi-journée</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{halfDayPendingType.label} — quelle période ?</div>
          </div>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {["matin", "apres-midi"].map(period => (
              <button key={period} onClick={() => setHalfDayPeriod(period)}
                style={{ padding: "12px 16px", borderRadius: 10, border: "2px solid " + (halfDayPeriod === period ? halfDayPendingType.color : "#e2e8f0"), background: halfDayPeriod === period ? hexToLight(halfDayPendingType.color) : "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, overflow: "hidden", border: "1px solid " + halfDayPendingType.color + "40", flexShrink: 0 }}>
                  {period === "matin"
                    ? <><div style={{ height: "50%", background: halfDayPendingType.color }} /><div style={{ height: "50%", background: "#fff" }} /></>
                    : <><div style={{ height: "50%", background: "#fff" }} /><div style={{ height: "50%", background: halfDayPendingType.color }} /></>
                  }
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: halfDayPeriod === period ? halfDayPendingType.color : "#374151" }}>{period === "matin" ? "Matin" : "Après-midi"}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: "0 16px 12px" }}>
            <input id="leave-reason-halfday" placeholder="Raison (optionnel)..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", fontSize: 12, color: "#cbd5e1", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => { setHalfDayPendingType(null); setHalfDayPeriod(null); }} style={{ flex: 1, padding: "10px", border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>✕ Annuler</button>
            <button disabled={!halfDayPeriod} onClick={() => {
              const reason = document.getElementById("leave-reason-halfday")?.value || "";
              const finalReason = "[" + halfDayPeriod + "]" + (reason ? " " + reason : "");
              const overrideModal = halfDayPendingType._overrideModal || null;
              const lt = { ...halfDayPendingType };
              delete lt._overrideModal; delete lt._reason;
              setHalfDayPeriod(null);
              setHalfDayPendingType(null);
              submitRequest(lt, finalReason, overrideModal);
            }} style={{ flex: 1, padding: "10px", border: "none", borderLeft: "1px solid #f1f5f9", background: halfDayPeriod ? halfDayPendingType.color : "#e2e8f0", color: halfDayPeriod ? "#fff" : "#94a3b8", cursor: halfDayPeriod ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, transition: "all 0.15s" }}>Confirmer</button>
          </div>
        </div>
      )}
      {halfDayPendingType && <div onClick={() => { setHalfDayPendingType(null); setHalfDayPeriod(null); }} style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.6)", zIndex: 99999, backdropFilter: "blur(4px)" }} />}
      {requestModal && <div onClick={() => setRequestModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.6)", zIndex: 99998, backdropFilter: "blur(4px)" }} />}

      {rejectModal && <Modal title="❌ Refuser la demande">
        <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} placeholder="Motif du refus (obligatoire)..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, boxSizing: "border-box", resize: "none", marginBottom: 20, transition: "all 0.2s" }} />
        <ModalButtons onCancel={() => setRejectModal(null)} onConfirm={() => rejectRequest(rejectModal)} confirmLabel="Confirmer le refus" confirmColor={rejectComment.trim() ? "#ef4444" : "#fca5a5"} disabled={!rejectComment.trim()} />
      </Modal>}
    </div>
  );
}

// ─── VALIDATIONS ───
const STATUS_META = {
  pending: { label: "En attente", dot: "#f59e0b", text: "#92400e", bg: "#fffbeb" },
  approved: { label: "Approuvée", dot: "#10b981", text: "#065f46", bg: "#f0fdf4" },
  rejected: { label: "Refusée", dot: "#ef4444", text: "#991b1b", bg: "#fef2f2" },
};

function RequestRow({ req, isManager, onApprove, onReject }) {
  const meta = STATUS_META[req.status] || { label: req.status, dot: "#94a3b8", text: "#64748b", bg: "#f8fafc" };
  const period = req.start === req.end ? formatDate(req.start) : `${formatDate(req.start)} – ${formatDate(req.end)}`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "40px 1fr auto", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {/* Avatar */}
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: teamGradient(req.agentTeam), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>{req.agentAvatar}</div>
      {/* Infos */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{req.agentName}</span>
          {req.agentTeam && <span style={{ fontSize: 10, color: "#94a3b8", background: "#f1f5f9", padding: "1px 7px", borderRadius: 10, fontWeight: 500 }}>{req.agentTeam}</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: meta.bg, color: meta.text, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.dot, display: "inline-block" }} />
            {meta.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>📅 {period}</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: req.leaveType?.color || "#6366f1", background: req.leaveType?.color ? req.leaveType.color + "18" : "#eef2ff", padding: "1px 8px", borderRadius: 5 }}>{req.leaveType?.label}</span>
          {req.reason && <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>"{req.reason}"</span>}
          {req.comment && <span style={{ fontSize: 11, color: "#ef4444", background: "#fef2f2", padding: "1px 7px", borderRadius: 5, fontWeight: 600 }}>↳ {req.comment}</span>}
        </div>
      </div>
      {/* Actions */}
      {isManager && req.status === "pending" ? (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={onApprove}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#10b981,#34d399)", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: "0 2px 10px rgba(16,185,129,0.35)", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(16,185,129,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(16,185,129,0.35)"; e.currentTarget.style.transform = "none"; }}>✓ Approuver</button>
          <button onClick={onReject}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #fca5a5", background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "none"; }}>✕ Refuser</button>
        </div>
      ) : <div />}
    </div>
  );
}

function ValidationsView({ isManager, isAdmin, requests, pendingRequests, myRequests, onApprove, onReject, onClearHistory, onClearPlanningData }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showHistory, setShowHistory] = useState(true);
  const sourceList = isManager ? requests : myRequests;
  const pending = sourceList.filter(r => r.status === "pending");
  const history = sourceList.filter(r => r.status !== "pending");
  const filtered = statusFilter === "all" ? sourceList : statusFilter === "pending" ? pending : history.filter(r => r.status === statusFilter);
  const counts = { all: sourceList.length, pending: pending.length, approved: history.filter(r => r.status === "approved").length, rejected: history.filter(r => r.status === "rejected").length };
  return (
    <div style={{ padding: 24, maxWidth: 820, animation: "fadeIn 0.3s ease" }}>
      <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 0, padding: "12px 16px", marginBottom: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {/* Ligne 1 : filtres statut */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: isManager ? 10 : 0 }}>
          {[
            { id: "all",      label: "Toutes",      color: "#6366f1", bg: "#eef2ff"  },
            { id: "pending",  label: "En attente",  color: "#f59e0b", bg: "#fffbeb"  },
            { id: "approved", label: "Approuvées",  color: "#10b981", bg: "#f0fdf4"  },
            { id: "rejected", label: "Refusées",    color: "#ef4444", bg: "#fef2f2"  },
          ].map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{
              padding: "6px 14px", borderRadius: 8,
              border: `2px solid ${statusFilter === f.id ? f.color : "#e2e8f0"}`,
              background: statusFilter === f.id ? f.bg : "#f8fafc",
              color: statusFilter === f.id ? f.color : "#64748b",
              cursor: "pointer", fontSize: 12, fontWeight: statusFilter === f.id ? 700 : 500,
              boxShadow: statusFilter === f.id ? `0 2px 8px ${f.color}25` : "none",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6
            }}
            onMouseEnter={e => { if (statusFilter !== f.id) { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.color = f.color; e.currentTarget.style.background = f.bg; }}}
            onMouseLeave={e => { if (statusFilter !== f.id) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#f8fafc"; }}}>
              {f.label}
              {counts[f.id] > 0 && <span style={{ background: statusFilter === f.id ? f.color : "#e2e8f0", color: statusFilter === f.id ? "#fff" : "#64748b", borderRadius: 10, padding: "0 6px", fontSize: 10, fontWeight: 800, minWidth: 18, textAlign: "center" }}>{counts[f.id]}</span>}
            </button>
          ))}

          {/* Bouton historique aligné à droite */}
          <button onClick={() => setShowHistory(h => !h)} style={{
            marginLeft: "auto", padding: "6px 13px", borderRadius: 8,
            border: `1.5px solid ${showHistory ? "#6366f1" : "#e2e8f0"}`,
            background: showHistory ? "#eef2ff" : "#f8fafc",
            color: showHistory ? "#4338ca" : "#64748b",
            cursor: "pointer", fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s"
          }}>
            <span style={{ fontSize: 13, transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
            {showHistory ? "Masquer" : "Afficher"} l'historique
          </button>
        </div>

        {/* Ligne 2 : actions admin (séparée) */}
        {history.length > 0 && isManager && (
          <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => { if (window.confirm("Effacer l'historique des demandes refusées ?\n\nLes demandes approuvées resteront dans le planning.")) onClearHistory(); }} style={{
              padding: "5px 13px", borderRadius: 8, border: "1.5px solid #fca5a5",
              background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}>
              🗂 Effacer l'historique
            </button>
            {isAdmin && <button onClick={() => { if (window.confirm("⚠️ ATTENTION ⚠️\n\nCette action supprimera TOUTES les données du planning.\n\nContinuer ?")) onClearPlanningData(); }} style={{
              padding: "5px 13px", borderRadius: 8, border: "1.5px solid #fcd34d",
              background: "#fffbeb", color: "#b45309", cursor: "pointer", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#f59e0b"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fffbeb"; e.currentTarget.style.color = "#b45309"; e.currentTarget.style.borderColor = "#fcd34d"; }}>
              🗑 Vider le planning
            </button>}
          </div>
        )}
      </div>
      {!isManager && (
        <div style={{ fontSize: 12, color: "#a5b4fc", background: "#eef2ff", border: "1.5px solid #c7d2fe", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ fontWeight: 500 }}>Sélectionnez des dates dans le planning pour déposer une demande de congé.</span>
        </div>
      )}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 0, padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 13, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>Aucune demande</div>
      ) : (
        <>
          {(statusFilter === "all" || statusFilter === "pending") && pending.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 0, overflow: "hidden", marginBottom: 12, boxShadow: "0 2px 10px rgba(245,158,11,0.1)", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,0.15)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(245,158,11,0.1)"}>
              <div style={{ padding: "12px 18px", background: "linear-gradient(135deg,#fffbeb,#fef9ec)", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 2px 6px rgba(245,158,11,0.3)" }}>⏳</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>En attente de validation</div>
                  <div style={{ fontSize: 11, color: "#b45309" }}>{pending.length} demande{pending.length > 1 ? "s" : ""} à traiter</div>
                </div>
              </div>
              {pending.map(req => (
                <RequestRow key={req.id} req={req} isManager={isManager} onApprove={() => onApprove(req.id)} onReject={() => onReject(req.id)} />
              ))}
            </div>
          )}
          {showHistory && (statusFilter === "all" || statusFilter === "approved" || statusFilter === "rejected") && history.filter(r => statusFilter === "all" || r.status === statusFilter).length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 0, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)"}>
              <div style={{ padding: "12px 18px", background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", borderBottom: "1px solid #e8edf5", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#64748b,#94a3b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 2px 6px rgba(100,116,139,0.25)" }}>📋</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>Historique</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{history.filter(r => statusFilter === "all" || r.status === statusFilter).length} demande{history.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              {history.filter(r => statusFilter === "all" || r.status === statusFilter).map(req => (
                <RequestRow key={req.id} req={req} isManager={isManager} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { const saved = localStorage.getItem("plannipro_user"); return saved ? JSON.parse(saved) : null; }
    catch { return null; }
  });
  function handleLogin(user) {
    try { localStorage.setItem("plannipro_user", JSON.stringify(user)); } catch { }
    setCurrentUser(user);
  }
  function handleLogout() {
    try { localStorage.removeItem("plannipro_user"); } catch { }
    setCurrentUser(null);
  }
  if (!currentUser) return <LoginPage onLogin={handleLogin} />;
  return <PlanningApp currentUser={currentUser} onLogout={handleLogout} />;
}
