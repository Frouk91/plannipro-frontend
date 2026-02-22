import { useState, useEffect } from "react";

const API = "https://plannipro-backend-production.up.railway.app/api";
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#84cc16"];

const DEMO_USERS = [
  { email: "redouane@entreprise.fr", password: "admin1234" },
  { email: "sophie@entreprise.fr", password: "sophie123" },
  { email: "lucas@entreprise.fr", password: "lucas123" },
  { email: "emma@entreprise.fr", password: "emma1234" },
];

function hexToLight(hex) {
  try { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},0.12)`; }
  catch { return "#f3f4f6"; }
}
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { let d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function dateKey(y, m, d) { return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
function isWeekend(y, m, d) { const w = new Date(y, m, d).getDay(); return w === 0 || w === 6; }
function formatDate(s) { if (!s) return ""; const p = s.split("T")[0].split("-"); return `${p[2]}/${p[1]}/${p[0]}`; }
function getInitials(name) { return (name || "?").split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2); }
function agentHue(id) { return Math.abs((id || "").toString().split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360; }
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function compareDates(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

function leaveFromBackend(l) {
  return {
    id: l.leave_type_code, code: l.leave_type_code, label: l.leave_type_label,
    color: l.color, bg: hexToLight(l.color)
  };
}
function requestFromBackend(l) {
  return {
    id: l.id, agentId: l.agent_id,
    agentName: `${l.first_name || ""} ${l.last_name || ""}`.trim(),
    agentAvatar: l.avatar_initials || getInitials(`${l.first_name || ""} ${l.last_name || ""}`),
    agentTeam: l.team_name || "", leaveType: leaveFromBackend(l),
    start: (l.start_date || "").split("T")[0], end: (l.end_date || "").split("T")[0],
    reason: l.reason || "", status: l.status, createdAt: l.created_at
  };
}

async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  return res.json();
}

// ─── LOGIN ───
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", null, { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
      if (data.accessToken) { onLogin({ ...data.agent, token: data.accessToken }); }
      else { setError("Email ou mot de passe incorrect."); }
    } catch { setError("Erreur de connexion au serveur."); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a1d27,#16213e,#0f3460)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0 }}>PlanniPro</h1>
          <p style={{ color: "#9ca3af", fontSize: 14, margin: "8px 0 0" }}>Gestion des présences et congés</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 36, boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#111827" }}>Connexion</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="prenom@entreprise.fr"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: error ? "2px solid #ef4444" : "1.5px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input type={showPwd ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••"
                style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 10, border: error ? "2px solid #ef4444" : "1.5px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af" }}>{showPwd ? "🙈" : "👁"}</button>
            </div>
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>⚠️ {error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 16, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Connexion..." : "Se connecter →"}
          </button>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>Comptes demo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DEMO_USERS.map((u, i) => (
              <button key={i} onClick={() => { setEmail(u.email); setPassword(u.password); setError(""); }}
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", textAlign: "left" }}>
                <div style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{u.email.split("@")[0]}</div>
                <div style={{ color: "#9ca3af", fontSize: 10 }}>{u.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, style = {} }) {
  return (<div style={style}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>}
    <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
  </div>);
}
function Modal({ title, children }) {
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
    <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>{title}</h2>
      {children}
    </div>
  </div>);
}
function ModalButtons({ onCancel, onConfirm, confirmLabel, confirmColor, disabled }) {
  return (<div style={{ display: "flex", gap: 10 }}>
    <button onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}>Annuler</button>
    <button onClick={onConfirm} disabled={disabled} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: confirmColor || "#4f46e5", color: "#fff", cursor: disabled ? "default" : "pointer", fontSize: 14, fontWeight: 600, opacity: disabled ? 0.7 : 1 }}>{confirmLabel}</button>
  </div>);
}

// ─── MENU CONTEXTUEL ───
function ContextMenu({ x, y, leave, onDeleteDay, onDeleteAll, onClose }) {
  const isMultiDay = leave.leaveStart !== leave.leaveEnd;
  return (
    <div onClick={e => e.stopPropagation()}
      style={{ position: "fixed", top: y, left: x, background: "#fff", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", border: "1px solid #e5e7eb", zIndex: 99999, minWidth: 220, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 12, color: "#6b7280", fontWeight: 600, background: "#f9fafb" }}>
        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: leave.color, marginRight: 6 }}></span>
        {leave.label} — {formatDate(leave.leaveStart)} {isMultiDay ? `→ ${formatDate(leave.leaveEnd)}` : ""}
      </div>
      <button onClick={e => { e.stopPropagation(); onDeleteDay(); }}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>
        ✂️ Supprimer ce jour seulement
      </button>
      {isMultiDay && (
        <button onClick={e => { e.stopPropagation(); onDeleteAll(); }}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 14px", border: "none", borderTop: "1px solid #f3f4f6", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
          🗑 Supprimer toute la période
        </button>
      )}
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", borderTop: "1px solid #f3f4f6", background: "none", cursor: "pointer", fontSize: 13, color: "#6b7280" }}>
        ✕ Annuler
      </button>
    </div>
  );
}

// ─── ADMIN ───
function AdminPanel({ agents, teams, leaveTypes, token, onAgentAdded, onAgentUpdated, onAgentDeleted, onTeamAdded, onTeamDeleted, onLeaveTypeAdded, onLeaveTypeUpdated, onLeaveTypeDeleted, showNotif }) {
  const [tab, setTab] = useState("agents");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editLT, setEditLT] = useState(null);
  const [newAgent, setNewAgent] = useState({ first_name: "", last_name: "", email: "", password: "", role: "agent", team: "" });
  const [editData, setEditData] = useState({});
  const [newTeam, setNewTeam] = useState("");
  const [newLT, setNewLT] = useState({ label: "", color: COLORS[0] });
  const [loading, setLoading] = useState(false);

  async function handleAddAgent() {
    if (!newAgent.first_name || !newAgent.email || !newAgent.password) return;
    setLoading(true);
    try {
      const data = await apiFetch("/auth/register", token, { method: "POST", body: JSON.stringify(newAgent) });
      if (data.agent) {
        onAgentAdded({ id: data.agent.id, name: `${newAgent.first_name} ${newAgent.last_name}`, email: newAgent.email, role: newAgent.role, team: newAgent.team, avatar: getInitials(`${newAgent.first_name} ${newAgent.last_name}`) });
        setAddModal(false); setNewAgent({ first_name: "", last_name: "", email: "", password: "", role: "agent", team: "" });
        showNotif("Agent ajouté ✅");
      } else { showNotif(data.errors?.[0]?.msg || "Erreur", "error"); }
    } catch { showNotif("Erreur", "error"); }
    setLoading(false);
  }

  async function handleAddTeam() {
    if (!newTeam.trim()) return;
    try {
      const data = await apiFetch("/teams", token, { method: "POST", body: JSON.stringify({ name: newTeam.trim() }) });
      if (data.id) { onTeamAdded(data); setNewTeam(""); showNotif("Équipe ajoutée ✅"); }
    } catch { showNotif("Erreur", "error"); }
  }

  async function handleDeleteTeam(team) {
    try { await apiFetch(`/teams/${team.id}`, token, { method: "DELETE" }); onTeamDeleted(team.id); showNotif("Équipe supprimée", "error"); }
    catch { showNotif("Erreur", "error"); }
  }

  async function handleAddLT() {
    if (!newLT.label.trim()) return;
    try {
      const data = await apiFetch("/leave-types", token, { method: "POST", body: JSON.stringify({ label: newLT.label.trim(), color: newLT.color }) });
      if (data.id) { onLeaveTypeAdded({ ...data, bg: hexToLight(data.color) }); setNewLT({ label: "", color: COLORS[0] }); showNotif("Type ajouté ✅"); }
    } catch { showNotif("Erreur", "error"); }
  }

  async function handleUpdateLT(lt, newLabel) {
    try { await apiFetch(`/leave-types/${lt.id}`, token, { method: "PATCH", body: JSON.stringify({ label: newLabel }) }); onLeaveTypeUpdated(lt.id, { label: newLabel }); setEditLT(null); showNotif("Modifié ✅"); }
    catch { showNotif("Erreur", "error"); }
  }

  async function handleDeleteLT(lt) {
    try { await apiFetch(`/leave-types/${lt.id}`, token, { method: "DELETE" }); onLeaveTypeDeleted(lt.id); showNotif("Type supprimé", "error"); }
    catch { showNotif("Erreur", "error"); }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ id: "agents", icon: "👥", label: "Agents" }, { id: "teams", icon: "🏢", label: "Équipes" }, { id: "leavetypes", icon: "🏷", label: "Types de congés" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: tab === t.id ? "#4f46e5" : "#fff", color: tab === t.id ? "#fff" : "#6b7280", cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "agents" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: "#6b7280" }}>{agents.length} agents</span>
            <button onClick={() => setAddModal(true)} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Ajouter</button>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Agent", "Email", "Équipe", "Rôle", "Actions"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${agentHue(a.id)},60%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{a.avatar}</div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{a.email}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12 }}>{a.team}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ background: a.role === "admin" ? "#fef3c7" : a.role === "manager" ? "#eef2ff" : "#f0fdf4", color: a.role === "admin" ? "#92400e" : a.role === "manager" ? "#4338ca" : "#166534", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {a.role === "admin" ? "👑 Admin" : a.role === "manager" ? "👑 Manager" : "Agent"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditModal(a); setEditData({ name: a.name, email: a.email, team: a.team, role: a.role, password: "" }); }} style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✏️ Modifier</button>
                        {a.role !== "admin" && <button onClick={() => setDeleteModal(a)} style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#dc2626" }}>🗑 Supprimer</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "teams" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input value={newTeam} onChange={e => setNewTeam(e.target.value)} placeholder="Nom de la nouvelle équipe..." onKeyDown={e => e.key === "Enter" && handleAddTeam()}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }} />
            <button onClick={handleAddTeam} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Ajouter</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
            {teams.map(team => (
              <div key={team.id || team.name} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🏢</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{agents.filter(a => a.team === team.name).length} agents</div>
                  </div>
                </div>
                {team.name !== "Admin" && <button onClick={() => handleDeleteTeam(team)} style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>🗑</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "leavetypes" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>➕ Nouveau type de congé</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input value={newLT.label} onChange={e => setNewLT(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Congé sans solde"
                style={{ flex: 1, minWidth: 160, padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {COLORS.map(c => <button key={c} onClick={() => setNewLT(p => ({ ...p, color: c }))} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: newLT.color === c ? "3px solid #111" : "2px solid transparent", cursor: "pointer" }} />)}
              </div>
              <button onClick={handleAddLT} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Ajouter</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {leaveTypes.map(lt => (
              <div key={lt.id} style={{ background: "#fff", borderRadius: 10, border: `2px solid ${lt.color}30`, padding: 16 }}>
                {editLT === lt.id ? (
                  <div>
                    <input defaultValue={lt.label} id={`elt-${lt.id}`} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box", marginBottom: 8, outline: "none" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleUpdateLT(lt, document.getElementById(`elt-${lt.id}`).value)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Enregistrer</button>
                      <button onClick={() => setEditLT(null)} style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 12 }}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: lt.color }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{lt.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditLT(lt.id)} style={{ background: "#f3f4f6", border: "none", borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>✏️</button>
                      <button onClick={() => handleDeleteLT(lt)} style={{ background: "#fef2f2", border: "none", borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#dc2626" }}>🗑</button>
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
        <Field label="Mot de passe (min 8 caractères)" value={newAgent.password} onChange={v => setNewAgent(p => ({ ...p, password: v }))} placeholder="motdepasse123" style={{ marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Équipe</label>
            <select value={newAgent.team} onChange={e => setNewAgent(p => ({ ...p, team: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }}>
              <option value="">-- Choisir --</option>
              {teams.map(t => <option key={t.id || t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Rôle</label>
            <select value={newAgent.role} onChange={e => setNewAgent(p => ({ ...p, role: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }}>
              <option value="agent">Agent</option>
              <option value="manager">Manager 👑</option>
            </select>
          </div>
        </div>
        <ModalButtons onCancel={() => setAddModal(false)} onConfirm={handleAddAgent} confirmLabel={loading ? "En cours..." : "Ajouter"} confirmColor="#4f46e5" disabled={loading} />
      </Modal>}

      {editModal && <Modal title={`✏️ Modifier — ${editModal.name}`}>
        <Field label="Nom complet" value={editData.name} onChange={v => setEditData(p => ({ ...p, name: v }))} style={{ marginBottom: 12 }} />
        <Field label="Email" value={editData.email} onChange={v => setEditData(p => ({ ...p, email: v }))} style={{ marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Équipe</label>
            <input value={editData.team || ""} onChange={e => setEditData(p => ({ ...p, team: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Rôle</label>
            <select value={editData.role || "agent"} onChange={e => setEditData(p => ({ ...p, role: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }}>
              <option value="agent">Agent</option>
              <option value="manager">Manager 👑</option>
            </select>
          </div>
        </div>
        <Field label="Nouveau mot de passe (laisser vide = inchangé)" value={editData.password} onChange={v => setEditData(p => ({ ...p, password: v }))} placeholder="••••••••" style={{ marginBottom: 20 }} />
        <ModalButtons onCancel={() => setEditModal(null)} onConfirm={() => { onAgentUpdated(editModal.id, editData); setEditModal(null); showNotif("Agent modifié ✅"); }} confirmLabel="Enregistrer" confirmColor="#4f46e5" />
      </Modal>}

      {deleteModal && <Modal title="🗑 Supprimer l'agent">
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 20px" }}>Supprimer <strong>{deleteModal.name}</strong> ? Cette action est irréversible.</p>
        <ModalButtons onCancel={() => setDeleteModal(null)} onConfirm={() => { onAgentDeleted(deleteModal.id); setDeleteModal(null); showNotif("Agent supprimé", "error"); }} confirmLabel="Supprimer" confirmColor="#ef4444" />
      </Modal>}
    </div>
  );
}

// ─── APP PRINCIPALE ───
function PlanningApp({ currentUser, onLogout }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaves, setLeaves] = useState({});
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState("planning");
  const [filterTeam, setFilterTeam] = useState("Tous");
  const [selectedLTId, setSelectedLTId] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [requestReason, setRequestReason] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [notification, setNotification] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const token = currentUser.token;
  const isManager = currentUser.role === "manager" || currentUser.role === "admin";
  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    async function loadAll() {
      try {
        const [teamsData, ltData, agentsData] = await Promise.all([
          apiFetch("/teams", token),
          apiFetch("/leave-types", token),
          apiFetch("/agents", token),
        ]);
        const teamsResult = Array.isArray(teamsData) ? teamsData : [];
        setTeams(teamsResult);
        const ltResult = Array.isArray(ltData) ? ltData : [];
        const ltFormatted = ltResult.map(lt => ({ ...lt, bg: hexToLight(lt.color) }));
        setLeaveTypes(ltFormatted);
        if (ltFormatted.length > 0) setSelectedLTId(ltFormatted[0].id);
        const agentsRaw = agentsData.agents || (Array.isArray(agentsData) ? agentsData : []);
        setAgents(agentsRaw.map(a => ({
          id: a.id, name: `${a.first_name || ""} ${a.last_name || ""}`.trim(),
          email: a.email, role: a.role || "agent", team: a.team_name || a.team || "",
          avatar: a.avatar_initials || getInitials(`${a.first_name || ""} ${a.last_name || ""}`)
        })));
        await loadLeaves(ltFormatted, token, now.getFullYear(), now.getMonth());
        await loadRequests(token);
      } catch (e) { console.error("Erreur chargement:", e); }
      setDataLoaded(true);
    }
    loadAll();
  }, [token]);

  useEffect(() => {
    if (dataLoaded && leaveTypes.length > 0) loadLeaves(leaveTypes, token, year, month);
  }, [year, month]);

  async function loadLeaves(ltList, tok, y, m) {
    try {
      const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
      const data = await apiFetch(`/leaves?month=${monthStr}`, tok);
      const leavesData = (data.leaves || []).filter(l => l.status !== "cancelled");
      const leavesMap = {};
      leavesData.forEach(l => {
        if (!leavesMap[l.agent_id]) leavesMap[l.agent_id] = {};
        const lt = leaveFromBackend(l);
        const leaveStart = l.start_date.split("T")[0];
        const leaveEnd = l.end_date.split("T")[0];
        const start = new Date(l.start_date), end = new Date(l.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          // On stocke leaveStart et leaveEnd pour pouvoir faire la suppression partielle
          leavesMap[l.agent_id][k] = { ...lt, status: l.status, leaveId: l.id, leaveStart, leaveEnd, leaveCode: l.leave_type_code, agentId: l.agent_id };
        }
      });
      setLeaves(leavesMap);
    } catch (e) { console.error("Erreur congés:", e); }
  }

  async function loadRequests(tok) {
    try {
      const [pendingData, allData] = await Promise.all([
        apiFetch("/leaves?status=pending", tok),
        apiFetch("/leaves", tok),
      ]);
      const pending = (pendingData.leaves || []).map(requestFromBackend);
      const others = (allData.leaves || []).filter(l => l.status !== "pending").map(requestFromBackend);
      setRequests([...pending, ...others]);
    } catch (e) { console.error("Erreur demandes:", e); }
  }

  function showNotif(msg, type = "success") { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3500); }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const allTeams = ["Tous", ...teams.filter(t => t.name !== "Admin").map(t => t.name)];
  const filteredAgents = (filterTeam === "Tous" ? agents : agents.filter(a => a.team === filterTeam)).filter(a => a.role !== "admin");
  const pendingRequests = requests.filter(r => r.status === "pending");
  const myRequests = requests.filter(r => r.agentId === currentUser.id);
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;
  const currentLT = leaveTypes.find(t => t.id === selectedLTId) || leaveTypes[0];

  function getLeave(agentId, day) { return leaves[agentId]?.[dateKey(year, month, day)]; }

  async function handleCellClick(agentId, day) {
    if (contextMenu) { setContextMenu(null); return; }
    if (isWeekend(year, month, day)) return;
    if (!isManager && currentUser.id !== agentId) return;
    if (!selectedAgent || selectedAgent !== agentId) { setSelectedAgent(agentId); setSelectionStart(day); }
    else {
      const start = Math.min(selectionStart, day), end = Math.max(selectionStart, day);
      setSelectionStart(null); setSelectedAgent(null);
      if (isManager) {
        applyLeaveLocal(agentId, start, end, currentLT, "approved");
        try {
          await apiFetch("/leaves", token, {
            method: "POST", body: JSON.stringify({
              leave_type_code: currentLT.code, start_date: dateKey(year, month, start), end_date: dateKey(year, month, end), agent_id: agentId
            })
          });
          await loadLeaves(leaveTypes, token, year, month);
          showNotif("Congé sauvegardé ✅");
        } catch { showNotif("Congé appliqué (erreur sauvegarde)", "error"); }
      } else {
        setRequestModal({ agentId, start: dateKey(year, month, start), end: dateKey(year, month, end) });
        setRequestReason("");
      }
    }
  }

  function handleCellRightClick(e, agentId, day) {
    e.preventDefault();
    e.stopPropagation();
    if (!isManager && currentUser.id !== agentId) return;
    const leave = leaves[agentId]?.[dateKey(year, month, day)];
    if (!leave || !leave.leaveId) return;
    setContextMenu({ x: e.clientX, y: e.clientY, agentId, day, leave, leaveId: leave.leaveId, clickedDate: dateKey(year, month, day) });
  }

  // Supprime toute la période
  async function handleDeleteAll() {
    if (!contextMenu) return;
    const { leaveId } = contextMenu;
    setContextMenu(null);
    try {
      await apiFetch(`/leaves/${leaveId}`, token, { method: "DELETE" });
      await loadLeaves(leaveTypes, token, year, month);
      showNotif("Congé supprimé ✅");
    } catch { showNotif("Erreur lors de la suppression", "error"); }
  }

  // Supprime un seul jour : annule la demande + recrée avant et après
  async function handleDeleteDay() {
    if (!contextMenu) return;
    const { leaveId, clickedDate, leave, agentId } = contextMenu;
    setContextMenu(null);
    try {
      // 1. Supprimer la demande originale
      await apiFetch(`/leaves/${leaveId}`, token, { method: "DELETE" });

      const start = leave.leaveStart;
      const end = leave.leaveEnd;
      const code = leave.leaveCode || leave.code;

      // 2. Recréer la période AVANT le jour cliqué (si elle existe)
      if (compareDates(start, clickedDate) < 0) {
        const newEnd = addDays(clickedDate, -1);
        await apiFetch("/leaves", token, {
          method: "POST", body: JSON.stringify({
            leave_type_code: code, start_date: start, end_date: newEnd, agent_id: agentId
          })
        });
      }

      // 3. Recréer la période APRÈS le jour cliqué (si elle existe)
      if (compareDates(clickedDate, end) < 0) {
        const newStart = addDays(clickedDate, 1);
        await apiFetch("/leaves", token, {
          method: "POST", body: JSON.stringify({
            leave_type_code: code, start_date: newStart, end_date: end, agent_id: agentId
          })
        });
      }

      await loadLeaves(leaveTypes, token, year, month);
      showNotif("Jour supprimé ✅");
    } catch (e) {
      console.error(e);
      showNotif("Erreur lors de la suppression", "error");
    }
  }

  function applyLeaveLocal(agentId, startDay, endDay, type, status) {
    setLeaves(prev => {
      const al = { ...(prev[agentId] || {}) };
      for (let d = startDay; d <= endDay; d++) { if (!isWeekend(year, month, d)) al[dateKey(year, month, d)] = { ...type, status }; }
      return { ...prev, [agentId]: al };
    });
  }

  async function submitRequest() {
    if (!requestModal || !currentLT) return;
    const { agentId, start, end } = requestModal;
    const agent = agents.find(a => a.id === agentId);
    try {
      const data = await apiFetch("/leaves", token, {
        method: "POST", body: JSON.stringify({
          leave_type_code: currentLT.code, start_date: start, end_date: end, reason: requestReason, agent_id: agentId
        })
      });
      if (data.leave) {
        setRequests(prev => [...prev, {
          id: data.leave.id, agentId, agentName: agent.name, agentAvatar: agent.avatar,
          agentTeam: agent.team, leaveType: currentLT, start, end, reason: requestReason,
          status: "pending", createdAt: new Date().toISOString()
        }]);
      }
    } catch { }
    setRequestModal(null);
    showNotif("Demande envoyée au manager !");
  }

  async function approveRequest(reqId) {
    try {
      await apiFetch(`/leaves/${reqId}/approve`, token, { method: "PATCH", body: JSON.stringify({}) });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "approved" } : r));
      const req = requests.find(r => r.id === reqId);
      if (req) {
        const [sy, sm, sd] = req.start.split("-").map(Number), [ey, em, ed] = req.end.split("-").map(Number);
        setLeaves(prev => {
          const al = { ...(prev[req.agentId] || {}) };
          for (let d = new Date(sy, sm - 1, sd); d <= new Date(ey, em - 1, ed); d.setDate(d.getDate() + 1)) {
            if (d.getDay() !== 0 && d.getDay() !== 6) {
              const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              al[k] = { ...req.leaveType, status: "approved" };
            }
          }
          return { ...prev, [req.agentId]: al };
        });
      }
      showNotif("Demande approuvée ✅");
    } catch { showNotif("Erreur", "error"); }
  }

  async function rejectRequest(reqId) {
    try {
      await apiFetch(`/leaves/${reqId}/reject`, token, { method: "PATCH", body: JSON.stringify({ manager_comment: rejectComment }) });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "rejected", comment: rejectComment } : r));
      setRejectModal(null); showNotif("Demande refusée", "error");
    } catch { showNotif("Erreur", "error"); }
  }

  function isInSelection(agentId, day) {
    if (selectedAgent !== agentId || selectionStart === null || hoveredDay === null) return false;
    return day >= Math.min(selectionStart, hoveredDay) && day <= Math.max(selectionStart, hoveredDay);
  }

  const navItems = [
    { id: "planning", icon: "🗓", label: "Planning" },
    { id: "validations", icon: "✅", label: "Validations", badge: isManager ? pendingRequests.length : myRequests.filter(r => r.status === "pending").length },
    { id: "stats", icon: "📊", label: "Statistiques" },
    ...(isAdmin ? [{ id: "admin", icon: "⚙️", label: "Administration" }] : []),
  ];

  if (!dataLoaded) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f7", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>📅</div><div style={{ fontSize: 16, color: "#6b7280", fontWeight: 500 }}>Chargement en cours...</div></div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: "100vh", background: "#f0f2f7", display: "flex" }}
      onClick={() => { if (contextMenu) setContextMenu(null); }}>

      {notification && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: notification.type === "error" ? "#ef4444" : "#10b981", color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>{notification.msg}</div>}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          leave={contextMenu.leave}
          onDeleteDay={handleDeleteDay}
          onDeleteAll={handleDeleteAll}
          onClose={() => setContextMenu(null)}
        />
      )}

      <aside style={{ width: 220, background: "#1a1d27", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #2d3148" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>📅 PlanniPro</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Gestion des présences</div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2d3148" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              {currentUser.avatar_initials || getInitials(`${currentUser.first_name || ""} ${currentUser.last_name || ""}`)}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.first_name} {currentUser.last_name}</div>
              <div style={{ fontSize: 10, color: currentUser.role === "admin" ? "#f59e0b" : currentUser.role === "manager" ? "#818cf8" : "#9ca3af" }}>
                {currentUser.role === "admin" ? "👑 Admin" : currentUser.role === "manager" ? "👑 Manager" : "👤 Agent"}
              </div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", marginTop: 10, padding: "6px 0", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>🚪 Déconnexion</button>
        </div>
        <nav style={{ padding: "16px 0", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 20px", border: "none", background: view === item.id ? "#2d3148" : "transparent", color: view === item.id ? "#818cf8" : "#9ca3af", cursor: "pointer", fontSize: 14, fontWeight: view === item.id ? 600 : 400, borderLeft: view === item.id ? "3px solid #818cf8" : "3px solid transparent" }}>
              <span>{item.icon}</span><span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: "#e94560", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #2d3148" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Légende</div>
          {leaveTypes.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color }} /><span style={{ fontSize: 11, color: "#9ca3af" }}>{t.label}</span>
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 28px" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>{view === "planning" ? "Planning mensuel" : view === "validations" ? "Demandes de congés" : view === "stats" ? "Statistiques" : "Administration"}</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{view === "planning" ? `${MONTHS_FR[month]} ${year}` : view === "validations" ? (isManager ? `${pendingRequests.length} en attente` : `${myRequests.length} demande(s)`) : ""}</p>
        </div>

        {view === "admin" && isAdmin && <AdminPanel agents={agents} teams={teams} leaveTypes={leaveTypes} token={token} showNotif={showNotif}
          onAgentAdded={a => setAgents(prev => [...prev, a])}
          onAgentUpdated={(id, data) => setAgents(prev => prev.map(a => a.id === id ? { ...a, ...(data.name ? { name: data.name, avatar: getInitials(data.name) } : {}), email: data.email || a.email, team: data.team || a.team, role: data.role || a.role } : a))}
          onAgentDeleted={id => setAgents(prev => prev.filter(a => a.id !== id))}
          onTeamAdded={t => setTeams(prev => [...prev, t])}
          onTeamDeleted={id => setTeams(prev => prev.filter(t => t.id !== id))}
          onLeaveTypeAdded={lt => setLeaveTypes(prev => [...prev, lt])}
          onLeaveTypeUpdated={(id, data) => setLeaveTypes(prev => prev.map(lt => lt.id === id ? { ...lt, ...data } : lt))}
          onLeaveTypeDeleted={id => setLeaveTypes(prev => prev.filter(lt => lt.id !== id))}
        />}

        {view === "planning" && (
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#111827", minWidth: 160, textAlign: "center" }}>{MONTHS_FR[month]} {year}</span>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>›</button>
              <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Aujourd'hui</button>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {allTeams.map(t => <button key={t} onClick={() => setFilterTeam(t)} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", fontWeight: 500, background: filterTeam === t ? "#4f46e5" : "#fff", color: filterTeam === t ? "#fff" : "#6b7280", borderColor: filterTeam === t ? "#4f46e5" : "#e5e7eb" }}>{t}</button>)}
              </div>
            </div>
            {leaveTypes.length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {leaveTypes.map(t => <button key={t.id} onClick={() => setSelectedLTId(t.id)} style={{ padding: "5px 12px", borderRadius: 20, border: "2px solid", fontSize: 12, cursor: "pointer", fontWeight: 600, background: selectedLTId === t.id ? t.color : t.bg, color: selectedLTId === t.id ? "#fff" : t.color, borderColor: t.color }}>{t.label}</button>)}
            </div>}
            <div style={{ fontSize: 12, color: "#92400e", marginBottom: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px" }}>
              {isManager ? "👑 Clic gauche : ajouter. Clic droit sur un congé : supprimer un jour ou toute la période." : "👤 Sélectionnez des dates pour envoyer une demande au manager."}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup><col style={{ width: 160 }} />{Array.from({ length: daysInMonth }, (_, i) => <col key={i} />)}</colgroup>
                <thead><tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#9ca3af", fontWeight: 600, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>AGENT</th>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1, wk = isWeekend(year, month, day), isToday = todayDay === day;
                    return <th key={i} style={{ padding: "4px 2px", textAlign: "center", fontSize: 10, fontWeight: 600, background: isToday ? "#eef2ff" : "#f9fafb", color: isToday ? "#4f46e5" : wk ? "#d1d5db" : "#6b7280", borderBottom: "1px solid #e5e7eb", borderLeft: "1px solid #f3f4f6" }}>
                      <div>{DAYS_FR[(i + firstDay) % 7].slice(0, 1)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#4f46e5" : wk ? "#d1d5db" : "#374151" }}>{day}</div>
                    </th>;
                  })}
                </tr></thead>
                <tbody>
                  {filteredAgents.map(agent => (
                    <tr key={agent.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: `hsl(${agentHue(agent.id)},60%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{agent.avatar}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: agent.id === currentUser.id ? "#4f46e5" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>{agent.name.split(" ")[0]} {agent.role === "manager" ? "👑" : ""}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{agent.team}</div>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1, wk = isWeekend(year, month, day), leave = getLeave(agent.id, day), inSel = isInSelection(agent.id, day), isToday = todayDay === day, canInteract = isManager || currentUser.id === agent.id;
                        return <td key={i}
                          onClick={() => canInteract && !wk && handleCellClick(agent.id, day)}
                          onContextMenu={(e) => !wk && handleCellRightClick(e, agent.id, day)}
                          onMouseEnter={() => { if (selectedAgent === agent.id) setHoveredDay(day); }}
                          onMouseLeave={() => setHoveredDay(null)}
                          style={{ padding: "3px 2px", textAlign: "center", cursor: wk || !canInteract ? "default" : "pointer", background: wk ? "#f9fafb" : inSel ? "#c7d2fe" : leave ? leave.bg : isToday ? "#fafafa" : "#fff", borderLeft: "1px solid #f3f4f6" }}>
                          {leave && !wk && <div style={{ width: "100%", height: 22, background: leave.color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", opacity: (leave.status === "pending" && leave.agentId !== currentUser.id) ? 0.4 : 1 }}>
                            <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{(leave.status === "pending" && leave.agentId !== currentUser.id) ? "?" : leave.label.slice(0, 3).toUpperCase()}</span>
                          </div>}
                        </td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "validations" && (
          <div style={{ padding: 24 }}>
            {isManager ? (
              <>
                {pendingRequests.length === 0 && requests.filter(r => r.status !== "pending").length === 0 &&
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 40, textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: "3rem" }}>🎉</div><div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Aucune demande</div>
                  </div>}
                {pendingRequests.length > 0 && <>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🕐 En attente ({pendingRequests.length})</h3>
                  {pendingRequests.map(req => <RequestCard key={req.id} req={req} isManager onApprove={() => approveRequest(req.id)} onReject={() => { setRejectModal(req.id); setRejectComment(""); }} />)}
                </>}
                {requests.filter(r => r.status !== "pending").length > 0 && <>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "24px 0 16px" }}>📋 Historique</h3>
                  {requests.filter(r => r.status !== "pending").map(req => <RequestCard key={req.id} req={req} isManager />)}
                </>}
              </>
            ) : (
              <>
                <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, color: "#4338ca" }}>💡 Sélectionnez des dates dans le planning pour envoyer une demande.</div>
                {myRequests.length === 0 && <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 40, textAlign: "center", color: "#9ca3af" }}><div style={{ fontSize: "3rem" }}>📝</div><div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Aucune demande</div></div>}
                {myRequests.map(req => <RequestCard key={req.id} req={req} />)}
              </>
            )}
          </div>
        )}

        {view === "stats" && (
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
              {leaveTypes.map(t => {
                let count = 0; agents.forEach(a => { Object.values(leaves[a.id] || {}).forEach(l => { if (l.code === t.code || l.id === t.id) count++; }); });
                return <div key={t.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: t.color }} /><span style={{ fontSize: 13, color: "#6b7280" }}>{t.label}</span></div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: t.color }}>{count}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>jours ce mois</div>
                </div>;
              })}
            </div>
          </div>
        )}
      </main>

      {requestModal && currentLT && <Modal title="📝 Demande de congé">
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 16px" }}>Du <strong>{formatDate(requestModal.start)}</strong> au <strong>{formatDate(requestModal.end)}</strong></p>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Type de congé</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{leaveTypes.map(t => <button key={t.id} onClick={() => setSelectedLTId(t.id)} style={{ padding: "6px 12px", borderRadius: 20, border: "2px solid", fontSize: 12, cursor: "pointer", fontWeight: 600, background: selectedLTId === t.id ? t.color : t.bg, color: selectedLTId === t.id ? "#fff" : t.color, borderColor: t.color }}>{t.label}</button>)}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Motif (optionnel)</label>
          <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", resize: "none", outline: "none" }} />
        </div>
        <ModalButtons onCancel={() => setRequestModal(null)} onConfirm={submitRequest} confirmLabel="Envoyer" confirmColor="#4f46e5" />
      </Modal>}

      {rejectModal && <Modal title="❌ Refuser la demande">
        <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} placeholder="Motif du refus obligatoire..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", resize: "none", outline: "none", marginBottom: 20 }} />
        <ModalButtons onCancel={() => setRejectModal(null)} onConfirm={() => rejectRequest(rejectModal)} confirmLabel="Confirmer" confirmColor={rejectComment.trim() ? "#ef4444" : "#fca5a5"} disabled={!rejectComment.trim()} />
      </Modal>}
    </div>
  );
}

