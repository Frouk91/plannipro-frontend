import { useState, useEffect } from "react";

const API = "https://plannipro-backend-production.up.railway.app/api";
const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const COLORS = ["#818cf8","#38bdf8","#fb923c","#34d399","#a78bfa","#f87171","#f472b6","#2dd4bf","#fb923c","#a3e635"];
const AGENT_ALLOWED_CODES = ["cp","_cp","rtt","_rtt","teletravail"];

const DEMO_USERS = [
  { email: "redouane@entreprise.fr", password: "admin1234" },
  { email: "sophie@entreprise.fr", password: "sophie123" },
  { email: "lucas@entreprise.fr", password: "lucas123" },
  { email: "emma@entreprise.fr", password: "emma1234" },
];

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');`;

const GLOBAL_STYLE = `
  ${FONTS}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07070f; font-family: 'Outfit', sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0d0d1a; }
  ::-webkit-scrollbar-thumb { background: #2d2d4e; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #4c4c7f; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); } 50% { box-shadow: 0 0 40px rgba(124,58,237,0.6); } }
  @keyframes slideIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
  .cell-hover:hover { background: rgba(124,58,237,0.08) !important; transition: background 0.15s ease; }
  .btn-glow:hover { box-shadow: 0 0 20px rgba(124,58,237,0.4); transform: translateY(-1px); transition: all 0.2s ease; }
  .nav-item { transition: all 0.2s ease; }
  .nav-item:hover { background: rgba(255,255,255,0.05) !important; }
  .card-hover { transition: all 0.2s ease; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
`;

