import { useState } from "react";

const DEFAULT_LEAVE_TYPES = [
  { id: "cp", label: "Congé payé", color: "#6366f1", bg: "#eef2ff" },
  { id: "rtt", label: "RTT", color: "#0ea5e9", bg: "#e0f2fe" },
  { id: "maladie", label: "Maladie", color: "#f59e0b", bg: "#fef3c7" },
  { id: "formation", label: "Formation", color: "#10b981", bg: "#d1fae5" },
  { id: "teletravail", label: "Télétravail", color: "#8b5cf6", bg: "#ede9fe" },
];

const DEFAULT_TEAMS = ["Admin", "RH", "Tech", "Ventes", "Finance"];

const DEFAULT_USERS = [
  { id: 1, name: "Redouane F", email: "redouane@entreprise.fr", password: "admin1234", role: "admin", team: "Admin", avatar: "RF" },
  { id: 2, name: "Sophie Martin", email: "sophie@entreprise.fr", password: "sophie123", role: "manager", team: "RH", avatar: "SM" },
  { id: 3, name: "Lucas Bernard", email: "lucas@entreprise.fr", password: "lucas123", role: "agent", team: "Tech", avatar: "LB" },
  { id: 4, name: "Emma Dubois", email: "emma@entreprise.fr", password: "emma1234", role: "agent", team: "Tech", avatar: "ED" },
  { id: 5, name: "Hugo Leroy", email: "hugo@entreprise.fr", password: "hugo1234", role: "agent", team: "Ventes", avatar: "HL" },
  { id: 6, name: "Chloé Moreau", email: "chloe@entreprise.fr", password: "chloe123", role: "agent", team: "Finance", avatar: "CM" },
  { id: 7, name: "Nathan Simon", email: "nathan@entreprise.fr", password: "nathan123", role: "agent", team: "Tech", avatar: "NS" },
  { id: 8, name: "Léa Petit", email: "lea@entreprise.fr", password: "lea12345", role: "agent", team: "RH", avatar: "LP" },
  { id: 9, name: "Théo Lambert", email: "theo@entreprise.fr", password: "theo1234", role: "agent", team: "Ventes", avatar: "TL" },
];

const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const API = "https://plannipro-backend-production.up.railway.app/api";
const COLORS = ["#6366f1","#0ea5e9","#f59e0b","#10b981","#8b5cf6","#ef4444","#ec4899","#14b8a6","#f97316","#84cc16"];