function RequestCard({ req, isManager, onApprove, onReject }) {
  const s = { pending: { label: "En attente", bg: "#fef3c7", color: "#92400e", icon: "🕐" }, approved: { label: "Approuvée", bg: "#d1fae5", color: "#065f46", icon: "✅" }, rejected: { label: "Refusée", bg: "#fee2e2", color: "#991b1b", icon: "❌" } }[req.status] || { label: req.status, bg: "#f3f4f6", color: "#374151", icon: "•" };
  const ltBg = req.leaveType?.bg || hexToLight(req.leaveType?.color || "#6366f1");
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${agentHue(req.agentId)},60%,55%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{req.agentAvatar}</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{req.agentName}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{req.agentTeam}</div></div>
        <div style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.icon} {s.label}</div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: req.reason ? 10 : 0 }}>
        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 14px" }}><div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>PÉRIODE</div><div style={{ fontSize: 13, fontWeight: 600 }}>{req.start === req.end ? formatDate(req.start) : `${formatDate(req.start)} → ${formatDate(req.end)}`}</div></div>
        <div style={{ background: ltBg, borderRadius: 8, padding: "8px 14px" }}><div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>TYPE</div><div style={{ fontSize: 13, fontWeight: 600, color: req.leaveType?.color }}>{req.leaveType?.label}</div></div>
      </div>
      {req.reason && <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>💬 {req.reason}</div>}
      {req.comment && <div style={{ fontSize: 12, color: "#991b1b", background: "#fee2e2", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>❌ {req.comment}</div>}
      {isManager && req.status === "pending" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onApprove} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>✅ Approuver</button>
        <button onClick={onReject} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>❌ Refuser</button>
      </div>}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  if (!currentUser) return <LoginPage onLogin={setCurrentUser} />;
  return <PlanningApp currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
}