function hexToLight(hex) {
  try { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},0.15)`; }
  catch { return "rgba(124,58,237,0.15)"; }
}
function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function getFirstDayOfMonth(y,m){let d=new Date(y,m,1).getDay();return d===0?6:d-1;}
function dateKey(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function isWeekend(y,m,d){const w=new Date(y,m,d).getDay();return w===0||w===6;}
function formatDate(s){if(!s)return "";const p=s.split("T")[0].split("-");return `${p[2]}/${p[1]}/${p[0]}`;}
function getInitials(name){return (name||"?").split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,2);}
function agentHue(id){return Math.abs((id||"").toString().split("").reduce((a,c)=>a+c.charCodeAt(0),0))%360;}
function addDays(dateStr,n){const d=new Date(dateStr);d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function compareDates(a,b){return a<b?-1:a>b?1:0;}

function leaveFromBackend(l){
  return {id:l.leave_type_code,code:l.leave_type_code,label:l.leave_type_label,color:l.color,bg:hexToLight(l.color)};
}
function requestFromBackend(l){
  return {
    id:l.id,agentId:l.agent_id,
    agentName:`${l.first_name||""} ${l.last_name||""}`.trim(),
    agentAvatar:l.avatar_initials||getInitials(`${l.first_name||""} ${l.last_name||""}`),
    agentTeam:l.team_name||"",leaveType:leaveFromBackend(l),
    start:(l.start_date||"").split("T")[0],end:(l.end_date||"").split("T")[0],
    reason:l.reason||"",status:l.status,createdAt:l.created_at
  };
}

async function apiFetch(path,token,options={}){
  const res=await fetch(`${API}${path}`,{
    ...options,
    headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}),...(options.headers||{})}
  });
  return res.json();
}

// ─── LOGIN ───
function LoginPage({onLogin}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [showPwd,setShowPwd]=useState(false);

  async function handleLogin(){
    setLoading(true);
    try{
      const data=await apiFetch("/auth/login",null,{method:"POST",body:JSON.stringify({email:email.trim().toLowerCase(),password})});
      if(data.accessToken){onLogin({...data.agent,token:data.accessToken});}
      else{setError("Email ou mot de passe incorrect.");}
    }catch{setError("Erreur de connexion au serveur.");}
    setLoading(false);
  }

  return(
    <div style={{minHeight:"100vh",background:"#07070f",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_STYLE}</style>
      {/* Orbs décoratifs */}
      <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)",top:-200,left:-200,pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)",bottom:-100,right:-100,pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:440,padding:"0 24px",animation:"fadeIn 0.6s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#7c3aed,#3b82f6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16,boxShadow:"0 0 40px rgba(124,58,237,0.4)"}}>📅</div>
          <h1 style={{color:"#fff",fontSize:30,fontWeight:800,margin:0,letterSpacing:"-0.5px"}}>PlanniPro</h1>
          <p style={{color:"#4b5563",fontSize:14,margin:"6px 0 0",fontWeight:400}}>Gestion des présences et congés</p>
        </div>

        {/* Card login */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:36,backdropFilter:"blur(20px)",boxShadow:"0 25px 60px rgba(0,0,0,0.5)"}}>
          <h2 style={{margin:"0 0 24px",fontSize:18,fontWeight:700,color:"#f9fafb"}}>Connexion</h2>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Email</label>
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="prenom@entreprise.fr"
              style={{width:"100%",padding:"12px 16px",borderRadius:10,border:error?"1.5px solid rgba(239,68,68,0.5)":"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:14,color:"#f9fafb",outline:"none",transition:"border 0.2s"}}/>
          </div>
          <div style={{marginBottom:8}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <input type={showPwd?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••"
                style={{width:"100%",padding:"12px 44px 12px 16px",borderRadius:10,border:error?"1.5px solid rgba(239,68,68,0.5)":"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:14,color:"#f9fafb",outline:"none"}}/>
              <button onClick={()=>setShowPwd(!showPwd)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#6b7280"}}>{showPwd?"🙈":"👁"}</button>
            </div>
          </div>
          {error&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#fca5a5"}}>⚠️ {error}</div>}
          <button onClick={handleLogin} disabled={loading} className="btn-glow"
            style={{width:"100%",padding:"13px 0",borderRadius:10,border:"none",background:loading?"rgba(124,58,237,0.5)":"linear-gradient(135deg,#7c3aed,#3b82f6)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16,letterSpacing:"0.3px"}}>
            {loading?"Connexion...":"Se connecter →"}
          </button>
        </div>

        {/* Comptes démo */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:20,marginTop:16}}>
          <div style={{fontSize:11,color:"#4b5563",marginBottom:12,textAlign:"center",textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Comptes demo</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {DEMO_USERS.map((u,i)=>(
              <button key={i} onClick={()=>{setEmail(u.email);setPassword(u.password);setError("");}}
                style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"8px 12px",cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}>
                <div style={{color:"#e2e8f0",fontSize:11,fontWeight:600}}>{u.email.split("@")[0]}</div>
                <div style={{color:"#4b5563",fontSize:10,marginTop:2}}>{u.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({title,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#12121e",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:32,width:480,maxWidth:"95vw",boxShadow:"0 25px 60px rgba(0,0,0,0.7)",maxHeight:"90vh",overflowY:"auto",animation:"slideIn 0.2s ease"}}>
        <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:700,color:"#f9fafb"}}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ModalButtons({onCancel,onConfirm,confirmLabel,confirmColor,disabled}){
  return(<div style={{display:"flex",gap:10}}>
    <button onClick={onCancel} style={{flex:1,padding:10,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",cursor:"pointer",fontSize:14,color:"#9ca3af",fontWeight:500}}>Annuler</button>
    <button onClick={onConfirm} disabled={disabled} style={{flex:1,padding:10,borderRadius:8,border:"none",background:confirmColor||"linear-gradient(135deg,#7c3aed,#3b82f6)",color:"#fff",cursor:disabled?"default":"pointer",fontSize:14,fontWeight:600,opacity:disabled?0.5:1}}>{confirmLabel}</button>
  </div>);
}

function Field({label,value,onChange,placeholder,style={}}){
  return(<div style={style}>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</label>}
    <input value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:14,color:"#f9fafb",outline:"none"}}/>
  </div>);
}

// ─── MENU CONTEXTUEL ───
function ContextMenu({x,y,leave,onDeleteDay,onDeleteAll,onClose}){
  const isMultiDay=leave.leaveStart!==leave.leaveEnd;
  return(
    <div onClick={e=>e.stopPropagation()}
      style={{position:"fixed",top:y,left:x,background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,0.6)",zIndex:99999,minWidth:240,overflow:"hidden",animation:"slideIn 0.15s ease"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:12,color:"#6b7280",fontWeight:600,background:"rgba(255,255,255,0.02)"}}>
        <span style={{display:"inline-block",width:10,height:10,borderRadius:3,background:leave.color,marginRight:8,boxShadow:`0 0 8px ${leave.color}`}}></span>
        {leave.label}
      </div>
      <button onClick={e=>{e.stopPropagation();onDeleteDay();}}
        style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 16px",border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#fbbf24",fontWeight:500,transition:"background 0.15s"}}>
        ✂️ Supprimer ce jour seulement
      </button>
      {isMultiDay&&(
        <button onClick={e=>{e.stopPropagation();onDeleteAll();}}
          style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 16px",border:"none",borderTop:"1px solid rgba(255,255,255,0.05)",background:"none",cursor:"pointer",fontSize:13,color:"#f87171",fontWeight:500}}>
          🗑 Supprimer toute la période
        </button>
      )}
      <button onClick={e=>{e.stopPropagation();onClose();}}
        style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 16px",border:"none",borderTop:"1px solid rgba(255,255,255,0.05)",background:"none",cursor:"pointer",fontSize:13,color:"#4b5563"}}>
        ✕ Annuler
      </button>
    </div>
  );
}

// ─── ADMIN ───
function AdminPanel({agents,teams,leaveTypes,token,onAgentAdded,onAgentUpdated,onAgentDeleted,onTeamAdded,onTeamDeleted,onLeaveTypeAdded,onLeaveTypeUpdated,onLeaveTypeDeleted,showNotif}){
  const [tab,setTab]=useState("agents");
  const [addModal,setAddModal]=useState(false);
  const [editModal,setEditModal]=useState(null);
  const [deleteModal,setDeleteModal]=useState(null);
  const [editLT,setEditLT]=useState(null);
  const [newAgent,setNewAgent]=useState({first_name:"",last_name:"",email:"",password:"",role:"agent",team:""});
  const [editData,setEditData]=useState({});
  const [newTeam,setNewTeam]=useState("");
  const [newLT,setNewLT]=useState({label:"",color:COLORS[0]});
  const [loading,setLoading]=useState(false);

  async function handleAddAgent(){
    if(!newAgent.first_name||!newAgent.email||!newAgent.password)return;
    setLoading(true);
    try{
      const data=await apiFetch("/auth/register",token,{method:"POST",body:JSON.stringify(newAgent)});
      if(data.agent){
        onAgentAdded({id:data.agent.id,name:`${newAgent.first_name} ${newAgent.last_name}`,email:newAgent.email,role:newAgent.role,team:newAgent.team,avatar:getInitials(`${newAgent.first_name} ${newAgent.last_name}`)});
        setAddModal(false);setNewAgent({first_name:"",last_name:"",email:"",password:"",role:"agent",team:""});
        showNotif("Agent ajouté ✅");
      }else{showNotif(data.errors?.[0]?.msg||"Erreur","error");}
    }catch{showNotif("Erreur","error");}
    setLoading(false);
  }

  async function handleAddTeam(){
    if(!newTeam.trim())return;
    try{const data=await apiFetch("/teams",token,{method:"POST",body:JSON.stringify({name:newTeam.trim()})});
    if(data.id){onTeamAdded(data);setNewTeam("");showNotif("Équipe ajoutée ✅");}}
    catch{showNotif("Erreur","error");}
  }

  async function handleDeleteTeam(team){
    try{await apiFetch(`/teams/${team.id}`,token,{method:"DELETE"});onTeamDeleted(team.id);showNotif("Équipe supprimée","error");}
    catch{showNotif("Erreur","error");}
  }

  async function handleAddLT(){
    if(!newLT.label.trim())return;
    try{const data=await apiFetch("/leave-types",token,{method:"POST",body:JSON.stringify({label:newLT.label.trim(),color:newLT.color})});
    if(data.id){onLeaveTypeAdded({...data,bg:hexToLight(data.color)});setNewLT({label:"",color:COLORS[0]});showNotif("Type ajouté ✅");}}
    catch{showNotif("Erreur","error");}
  }

  async function handleUpdateLT(lt,newLabel){
    try{await apiFetch(`/leave-types/${lt.id}`,token,{method:"PATCH",body:JSON.stringify({label:newLabel})});onLeaveTypeUpdated(lt.id,{label:newLabel});setEditLT(null);showNotif("Modifié ✅");}
    catch{showNotif("Erreur","error");}
  }

  async function handleDeleteLT(lt){
    try{await apiFetch(`/leave-types/${lt.id}`,token,{method:"DELETE"});onLeaveTypeDeleted(lt.id);showNotif("Type supprimé","error");}
    catch{showNotif("Erreur","error");}
  }

  const tabStyle=(id)=>({padding:"8px 16px",borderRadius:8,border:"none",background:tab===id?"rgba(124,58,237,0.2)":"transparent",color:tab===id?"#a78bfa":"#4b5563",cursor:"pointer",fontSize:13,fontWeight:600,border:tab===id?"1px solid rgba(124,58,237,0.3)":"1px solid transparent",transition:"all 0.2s"});

  return(
    <div style={{padding:24,animation:"fadeIn 0.4s ease"}}>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[{id:"agents",icon:"👥",label:"Agents"},{id:"teams",icon:"🏢",label:"Équipes"},{id:"leavetypes",icon:"🏷",label:"Types de congés"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={tabStyle(t.id)}>{t.icon} {t.label}</button>
        ))}
      </div>

      {tab==="agents"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontSize:13,color:"#4b5563"}}>{agents.length} agents</span>
            <button onClick={()=>setAddModal(true)} className="btn-glow" style={{background:"linear-gradient(135deg,#7c3aed,#3b82f6)",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Ajouter</button>
          </div>
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                {["Agent","Email","Équipe","Rôle","Actions"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,color:"#4b5563",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {agents.map(a=>(
                  <tr key={a.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <td style={{padding:"12px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,hsl(${agentHue(a.id)},60%,40%),hsl(${agentHue(a.id)+40},70%,55%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700,boxShadow:`0 0 12px hsla(${agentHue(a.id)},60%,50%,0.3)`}}>{a.avatar}</div>
                        <span style={{fontWeight:600,fontSize:13,color:"#e2e8f0"}}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 16px",fontSize:12,color:"#4b5563"}}>{a.email}</td>
                    <td style={{padding:"12px 16px",fontSize:12,color:"#6b7280"}}>{a.team||"—"}</td>
                    <td style={{padding:"12px 16px"}}>
                      <span style={{background:a.role==="admin"?"rgba(251,191,36,0.15)":a.role==="manager"?"rgba(124,58,237,0.15)":"rgba(52,211,153,0.15)",color:a.role==="admin"?"#fbbf24":a.role==="manager"?"#a78bfa":"#34d399",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,border:`1px solid ${a.role==="admin"?"rgba(251,191,36,0.2)":a.role==="manager"?"rgba(124,58,237,0.2)":"rgba(52,211,153,0.2)"}`}}>
                        {a.role==="admin"?"👑 Admin":a.role==="manager"?"👑 Manager":"Agent"}
                      </span>
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>{setEditModal(a);setEditData({name:a.name,email:a.email,team:a.team,role:a.role,password:""}); }} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#9ca3af"}}>✏️ Modifier</button>
                        {a.role!=="admin"&&<button onClick={()=>setDeleteModal(a)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#f87171"}}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="teams"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <input value={newTeam} onChange={e=>setNewTeam(e.target.value)} placeholder="Nom de la nouvelle équipe..." onKeyDown={e=>e.key==="Enter"&&handleAddTeam()}
              style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:14,color:"#f9fafb",outline:"none"}}/>
            <button onClick={handleAddTeam} className="btn-glow" style={{background:"linear-gradient(135deg,#7c3aed,#3b82f6)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Ajouter</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {teams.map(team=>(
              <div key={team.id||team.name} className="card-hover" style={{background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏢</div>
                  <div>
                    <div style={{fontWeight:600,color:"#e2e8f0",fontSize:14}}>{team.name}</div>
                    <div style={{fontSize:11,color:"#4b5563"}}>{agents.filter(a=>a.team===team.name).length} agents</div>
                  </div>
                </div>
                {team.name!=="Admin"&&<button onClick={()=>handleDeleteTeam(team)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#f87171",fontWeight:600}}>🗑</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="leavetypes"&&(
        <div>
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",padding:20,marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#e2e8f0"}}>➕ Nouveau type de congé</h3>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input value={newLT.label} onChange={e=>setNewLT(p=>({...p,label:e.target.value}))} placeholder="Ex: Congé sans solde"
                style={{flex:1,minWidth:160,padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:14,color:"#f9fafb",outline:"none"}}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {COLORS.map(c=><button key={c} onClick={()=>setNewLT(p=>({...p,color:c}))} style={{width:26,height:26,borderRadius:8,background:c,border:newLT.color===c?"3px solid #fff":"2px solid transparent",cursor:"pointer",boxShadow:newLT.color===c?`0 0 12px ${c}`:"none",transition:"all 0.2s"}}/>)}
              </div>
              <button onClick={handleAddLT} className="btn-glow" style={{background:"linear-gradient(135deg,#7c3aed,#3b82f6)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>Ajouter</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
            {leaveTypes.map(lt=>(
              <div key={lt.id} className="card-hover" style={{background:"rgba(255,255,255,0.03)",borderRadius:12,border:`1px solid ${lt.color}30`,padding:16}}>
                {editLT===lt.id?(
                  <div>
                    <input defaultValue={lt.label} id={`elt-${lt.id}`} style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",fontSize:13,color:"#f9fafb",boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>handleUpdateLT(lt,document.getElementById(`elt-${lt.id}`).value)} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#7c3aed,#3b82f6)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>Enregistrer</button>
                      <button onClick={()=>setEditLT(null)} style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#9ca3af",cursor:"pointer",fontSize:12}}>Annuler</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:14,height:14,borderRadius:4,background:lt.color,boxShadow:`0 0 8px ${lt.color}`}}/>
                      <span style={{fontWeight:600,fontSize:14,color:"#e2e8f0"}}>{lt.label}</span>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>setEditLT(lt.id)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#9ca3af"}}>✏️</button>
                      <button onClick={()=>handleDeleteLT(lt)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#f87171"}}>🗑</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {addModal&&<Modal title="➕ Ajouter un agent">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <Field label="Prénom" value={newAgent.first_name} onChange={v=>setNewAgent(p=>({...p,first_name:v}))} placeholder="Jean"/>
          <Field label="Nom" value={newAgent.last_name} onChange={v=>setNewAgent(p=>({...p,last_name:v}))} placeholder="Dupont"/>
        </div>
        <Field label="Email" value={newAgent.email} onChange={v=>setNewAgent(p=>({...p,email:v}))} placeholder="jean@entreprise.fr" style={{marginBottom:12}}/>
        <Field label="Mot de passe (min 8 car.)" value={newAgent.password} onChange={v=>setNewAgent(p=>({...p,password:v}))} placeholder="motdepasse123" style={{marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Équipe</label>
            <select value={newAgent.team} onChange={e=>setNewAgent(p=>({...p,team:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"#12121e",fontSize:14,color:"#f9fafb",outline:"none"}}>
              <option value="">-- Choisir --</option>
              {teams.map(t=><option key={t.id||t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Rôle</label>
            <select value={newAgent.role} onChange={e=>setNewAgent(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"#12121e",fontSize:14,color:"#f9fafb",outline:"none"}}>
              <option value="agent">Agent</option>
              <option value="manager">Manager 👑</option>
            </select>
          </div>
        </div>
        <ModalButtons onCancel={()=>setAddModal(false)} onConfirm={handleAddAgent} confirmLabel={loading?"En cours...":"Ajouter"} confirmColor="linear-gradient(135deg,#7c3aed,#3b82f6)" disabled={loading}/>
      </Modal>}

      {editModal&&<Modal title={`✏️ Modifier — ${editModal.name}`}>
        <Field label="Nom complet" value={editData.name} onChange={v=>setEditData(p=>({...p,name:v}))} style={{marginBottom:12}}/>
        <Field label="Email" value={editData.email} onChange={v=>setEditData(p=>({...p,email:v}))} style={{marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Équipe</label>
            <select value={editData.team||""} onChange={e=>setEditData(p=>({...p,team:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"#12121e",fontSize:14,color:"#f9fafb",outline:"none"}}>
              <option value="">-- Aucune équipe --</option>
              {teams.map(t=><option key={t.id||t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Rôle</label>
            <select value={editData.role||"agent"} onChange={e=>setEditData(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"#12121e",fontSize:14,color:"#f9fafb",outline:"none"}}>
              <option value="agent">Agent</option>
              <option value="manager">Manager 👑</option>
            </select>
          </div>
        </div>
        <Field label="Nouveau mot de passe (vide = inchangé)" value={editData.password} onChange={v=>setEditData(p=>({...p,password:v}))} placeholder="••••••••" style={{marginBottom:20}}/>
        <ModalButtons onCancel={()=>setEditModal(null)} onConfirm={async()=>{
          try{await apiFetch(`/agents/${editModal.id}`,token,{method:"PATCH",body:JSON.stringify({team:editData.team,role:editData.role,email:editData.email,...(editData.password?{password:editData.password}:{})})});}catch(e){console.error(e);}
          onAgentUpdated(editModal.id,editData);setEditModal(null);showNotif("Agent modifié ✅");
        }} confirmLabel="Enregistrer" confirmColor="linear-gradient(135deg,#7c3aed,#3b82f6)"/>
      </Modal>}

      {deleteModal&&<Modal title="🗑 Supprimer l'agent">
        <p style={{color:"#6b7280",fontSize:14,margin:"0 0 20px"}}>Supprimer <strong style={{color:"#e2e8f0"}}>{deleteModal.name}</strong> ? Cette action est irréversible.</p>
        <ModalButtons onCancel={()=>setDeleteModal(null)} onConfirm={()=>{onAgentDeleted(deleteModal.id);setDeleteModal(null);showNotif("Agent supprimé","error");}} confirmLabel="Supprimer" confirmColor="#ef4444"/>
      </Modal>}
    </div>
  );
}

// ─── APP PRINCIPALE ───
function PlanningApp({currentUser,onLogout}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [agents,setAgents]=useState([]);
  const [teams,setTeams]=useState([]);
  const [leaveTypes,setLeaveTypes]=useState([]);
  const [leaves,setLeaves]=useState({});
  const [requests,setRequests]=useState([]);
  const [view,setView]=useState("planning");
  const [filterTeam,setFilterTeam]=useState("Tous");
  const [selectedLTId,setSelectedLTId]=useState(null);
  const [selectionStart,setSelectionStart]=useState(null);
  const [hoveredDay,setHoveredDay]=useState(null);
  const [selectedAgent,setSelectedAgent]=useState(null);
  const [requestModal,setRequestModal]=useState(null);
  const [requestReason,setRequestReason]=useState("");
  const [rejectModal,setRejectModal]=useState(null);
  const [rejectComment,setRejectComment]=useState("");
  const [notification,setNotification]=useState(null);
  const [dataLoaded,setDataLoaded]=useState(false);
  const [contextMenu,setContextMenu]=useState(null);
  const [seenRejected,setSeenRejected]=useState(()=>{
    try{return JSON.parse(localStorage.getItem(`seenRejected_${currentUser.id}`)||"[]");}
    catch{return [];}
  });

  const token=currentUser.token;
  const isManager=currentUser.role==="manager"||currentUser.role==="admin";
  const isAdmin=currentUser.role==="admin";

  useEffect(()=>{
    async function loadAll(){
      try{
        const [teamsData,ltData,agentsData]=await Promise.all([apiFetch("/teams",token),apiFetch("/leave-types",token),apiFetch("/agents",token)]);
        const teamsResult=Array.isArray(teamsData)?teamsData:[];setTeams(teamsResult);
        const ltResult=Array.isArray(ltData)?ltData:[];
        const ltFormatted=ltResult.map(lt=>({...lt,bg:hexToLight(lt.color)}));setLeaveTypes(ltFormatted);
        const allowedFirst=ltFormatted.find(t=>AGENT_ALLOWED_CODES.includes(t.code));
        if(ltFormatted.length>0)setSelectedLTId((allowedFirst||ltFormatted[0]).id);
        const agentsRaw=agentsData.agents||(Array.isArray(agentsData)?agentsData:[]);
        setAgents(agentsRaw.map(a=>({id:a.id,name:`${a.first_name||""} ${a.last_name||""}`.trim(),email:a.email,role:a.role||"agent",team:a.team_name||a.team||"",avatar:a.avatar_initials||getInitials(`${a.first_name||""} ${a.last_name||""}`)})));
        await loadLeaves(ltFormatted,token,now.getFullYear(),now.getMonth());
        await loadRequests(token);
      }catch(e){console.error("Erreur chargement:",e);}
      setDataLoaded(true);
    }
    loadAll();
  },[token]);

  useEffect(()=>{if(dataLoaded&&leaveTypes.length>0)loadLeaves(leaveTypes,token,year,month);},[year,month]);

  async function loadLeaves(ltList,tok,y,m){
    try{
      const monthStr=`${y}-${String(m+1).padStart(2,"0")}`;
      const data=await apiFetch(`/leaves?month=${monthStr}`,tok);
      const leavesData=(data.leaves||[]).filter(l=>l.status!=="cancelled"&&l.status!=="rejected");
      const leavesMap={};
      leavesData.forEach(l=>{
        if(!leavesMap[l.agent_id])leavesMap[l.agent_id]={};
        const lt=leaveFromBackend(l);
        const leaveStart=l.start_date.split("T")[0],leaveEnd=l.end_date.split("T")[0];
        const start=new Date(l.start_date),end=new Date(l.end_date);
        for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
          const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          leavesMap[l.agent_id][k]={...lt,status:l.status,leaveId:l.id,leaveStart,leaveEnd,leaveCode:l.leave_type_code,agentId:l.agent_id};
        }
      });
      setLeaves(leavesMap);
    }catch(e){console.error("Erreur congés:",e);}
  }

  async function loadRequests(tok){
    try{
      const [pendingData,allData]=await Promise.all([apiFetch("/leaves?status=pending",tok),apiFetch("/leaves",tok)]);
      const pending=(pendingData.leaves||[]).map(requestFromBackend);
      const others=(allData.leaves||[]).filter(l=>l.status!=="pending").map(requestFromBackend);
      setRequests([...pending,...others]);
    }catch(e){console.error("Erreur demandes:",e);}
  }

  function showNotif(msg,type="success"){setNotification({msg,type});setTimeout(()=>setNotification(null),3500);}

  const daysInMonth=getDaysInMonth(year,month);
  const firstDay=getFirstDayOfMonth(year,month);
  const allTeams=["Tous",...teams.filter(t=>t.name!=="Admin").map(t=>t.name)];
  const filteredAgents=(filterTeam==="Tous"?agents:agents.filter(a=>a.team===filterTeam)).filter(a=>a.role!=="admin"||a.team);
  const pendingRequests=requests.filter(r=>r.status==="pending");
  const myRequests=requests.filter(r=>r.agentId===currentUser.id);
  const todayDay=now.getFullYear()===year&&now.getMonth()===month?now.getDate():null;
  const currentLT=leaveTypes.find(t=>t.id===selectedLTId)||leaveTypes[0];
  const validationBadge=isManager?pendingRequests.length:myRequests.filter(r=>r.status==="pending"||(r.status==="rejected"&&!seenRejected.includes(r.id))).length;

  function getLeave(agentId,day){return leaves[agentId]?.[dateKey(year,month,day)];}

  async function handleCellClick(agentId,day){
    if(contextMenu){setContextMenu(null);return;}
    if(isWeekend(year,month,day))return;
    if(!isManager&&currentUser.id!==agentId)return;
    if(!selectedAgent||selectedAgent!==agentId){setSelectedAgent(agentId);setSelectionStart(day);}
    else{
      const start=Math.min(selectionStart,day),end=Math.max(selectionStart,day);
      setSelectionStart(null);setSelectedAgent(null);
      if(isManager){
        applyLeaveLocal(agentId,start,end,currentLT,"approved");
        try{
          await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:currentLT.code,start_date:dateKey(year,month,start),end_date:dateKey(year,month,end),agent_id:agentId})});
          await loadLeaves(leaveTypes,token,year,month);showNotif("Congé sauvegardé ✅");
        }catch{showNotif("Congé appliqué (erreur sauvegarde)","error");}
      }else{
        const allowedTypes=leaveTypes.filter(t=>AGENT_ALLOWED_CODES.includes(t.code));
        if(!AGENT_ALLOWED_CODES.includes(currentLT?.code)&&allowedTypes.length>0)setSelectedLTId(allowedTypes[0].id);
        setRequestModal({agentId,start:dateKey(year,month,start),end:dateKey(year,month,end)});setRequestReason("");
      }
    }
  }

  function handleCellRightClick(e,agentId,day){
    e.preventDefault();e.stopPropagation();
    if(currentUser.id!==agentId&&!isManager)return;
    const leave=leaves[agentId]?.[dateKey(year,month,day)];
    if(!leave||!leave.leaveId)return;
    setContextMenu({x:e.clientX,y:e.clientY,agentId,day,leave,leaveId:leave.leaveId,clickedDate:dateKey(year,month,day)});
  }

  async function handleDeleteAll(){
    if(!contextMenu)return;
    const{leaveId}=contextMenu;setContextMenu(null);
    try{await apiFetch(`/leaves/${leaveId}`,token,{method:"DELETE"});await loadLeaves(leaveTypes,token,year,month);showNotif("Congé supprimé ✅");}
    catch{showNotif("Erreur lors de la suppression","error");}
  }

  async function handleDeleteDay(){
    if(!contextMenu)return;
    const{leaveId,clickedDate,leave,agentId}=contextMenu;setContextMenu(null);
    try{
      await apiFetch(`/leaves/${leaveId}`,token,{method:"DELETE"});
      const start=leave.leaveStart,end=leave.leaveEnd,code=leave.leaveCode||leave.code;
      if(compareDates(start,clickedDate)<0)await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:code,start_date:start,end_date:addDays(clickedDate,-1),agent_id:agentId})});
      if(compareDates(clickedDate,end)<0)await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:code,start_date:addDays(clickedDate,1),end_date:end,agent_id:agentId})});
      await loadLeaves(leaveTypes,token,year,month);showNotif("Jour supprimé ✅");
    }catch(e){console.error(e);showNotif("Erreur lors de la suppression","error");}
  }

  function applyLeaveLocal(agentId,startDay,endDay,type,status){
    setLeaves(prev=>{const al={...(prev[agentId]||{})};for(let d=startDay;d<=endDay;d++){if(!isWeekend(year,month,d))al[dateKey(year,month,d)]={...type,status};}return{...prev,[agentId]:al};});
  }

  async function submitRequest(){
    if(!requestModal||!currentLT)return;
    const{agentId,start,end}=requestModal;const agent=agents.find(a=>a.id===agentId);
    try{
      const data=await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:currentLT.code,start_date:start,end_date:end,reason:requestReason,agent_id:agentId})});
      if(data.leave)setRequests(prev=>[...prev,{id:data.leave.id,agentId,agentName:agent.name,agentAvatar:agent.avatar,agentTeam:agent.team,leaveType:currentLT,start,end,reason:requestReason,status:"pending",createdAt:new Date().toISOString()}]);
    }catch{}
    setRequestModal(null);showNotif("Demande envoyée au manager !");
  }

  async function approveRequest(reqId){
    try{
      await apiFetch(`/leaves/${reqId}/approve`,token,{method:"PATCH",body:JSON.stringify({})});
      setRequests(prev=>prev.map(r=>r.id===reqId?{...r,status:"approved"}:r));
      const req=requests.find(r=>r.id===reqId);
      if(req){const[sy,sm,sd]=req.start.split("-").map(Number),[ey,em,ed]=req.end.split("-").map(Number);setLeaves(prev=>{const al={...(prev[req.agentId]||{})};for(let d=new Date(sy,sm-1,sd);d<=new Date(ey,em-1,ed);d.setDate(d.getDate()+1)){if(d.getDay()!==0&&d.getDay()!==6){const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;al[k]={...req.leaveType,status:"approved"};}}return{...prev,[req.agentId]:al};});}
      showNotif("Demande approuvée ✅");
    }catch{showNotif("Erreur","error");}
  }

  async function rejectRequest(reqId){
    try{
      await apiFetch(`/leaves/${reqId}/reject`,token,{method:"PATCH",body:JSON.stringify({manager_comment:rejectComment})});
      setRequests(prev=>prev.map(r=>r.id===reqId?{...r,status:"rejected",comment:rejectComment}:r));
      await loadLeaves(leaveTypes,token,year,month);
      setRejectModal(null);showNotif("Demande refusée","error");
    }catch{showNotif("Erreur","error");}
  }

  function isInSelection(agentId,day){
    if(selectedAgent!==agentId||selectionStart===null||hoveredDay===null)return false;
    return day>=Math.min(selectionStart,hoveredDay)&&day<=Math.max(selectionStart,hoveredDay);
  }

  const navItems=[
    {id:"planning",icon:"🗓",label:"Planning"},
    {id:"validations",icon:"✅",label:"Validations",badge:validationBadge},
    {id:"stats",icon:"📊",label:"Statistiques"},
    ...(isAdmin?[{id:"admin",icon:"⚙️",label:"Administration"}]:[]),
  ];

  if(!dataLoaded)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07070f",fontFamily:"'Outfit',sans-serif"}}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#7c3aed,#3b82f6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:20,animation:"glow 2s infinite"}}>📅</div>
        <div style={{fontSize:16,color:"#4b5563",fontWeight:500}}>Chargement en cours...</div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif",minHeight:"100vh",background:"#07070f",display:"flex"}}
      onClick={()=>{if(contextMenu)setContextMenu(null);}}>
      <style>{GLOBAL_STYLE}</style>

      {/* Notification */}
      {notification&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:notification.type==="error"?"rgba(239,68,68,0.15)":"rgba(52,211,153,0.15)",border:`1px solid ${notification.type==="error"?"rgba(239,68,68,0.3)":"rgba(52,211,153,0.3)"}`,color:notification.type==="error"?"#f87171":"#34d399",padding:"12px 20px",borderRadius:12,fontWeight:600,fontSize:14,backdropFilter:"blur(20px)",animation:"slideIn 0.3s ease",boxShadow:"0 8px 30px rgba(0,0,0,0.4)"}}>{notification.msg}</div>}

      {contextMenu&&<ContextMenu x={contextMenu.x} y={contextMenu.y} leave={contextMenu.leave} onDeleteDay={handleDeleteDay} onDeleteAll={handleDeleteAll} onClose={()=>setContextMenu(null)}/>}

      {/* SIDEBAR */}
      <aside style={{width:230,background:"linear-gradient(180deg,#0d0d1a 0%,#0a0a14 100%)",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0}}>
        {/* Logo */}
        <div style={{padding:"0 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 20px rgba(124,58,237,0.3)"}}>📅</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#f9fafb",letterSpacing:"-0.3px"}}>PlanniPro</div>
              <div style={{fontSize:10,color:"#374151",fontWeight:400}}>Gestion des présences</div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{position:"relative"}}>
              <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,hsl(${agentHue(currentUser.id)},60%,35%),hsl(${agentHue(currentUser.id)+40},70%,50%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,boxShadow:`0 0 15px hsla(${agentHue(currentUser.id)},60%,50%,0.3)`}}>
                {currentUser.avatar_initials||getInitials(`${currentUser.first_name||""} ${currentUser.last_name||""}`)}
              </div>
              <div style={{position:"absolute",bottom:0,right:0,width:9,height:9,borderRadius:"50%",background:"#34d399",border:"2px solid #0d0d1a"}}/>
            </div>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#f9fafb",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.first_name} {currentUser.last_name}</div>
              <div style={{fontSize:10,color:currentUser.role==="admin"?"#fbbf24":currentUser.role==="manager"?"#a78bfa":"#34d399",fontWeight:500}}>
                {currentUser.role==="admin"?"👑 Admin":currentUser.role==="manager"?"👑 Manager":"👤 Agent"}
              </div>
            </div>
          </div>
          <button onClick={onLogout} style={{width:"100%",padding:"6px 0",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",color:"#4b5563",fontSize:11,cursor:"pointer",fontWeight:600,transition:"all 0.2s"}}>🚪 Déconnexion</button>
        </div>

        {/* Nav */}
        <nav style={{padding:"12px 12px",flex:1}}>
          {navItems.map(item=>(
            <button key={item.id} className="nav-item" onClick={()=>{
              setView(item.id);
              if(item.id==="validations"&&!isManager){
                const newSeen=myRequests.filter(r=>r.status==="rejected").map(r=>r.id);
                setSeenRejected(newSeen);
                localStorage.setItem(`seenRejected_${currentUser.id}`,JSON.stringify(newSeen));
              }
            }} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",borderRadius:10,background:view===item.id?"rgba(124,58,237,0.15)":"transparent",color:view===item.id?"#a78bfa":"#4b5563",cursor:"pointer",fontSize:14,fontWeight:view===item.id?600:400,marginBottom:2,borderLeft:view===item.id?"none":"none",boxShadow:view===item.id?"inset 0 0 0 1px rgba(124,58,237,0.2)":"none"}}>
              <span style={{fontSize:16}}>{item.icon}</span>
              <span style={{flex:1,textAlign:"left"}}>{item.label}</span>
              {item.badge>0&&<span style={{background:"#e94560",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700,boxShadow:"0 0 10px rgba(233,69,96,0.4)"}}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Légende */}
        <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:10,color:"#374151",marginBottom:10,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Légende</div>
          {leaveTypes.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:10,height:10,borderRadius:3,background:t.color,boxShadow:`0 0 6px ${t.color}60`}}/>
              <span style={{fontSize:11,color:"#374151"}}>{t.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,overflow:"auto",background:"#07070f"}}>
        {/* Header */}
        <div style={{background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"18px 28px",backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:10}}>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:"#f9fafb",letterSpacing:"-0.3px"}}>
            {view==="planning"?"📅 Planning mensuel":view==="validations"?"✅ Demandes de congés":view==="stats"?"📊 Statistiques":"⚙️ Administration"}
          </h1>
          <p style={{margin:"2px 0 0",fontSize:13,color:"#374151"}}>
            {view==="planning"?`${MONTHS_FR[month]} ${year}`:view==="validations"?(isManager?`${pendingRequests.length} demande(s) en attente`:`${myRequests.length} demande(s) au total`):""}
          </p>
        </div>

        {view==="admin"&&isAdmin&&<AdminPanel agents={agents} teams={teams} leaveTypes={leaveTypes} token={token} showNotif={showNotif}
          onAgentAdded={a=>setAgents(prev=>[...prev,a])}
          onAgentUpdated={(id,data)=>setAgents(prev=>prev.map(a=>a.id===id?{...a,...(data.name?{name:data.name,avatar:getInitials(data.name)}:{}),email:data.email||a.email,team:data.team!==undefined?data.team:a.team,role:data.role||a.role}:a))}
          onAgentDeleted={id=>setAgents(prev=>prev.filter(a=>a.id!==id))}
          onTeamAdded={t=>setTeams(prev=>[...prev,t])}
          onTeamDeleted={id=>setTeams(prev=>prev.filter(t=>t.id!==id))}
          onLeaveTypeAdded={lt=>setLeaveTypes(prev=>[...prev,lt])}
          onLeaveTypeUpdated={(id,data)=>setLeaveTypes(prev=>prev.map(lt=>lt.id===id?{...lt,...data}:lt))}
          onLeaveTypeDeleted={id=>setLeaveTypes(prev=>prev.filter(lt=>lt.id!==id))}
        />}

        {view==="planning"&&(
          <div style={{padding:24,animation:"fadeIn 0.3s ease"}}>
            {/* Controls */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"6px 12px"}}>
                <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#6b7280",lineHeight:1,padding:"0 4px"}}>‹</button>
                <span style={{fontWeight:700,fontSize:16,color:"#f9fafb",minWidth:150,textAlign:"center",letterSpacing:"-0.3px"}}>{MONTHS_FR[month]} {year}</span>
                <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#6b7280",lineHeight:1,padding:"0 4px"}}>›</button>
              </div>
              <button onClick={()=>{setYear(now.getFullYear());setMonth(now.getMonth());}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:"#6b7280",transition:"all 0.2s"}}>Aujourd'hui</button>
              <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
                {allTeams.map(t=><button key={t} onClick={()=>setFilterTeam(t)} style={{padding:"6px 14px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",fontWeight:500,background:filterTeam===t?"rgba(124,58,237,0.2)":"transparent",color:filterTeam===t?"#a78bfa":"#4b5563",borderColor:filterTeam===t?"rgba(124,58,237,0.4)":"rgba(255,255,255,0.07)",transition:"all 0.2s"}}>{t}</button>)}
              </div>
            </div>

            {/* Types de congés */}
            {leaveTypes.length>0&&<div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {leaveTypes.filter(t=>isManager||AGENT_ALLOWED_CODES.includes(t.code)).map(t=>(
                <button key={t.id} onClick={()=>setSelectedLTId(t.id)}
                  style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${selectedLTId===t.id?t.color:t.color+"40"}`,fontSize:12,cursor:"pointer",fontWeight:600,background:selectedLTId===t.id?t.color+"25":"transparent",color:selectedLTId===t.id?t.color:t.color+"80",transition:"all 0.2s",boxShadow:selectedLTId===t.id?`0 0 15px ${t.color}30`:"none"}}>
                  {t.label}
                </button>
              ))}
            </div>}

            {/* Hint */}
            <div style={{fontSize:12,color:"#374151",marginBottom:12,background:"rgba(251,191,36,0.05)",border:"1px solid rgba(251,191,36,0.1)",borderRadius:8,padding:"8px 14px"}}>
              {isManager?"👑 Clic gauche : ajouter un congé — Clic droit : supprimer un jour ou toute la période":"👤 Sélectionnez des dates pour envoyer une demande de validation au manager"}
            </div>

            {/* Table planning */}
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:14,border:"1px solid rgba(255,255,255,0.05)",overflow:"auto",boxShadow:"0 4px 30px rgba(0,0,0,0.3)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <colgroup><col style={{width:160}}/>{Array.from({length:daysInMonth},(_,i)=><col key={i}/>)}</colgroup>
                <thead>
                  <tr>
                    <th style={{padding:"14px 16px",textAlign:"left",fontSize:10,color:"#374151",fontWeight:600,borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.02)",textTransform:"uppercase",letterSpacing:"0.5px"}}>AGENT</th>
                    {Array.from({length:daysInMonth},(_,i)=>{
                      const day=i+1,wk=isWeekend(year,month,day),isToday=todayDay===day;
                      return<th key={i} style={{padding:"8px 2px",textAlign:"center",fontSize:9,fontWeight:600,background:isToday?"rgba(124,58,237,0.15)":wk?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.02)",color:isToday?"#a78bfa":wk?"#1f2937":"#374151",borderBottom:`1px solid ${isToday?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.05)"}`,borderLeft:"1px solid rgba(255,255,255,0.03)"}}>
                        <div style={{textTransform:"uppercase",letterSpacing:"0.3px"}}>{DAYS_FR[(i+firstDay)%7].slice(0,1)}</div>
                        <div style={{fontSize:11,fontWeight:700,color:isToday?"#a78bfa":wk?"#1f2937":"#6b7280",marginTop:1}}>{day}</div>
                        {isToday&&<div style={{width:4,height:4,borderRadius:"50%",background:"#7c3aed",margin:"2px auto 0",boxShadow:"0 0 6px #7c3aed"}}/>}
                      </th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent,idx)=>(
                    <tr key={agent.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                      <td style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.01)"}}>
                        <div style={{width:30,height:30,borderRadius:9,background:`linear-gradient(135deg,hsl(${agentHue(agent.id)},55%,30%),hsl(${agentHue(agent.id)+40},65%,45%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0,boxShadow:`0 0 10px hsla(${agentHue(agent.id)},60%,50%,0.2)`}}>{agent.avatar}</div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:agent.id===currentUser.id?"#a78bfa":"#d1d5db",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>{agent.name.split(" ")[0]} {agent.role==="manager"?"👑":""}</div>
                          <div style={{fontSize:10,color:"#374151"}}>{agent.team}</div>
                        </div>
                      </td>
                      {Array.from({length:daysInMonth},(_,i)=>{
                        const day=i+1,wk=isWeekend(year,month,day),leave=getLeave(agent.id,day),inSel=isInSelection(agent.id,day),isToday=todayDay===day,canInteract=isManager||currentUser.id===agent.id;
                        return<td key={i}
                          onClick={()=>canInteract&&!wk&&handleCellClick(agent.id,day)}
                          onContextMenu={(e)=>!wk&&handleCellRightClick(e,agent.id,day)}
                          onMouseEnter={()=>{if(selectedAgent===agent.id)setHoveredDay(day);}}
                          onMouseLeave={()=>setHoveredDay(null)}
                          className={!wk&&canInteract?"cell-hover":""}
                          style={{padding:"3px 2px",textAlign:"center",cursor:wk||!canInteract?"default":"pointer",background:wk?"rgba(255,255,255,0.005)":inSel?"rgba(124,58,237,0.2)":isToday?"rgba(124,58,237,0.04)":"transparent",borderLeft:"1px solid rgba(255,255,255,0.03)",transition:"background 0.1s"}}>
                          {leave&&!wk&&(
                            <div style={{width:"calc(100% - 2px)",height:24,margin:"0 1px",background:leave.color+(leave.status==="pending"&&leave.agentId!==currentUser.id?"30":""),border:`1px solid ${leave.color}${leave.status==="pending"&&leave.agentId!==currentUser.id?"40":"80"}`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:leave.status==="pending"&&leave.agentId!==currentUser.id?"none":`0 0 8px ${leave.color}30`}}>
                              <span style={{fontSize:8,color:"#fff",fontWeight:700,letterSpacing:"0.3px",opacity:leave.status==="pending"&&leave.agentId!==currentUser.id?0.4:1}}>{leave.status==="pending"&&leave.agentId!==currentUser.id?"?":leave.label.slice(0,3).toUpperCase()}</span>
                            </div>
                          )}
                          {inSel&&!leave&&<div style={{width:"calc(100% - 4px)",height:24,margin:"0 2px",borderRadius:5,background:"rgba(124,58,237,0.3)",border:"1px solid rgba(124,58,237,0.5)"}}/>}
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
          <div style={{padding:24,animation:"fadeIn 0.3s ease"}}>
            {isManager?(
              <>
                {pendingRequests.length===0&&requests.filter(r=>r.status!=="pending").length===0&&
                  <div style={{background:"rgba(255,255,255,0.02)",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",padding:60,textAlign:"center",color:"#374151"}}>
                    <div style={{fontSize:"3rem",marginBottom:12}}>🎉</div>
                    <div style={{fontSize:16,fontWeight:600,color:"#6b7280"}}>Aucune demande en attente</div>
                  </div>}
                {pendingRequests.length>0&&<>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:16,color:"#fbbf24",textTransform:"uppercase",letterSpacing:"0.5px"}}>🕐 En attente · {pendingRequests.length}</h3>
                  {pendingRequests.map(req=><RequestCard key={req.id} req={req} isManager onApprove={()=>approveRequest(req.id)} onReject={()=>{setRejectModal(req.id);setRejectComment("");}}/>)}
                </>}
                {requests.filter(r=>r.status!=="pending").length>0&&<>
                  <h3 style={{fontSize:14,fontWeight:700,margin:"28px 0 16px",color:"#374151",textTransform:"uppercase",letterSpacing:"0.5px"}}>📋 Historique</h3>
                  {requests.filter(r=>r.status!=="pending").map(req=><RequestCard key={req.id} req={req} isManager/>)}
                </>}
              </>
            ):(
              <>
                <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:12,padding:16,marginBottom:24,fontSize:13,color:"#a78bfa"}}>💡 Sélectionnez des dates dans le planning pour envoyer une demande de congé.</div>
                {myRequests.length===0&&<div style={{background:"rgba(255,255,255,0.02)",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",padding:60,textAlign:"center"}}><div style={{fontSize:"3rem",marginBottom:12}}>📝</div><div style={{fontSize:16,fontWeight:600,color:"#6b7280"}}>Aucune demande</div></div>}
                {myRequests.map(req=><RequestCard key={req.id} req={req}/>)}
              </>
            )}
          </div>
        )}

        {view==="stats"&&(
          <div style={{padding:24,animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
              {leaveTypes.map(t=>{
                let count=0;agents.forEach(a=>{Object.values(leaves[a.id]||{}).forEach(l=>{if(l.code===t.code||l.id===t.id)count++;});});
                return<div key={t.id} className="card-hover" style={{background:"rgba(255,255,255,0.02)",borderRadius:14,border:`1px solid ${t.color}20`,padding:24,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,right:0,width:100,height:100,borderRadius:"50%",background:`radial-gradient(circle,${t.color}15 0%,transparent 70%)`,transform:"translate(30%,-30%)"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <div style={{width:12,height:12,borderRadius:4,background:t.color,boxShadow:`0 0 8px ${t.color}`}}/>
                    <span style={{fontSize:12,color:"#6b7280",fontWeight:500}}>{t.label}</span>
                  </div>
                  <div style={{fontSize:42,fontWeight:800,color:t.color,letterSpacing:"-1px"}}>{count}</div>
                  <div style={{fontSize:11,color:"#374151",marginTop:4,fontWeight:500}}>jours ce mois</div>
                </div>;
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal demande congé */}
      {requestModal&&currentLT&&<Modal title="📝 Nouvelle demande de congé">
        <p style={{color:"#4b5563",fontSize:13,margin:"0 0 20px"}}>Du <strong style={{color:"#e2e8f0"}}>{formatDate(requestModal.start)}</strong> au <strong style={{color:"#e2e8f0"}}>{formatDate(requestModal.end)}</strong></p>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>Type de congé</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {leaveTypes.filter(t=>isManager||AGENT_ALLOWED_CODES.includes(t.code)).map(t=>(
              <button key={t.id} onClick={()=>setSelectedLTId(t.id)}
                style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${selectedLTId===t.id?t.color:t.color+"40"}`,fontSize:12,cursor:"pointer",fontWeight:600,background:selectedLTId===t.id?t.color+"25":"transparent",color:selectedLTId===t.id?t.color:t.color+"80",transition:"all 0.2s"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>Motif (optionnel)</label>
          <textarea value={requestReason} onChange={e=>setRequestReason(e.target.value)} rows={3} placeholder="Précisez si nécessaire..."
            style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:14,color:"#f9fafb",boxSizing:"border-box",resize:"none",outline:"none"}}/>
        </div>
        <ModalButtons onCancel={()=>setRequestModal(null)} onConfirm={submitRequest} confirmLabel="Envoyer la demande" confirmColor="linear-gradient(135deg,#7c3aed,#3b82f6)"/>
      </Modal>}

      {rejectModal&&<Modal title="❌ Refuser la demande">
        <textarea value={rejectComment} onChange={e=>setRejectComment(e.target.value)} placeholder="Motif du refus (obligatoire)..." rows={3}
          style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:14,color:"#f9fafb",boxSizing:"border-box",resize:"none",outline:"none",marginBottom:20}}/>
        <ModalButtons onCancel={()=>setRejectModal(null)} onConfirm={()=>rejectRequest(rejectModal)} confirmLabel="Confirmer le refus" confirmColor={rejectComment.trim()?"#ef4444":"rgba(239,68,68,0.3)"} disabled={!rejectComment.trim()}/>
      </Modal>}
    </div>
  );
}

