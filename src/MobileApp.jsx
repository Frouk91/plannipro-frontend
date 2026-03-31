import React, { useState, useEffect, useCallback } from 'react';

const API = "https://plannipro-backend.onrender.com/api";

// Styles globaux mobile
const MOBILE_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; }
  
  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #e2e8f0; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
  
  /* Animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  
  /* Responsive */
  @media (min-width: 769px) {
    body::after { content: "⚠️ Accédez à /mobile depuis un mobile!"; position: fixed; top: 0; width: 100%; background: #ef4444; color: white; padding: 10px; text-align: center; font-weight: 700; z-index: 9999; }
  }
`;

function MobileApp({ currentUser, onLogout, token }) {
  const [activeTab, setActiveTab] = useState('accueil');
  const [agents, setAgents] = useState([]);
  const [leaves, setLeaves] = useState({});
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [astreintes, setAstreintes] = useState({});
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', leaveTypeId: '', reason: '' });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Charger les données
  useEffect(() => {
    loadData();
  }, [token]);

  async function loadData() {
    try {
      setLoading(true);
      
      const [agentsRes, leavesRes, leaveTypesRes, astrRes] = await Promise.all([
        fetch(`${API}/agents`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/leaves`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/leave-types`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/astreintes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (agentsRes.ok) setAgents(await agentsRes.json());
      if (leavesRes.ok) setLeaves(await leavesRes.json());
      if (leaveTypesRes.ok) setLeaveTypes(await leaveTypesRes.json());
      if (astrRes.ok) {
        const astrData = await astrRes.json();
        const astrObj = {};
        astrData.forEach(a => {
          const key = `${a.team_name}|${a.row_type}|${a.date_key}`;
          astrObj[key] = a;
        });
        setAstreintes(astrObj);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setLoading(false);
    }
  }

  async function submitLeave() {
    if (!leaveForm.startDate || !leaveForm.leaveTypeId) {
      showNotif('⚠️ Remplissez les champs', '#f59e0b');
      return;
    }

    try {
      const response = await fetch(`${API}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agent_id: currentUser.id,
          leave_type_id: leaveForm.leaveTypeId,
          start_date: leaveForm.startDate,
          end_date: leaveForm.endDate || leaveForm.startDate,
          reason: leaveForm.reason
        })
      });

      if (response.ok) {
        showNotif('✅ Congé posé avec succès!', '#10b981');
        setShowLeaveForm(false);
        setLeaveForm({ startDate: '', endDate: '', leaveTypeId: '', reason: '' });
        setTimeout(loadData, 500);
      } else {
        showNotif('❌ Erreur lors de la sauvegarde', '#ef4444');
      }
    } catch (err) {
      console.error('Erreur soumission:', err);
      showNotif('❌ Erreur serveur', '#ef4444');
    }
  }

  function showNotif(msg, color) {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 3000);
  }

  // === ONGLET 1: ACCUEIL ===
  function HomeTab() {
    const absentAgents = agents.filter(a => {
      const aLeaves = leaves[a.id] || {};
      const l = aLeaves[todayStr];
      if (!l) return false;
      const leaveArr = Array.isArray(l) ? l : [l];
      return leaveArr.some(x => x.status !== 'rejected');
    });

    const dispoAgents = agents.filter(a => a.role !== 'admin' && !absentAgents.some(x => x.id === a.id));

    return (
      <div style={{ padding: '16px', animation: 'fadeIn 0.3s' }}>
        {/* Carte aujourd'hui */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>📅 Aujourd'hui</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
            {now.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Absents */}
        {absentAgents.length > 0 && (
          <div style={{ background: '#fef2f2', borderRadius: 12, padding: '12px', marginBottom: 16, borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
              ❌ ABSENTS AUJOURD'HUI ({absentAgents.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {absentAgents.map(a => (
                <div key={a.id} style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                  👤 {a.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disponibles */}
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
            ✅ DISPONIBLES ({dispoAgents.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dispoAgents.map(a => (
              <div key={a.id} style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                ✓ {a.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === ONGLET 2: MES CONGÉS ===
  function LeavesTab() {
    const myLeaves = leaves[currentUser.id] || {};
    const futureLeaves = Object.entries(myLeaves)
      .filter(([date, leave]) => date >= todayStr)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5);

    return (
      <div style={{ padding: '16px', paddingBottom: 100, animation: 'fadeIn 0.3s' }}>
        <button
          onClick={() => setShowLeaveForm(!showLeaveForm)}
          style={{
            width: '100%',
            padding: '14px',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 16,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
        >
          📅 Poser un congé
        </button>

        {/* Formulaire */}
        {showLeaveForm && (
          <div style={{
            background: '#eef2ff',
            borderRadius: 12,
            padding: '14px',
            marginBottom: 16,
            border: '2px solid #6366f1'
          }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', display: 'block', marginBottom: 6 }}>
                Date de début *
              </label>
              <input
                type="date"
                value={leaveForm.startDate}
                onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #c7d2fe',
                  fontSize: 12
                }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', display: 'block', marginBottom: 6 }}>
                Date de fin
              </label>
              <input
                type="date"
                value={leaveForm.endDate}
                onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #c7d2fe',
                  fontSize: 12
                }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', display: 'block', marginBottom: 6 }}>
                Type de congé *
              </label>
              <select
                value={leaveForm.leaveTypeId}
                onChange={e => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #c7d2fe',
                  fontSize: 12
                }}
              >
                <option value="">-- Choisir --</option>
                {leaveTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={submitLeave}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                ✓ Envoyer
              </button>
              <button
                onClick={() => setShowLeaveForm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                ✕ Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste des congés */}
        {futureLeaves.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {futureLeaves.map(([date, leave]) => {
              const leaveArr = Array.isArray(leave) ? leave : [leave];
              const mainLeave = leaveArr[0];
              return (
                <div key={date} style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '12px',
                  borderLeft: `4px solid ${mainLeave?.color || '#6366f1'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                    {mainLeave?.leaveLabel || 'Congé'}
                  </div>
                  <div style={{ fontSize: 10, color: mainLeave?.status === 'pending' ? '#f59e0b' : '#10b981', marginTop: 4, fontWeight: 600 }}>
                    {mainLeave?.status === 'pending' ? '⏳ En attente' : mainLeave?.status === 'approved' ? '✅ Approuvé' : '❌ Rejeté'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 12 }}>Aucun congé prévu</div>
          </div>
        )}
      </div>
    );
  }

  // === ONGLET 3: ASTREINTES ===
  function AstreinteTab() {
    const currentYear = now.getFullYear();
    const myAstreintes = Object.entries(astreintes)
      .filter(([key, data]) => {
        const dateStr = data.date_key ? (typeof data.date_key === 'string' ? data.date_key.split('T')[0] : new Date(data.date_key).toISOString().split('T')[0]) : null;
        const [team, row, date] = key.split('|');
        return data.agent_id === currentUser.id && row === 'astreinte' && date >= todayStr;
      })
      .sort(([aKey], [bKey]) => {
        const aDate = aKey.split('|')[2];
        const bDate = bKey.split('|')[2];
        return aDate.localeCompare(bDate);
      })
      .slice(0, 10);

    const astreinteCount = Object.entries(astreintes).filter(([key, data]) => {
      const dateStr = data.date_key ? (typeof data.date_key === 'string' ? data.date_key.split('T')[0] : new Date(data.date_key).toISOString().split('T')[0]) : null;
      const [team, row, date] = key.split('|');
      return data.agent_id === currentUser.id && row === 'astreinte' && date.startsWith(currentYear);
    }).length;

    return (
      <div style={{ padding: '16px', paddingBottom: 100, animation: 'fadeIn 0.3s' }}>
        {/* Stat annuelle */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>📊 Astreintes {currentYear}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{astreinteCount}</div>
        </div>

        {/* Liste */}
        {myAstreintes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myAstreintes.map(([key, data]) => {
              const dateStr = data.date_key ? (typeof data.date_key === 'string' ? data.date_key.split('T')[0] : new Date(data.date_key).toISOString().split('T')[0]) : null;
              const date = new Date(dateStr + 'T00:00:00');
              return (
                <div key={key} style={{
                  background: '#fffbeb',
                  borderRadius: 10,
                  padding: '12px',
                  borderLeft: '4px solid #f59e0b',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: 11, color: '#92400e', marginBottom: 4 }}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                    🔔 Astreinte vendredi
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
            <div style={{ fontSize: 12 }}>Aucune astreinte programmée</div>
          </div>
        )}
      </div>
    );
  }

  // === ONGLET 4: PROFIL ===
  function ProfileTab() {
    return (
      <div style={{ padding: '16px', paddingBottom: 100, animation: 'fadeIn 0.3s' }}>
        {/* Carte profil */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          borderRadius: 16,
          padding: '24px',
          marginBottom: 16,
          color: '#fff',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {currentUser.first_name} {currentUser.last_name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            {currentUser.email}
          </div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 8 }}>
            Équipe: <strong>{currentUser.team || 'N/A'}</strong>
          </div>
        </div>

        {/* Infos */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Infos</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#475569' }}>Rôle</span>
            <strong style={{ color: '#1e293b' }}>{currentUser.role === 'manager' ? '👔 Manager' : '👤 Agent'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ color: '#475569' }}>Statut</span>
            <strong style={{ color: '#10b981' }}>✅ Actif</strong>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '14px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
          onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
        >
          🚪 Déconnexion
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: 'fadeIn 1s infinite' }}>⏳</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>Chargement...</div>
        </div>
      </div>
    );
  }

  const tabsConfig = [
    { id: 'accueil', icon: '🏠', label: 'Accueil', component: HomeTab },
    { id: 'leaves', icon: '📅', label: 'Congés', component: LeavesTab },
    { id: 'astreinte', icon: '🔔', label: 'Astreintes', component: AstreinteTab },
    { id: 'profil', icon: '👤', label: 'Profil', component: ProfileTab }
  ];

  const ActiveComponent = tabsConfig.find(t => t.id === activeTab)?.component || HomeTab;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 70 }}>
      <style>{MOBILE_STYLE}</style>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
        color: '#fff',
        padding: '16px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>📱 PlanniPro Mobile</div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Gestion du planning</div>
      </div>

      {/* CONTENU */}
      <ActiveComponent />

      {/* NOTIFICATION */}
      {notif && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: notif.color,
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 999,
          animation: 'slideUp 0.3s'
        }}>
          {notif.msg}
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 100,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
      }}>
        {tabsConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: activeTab === tab.id ? '#eef2ff' : 'transparent',
              color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.2s',
              borderTop: activeTab === tab.id ? '3px solid #6366f1' : '3px solid transparent'
            }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{tab.icon}</div>
            <div>{tab.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MobileApp;