function hexToLight(hex) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},0.12)`;
}
function getDaysInMonth(year,month){return new Date(year,month+1,0).getDate();}
function getFirstDayOfMonth(year,month){let d=new Date(year,month,1).getDay();return d===0?6:d-1;}
function dateKey(year,month,day){return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;}
function isWeekend(year,month,day){const d=new Date(year,month,day).getDay();return d===0||d===6;}
function formatDate(dateStr){const[y,m,d]=dateStr.split("-");return `${d}/${m}/${y}`;}
function getInitials(name){return name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginPage({onLogin,users}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [showPwd,setShowPwd]=useState(false);

  async function handleLogin(){
    setLoading(true);
    try{
      const res=await fetch(`${API}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim().toLowerCase(),password})});
      const data=await res.json();
      if(data.accessToken){
        const user=users.find(u=>u.email===email.trim().toLowerCase());
        onLogin({...user,token:data.accessToken});
      }else{
        setError("Email ou mot de passe incorrect.");
      }
    }catch{setError("Erreur de connexion au serveur.");}
    setLoading(false);
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1d27 0%,#16213e 50%,#0f3460 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:420,padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:48,marginBottom:12}}>📅</div>
          <h1 style={{color:"#fff",fontSize:28,fontWeight:800,margin:0}}>PlanniPro</h1>
          <p style={{color:"#9ca3af",fontSize:14,margin:"8px 0 0"}}>Gestion des présences et congés</p>
        </div>
        <div style={{background:"#fff",borderRadius:20,padding:36,boxShadow:"0 25px 60px rgba(0,0,0,0.4)"}}>
          <h2 style={{margin:"0 0 24px",fontSize:20,fontWeight:700,color:"#111827"}}>Connexion</h2>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Adresse email</label>
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="prenom@entreprise.fr"
              style={{width:"100%",padding:"12px 16px",borderRadius:10,border:error?"2px solid #ef4444":"1.5px solid #d1d5db",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
          </div>
          <div style={{marginBottom:8}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <input type={showPwd?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••"
                style={{width:"100%",padding:"12px 44px 12px 16px",borderRadius:10,border:error?"2px solid #ef4444":"1.5px solid #d1d5db",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              <button onClick={()=>setShowPwd(!showPwd)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9ca3af"}}>{showPwd?"🙈":"👁"}</button>
            </div>
          </div>
          {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#dc2626"}}>⚠️ {error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16,opacity:loading?0.7:1}}>
            {loading?"Connexion...":"Se connecter →"}
          </button>
        </div>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:16,padding:20,marginTop:20}}>
          <div style={{fontSize:12,color:"#9ca3af",marginBottom:14,textAlign:"center",textTransform:"uppercase",letterSpacing:1}}>Comptes de démonstration</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {users.slice(0,4).map(u=>(
              <button key={u.id} onClick={()=>{setEmail(u.email);setPassword(u.password);setError("");}}
                style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"10px 12px",cursor:"pointer",textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`hsl(${(u.id*47)%360},60%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,flexShrink:0}}>{u.avatar}</div>
                  <div>
                    <div style={{color:"#fff",fontSize:11,fontWeight:600}}>{u.name.split(" ")[0]}</div>
                    <div style={{color:u.role==="admin"?"#f59e0b":u.role==="manager"?"#818cf8":"#9ca3af",fontSize:10}}>{u.role==="admin"?"👑 Admin":u.role==="manager"?"👑 Manager":"Agent"}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PANNEAU ADMIN COMPLET
// ─────────────────────────────────────────────
function AdminPanel({agents,teams,leaveTypes,onAgentAdded,onAgentUpdated,onAgentDeleted,onTeamAdded,onTeamDeleted,onLeaveTypeAdded,onLeaveTypeUpdated,onLeaveTypeDeleted,showNotif}){
  const [tab,setTab]=useState("agents");
  const [addAgentModal,setAddAgentModal]=useState(false);
  const [editAgentModal,setEditAgentModal]=useState(null);
  const [deleteModal,setDeleteModal]=useState(null);
  const [newAgent,setNewAgent]=useState({first_name:"",last_name:"",email:"",password:"",role:"agent",team:""});
  const [editData,setEditData]=useState({});
  const [newTeam,setNewTeam]=useState("");
  const [newLT,setNewLT]=useState({label:"",color:COLORS[0]});
  const [editLT,setEditLT]=useState(null);
  const [loading,setLoading]=useState(false);

  async function handleAddAgent(){
    if(!newAgent.first_name||!newAgent.email||!newAgent.password)return;
    setLoading(true);
    try{
      const res=await fetch(`${API}/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newAgent)});
      const data=await res.json();
      if(data.agent){
        onAgentAdded({id:Date.now(),name:`${newAgent.first_name} ${newAgent.last_name}`,email:newAgent.email,password:newAgent.password,role:newAgent.role,team:newAgent.team,avatar:getInitials(`${newAgent.first_name} ${newAgent.last_name}`)});
        setAddAgentModal(false);
        setNewAgent({first_name:"",last_name:"",email:"",password:"",role:"agent",team:""});
        showNotif("Agent ajouté ✅");
      }else{
        showNotif(data.errors?.[0]?.msg||"Erreur lors de l'ajout","error");
      }
    }catch{showNotif("Erreur de connexion","error");}
    setLoading(false);
  }

  function handleSaveEdit(){
    onAgentUpdated(editAgentModal.id,editData);
    setEditAgentModal(null);
    showNotif("Agent modifié ✅");
  }

  const tabs=[{id:"agents",icon:"👥",label:"Agents"},({id:"teams",icon:"🏢",label:"Équipes"}),{id:"leavetypes",icon:"🏷",label:"Types de congés"}];

  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 18px",borderRadius:8,border:"none",background:tab===t.id?"#4f46e5":"#fff",color:tab===t.id?"#fff":"#6b7280",cursor:"pointer",fontSize:13,fontWeight:600,boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ONGLET AGENTS */}
      {tab==="agents"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontSize:14,color:"#6b7280"}}>{agents.length} agents</span>
            <button onClick={()=>setAddAgentModal(true)} style={{background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Ajouter</button>
          </div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"#f9fafb",borderBottom:"1px solid #e5e7eb"}}>
                  {["Agent","Email","Équipe","Rôle","Actions"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,color:"#6b7280",fontWeight:600}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {agents.map(agent=>(
                  <tr key={agent.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                    <td style={{padding:"10px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:`hsl(${(agent.id*47)%360},60%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700}}>{agent.avatar}</div>
                        <span style={{fontWeight:600,color:"#111827",fontSize:13}}>{agent.name}</span>
                      </div>
                    </td>
                    <td style={{padding:"10px 16px",fontSize:12,color:"#6b7280"}}>{agent.email}</td>
                    <td style={{padding:"10px 16px",fontSize:12,color:"#374151"}}>{agent.team}</td>
                    <td style={{padding:"10px 16px"}}>
                      <span style={{background:agent.role==="admin"?"#fef3c7":agent.role==="manager"?"#eef2ff":"#f0fdf4",color:agent.role==="admin"?"#92400e":agent.role==="manager"?"#4338ca":"#166534",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>
                        {agent.role==="admin"?"👑 Admin":agent.role==="manager"?"👑 Manager":"Agent"}
                      </span>
                    </td>
                    <td style={{padding:"10px 16px"}}>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>{setEditAgentModal(agent);setEditData({name:agent.name,email:agent.email,team:agent.team,role:agent.role,password:""});}} style={{background:"#f3f4f6",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#374151"}}>✏️ Modifier</button>
                        {agent.role!=="admin"&&<button onClick={()=>setDeleteModal(agent)} style={{background:"#fef2f2",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#dc2626"}}>🗑 Supprimer</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONGLET ÉQUIPES */}
      {tab==="teams"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <input value={newTeam} onChange={e=>setNewTeam(e.target.value)} placeholder="Nom de la nouvelle équipe..." onKeyDown={e=>e.key==="Enter"&&newTeam.trim()&&(onTeamAdded(newTeam.trim()),setNewTeam(""),showNotif("Équipe ajoutée ✅"))}
              style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,outline:"none"}}/>
            <button onClick={()=>{if(newTeam.trim()){onTeamAdded(newTeam.trim());setNewTeam("");showNotif("Équipe ajoutée ✅");}}} style={{background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Ajouter</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {teams.map(team=>(
              <div key={team} style={{background:"#fff",borderRadius:10,border:"1px solid #e5e7eb",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>🏢</span>
                  <div>
                    <div style={{fontWeight:600,color:"#111827",fontSize:14}}>{team}</div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>{agents.filter(a=>a.team===team).length} agents</div>
                  </div>
                </div>
                {team!=="Admin"&&<button onClick={()=>{onTeamDeleted(team);showNotif("Équipe supprimée","error");}} style={{background:"#fef2f2",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#dc2626",fontWeight:600}}>🗑</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONGLET TYPES DE CONGÉS */}
      {tab==="leavetypes"&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:20,marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#111827"}}>➕ Nouveau type de congé</h3>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input value={newLT.label} onChange={e=>setNewLT(prev=>({...prev,label:e.target.value}))} placeholder="Ex: Congé sans solde"
                style={{flex:1,minWidth:160,padding:"10px 14px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,outline:"none"}}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {COLORS.map(c=><button key={c} onClick={()=>setNewLT(prev=>({...prev,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:newLT.color===c?"3px solid #111827":"2px solid transparent",cursor:"pointer"}}/>)}
              </div>
              <button onClick={()=>{if(newLT.label.trim()){onLeaveTypeAdded({id:newLT.label.toLowerCase().replace(/\s+/g,"-"),label:newLT.label.trim(),color:newLT.color,bg:hexToLight(newLT.color)});setNewLT({label:"",color:COLORS[0]});showNotif("Type de congé ajouté ✅");}}} style={{background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>Ajouter</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
            {leaveTypes.map(lt=>(
              <div key={lt.id} style={{background:"#fff",borderRadius:10,border:`2px solid ${lt.color}20`,padding:16}}>
                {editLT===lt.id?(
                  <div>
                    <input defaultValue={lt.label} id={`edit-lt-${lt.id}`} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid #d1d5db",fontSize:13,boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
                    <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
                      {COLORS.map(c=><button key={c} onClick={()=>{}} style={{width:20,height:20,borderRadius:"50%",background:c,border:"1px solid #ddd",cursor:"pointer"}}/>)}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{const val=document.getElementById(`edit-lt-${lt.id}`).value;if(val.trim()){onLeaveTypeUpdated(lt.id,{label:val.trim()});setEditLT(null);showNotif("Modifié ✅");}}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"#4f46e5",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>Enregistrer</button>
                      <button onClick={()=>setEditLT(null)} style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:12}}>Annuler</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:14,height:14,borderRadius:3,background:lt.color,flexShrink:0}}/>
                      <span style={{fontWeight:600,color:"#111827",fontSize:14}}>{lt.label}</span>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>setEditLT(lt.id)} style={{background:"#f3f4f6",border:"none",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:11}}>✏️</button>
                      <button onClick={()=>{onLeaveTypeDeleted(lt.id);showNotif("Type supprimé","error");}} style={{background:"#fef2f2",border:"none",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#dc2626"}}>🗑</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal ajouter agent */}
      {addAgentModal&&<Modal title="➕ Ajouter un agent" onClose={()=>setAddAgentModal(false)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <Field label="Prénom" value={newAgent.first_name} onChange={v=>setNewAgent(p=>({...p,first_name:v}))} placeholder="Jean"/>
          <Field label="Nom" value={newAgent.last_name} onChange={v=>setNewAgent(p=>({...p,last_name:v}))} placeholder="Dupont"/>
        </div>
        <Field label="Email" value={newAgent.email} onChange={v=>setNewAgent(p=>({...p,email:v}))} placeholder="jean@entreprise.fr" style={{marginBottom:12}}/>
        <Field label="Mot de passe (min 8 caractères)" value={newAgent.password} onChange={v=>setNewAgent(p=>({...p,password:v}))} placeholder="motdepasse123" style={{marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Équipe</label>
            <select value={newAgent.team} onChange={e=>setNewAgent(p=>({...p,team:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,outline:"none"}}>
              <option value="">-- Choisir --</option>
              {DEFAULT_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Rôle</label>
            <select value={newAgent.role} onChange={e=>setNewAgent(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,outline:"none"}}>
              <option value="agent">Agent</option>
              <option value="manager">Manager 👑</option>
            </select>
          </div>
        </div>
        <ModalButtons onCancel={()=>setAddAgentModal(false)} onConfirm={handleAddAgent} confirmLabel={loading?"En cours...":"Ajouter"} confirmColor="#4f46e5" disabled={loading}/>
      </Modal>}

      {/* Modal modifier agent */}
      {editAgentModal&&<Modal title={`✏️ Modifier — ${editAgentModal.name}`} onClose={()=>setEditAgentModal(null)}>
        <Field label="Nom complet" value={editData.name} onChange={v=>setEditData(p=>({...p,name:v}))} style={{marginBottom:12}}/>
        <Field label="Email" value={editData.email} onChange={v=>setEditData(p=>({...p,email:v}))} style={{marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Équipe</label>
            <input value={editData.team} onChange={e=>setEditData(p=>({...p,team:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>Rôle</label>
            <select value={editData.role} onChange={e=>setEditData(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,outline:"none"}}>
              <option value="agent">Agent</option>
              <option value="manager">Manager 👑</option>
            </select>
          </div>
        </div>
        <Field label="Nouveau mot de passe (laisser vide pour ne pas changer)" value={editData.password} onChange={v=>setEditData(p=>({...p,password:v}))} placeholder="••••••••" style={{marginBottom:20}}/>
        <ModalButtons onCancel={()=>setEditAgentModal(null)} onConfirm={handleSaveEdit} confirmLabel="Enregistrer" confirmColor="#4f46e5"/>
      </Modal>}

      {/* Modal supprimer */}
      {deleteModal&&<Modal title="🗑 Supprimer l'agent" onClose={()=>setDeleteModal(null)}>
        <p style={{color:"#6b7280",fontSize:14,margin:"0 0 20px"}}>Êtes-vous sûr de vouloir supprimer <strong>{deleteModal.name}</strong> ? Cette action est irréversible.</p>
        <ModalButtons onCancel={()=>setDeleteModal(null)} onConfirm={()=>{onAgentDeleted(deleteModal.id);setDeleteModal(null);showNotif("Agent supprimé","error");}} confirmLabel="Supprimer" confirmColor="#ef4444"/>
      </Modal>}
    </div>
  );
}

function Field({label,value,onChange,placeholder,type="text",style={}}){
  return(
    <div style={style}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,boxSizing:"border-box",outline:"none"}}/>
    </div>
  );
}
function Modal({title,children,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#fff",borderRadius:16,padding:32,width:480,maxWidth:"95vw",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto"}}>
        <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:700}}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
function ModalButtons({onCancel,onConfirm,confirmLabel,confirmColor,disabled}){
  return(
    <div style={{display:"flex",gap:10}}>
      <button onClick={onCancel} style={{flex:1,padding:10,borderRadius:8,border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:14}}>Annuler</button>
      <button onClick={onConfirm} disabled={disabled} style={{flex:1,padding:10,borderRadius:8,border:"none",background:confirmColor||"#4f46e5",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600,opacity:disabled?0.7:1}}>{confirmLabel}</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP PRINCIPALE
// ─────────────────────────────────────────────
function PlanningApp({currentUser,onLogout}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [agents,setAgents]=useState(DEFAULT_USERS);
  const [teams,setTeams]=useState(DEFAULT_TEAMS);
  const [leaveTypes,setLeaveTypes]=useState(DEFAULT_LEAVE_TYPES);
  const [leaves,setLeaves]=useState({});
  const [requests,setRequests]=useState([]);
  const [view,setView]=useState("planning");
  const [filterTeam,setFilterTeam]=useState("Tous");
  const [selectedLeaveType,setSelectedLeaveType]=useState("cp");
  const [selectionStart,setSelectionStart]=useState(null);
  const [hoveredDay,setHoveredDay]=useState(null);
  const [selectedAgent,setSelectedAgent]=useState(null);
  const [requestModal,setRequestModal]=useState(null);
  const [requestReason,setRequestReason]=useState("");
  const [rejectModal,setRejectModal]=useState(null);
  const [rejectComment,setRejectComment]=useState("");
  const [notification,setNotification]=useState(null);

  const daysInMonth=getDaysInMonth(year,month);
  const firstDay=getFirstDayOfMonth(year,month);
  const allTeams=["Tous",...teams.filter(t=>t!=="Admin")];
  const filteredAgents=(filterTeam==="Tous"?agents:agents.filter(a=>a.team===filterTeam)).filter(a=>a.role!=="admin");
  const pendingRequests=requests.filter(r=>r.status==="pending");
  const isManager=currentUser.role==="manager"||currentUser.role==="admin";
  const isAdmin=currentUser.role==="admin";
  const myRequests=requests.filter(r=>r.agentId===currentUser.id);
  const todayDay=now.getFullYear()===year&&now.getMonth()===month?now.getDate():null;

  function showNotif(msg,type="success"){setNotification({msg,type});setTimeout(()=>setNotification(null),3500);}
  function getLeave(agentId,day){return leaves[agentId]?.[dateKey(year,month,day)];}

  function handleCellClick(agentId,day){
    if(isWeekend(year,month,day))return;
    if(!isManager&&currentUser.id!==agentId)return;
    if(!selectedAgent||selectedAgent!==agentId){setSelectedAgent(agentId);setSelectionStart(day);}
    else{
      const start=Math.min(selectionStart,day),end=Math.max(selectionStart,day);
      if(isManager){applyLeave(agentId,start,end,selectedLeaveType,"approved");showNotif("Congé appliqué ✅");}
      else{setRequestModal({agentId,start:dateKey(year,month,start),end:dateKey(year,month,end)});setRequestReason("");}
      setSelectionStart(null);setSelectedAgent(null);
    }
  }

  function applyLeave(agentId,startDay,endDay,typeId,status){
    const type=leaveTypes.find(t=>t.id===typeId);
    setLeaves(prev=>{
      const al={...(prev[agentId]||{})};
      for(let d=startDay;d<=endDay;d++){if(!isWeekend(year,month,d))al[dateKey(year,month,d)]={...type,status};}
      return{...prev,[agentId]:al};
    });
  }

  function submitRequest(){
    if(!requestModal)return;
    const{agentId,start,end}=requestModal;
    const agent=agents.find(a=>a.id===agentId);
    const type=leaveTypes.find(t=>t.id===selectedLeaveType);
    setRequests(prev=>[...prev,{id:Date.now(),agentId,agentName:agent.name,agentAvatar:agent.avatar,agentTeam:agent.team,leaveType:type,start,end,reason:requestReason,status:"pending",createdAt:new Date().toISOString()}]);
    setRequestModal(null);showNotif("Demande envoyée au manager !");
  }

  function approveRequest(reqId){
    const req=requests.find(r=>r.id===reqId);
    if(req){
      setRequests(prev=>prev.map(r=>r.id===reqId?{...r,status:"approved"}:r));
      setLeaves(prev=>{
        const al={...(prev[req.agentId]||{})};
        const[sy,sm,sd]=req.start.split("-").map(Number),[ey,em,ed]=req.end.split("-").map(Number);
        for(let d=new Date(sy,sm-1,sd);d<=new Date(ey,em-1,ed);d.setDate(d.getDate()+1)){
          if(d.getDay()!==0&&d.getDay()!==6)al[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`]={...req.leaveType,status:"approved"};
        }
        return{...prev,[req.agentId]:al};
      });
      showNotif("Demande approuvée ✅");
    }
  }

  function isInSelection(agentId,day){
    if(selectedAgent!==agentId||selectionStart===null||hoveredDay===null)return false;
    return day>=Math.min(selectionStart,hoveredDay)&&day<=Math.max(selectionStart,hoveredDay);
  }

  const navItems=[
    {id:"planning",icon:"🗓",label:"Planning"},
    {id:"validations",icon:"✅",label:"Validations",badge:isManager?pendingRequests.length:myRequests.filter(r=>r.status==="pending").length},
    {id:"stats",icon:"📊",label:"Statistiques"},
    ...(isAdmin?[{id:"admin",icon:"⚙️",label:"Administration"}]:[]),
  ];

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",minHeight:"100vh",background:"#f0f2f7",display:"flex"}}>
      {notification&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:notification.type==="error"?"#ef4444":"#10b981",color:"white",padding:"12px 20px",borderRadius:12,fontWeight:600,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>{notification.msg}</div>}

      <aside style={{width:220,background:"#1a1d27",color:"#fff",display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0}}>
        <div style={{padding:"0 20px 20px",borderBottom:"1px solid #2d3148"}}>
          <div style={{fontSize:20,fontWeight:700}}>📅 PlanniPro</div>
          <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Gestion des présences</div>
        </div>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #2d3148"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`hsl(${(currentUser.id*47)%360},60%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,flexShrink:0}}>{currentUser.avatar}</div>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.name}</div>
              <div style={{fontSize:10,color:currentUser.role==="admin"?"#f59e0b":currentUser.role==="manager"?"#818cf8":"#9ca3af"}}>
                {currentUser.role==="admin"?"👑 Admin":currentUser.role==="manager"?"👑 Manager":"👤 Agent"} · {currentUser.team}
              </div>
            </div>
          </div>
          <button onClick={onLogout} style={{width:"100%",marginTop:10,padding:"6px 0",borderRadius:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"#9ca3af",fontSize:11,cursor:"pointer",fontWeight:600}}>🚪 Déconnexion</button>
        </div>
        <nav style={{padding:"16px 0",flex:1}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 20px",border:"none",background:view===item.id?"#2d3148":"transparent",color:view===item.id?"#818cf8":"#9ca3af",cursor:"pointer",fontSize:14,fontWeight:view===item.id?600:400,borderLeft:view===item.id?"3px solid #818cf8":"3px solid transparent"}}>
              <span>{item.icon}</span><span style={{flex:1}}>{item.label}</span>
              {item.badge>0&&<span style={{background:"#e94560",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700}}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"16px 20px",borderTop:"1px solid #2d3148"}}>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Légende</div>
          {leaveTypes.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
              <div style={{width:10,height:10,borderRadius:2,background:t.color}}/><span style={{fontSize:11,color:"#9ca3af"}}>{t.label}</span>
            </div>
          ))}
        </div>
      </aside>

      <main style={{flex:1,overflow:"auto"}}>
        <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"16px 28px",display:"flex",alignItems:"center"}}>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:700,color:"#111827"}}>
              {view==="planning"?"Planning mensuel":view==="validations"?"Demandes de congés":view==="stats"?"Statistiques":"Administration"}
            </h1>
            <p style={{margin:"2px 0 0",fontSize:13,color:"#6b7280"}}>
              {view==="planning"?`${MONTHS_FR[month]} ${year}`:view==="validations"?(isManager?`${pendingRequests.length} demande(s) en attente`:`${myRequests.length} demande(s)`):view==="admin"?`${agents.length} agents · ${teams.length} équipes`:""}
            </p>
          </div>
        </div>

        {view==="admin"&&isAdmin&&(
          <AdminPanel
            agents={agents} teams={teams} leaveTypes={leaveTypes}
            showNotif={showNotif}
            onAgentAdded={a=>setAgents(prev=>[...prev,a])}
            onAgentUpdated={(id,data)=>setAgents(prev=>prev.map(a=>a.id===id?{...a,...data,avatar:data.name?getInitials(data.name):a.avatar}:a))}
            onAgentDeleted={id=>setAgents(prev=>prev.filter(a=>a.id!==id))}
            onTeamAdded={t=>setTeams(prev=>[...prev,t])}
            onTeamDeleted={t=>setTeams(prev=>prev.filter(x=>x!==t))}
            onLeaveTypeAdded={lt=>setLeaveTypes(prev=>[...prev,lt])}
            onLeaveTypeUpdated={(id,data)=>setLeaveTypes(prev=>prev.map(lt=>lt.id===id?{...lt,...data}:lt))}
            onLeaveTypeDeleted={id=>setLeaveTypes(prev=>prev.filter(lt=>lt.id!==id))}
          />
        )}

        {view==="planning"&&(
          <div style={{padding:24}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:16}}>‹</button>
              <span style={{fontWeight:700,fontSize:18,color:"#111827",minWidth:160,textAlign:"center"}}>{MONTHS_FR[month]} {year}</span>
              <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:16}}>›</button>
              <button onClick={()=>{setYear(now.getFullYear());setMonth(now.getMonth());}} style={{background:"#f3f4f6",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:"#4b5563",fontWeight:600}}>Aujourd'hui</button>
              <div style={{marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap"}}>
                {allTeams.map(t=><button key={t} onClick={()=>setFilterTeam(t)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",fontWeight:500,background:filterTeam===t?"#4f46e5":"#fff",color:filterTeam===t?"#fff":"#6b7280",borderColor:filterTeam===t?"#4f46e5":"#e5e7eb"}}>{t}</button>)}
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {leaveTypes.map(t=><button key={t.id} onClick={()=>setSelectedLeaveType(t.id)} style={{padding:"5px 12px",borderRadius:20,border:"2px solid",fontSize:12,cursor:"pointer",fontWeight:600,background:selectedLeaveType===t.id?t.color:t.bg,color:selectedLeaveType===t.id?"#fff":t.color,borderColor:t.color}}>{t.label}</button>)}
            </div>
            <div style={{fontSize:12,color:"#92400e",marginBottom:12,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"8px 14px"}}>
              {isManager?"👑 Manager : cliquez pour sélectionner une plage (1er clic = début, 2ème clic = fin).":"👤 Sélectionnez une plage de dates pour envoyer une demande au manager."}
            </div>
            <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <colgroup><col style={{width:160}}/>{Array.from({length:daysInMonth},(_,i)=><col key={i}/>)}</colgroup>
                <thead>
                  <tr>
                    <th style={{padding:"12px 16px",textAlign:"left",fontSize:11,color:"#9ca3af",fontWeight:600,borderBottom:"1px solid #e5e7eb",background:"#f9fafb"}}>AGENT</th>
                    {Array.from({length:daysInMonth},(_,i)=>{
                      const day=i+1,wk=isWeekend(year,month,day),isToday=todayDay===day;
                      return<th key={i} style={{padding:"4px 2px",textAlign:"center",fontSize:10,fontWeight:600,background:isToday?"#eef2ff":"#f9fafb",color:isToday?"#4f46e5":wk?"#d1d5db":"#6b7280",borderBottom:"1px solid #e5e7eb",borderLeft:"1px solid #f3f4f6"}}>
                        <div>{DAYS_FR[(i+firstDay)%7].slice(0,1)}</div>
                        <div style={{fontSize:11,fontWeight:700,color:isToday?"#4f46e5":wk?"#d1d5db":"#374151"}}>{day}</div>
                      </th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map(agent=>(
                    <tr key={agent.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                      <td style={{padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:`hsl(${(agent.id*47)%360},60%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{agent.avatar}</div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:agent.id===currentUser.id?"#4f46e5":"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>{agent.name.split(" ")[0]} {agent.role==="manager"?"👑":""}</div>
                          <div style={{fontSize:10,color:"#9ca3af"}}>{agent.team}</div>
                        </div>
                      </td>
                      {Array.from({length:daysInMonth},(_,i)=>{
                        const day=i+1,wk=isWeekend(year,month,day),leave=getLeave(agent.id,day),inSel=isInSelection(agent.id,day),isToday=todayDay===day,canInteract=isManager||currentUser.id===agent.id;
                        return<td key={i} onClick={()=>canInteract&&handleCellClick(agent.id,day)} onMouseEnter={()=>{if(selectedAgent===agent.id)setHoveredDay(day);}} onMouseLeave={()=>setHoveredDay(null)}
                          style={{padding:"3px 2px",textAlign:"center",cursor:wk||!canInteract?"default":"pointer",background:wk?"#f9fafb":inSel?"#c7d2fe":leave?leave.bg:isToday?"#fafafa":"#fff",borderLeft:"1px solid #f3f4f6"}}>
                          {leave&&!wk&&<div style={{width:"100%",height:22,background:leave.color,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",opacity:leave.status==="pending"?0.4:1}}>
                            <span style={{fontSize:9,color:"#fff",fontWeight:700}}>{leave.status==="pending"?"?":leave.label.slice(0,3).toUpperCase()}</span>
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

        {view==="validations"&&(
          <div style={{padding:24}}>
            {isManager?(
              <>
                {pendingRequests.length===0&&requests.length===0&&<div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:40,textAlign:"center",color:"#9ca3af"}}><div style={{fontSize:"3rem"}}>🎉</div><div style={{fontSize:16,fontWeight:600,marginTop:12}}>Aucune demande en attente</div></div>}
                {pendingRequests.length>0&&<><h3 style={{fontSize:15,fontWeight:700,marginBottom:16}}>🕐 En attente ({pendingRequests.length})</h3>{pendingRequests.map(req=><RequestCard key={req.id} req={req} isManager onApprove={()=>approveRequest(req.id)} onReject={()=>{setRejectModal(req.id);setRejectComment("");}}/>)}</>}
                {requests.filter(r=>r.status!=="pending").length>0&&<><h3 style={{fontSize:15,fontWeight:700,margin:"24px 0 16px"}}>📋 Historique</h3>{requests.filter(r=>r.status!=="pending").map(req=><RequestCard key={req.id} req={req} isManager/>)}</>}
              </>
            ):(
              <>
                <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:12,padding:16,marginBottom:24,fontSize:13,color:"#4338ca"}}>💡 Sélectionnez des dates dans le planning pour envoyer une demande.</div>
                {myRequests.length===0&&<div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:40,textAlign:"center",color:"#9ca3af"}}><div style={{fontSize:"3rem"}}>📝</div><div style={{fontSize:16,fontWeight:600,marginTop:12}}>Aucune demande</div></div>}
                {myRequests.map(req=><RequestCard key={req.id} req={req}/>)}
              </>
            )}
          </div>
        )}

        {view==="stats"&&(
          <div style={{padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
              {leaveTypes.map(t=>{
                let count=0;agents.forEach(a=>{Object.values(leaves[a.id]||{}).forEach(l=>{if(l.id===t.id)count++;});});
                return<div key={t.id} style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><div style={{width:12,height:12,borderRadius:3,background:t.color}}/><span style={{fontSize:13,color:"#6b7280"}}>{t.label}</span></div>
                  <div style={{fontSize:36,fontWeight:800,color:t.color}}>{count}</div>
                  <div style={{fontSize:12,color:"#9ca3af"}}>jours au total</div>
                </div>;
              })}
            </div>
          </div>
        )}
      </main>

      {requestModal&&<Modal title="📝 Demande de congé" onClose={()=>setRequestModal(null)}>
        <p style={{color:"#6b7280",fontSize:13,margin:"0 0 16px"}}>Du <strong>{formatDate(requestModal.start)}</strong> au <strong>{formatDate(requestModal.end)}</strong></p>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Type de congé</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{leaveTypes.map(t=><button key={t.id} onClick={()=>setSelectedLeaveType(t.id)} style={{padding:"6px 12px",borderRadius:20,border:"2px solid",fontSize:12,cursor:"pointer",fontWeight:600,background:selectedLeaveType===t.id?t.color:t.bg,color:selectedLeaveType===t.id?"#fff":t.color,borderColor:t.color}}>{t.label}</button>)}</div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>Motif (optionnel)</label>
          <textarea value={requestReason} onChange={e=>setRequestReason(e.target.value)} rows={3} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,boxSizing:"border-box",resize:"none",outline:"none"}}/>
        </div>
        <ModalButtons onCancel={()=>setRequestModal(null)} onConfirm={submitRequest} confirmLabel="Envoyer" confirmColor="#4f46e5"/>
      </Modal>}

      {rejectModal&&<Modal title="❌ Refuser la demande" onClose={()=>setRejectModal(null)}>
        <textarea value={rejectComment} onChange={e=>setRejectComment(e.target.value)} placeholder="Motif du refus obligatoire..." rows={3} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,boxSizing:"border-box",resize:"none",outline:"none",marginBottom:20}}/>
        <ModalButtons onCancel={()=>setRejectModal(null)} onConfirm={()=>{setRequests(prev=>prev.map(r=>r.id===rejectModal?{...r,status:"rejected",comment:rejectComment}:r));setRejectModal(null);showNotif("Demande refusée","error");}} confirmLabel="Confirmer" confirmColor={rejectComment.trim()?"#ef4444":"#fca5a5"} disabled={!rejectComment.trim()}/>
      </Modal>}
    </div>
  );
}

function RequestCard({req,isManager,onApprove,onReject}){
  const s={pending:{label:"En attente",bg:"#fef3c7",color:"#92400e",icon:"🕐"},approved:{label:"Approuvée",bg:"#d1fae5",color:"#065f46",icon:"✅"},rejected:{label:"Refusée",bg:"#fee2e2",color:"#991b1b",icon:"❌"}}[req.status];
  return(
    <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:20,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:`hsl(${(req.agentId*47)%360},60%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{req.agentAvatar}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#111827"}}>{req.agentName}</div><div style={{fontSize:12,color:"#6b7280"}}>{req.agentTeam}</div></div>
        <div style={{background:s.bg,color:s.color,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600}}>{s.icon} {s.label}</div>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:req.reason?10:0}}>
        <div style={{background:"#f9fafb",borderRadius:8,padding:"8px 14px"}}><div style={{fontSize:10,color:"#9ca3af",marginBottom:2}}>PÉRIODE</div><div style={{fontSize:13,fontWeight:600,color:"#374151"}}>{req.start===req.end?formatDate(req.start):`${formatDate(req.start)} → ${formatDate(req.end)}`}</div></div>
        <div style={{background:req.leaveType.bg,borderRadius:8,padding:"8px 14px"}}><div style={{fontSize:10,color:"#9ca3af",marginBottom:2}}>TYPE</div><div style={{fontSize:13,fontWeight:600,color:req.leaveType.color}}>{req.leaveType.label}</div></div>
      </div>
      {req.reason&&<div style={{fontSize:12,color:"#6b7280",background:"#f9fafb",padding:"8px 12px",borderRadius:8,marginBottom:10}}>💬 {req.reason}</div>}
      {req.comment&&<div style={{fontSize:12,color:"#991b1b",background:"#fee2e2",padding:"8px 12px",borderRadius:8,marginBottom:10}}>❌ {req.comment}</div>}
      {isManager&&req.status==="pending"&&<div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={onApprove} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:"#10b981",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>✅ Approuver</button>
        <button onClick={onReject} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>❌ Refuser</button>
      </div>}
    </div>
  );
}

export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [users]=useState(DEFAULT_USERS);
  if(!currentUser)return<LoginPage onLogin={setCurrentUser} users={users}/>;
  return<PlanningApp currentUser={currentUser} onLogout={()=>setCurrentUser(null)}/>;
}