function RequestCard({req,isManager,onApprove,onReject}){
  const s={
    pending:{label:"En attente",bg:"rgba(251,191,36,0.1)",color:"#fbbf24",border:"rgba(251,191,36,0.2)",icon:"🕐"},
    approved:{label:"Approuvée",bg:"rgba(52,211,153,0.1)",color:"#34d399",border:"rgba(52,211,153,0.2)",icon:"✅"},
    rejected:{label:"Refusée",bg:"rgba(248,113,113,0.1)",color:"#f87171",border:"rgba(248,113,113,0.2)",icon:"❌"}
  }[req.status]||{label:req.status,bg:"rgba(255,255,255,0.05)",color:"#6b7280",border:"rgba(255,255,255,0.1)",icon:"•"};

  return(
    <div className="card-hover" style={{background:"rgba(255,255,255,0.02)",borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",padding:20,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,hsl(${agentHue(req.agentId)},55%,30%),hsl(${agentHue(req.agentId)+40},65%,45%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700,boxShadow:`0 0 15px hsla(${agentHue(req.agentId)},60%,50%,0.25)`}}>{req.agentAvatar}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:"#e2e8f0"}}>{req.agentName}</div>
          <div style={{fontSize:12,color:"#374151"}}>{req.agentTeam}</div>
        </div>
        <div style={{background:s.bg,color:s.color,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,border:`1px solid ${s.border}`}}>{s.icon} {s.label}</div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:req.reason?10:0}}>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"8px 14px"}}>
          <div style={{fontSize:10,color:"#374151",marginBottom:2,textTransform:"uppercase",letterSpacing:"0.3px"}}>Période</div>
          <div style={{fontSize:13,fontWeight:600,color:"#d1d5db"}}>{req.start===req.end?formatDate(req.start):`${formatDate(req.start)} → ${formatDate(req.end)}`}</div>
        </div>
        <div style={{background:`${req.leaveType?.color}15`,border:`1px solid ${req.leaveType?.color}30`,borderRadius:8,padding:"8px 14px"}}>
          <div style={{fontSize:10,color:"#374151",marginBottom:2,textTransform:"uppercase",letterSpacing:"0.3px"}}>Type</div>
          <div style={{fontSize:13,fontWeight:600,color:req.leaveType?.color}}>{req.leaveType?.label}</div>
        </div>
      </div>
      {req.reason&&<div style={{fontSize:12,color:"#4b5563",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",padding:"8px 12px",borderRadius:8,marginBottom:10}}>💬 {req.reason}</div>}
      {req.comment&&<div style={{fontSize:12,color:"#f87171",background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.15)",padding:"8px 12px",borderRadius:8,marginBottom:10}}>❌ {req.comment}</div>}
      {isManager&&req.status==="pending"&&<div style={{display:"flex",gap:8,marginTop:14}}>
        <button onClick={onApprove} className="btn-glow" style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:"rgba(52,211,153,0.15)",color:"#34d399",cursor:"pointer",fontSize:13,fontWeight:600,border:"1px solid rgba(52,211,153,0.2)"}}>✅ Approuver</button>
        <button onClick={onReject} style={{flex:1,padding:"9px 0",borderRadius:8,border:"1px solid rgba(248,113,113,0.2)",background:"rgba(248,113,113,0.1)",color:"#f87171",cursor:"pointer",fontSize:13,fontWeight:600}}>❌ Refuser</button>
      </div>}
    </div>
  );
}

export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  if(!currentUser)return <LoginPage onLogin={setCurrentUser}/>;
  return <PlanningApp currentUser={currentUser} onLogout={()=>setCurrentUser(null)}/>;
}
