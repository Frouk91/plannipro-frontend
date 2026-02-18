import { useState, useMemo } from "react";

const LEAVE_TYPES = [
  { id: "cp", label: "Congé payé", color: "#6366f1", bg: "#eef2ff" },
  { id: "rtt", label: "RTT", color: "#0ea5e9", bg: "#e0f2fe" },
  { id: "maladie", label: "Maladie", color: "#f59e0b", bg: "#fef3c7" },
  { id: "formation", label: "Formation", color: "#10b981", bg: "#d1fae5" },
  { id: "teletravail", label: "Télétravail", color: "#8b5cf6", bg: "#ede9fe" },
];

const INITIAL_AGENTS = [
  { id: 1, name: "Sophie Martin", role: "Manager", team: "RH", avatar: "SM" },
  { id: 2, name: "Lucas Bernard", role: "Développeur", team: "Tech", avatar: "LB" },
  { id: 3, name: "Emma Dubois", role: "Designer", team: "Tech", avatar: "ED" },
  { id: 4, name: "Hugo Leroy", role: "Commercial", team: "Ventes", avatar: "HL" },
  { id: 5, name: "Chloé Moreau", role: "Comptable", team: "Finance", avatar: "CM" },
  { id: 6, name: "Nathan Simon", role: "Développeur", team: "Tech", avatar: "NS" },
  { id: 7, name: "Léa Petit", role: "RH", team: "RH", avatar: "LP" },
  { id: 8, name: "Théo Lambert", role: "Commercial", team: "Ventes", avatar: "TL" },
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isWeekend(year, month, day) {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

export default function PlanningApp() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [leaves, setLeaves] = useState({});
  const [view, setView] = useState("planning"); // planning | agents | stats
  const [modal, setModal] = useState(null); // { agentId, day }
  const [addAgentModal, setAddAgentModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", role: "", team: "" });
  const [filterTeam, setFilterTeam] = useState("Tous");
  const [selectedLeaveType, setSelectedLeaveType] = useState("cp");
  const [selectionStart, setSelectionStart] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const teams = ["Tous", ...Array.from(new Set(agents.map(a => a.team)))];

  const filteredAgents = filterTeam === "Tous" ? agents : agents.filter(a => a.team === filterTeam);

  function getLeave(agentId, day) {
    const key = dateKey(year, month, day);
    return leaves[agentId]?.[key];
  }

  function toggleLeave(agentId, day, type) {
    const key = dateKey(year, month, day);
    setLeaves(prev => {
      const agentLeaves = { ...(prev[agentId] || {}) };
      if (agentLeaves[key]?.id === type) {
        delete agentLeaves[key];
      } else {
        agentLeaves[key] = LEAVE_TYPES.find(t => t.id === type);
      }
      return { ...prev, [agentId]: agentLeaves };
    });
  }

  function handleCellClick(agentId, day) {
    if (isWeekend(year, month, day)) return;
    if (!selectedAgent || selectedAgent !== agentId) {
      setSelectedAgent(agentId);
      setSelectionStart(day);
    } else {
      const start = Math.min(selectionStart, day);
      const end = Math.max(selectionStart, day);
      for (let d = start; d <= end; d++) {
        if (!isWeekend(year, month, d)) {
          toggleLeave(agentId, d, selectedLeaveType);
        }
      }
      setSelectionStart(null);
      setSelectedAgent(null);
    }
  }

  function isInSelection(agentId, day) {
    if (selectedAgent !== agentId || selectionStart === null || hoveredDay === null) return false;
    const start = Math.min(selectionStart, hoveredDay);
    const end = Math.max(selectionStart, hoveredDay);
    return day >= start && day <= end;
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function countLeaveDays(agentId) {
    const al = leaves[agentId] || {};
    return Object.values(al).length;
  }

  function statsForType(typeId) {
    let count = 0;
    agents.forEach(a => {
      Object.values(leaves[a.id] || {}).forEach(l => {
        if (l.id === typeId) count++;
      });
    });
    return count;
  }

  function addAgent() {
    if (!newAgent.name.trim()) return;
    const initials = newAgent.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    setAgents(prev => [...prev, { id: Date.now(), ...newAgent, avatar: initials }]);
    setNewAgent({ name: "", role: "", team: "" });
    setAddAgentModal(false);
  }

  function removeAgent(id) {
    setAgents(prev => prev.filter(a => a.id !== id));
    setLeaves(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;

  // Count agents present per day (not on leave, not weekend)
  function presentCount(day) {
    if (isWeekend(year, month, day)) return null;
    const absent = agents.filter(a => getLeave(a.id, day)).length;
    return agents.length - absent;
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#f0f2f7", display: "flex" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#1a1d27", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #2d3148" }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: "#fff" }}>📅 PlanniPro</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Gestion des présences</div>
        </div>
        <nav style={{ padding: "16px 0", flex: 1 }}>
          {[
            { id: "planning", icon: "🗓", label: "Planning" },
            { id: "agents", icon: "👥", label: "Agents" },
            { id: "stats", icon: "📊", label: "Statistiques" },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 20px", border: "none", background: view === item.id ? "#2d3148" : "transparent",
              color: view === item.id ? "#818cf8" : "#9ca3af", cursor: "pointer",
              fontSize: 14, fontWeight: view === item.id ? 600 : 400,
              borderLeft: view === item.id ? "3px solid #818cf8" : "3px solid transparent",
              transition: "all 0.15s",
            }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        {/* Legend */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #2d3148" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Légende</div>
          {LEAVE_TYPES.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{t.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
              {view === "planning" ? "Planning mensuel" : view === "agents" ? "Gestion des agents" : "Statistiques"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
              {view === "planning" ? `${agents.length} agents · ${MONTHS_FR[month]} ${year}` :
               view === "agents" ? `${agents.length} agents enregistrés` : "Vue d'ensemble des absences"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {view === "agents" && (
              <button onClick={() => setAddAgentModal(true)} style={{
                background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600
              }}>+ Ajouter un agent</button>
            )}
          </div>
        </div>

        {/* Planning View */}
        {view === "planning" && (
          <div style={{ padding: 24, flex: 1 }}>
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={prevMonth} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 18, color: "#111827", minWidth: 160, textAlign: "center" }}>{MONTHS_FR[month]} {year}</span>
                <button onClick={nextMonth} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>›</button>
                <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#4b5563", fontWeight: 600 }}>Aujourd'hui</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Équipe :</span>
                {teams.map(t => (
                  <button key={t} onClick={() => setFilterTeam(t)} style={{
                    padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", fontWeight: 500,
                    background: filterTeam === t ? "#4f46e5" : "#fff",
                    color: filterTeam === t ? "#fff" : "#6b7280",
                    borderColor: filterTeam === t ? "#4f46e5" : "#e5e7eb",
                  }}>{t}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Type :</span>
                {LEAVE_TYPES.map(t => (
                  <button key={t.id} onClick={() => setSelectedLeaveType(t.id)} style={{
                    padding: "5px 12px", borderRadius: 20, border: "2px solid", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    background: selectedLeaveType === t.id ? t.color : t.bg,
                    color: selectedLeaveType === t.id ? "#fff" : t.color,
                    borderColor: t.color,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px" }}>
              💡 <strong>Comment utiliser :</strong> Cliquez une 1ère fois sur une cellule pour démarrer la sélection, puis cliquez une 2ème fois pour valider la plage. Cliquez sur un congé existant pour le supprimer.
            </div>

            {/* Grid */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 160 }} />
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <col key={i} style={{ width: Math.max(28, Math.floor((100) / daysInMonth)) }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#9ca3af", fontWeight: 600, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>AGENT</th>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const wk = isWeekend(year, month, day);
                      const isToday = todayDay === day;
                      const count = presentCount(day);
                      return (
                        <th key={i} style={{
                          padding: "4px 2px", textAlign: "center", fontSize: 10, fontWeight: 600,
                          background: isToday ? "#eef2ff" : wk ? "#f9fafb" : "#f9fafb",
                          color: isToday ? "#4f46e5" : wk ? "#d1d5db" : "#6b7280",
                          borderBottom: "1px solid #e5e7eb",
                          borderLeft: "1px solid #f3f4f6",
                        }}>
                          <div>{DAYS_FR[(i + firstDay) % 7].slice(0, 1)}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#4f46e5" : wk ? "#d1d5db" : "#374151" }}>{day}</div>
                          {count !== null && (
                            <div style={{ fontSize: 9, color: count < agents.length * 0.7 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{count}/{agents.length}</div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, ai) => (
                    <tr key={agent.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", background: `hsl(${(agent.id * 47) % 360}, 60%, 55%)`,
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                          fontSize: 10, fontWeight: 700, flexShrink: 0
                        }}>{agent.avatar}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>{agent.name}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{agent.team}</div>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const wk = isWeekend(year, month, day);
                        const leave = getLeave(agent.id, day);
                        const inSel = isInSelection(agent.id, day);
                        const isStart = selectedAgent === agent.id && selectionStart === day;
                        const isToday = todayDay === day;

                        return (
                          <td key={i} onClick={() => handleCellClick(agent.id, day)}
                            onMouseEnter={() => { if (selectedAgent === agent.id) setHoveredDay(day); }}
                            onMouseLeave={() => setHoveredDay(null)}
                            style={{
                              padding: "3px 2px", textAlign: "center", cursor: wk ? "default" : "pointer",
                              background: wk ? "#f9fafb" : inSel ? "#c7d2fe" : isStart ? "#818cf8" : leave ? leave.bg : isToday ? "#fafafa" : "#fff",
                              borderLeft: "1px solid #f3f4f6",
                              transition: "background 0.1s",
                              position: "relative",
                            }}>
                            {leave && !wk && (
                              <div style={{
                                width: "100%", height: 22, background: leave.color, borderRadius: 4,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{leave.label.slice(0, 3).toUpperCase()}</span>
                              </div>
                            )}
                            {!leave && !wk && isToday && (
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f46e5", margin: "auto" }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Agents View */}
        {view === "agents" && (
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {agents.map(agent => (
                <div key={agent.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: `hsl(${(agent.id * 47) % 360}, 60%, 55%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0
                  }}>{agent.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{agent.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{agent.role} · {agent.team}</div>
                    <div style={{ fontSize: 11, color: "#4f46e5", marginTop: 4, fontWeight: 600 }}>{countLeaveDays(agent.id)} jours d'absence enregistrés</div>
                  </div>
                  <button onClick={() => removeAgent(agent.id)} style={{
                    background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444",
                    borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats View */}
        {view === "stats" && (
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              {LEAVE_TYPES.map(t => {
                const count = statsForType(t.id);
                return (
                  <div key={t.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: t.color }} />
                      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{t.label}</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: t.color }}>{count}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>jours au total</div>
                    <div style={{ marginTop: 12, background: "#f3f4f6", borderRadius: 4, height: 6 }}>
                      <div style={{ background: t.color, height: 6, borderRadius: 4, width: `${Math.min(100, count * 5)}%`, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#111827" }}>Absences par agent</h3>
              {agents.sort((a, b) => countLeaveDays(b.id) - countLeaveDays(a.id)).map(agent => {
                const total = countLeaveDays(agent.id);
                const maxDays = 30;
                return (
                  <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: `hsl(${(agent.id * 47) % 360}, 60%, 55%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0
                    }}>{agent.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{agent.name}</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{total} j.</span>
                      </div>
                      <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8 }}>
                        <div style={{
                          background: total > 20 ? "#ef4444" : total > 10 ? "#f59e0b" : "#10b981",
                          height: 8, borderRadius: 4, width: `${Math.min(100, (total / maxDays) * 100)}%`,
                          transition: "width 0.5s"
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Add Agent Modal */}
      {addAgentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Ajouter un agent</h2>
            {[
              { key: "name", label: "Nom complet", placeholder: "Ex: Jean Dupont" },
              { key: "role", label: "Poste", placeholder: "Ex: Développeur" },
              { key: "team", label: "Équipe", placeholder: "Ex: Tech" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                <input value={newAgent[f.key]} onChange={e => setNewAgent(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setAddAgentModal(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}>Annuler</button>
              <button onClick={addAgent} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
