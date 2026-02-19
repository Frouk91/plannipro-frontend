import { useState, useMemo } from "react";

const LEAVE_TYPES = [
  { id: "cp", label: "Congé payé", color: "#6366f1", bg: "#eef2ff" },
  { id: "rtt", label: "RTT", color: "#0ea5e9", bg: "#e0f2fe" },
  { id: "maladie", label: "Maladie", color: "#f59e0b", bg: "#fef3c7" },
  { id: "formation", label: "Formation", color: "#10b981", bg: "#d1fae5" },
  { id: "teletravail", label: "Télétravail", color: "#8b5cf6", bg: "#ede9fe" },
];

const INITIAL_AGENTS = [
  { id: 1, name: "Sophie Martin", role: "manager", team: "RH", avatar: "SM" },
  { id: 2, name: "Lucas Bernard", role: "agent", team: "Tech", avatar: "LB" },
  { id: 3, name: "Emma Dubois", role: "agent", team: "Tech", avatar: "ED" },
  { id: 4, name: "Hugo Leroy", role: "agent", team: "Ventes", avatar: "HL" },
  { id: 5, name: "Chloé Moreau", role: "agent", team: "Finance", avatar: "CM" },
  { id: 6, name: "Nathan Simon", role: "agent", team: "Tech", avatar: "NS" },
  { id: 7, name: "Léa Petit", role: "agent", team: "RH", avatar: "LP" },
  { id: 8, name: "Théo Lambert", role: "agent", team: "Ventes", avatar: "TL" },
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

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
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function PlanningApp() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [leaves, setLeaves] = useState({});
  const [requests, setRequests] = useState([]); // demandes en attente
  const [view, setView] = useState("planning");
  const [addAgentModal, setAddAgentModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", role: "agent", team: "" });
  const [filterTeam, setFilterTeam] = useState("Tous");
  const [selectedLeaveType, setSelectedLeaveType] = useState("cp");
  const [selectionStart, setSelectionStart] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [currentUser, setCurrentUser] = useState(INITIAL_AGENTS[0]); // Sophie = manager par défaut
  const [requestModal, setRequestModal] = useState(null); // { agentId, start, end }
  const [requestReason, setRequestReason] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [notification, setNotification] = useState(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const teams = ["Tous", ...Array.from(new Set(agents.map(a => a.team)))];
  const filteredAgents = filterTeam === "Tous" ? agents : agents.filter(a => a.team === filterTeam);
  const pendingRequests = requests.filter(r => r.status === "pending");
  const isManager = currentUser.role === "manager";

  function showNotif(msg, type = "success") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function getLeave(agentId, day) {
    const key = dateKey(year, month, day);
    return leaves[agentId]?.[key];
  }

  function handleCellClick(agentId, day) {
    if (isWeekend(year, month, day)) return;
    // Seul l'agent lui-même ou le manager peut poser des congés
    if (!isManager && currentUser.id !== agentId) return;

    if (!selectedAgent || selectedAgent !== agentId) {
      setSelectedAgent(agentId);
      setSelectionStart(day);
    } else {
      const start = Math.min(selectionStart, day);
      const end = Math.max(selectionStart, day);
      const startKey = dateKey(year, month, start);
      const endKey = dateKey(year, month, end);

      if (isManager) {
        // Manager : approuve directement
        applyLeave(agentId, start, end, selectedLeaveType, "approved");
      } else {
        // Agent : crée une demande
        setRequestModal({ agentId, start: startKey, end: endKey });
        setRequestReason("");
      }
      setSelectionStart(null);
      setSelectedAgent(null);
    }
  }

  function applyLeave(agentId, startDay, endDay, typeId, status) {
    const type = LEAVE_TYPES.find(t => t.id === typeId);
    setLeaves(prev => {
      const agentLeaves = { ...(prev[agentId] || {}) };
      for (let d = startDay; d <= endDay; d++) {
        if (!isWeekend(year, month, d)) {
          const key = dateKey(year, month, d);
          agentLeaves[key] = { ...type, status };
        }
      }
      return { ...prev, [agentId]: agentLeaves };
    });
  }

  function submitRequest() {
    if (!requestModal) return;
    const { agentId, start, end } = requestModal;
    const agent = agents.find(a => a.id === agentId);
    const type = LEAVE_TYPES.find(t => t.id === selectedLeaveType);
    const newReq = {
      id: Date.now(),
      agentId,
      agentName: agent.name,
      agentAvatar: agent.avatar,
      agentTeam: agent.team,
      leaveType: type,
      start, end,
      reason: requestReason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setRequests(prev => [...prev, newReq]);
    setRequestModal(null);
    showNotif("Demande envoyée au manager !");
  }

  function approveRequest(reqId) {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "approved" } : r));
    const req = requests.find(r => r.id === reqId);
    if (req) {
      const [sy, sm, sd] = req.start.split("-").map(Number);
      const [ey, em, ed] = req.end.split("-").map(Number);
      // Appliquer les congés sur le planning
      const type = req.leaveType;
      setLeaves(prev => {
        const agentLeaves = { ...(prev[req.agentId] || {}) };
        const startDate = new Date(sy, sm - 1, sd);
        const endDate = new Date(ey, em - 1, ed);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0 && d.getDay() !== 6) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            agentLeaves[key] = { ...type, status: "approved" };
          }
        }
        return { ...prev, [req.agentId]: agentLeaves };
      });
    }
    showNotif("Demande approuvée ✅");
  }

  function openRejectModal(reqId) {
    setRejectModal(reqId);
    setRejectComment("");
  }

  function confirmReject() {
    setRequests(prev => prev.map(r => r.id === rejectModal ? { ...r, status: "rejected", comment: rejectComment } : r));
    setRejectModal(null);
    showNotif("Demande refusée", "error");
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

  function addAgent() {
    if (!newAgent.name.trim()) return;
    const initials = newAgent.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    setAgents(prev => [...prev, { id: Date.now(), ...newAgent, avatar: initials }]);
    setNewAgent({ name: "", role: "agent", team: "" });
    setAddAgentModal(false);
  }

  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;
  const myRequests = requests.filter(r => r.agentId === currentUser.id);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#f0f2f7", display: "flex" }}>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: notification.type === "error" ? "#ef4444" : "#10b981",
          color: "white", padding: "12px 20px", borderRadius: 12,
          fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.3s ease"
        }}>{notification.msg}</div>
      )}

      {/* Sidebar */}
      <aside style={{ width: 220, background: "#1a1d27", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #2d3148" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>📅 PlanniPro</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Gestion des présences</div>
        </div>

        {/* Sélecteur d'utilisateur */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #2d3148" }}>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Connecté en tant que</div>
          <select value={currentUser.id} onChange={e => setCurrentUser(agents.find(a => a.id === parseInt(e.target.value)))}
            style={{ width: "100%", background: "#2d3148", color: "#fff", border: "1px solid #3d4168", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name} {a.role === "manager" ? "👑" : ""}</option>
            ))}
          </select>
          <div style={{ fontSize: 10, color: currentUser.role === "manager" ? "#818cf8" : "#9ca3af", marginTop: 6, textAlign: "center" }}>
            {currentUser.role === "manager" ? "👑 Manager" : "👤 Agent"}
          </div>
        </div>

        <nav style={{ padding: "16px 0", flex: 1 }}>
          {[
            { id: "planning", icon: "🗓", label: "Planning" },
            { id: "validations", icon: "✅", label: "Validations", badge: isManager ? pendingRequests.length : myRequests.filter(r => r.status === "pending").length },
            { id: "agents", icon: "👥", label: "Agents" },
            { id: "stats", icon: "📊", label: "Statistiques" },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 20px", border: "none",
              background: view === item.id ? "#2d3148" : "transparent",
              color: view === item.id ? "#818cf8" : "#9ca3af",
              cursor: "pointer", fontSize: 14, fontWeight: view === item.id ? 600 : 400,
              borderLeft: view === item.id ? "3px solid #818cf8" : "3px solid transparent",
            }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background: "#e94560", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Légende */}
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
              {view === "planning" ? "Planning mensuel" : view === "validations" ? "Demandes de congés" : view === "agents" ? "Gestion des agents" : "Statistiques"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
              {view === "planning" ? `${MONTHS_FR[month]} ${year}` :
                view === "validations" ? (isManager ? `${pendingRequests.length} demande(s) en attente` : `${myRequests.length} demande(s) au total`) :
                  `${agents.length} agents`}
            </p>
          </div>
          {view === "agents" && (
            <button onClick={() => setAddAgentModal(true)} style={{
              background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600
            }}>+ Ajouter un agent</button>
          )}
        </div>

        {/* ── VUE PLANNING ── */}
        {view === "planning" && (
          <div style={{ padding: 24, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={prevMonth} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 18, color: "#111827", minWidth: 160, textAlign: "center" }}>{MONTHS_FR[month]} {year}</span>
                <button onClick={nextMonth} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>›</button>
                <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#4b5563", fontWeight: 600 }}>Aujourd'hui</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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

            <div style={{ fontSize: 12, color: "#92400e", marginBottom: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px" }}>
              {isManager
                ? "👑 Mode Manager : cliquez pour sélectionner une plage de dates (1er clic = début, 2ème clic = fin). Les congés sont appliqués directement."
                : "👤 Mode Agent : sélectionnez une plage de dates pour envoyer une demande au manager."}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 160 }} />
                  {Array.from({ length: daysInMonth }, (_, i) => <col key={i} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#9ca3af", fontWeight: 600, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>AGENT</th>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const wk = isWeekend(year, month, day);
                      const isToday = todayDay === day;
                      return (
                        <th key={i} style={{
                          padding: "4px 2px", textAlign: "center", fontSize: 10, fontWeight: 600,
                          background: isToday ? "#eef2ff" : "#f9fafb",
                          color: isToday ? "#4f46e5" : wk ? "#d1d5db" : "#6b7280",
                          borderBottom: "1px solid #e5e7eb", borderLeft: "1px solid #f3f4f6",
                        }}>
                          <div>{DAYS_FR[(i + firstDay) % 7].slice(0, 1)}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#4f46e5" : wk ? "#d1d5db" : "#374151" }}>{day}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map(agent => (
                    <tr key={agent.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: `hsl(${(agent.id * 47) % 360}, 60%, 55%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0
                        }}>{agent.avatar}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
                            {agent.name} {agent.role === "manager" ? "👑" : ""}
                          </div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{agent.team}</div>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const wk = isWeekend(year, month, day);
                        const leave = getLeave(agent.id, day);
                        const inSel = isInSelection(agent.id, day);
                        const isToday = todayDay === day;
                        const canInteract = isManager || currentUser.id === agent.id;

                        return (
                          <td key={i}
                            onClick={() => canInteract && handleCellClick(agent.id, day)}
                            onMouseEnter={() => { if (selectedAgent === agent.id) setHoveredDay(day); }}
                            onMouseLeave={() => setHoveredDay(null)}
                            style={{
                              padding: "3px 2px", textAlign: "center",
                              cursor: wk || !canInteract ? "default" : "pointer",
                              background: wk ? "#f9fafb" : inSel ? "#c7d2fe" : leave ? leave.bg : isToday ? "#fafafa" : "#fff",
                              borderLeft: "1px solid #f3f4f6",
                            }}>
                            {leave && !wk && (
                              <div style={{
                                width: "100%", height: 22, background: leave.color, borderRadius: 4,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: leave.status === "pending" ? 0.4 : 1,
                              }}>
                                <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>
                                  {leave.status === "pending" ? "?" : leave.label.slice(0, 3).toUpperCase()}
                                </span>
                              </div>
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

        {/* ── VUE VALIDATIONS ── */}
        {view === "validations" && (
          <div style={{ padding: 24 }}>
            {isManager ? (
              <>
                {/* Vue Manager */}
                {pendingRequests.length === 0 && (
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 40, textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: 3 + "rem" }}>🎉</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Aucune demande en attente</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Toutes les demandes ont été traitées !</div>
                  </div>
                )}
                {pendingRequests.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>🕐 En attente de validation ({pendingRequests.length})</h3>
                    {pendingRequests.map(req => (
                      <RequestCard key={req.id} req={req} isManager={true}
                        onApprove={() => approveRequest(req.id)}
                        onReject={() => openRejectModal(req.id)} />
                    ))}
                  </div>
                )}
                {requests.filter(r => r.status !== "pending").length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>📋 Historique</h3>
                    {requests.filter(r => r.status !== "pending").map(req => (
                      <RequestCard key={req.id} req={req} isManager={true} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Vue Agent */}
                <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, color: "#4338ca" }}>
                  💡 Sélectionnez des dates dans le planning pour envoyer une demande de congé au manager.
                </div>
                {myRequests.length === 0 && (
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 40, textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: "3rem" }}>📝</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Aucune demande</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Vos demandes de congés apparaîtront ici.</div>
                  </div>
                )}
                {myRequests.map(req => (
                  <RequestCard key={req.id} req={req} isManager={false} />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── VUE AGENTS ── */}
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
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{agent.name} {agent.role === "manager" ? "👑" : ""}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{agent.team}</div>
                    <div style={{ fontSize: 11, color: agent.role === "manager" ? "#6366f1" : "#10b981", marginTop: 4, fontWeight: 600 }}>
                      {agent.role === "manager" ? "Manager" : "Agent"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VUE STATS ── */}
        {view === "stats" && (
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              {LEAVE_TYPES.map(t => {
                let count = 0;
                agents.forEach(a => {
                  Object.values(leaves[a.id] || {}).forEach(l => { if (l.id === t.id) count++; });
                });
                return (
                  <div key={t.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: t.color }} />
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{t.label}</span>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: t.color }}>{count}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>jours au total</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Demandes par statut</h3>
              {["pending", "approved", "rejected"].map(status => {
                const count = requests.filter(r => r.status === status).length;
                const labels = { pending: "En attente", approved: "Approuvées", rejected: "Refusées" };
                const colors = { pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444" };
                return (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 80, fontSize: 12, color: "#6b7280" }}>{labels[status]}</div>
                    <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 4, height: 8 }}>
                      <div style={{ background: colors[status], height: 8, borderRadius: 4, width: `${Math.min(100, count * 20)}%` }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors[status], width: 30 }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal demande de congé (agent) */}
      {requestModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>📝 Demande de congé</h2>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 20px" }}>
              Du <strong>{formatDate(requestModal.start)}</strong> au <strong>{formatDate(requestModal.end)}</strong>
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Type de congé</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {LEAVE_TYPES.map(t => (
                  <button key={t.id} onClick={() => setSelectedLeaveType(t.id)} style={{
                    padding: "6px 12px", borderRadius: 20, border: "2px solid", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    background: selectedLeaveType === t.id ? t.color : t.bg,
                    color: selectedLeaveType === t.id ? "#fff" : t.color,
                    borderColor: t.color,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Motif (optionnel)</label>
              <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)}
                placeholder="Ex: Vacances en famille..."
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", resize: "none", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRequestModal(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}>Annuler</button>
              <button onClick={submitRequest} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Envoyer la demande</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal refus */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>❌ Refuser la demande</h2>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 20px" }}>Indiquez le motif du refus (obligatoire)</p>
            <textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)}
              placeholder="Ex: Effectifs insuffisants sur cette période..."
              rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", resize: "none", outline: "none", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}>Annuler</button>
              <button onClick={confirmReject} disabled={!rejectComment.trim()} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: rejectComment.trim() ? "#ef4444" : "#fca5a5", color: "#fff", cursor: rejectComment.trim() ? "pointer" : "default", fontSize: 14, fontWeight: 600 }}>Confirmer le refus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajouter agent */}
      {addAgentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Ajouter un agent</h2>
            {[
              { key: "name", label: "Nom complet", placeholder: "Ex: Jean Dupont" },
              { key: "team", label: "Équipe", placeholder: "Ex: Tech" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                <input value={newAgent[f.key]} onChange={e => setNewAgent(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Rôle</label>
              <select value={newAgent.role} onChange={e => setNewAgent(prev => ({ ...prev, role: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }}>
                <option value="agent">Agent</option>
                <option value="manager">Manager 👑</option>
              </select>
            </div>
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

function RequestCard({ req, isManager, onApprove, onReject }) {
  const statusConfig = {
    pending: { label: "En attente", bg: "#fef3c7", color: "#92400e", icon: "🕐" },
    approved: { label: "Approuvée", bg: "#d1fae5", color: "#065f46", icon: "✅" },
    rejected: { label: "Refusée", bg: "#fee2e2", color: "#991b1b", icon: "❌" },
  };
  const s = statusConfig[req.status];

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: `hsl(${(req.agentId * 47) % 360}, 60%, 55%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0
        }}>{req.agentAvatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{req.agentName}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{req.agentTeam}</div>
        </div>
        <div style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          {s.icon} {s.label}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: req.reason ? 10 : 0, flexWrap: "wrap" }}>
        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 14px" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>PÉRIODE</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {req.start === req.end ? formatDate(req.start) : `${formatDate(req.start)} → ${formatDate(req.end)}`}
          </div>
        </div>
        <div style={{ background: req.leaveType.bg, borderRadius: 8, padding: "8px 14px" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>TYPE</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: req.leaveType.color }}>{req.leaveType.label}</div>
        </div>
      </div>
      {req.reason && (
        <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>
          💬 {req.reason}
        </div>
      )}
      {req.comment && (
        <div style={{ fontSize: 12, color: "#991b1b", background: "#fee2e2", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>
          ❌ Motif de refus : {req.comment}
        </div>
      )}
      {isManager && req.status === "pending" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onApprove} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            background: "#10b981", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600
          }}>✅ Approuver</button>
          <button onClick={onReject} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600
          }}>❌ Refuser</button>
        </div>
      )}
    </div>
  );
}

