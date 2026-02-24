import { useState, useEffect } from "react";

const API = "https://plannipro-backend-production.up.railway.app/api";
const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const COLORS = ["#6366f1","#0ea5e9","#f59e0b","#10b981","#8b5cf6","#ef4444","#ec4899","#14b8a6","#f97316","#84cc16"];
const AGENT_ALLOWED_CODES = ["cp","_cp","rtt","_rtt","teletravail"];
const DEMO_USERS = [
  { email: "redouane@entreprise.fr", password: "admin1234" },
  { email: "sophie@entreprise.fr", password: "sophie123" },
  { email: "lucas@entreprise.fr", password: "lucas123" },
  { email: "emma@entreprise.fr", password: "emma1234" },
];

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', sans-serif; background: #f5f6fa; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
  .cell-hover:hover { background: #f0f1ff !important; }
  .btn-primary { transition: all 0.2s ease; }
  .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,0.3) !important; }
  .nav-btn { transition: all 0.15s ease; }
  .nav-btn:hover { background: rgba(255,255,255,0.08) !important; }
  .card { transition: all 0.2s ease; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
  input:focus, textarea:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; outline: none; }
`;

// ─── JOURS FÉRIÉS FRANÇAIS ───
function getEaster(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7;
  const m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,da);
}
function getFeries(year){
  const e=getEaster(year);
  const add=(date,n)=>{const d=new Date(date);d.setDate(d.getDate()+n);return d;};
  const k=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  return {
    [k(new Date(year,0,1))]:"Nouvel An",
    [k(add(e,1))]:"Lundi de Pâques",
    [k(new Date(year,4,1))]:"Fête du Travail",
    [k(new Date(year,4,8))]:"Victoire 1945",
    [k(add(e,39))]:"Ascension",
    [k(add(e,50))]:"Lundi de Pentecôte",
    [k(new Date(year,6,14))]:"Fête Nationale",
    [k(new Date(year,7,15))]:"Assomption",
    [k(new Date(year,10,1))]:"Toussaint",
    [k(new Date(year,10,11))]:"Armistice",
    [k(new Date(year,11,25))]:"Noël",
  };
}

function hexToLight(hex){
  try{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},0.1)`;}
  catch{return "#f3f4f6";}
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
function leaveAbbr(label){
  if(!label)return"???";
  const map={"½ CP":"½CP","½ RTT":"½RTT","Congé payé":"CP","RTT":"RTT","Pont":"PON","Formation":"FOR","Absence":"ABS"};
  if(map[label])return map[label];
  return label.replace(/[^a-zA-Z0-9½]/g,"").slice(0,4).toUpperCase()||label.slice(0,3).toUpperCase();
}
function getWeekDays(year,month,day){
  const date=new Date(year,month,day);
  const dow=date.getDay()===0?6:date.getDay()-1;
  const mon=new Date(date);mon.setDate(date.getDate()-dow);
  return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
}
function dKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}

function leaveFromBackend(l){return {id:l.leave_type_code,code:l.leave_type_code,label:l.leave_type_label,color:l.color,bg:hexToLight(l.color)};}
function requestFromBackend(l){
  return {id:l.id,agentId:l.agent_id,agentName:`${l.first_name||""} ${l.last_name||""}`.trim(),
    agentAvatar:l.avatar_initials||getInitials(`${l.first_name||""} ${l.last_name||""}`),
    agentTeam:l.team_name||"",leaveType:leaveFromBackend(l),
    start:(l.start_date||"").split("T")[0],end:(l.end_date||"").split("T")[0],
    reason:l.reason||"",status:l.status,createdAt:l.created_at};
}
async function apiFetch(path,token,options={}){
  const res=await fetch(`${API}${path}`,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{}),...(options.headers||{})}});
  return res.json();
}

// ─── LOGIN ───
function LoginPage({onLogin}){
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [error,setError]=useState("");const [loading,setLoading]=useState(false);const [showPwd,setShowPwd]=useState(false);
  async function handleLogin(){
    setLoading(true);
    try{
      const data=await apiFetch("/auth/login",null,{method:"POST",body:JSON.stringify({email:email.trim().toLowerCase(),password})});
      if(data.accessToken)onLogin({...data.agent,token:data.accessToken});
      else setError("Email ou mot de passe incorrect.");
    }catch{setError("Erreur de connexion au serveur.");}
    setLoading(false);
  }
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif"}}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{width:"100%",maxWidth:440,padding:"0 24px",animation:"fadeIn 0.5s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:20,background:"rgba(255,255,255,0.2)",backdropFilter:"blur(10px)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16,border:"1px solid rgba(255,255,255,0.3)"}}>📅</div>
          <h1 style={{color:"#fff",fontSize:28,fontWeight:800,margin:0,letterSpacing:"-0.5px"}}>PlanniPro</h1>
          <p style={{color:"rgba(255,255,255,0.7)",fontSize:14,margin:"6px 0 0"}}>Gestion des présences et congés</p>
        </div>
        <div style={{background:"#fff",borderRadius:24,padding:36,boxShadow:"0 25px 50px rgba(0,0,0,0.15)"}}>
          <h2 style={{margin:"0 0 24px",fontSize:20,fontWeight:700,color:"#111827"}}>Connexion</h2>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Email</label>
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="prenom@entreprise.fr"
              style={{width:"100%",padding:"12px 16px",borderRadius:10,border:error?"1.5px solid #fca5a5":"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}/>
          </div>
          <div style={{marginBottom:8}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <input type={showPwd?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••"
                style={{width:"100%",padding:"12px 44px 12px 16px",borderRadius:10,border:error?"1.5px solid #fca5a5":"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}/>
              <button onClick={()=>setShowPwd(!showPwd)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9ca3af"}}>{showPwd?"🙈":"👁"}</button>
            </div>
          </div>
          {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#dc2626"}}>⚠️ {error}</div>}
          <button onClick={handleLogin} disabled={loading} className="btn-primary"
            style={{width:"100%",padding:"13px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16}}>
            {loading?"Connexion...":"Se connecter →"}
          </button>
        </div>
        <div style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(10px)",borderRadius:16,padding:20,marginTop:16,border:"1px solid rgba(255,255,255,0.2)"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:12,textAlign:"center",textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Comptes demo</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {DEMO_USERS.map((u,i)=>(
              <button key={i} onClick={()=>{setEmail(u.email);setPassword(u.password);setError("");}}
                style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10,padding:"8px 12px",cursor:"pointer",textAlign:"left"}}>
                <div style={{color:"#fff",fontSize:11,fontWeight:600}}>{u.email.split("@")[0]}</div>
                <div style={{color:"rgba(255,255,255,0.5)",fontSize:10,marginTop:1}}>{u.email}</div>
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(3px)"}}>
      <div style={{background:"#fff",borderRadius:20,padding:32,width:480,maxWidth:"95vw",boxShadow:"0 25px 60px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto",animation:"slideIn 0.2s ease"}}>
        <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:700,color:"#111827"}}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
function ModalButtons({onCancel,onConfirm,confirmLabel,confirmColor,disabled}){
  return(<div style={{display:"flex",gap:10}}>
    <button onClick={onCancel} style={{flex:1,padding:10,borderRadius:8,border:"1.5px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:14,color:"#6b7280",fontWeight:500}}>Annuler</button>
    <button onClick={onConfirm} disabled={disabled} className="btn-primary" style={{flex:1,padding:10,borderRadius:8,border:"none",background:confirmColor||"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",cursor:disabled?"default":"pointer",fontSize:14,fontWeight:600,opacity:disabled?0.5:1}}>{confirmLabel}</button>
  </div>);
}
function Field({label,value,onChange,placeholder,style={}}){
  return(<div style={style}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>{label}</label>}
    <input value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}/>
  </div>);
}

function ContextMenu({x,y,leave,onDeleteDay,onDeleteAll,onClose}){
  const isMultiDay=leave.leaveStart!==leave.leaveEnd;
  return(
    <div onClick={e=>e.stopPropagation()}
      style={{position:"fixed",top:y,left:x,background:"#fff",borderRadius:12,boxShadow:"0 10px 40px rgba(0,0,0,0.15)",border:"1px solid #f1f5f9",zIndex:99999,minWidth:230,overflow:"hidden",animation:"slideIn 0.15s ease"}}>
      <div style={{padding:"10px 16px",borderBottom:"1px solid #f8fafc",fontSize:12,color:"#64748b",fontWeight:600,background:"#f8fafc"}}>
        <span style={{display:"inline-block",width:10,height:10,borderRadius:3,background:leave.color,marginRight:8}}></span>{leave.label}
      </div>
      <button onClick={e=>{e.stopPropagation();onDeleteDay();}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"11px 16px",border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#d97706",fontWeight:500}}>✂️ Supprimer ce jour seulement</button>
      {isMultiDay&&<button onClick={e=>{e.stopPropagation();onDeleteAll();}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"11px 16px",border:"none",borderTop:"1px solid #f8fafc",background:"none",cursor:"pointer",fontSize:13,color:"#ef4444",fontWeight:500}}>🗑 Supprimer toute la période</button>}
      <button onClick={e=>{e.stopPropagation();onClose();}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 16px",border:"none",borderTop:"1px solid #f8fafc",background:"none",cursor:"pointer",fontSize:13,color:"#9ca3af"}}>✕ Annuler</button>
    </div>
  );
}

// ─── ADMIN ───
function AdminPanel({agents,teams,leaveTypes,token,onAgentAdded,onAgentUpdated,onAgentDeleted,onTeamAdded,onTeamDeleted,onLeaveTypeAdded,onLeaveTypeUpdated,onLeaveTypeDeleted,showNotif}){
  const [tab,setTab]=useState("agents");
  const [addModal,setAddModal]=useState(false);const [editModal,setEditModal]=useState(null);const [deleteModal,setDeleteModal]=useState(null);const [editLT,setEditLT]=useState(null);
  const [newAgent,setNewAgent]=useState({first_name:"",last_name:"",email:"",password:"",role:"agent",team:""});const [editData,setEditData]=useState({});
  const [newTeam,setNewTeam]=useState("");const [newLT,setNewLT]=useState({label:"",color:COLORS[0]});const [loading,setLoading]=useState(false);

  async function handleAddAgent(){
    if(!newAgent.first_name||!newAgent.email||!newAgent.password)return;setLoading(true);
    try{const data=await apiFetch("/auth/register",token,{method:"POST",body:JSON.stringify(newAgent)});
      if(data.agent){onAgentAdded({id:data.agent.id,name:`${newAgent.first_name} ${newAgent.last_name}`,email:newAgent.email,role:newAgent.role,team:newAgent.team,avatar:getInitials(`${newAgent.first_name} ${newAgent.last_name}`)});setAddModal(false);setNewAgent({first_name:"",last_name:"",email:"",password:"",role:"agent",team:""});showNotif("Agent ajouté ✅");}
      else showNotif(data.errors?.[0]?.msg||"Erreur","error");
    }catch{showNotif("Erreur","error");}setLoading(false);
  }
  async function handleAddTeam(){if(!newTeam.trim())return;try{const data=await apiFetch("/teams",token,{method:"POST",body:JSON.stringify({name:newTeam.trim()})});if(data.id){onTeamAdded(data);setNewTeam("");showNotif("Équipe ajoutée ✅");}}catch{showNotif("Erreur","error");}}
  async function handleDeleteTeam(team){try{await apiFetch(`/teams/${team.id}`,token,{method:"DELETE"});onTeamDeleted(team.id);showNotif("Équipe supprimée","error");}catch{showNotif("Erreur","error");}}
  async function handleAddLT(){if(!newLT.label.trim())return;try{const data=await apiFetch("/leave-types",token,{method:"POST",body:JSON.stringify({label:newLT.label.trim(),color:newLT.color})});if(data.id){onLeaveTypeAdded({...data,bg:hexToLight(data.color)});setNewLT({label:"",color:COLORS[0]});showNotif("Type ajouté ✅");}}catch{showNotif("Erreur","error");}}
  async function handleUpdateLT(lt,newLabel){try{await apiFetch(`/leave-types/${lt.id}`,token,{method:"PATCH",body:JSON.stringify({label:newLabel})});onLeaveTypeUpdated(lt.id,{label:newLabel});setEditLT(null);showNotif("Modifié ✅");}catch{showNotif("Erreur","error");}}
  async function handleDeleteLT(lt){try{await apiFetch(`/leave-types/${lt.id}`,token,{method:"DELETE"});onLeaveTypeDeleted(lt.id);showNotif("Type supprimé","error");}catch{showNotif("Erreur","error");}}

  return(
    <div style={{padding:24,animation:"fadeIn 0.3s ease"}}>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[{id:"agents",icon:"👥",label:"Agents"},{id:"teams",icon:"🏢",label:"Équipes"},{id:"leavetypes",icon:"🏷",label:"Types de congés"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 18px",borderRadius:10,border:"none",background:tab===t.id?"linear-gradient(135deg,#667eea,#764ba2)":"#fff",color:tab===t.id?"#fff":"#6b7280",cursor:"pointer",fontSize:13,fontWeight:600,boxShadow:tab===t.id?"0 4px 14px rgba(102,126,234,0.3)":"0 1px 4px rgba(0,0,0,0.06)"}}>{t.icon} {t.label}</button>
        ))}
      </div>
      {tab==="agents"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontSize:14,color:"#6b7280"}}>{agents.length} agents</span>
            <button onClick={()=>setAddModal(true)} className="btn-primary" style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Ajouter</button>
          </div>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #f1f5f9",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #f1f5f9"}}>
                {["Agent","Email","Équipe","Rôle","Actions"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>)}
              </tr></thead>
              <tbody>{agents.map(a=>(
                <tr key={a.id} style={{borderBottom:"1px solid #f8fafc"}}>
                  <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,hsl(${agentHue(a.id)},55%,55%),hsl(${agentHue(a.id)+30},65%,65%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>{a.avatar}</div><span style={{fontWeight:600,fontSize:13,color:"#1e293b"}}>{a.name}</span></div></td>
                  <td style={{padding:"12px 16px",fontSize:12,color:"#94a3b8"}}>{a.email}</td>
                  <td style={{padding:"12px 16px",fontSize:12,color:"#64748b"}}>{a.team||"—"}</td>
                  <td style={{padding:"12px 16px"}}><span style={{background:a.role==="admin"?"#fef3c7":a.role==="manager"?"#ede9fe":"#dcfce7",color:a.role==="admin"?"#92400e":a.role==="manager"?"#5b21b6":"#166534",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{a.role==="admin"?"👑 Admin":a.role==="manager"?"👑 Manager":"Agent"}</span></td>
                  <td style={{padding:"12px 16px"}}><div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{
                      const parts=a.name.split(" ");
                      setEditModal(a);
                      setEditData({first_name:parts[0]||"",last_name:parts.slice(1).join(" ")||"",email:a.email,team:a.team,role:a.role,password:""});
                    }} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#64748b"}}>✏️ Modifier</button>
                    {a.role!=="admin"&&<button onClick={()=>setDeleteModal(a)} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#ef4444"}}>🗑</button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      {tab==="teams"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <input value={newTeam} onChange={e=>setNewTeam(e.target.value)} placeholder="Nom de la nouvelle équipe..." onKeyDown={e=>e.key==="Enter"&&handleAddTeam()} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}/>
            <button onClick={handleAddTeam} className="btn-primary" style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>+ Ajouter</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {teams.map(team=>(
              <div key={team.id||team.name} className="card" style={{background:"#fff",borderRadius:12,border:"1px solid #f1f5f9",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏢</div><div><div style={{fontWeight:600,color:"#1e293b",fontSize:14}}>{team.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{agents.filter(a=>a.team===team.name).length} agents</div></div></div>
                {team.name!=="Admin"&&<button onClick={()=>handleDeleteTeam(team)} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#ef4444",fontWeight:600}}>🗑</button>}
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="leavetypes"&&(
        <div>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #f1f5f9",padding:20,marginBottom:16,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#1e293b"}}>➕ Nouveau type de congé</h3>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input value={newLT.label} onChange={e=>setNewLT(p=>({...p,label:e.target.value}))} placeholder="Ex: Congé sans solde" style={{flex:1,minWidth:160,padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{COLORS.map(c=><button key={c} onClick={()=>setNewLT(p=>({...p,color:c}))} style={{width:26,height:26,borderRadius:8,background:c,border:newLT.color===c?"3px solid #1e293b":"2px solid transparent",cursor:"pointer",transition:"all 0.15s"}}/>)}</div>
              <button onClick={handleAddLT} className="btn-primary" style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>Ajouter</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
            {leaveTypes.map(lt=>(
              <div key={lt.id} className="card" style={{background:"#fff",borderRadius:12,border:`1.5px solid ${lt.color}30`,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                {editLT===lt.id?(
                  <div><input defaultValue={lt.label} id={`elt-${lt.id}`} style={{width:"100%",padding:"8px",borderRadius:6,border:"1.5px solid #e5e7eb",fontSize:13,boxSizing:"border-box",marginBottom:8,transition:"all 0.2s"}}/>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>handleUpdateLT(lt,document.getElementById(`elt-${lt.id}`).value)} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>Enregistrer</button>
                      <button onClick={()=>setEditLT(null)} style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:12,color:"#6b7280"}}>Annuler</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:14,height:14,borderRadius:4,background:lt.color}}/><span style={{fontWeight:600,fontSize:14,color:"#1e293b"}}>{lt.label}</span></div>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>setEditLT(lt.id)} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#64748b"}}>✏️</button>
                      <button onClick={()=>handleDeleteLT(lt)} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#ef4444"}}>🗑</button>
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
          <div><label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Équipe</label>
            <select value={newAgent.team} onChange={e=>setNewAgent(p=>({...p,team:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}>
              <option value="">-- Choisir --</option>{teams.map(t=><option key={t.id||t.name} value={t.name}>{t.name}</option>)}
            </select></div>
          <div><label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Rôle</label>
            <select value={newAgent.role} onChange={e=>setNewAgent(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}>
              <option value="agent">Agent</option><option value="manager">Manager 👑</option>
            </select></div>
        </div>
        <ModalButtons onCancel={()=>setAddModal(false)} onConfirm={handleAddAgent} confirmLabel={loading?"En cours...":"Ajouter"} disabled={loading}/>
      </Modal>}
      {editModal&&<Modal title={`✏️ Modifier — ${editModal.name}`}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <Field label="Prénom" value={editData.first_name} onChange={v=>setEditData(p=>({...p,first_name:v}))} placeholder="Jean"/>
          <Field label="Nom" value={editData.last_name} onChange={v=>setEditData(p=>({...p,last_name:v}))} placeholder="Dupont"/>
        </div>
        <Field label="Email" value={editData.email} onChange={v=>setEditData(p=>({...p,email:v}))} style={{marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Équipe</label>
            <select value={editData.team||""} onChange={e=>setEditData(p=>({...p,team:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}>
              <option value="">-- Aucune équipe --</option>{teams.map(t=><option key={t.id||t.name} value={t.name}>{t.name}</option>)}
            </select></div>
          <div><label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Rôle</label>
            <select value={editData.role||"agent"} onChange={e=>setEditData(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"10px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,transition:"all 0.2s"}}>
              <option value="agent">Agent</option><option value="manager">Manager 👑</option>
            </select></div>
        </div>
        <Field label="Nouveau mot de passe (vide = inchangé)" value={editData.password} onChange={v=>setEditData(p=>({...p,password:v}))} placeholder="••••••••" style={{marginBottom:20}}/>
        <ModalButtons onCancel={()=>setEditModal(null)} onConfirm={async()=>{
          try{
            await apiFetch(`/agents/${editModal.id}`,token,{method:"PATCH",body:JSON.stringify({first_name:editData.first_name,last_name:editData.last_name,team:editData.team,role:editData.role,email:editData.email,...(editData.password?{password:editData.password}:{})})});
          }catch(e){console.error(e);}
          const newName=`${editData.first_name} ${editData.last_name}`.trim();
          onAgentUpdated(editModal.id,{...editData,name:newName,avatar:getInitials(newName)});
          setEditModal(null);showNotif("Agent modifié ✅");
        }} confirmLabel="Enregistrer"/>
      </Modal>}
      {deleteModal&&<Modal title="🗑 Supprimer l'agent">
        <p style={{color:"#6b7280",fontSize:14,margin:"0 0 20px"}}>Supprimer <strong>{deleteModal.name}</strong> ? Cette action est irréversible.</p>
        <ModalButtons onCancel={()=>setDeleteModal(null)} onConfirm={async()=>{
          try{await apiFetch(`/agents/${deleteModal.id}`,token,{method:"DELETE"});}catch(e){console.error(e);}
          onAgentDeleted(deleteModal.id);setDeleteModal(null);showNotif("Agent supprimé","error");
        }} confirmLabel="Supprimer" confirmColor="#ef4444"/>
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
  const [planView,setPlanView]=useState("month");
  const [weekAnchor,setWeekAnchor]=useState(new Date(now.getFullYear(),now.getMonth(),now.getDate()));
  const [filterTeam,setFilterTeam]=useState("Tous");
  const [filterStatus,setFilterStatus]=useState("all");
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
  const feries=getFeries(year);

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
        for(let d=new Date(l.start_date);d<=new Date(l.end_date);d.setDate(d.getDate()+1)){
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

  // Semaine
  const weekDays=getWeekDays(weekAnchor.getFullYear(),weekAnchor.getMonth(),weekAnchor.getDate());

  function getLeaveForDay(agentId,day){
    const k=dateKey(year,month,day);
    const leave=leaves[agentId]?.[k];
    if(!leave)return null;
    if(filterStatus==="approved"&&leave.status!=="approved")return null;
    if(filterStatus==="pending"&&leave.status!=="pending")return null;
    return leave;
  }

  function getLeaveForKey(agentId,k){
    const leave=leaves[agentId]?.[k];
    if(!leave)return null;
    if(filterStatus==="approved"&&leave.status!=="approved")return null;
    if(filterStatus==="pending"&&leave.status!=="pending")return null;
    return leave;
  }

  // Nombre d'absents par jour
  function countAbsents(k){
    return filteredAgents.filter(a=>{
      const l=leaves[a.id]?.[k];
      return l&&(l.status==="approved"||(l.status==="pending"&&isManager));
    }).length;
  }

  // Click cellule vue mois (inchangé)
  async function handleCellClick(agentId,day){
    if(contextMenu){setContextMenu(null);return;}
    if(isWeekend(year,month,day))return;
    const k=dateKey(year,month,day);
    if(feries[k]&&!isManager)return;
    if(!isManager&&currentUser.id!==agentId)return;
    if(!selectedAgent||selectedAgent!==agentId){setSelectedAgent(agentId);setSelectionStart(day);}
    else{
      const start=Math.min(selectionStart,day),end=Math.max(selectionStart,day);
      setSelectionStart(null);setSelectedAgent(null);
      if(isManager){
        try{await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:currentLT.code,start_date:dateKey(year,month,start),end_date:dateKey(year,month,end),agent_id:agentId})});await loadLeaves(leaveTypes,token,year,month);showNotif("Congé sauvegardé ✅");}
        catch{showNotif("Erreur sauvegarde","error");}
      }else{
        const allowedTypes=leaveTypes.filter(t=>AGENT_ALLOWED_CODES.includes(t.code));
        if(!AGENT_ALLOWED_CODES.includes(currentLT?.code)&&allowedTypes.length>0)setSelectedLTId(allowedTypes[0].id);
        setRequestModal({agentId,start:dateKey(year,month,start),end:dateKey(year,month,end)});setRequestReason("");
      }
    }
  }

  // Click cellule vue semaine (via clé string)
  const [weekSelStart,setWeekSelStart]=useState(null);
  const [weekSelAgent,setWeekSelAgent]=useState(null);
  const [weekHovered,setWeekHovered]=useState(null);

  async function handleWeekCellClick(agentId,dateObj){
    if(contextMenu){setContextMenu(null);return;}
    const dow=dateObj.getDay();if(dow===0||dow===6)return;
    const k=dKey(dateObj);
    const feriesWeek=getFeries(dateObj.getFullYear());
    if(feriesWeek[k]&&!isManager)return;
    if(!isManager&&currentUser.id!==agentId)return;
    if(!weekSelAgent||weekSelAgent!==agentId){setWeekSelAgent(agentId);setWeekSelStart(k);}
    else{
      const start=weekSelStart<k?weekSelStart:k;
      const end=weekSelStart<k?k:weekSelStart;
      setWeekSelStart(null);setWeekSelAgent(null);
      if(isManager){
        try{await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:currentLT.code,start_date:start,end_date:end,agent_id:agentId})});await loadLeaves(leaveTypes,token,year,month);showNotif("Congé sauvegardé ✅");}
        catch{showNotif("Erreur sauvegarde","error");}
      }else{
        const allowedTypes=leaveTypes.filter(t=>AGENT_ALLOWED_CODES.includes(t.code));
        if(!AGENT_ALLOWED_CODES.includes(currentLT?.code)&&allowedTypes.length>0)setSelectedLTId(allowedTypes[0].id);
        setRequestModal({agentId,start,end});setRequestReason("");
      }
    }
  }

  function isWeekInSel(agentId,k){
    if(weekSelAgent!==agentId||!weekSelStart||!weekHovered)return false;
    const [s,e]=weekSelStart<weekHovered?[weekSelStart,weekHovered]:[weekHovered,weekSelStart];
    return k>=s&&k<=e;
  }

  function handleCellRightClick(e,agentId,day){
    e.preventDefault();e.stopPropagation();
    if(currentUser.id!==agentId&&!isManager)return;
    const leave=leaves[agentId]?.[dateKey(year,month,day)];
    if(!leave||!leave.leaveId)return;
    setContextMenu({x:e.clientX,y:e.clientY,agentId,day,leave,leaveId:leave.leaveId,clickedDate:dateKey(year,month,day)});
  }

  function handleWeekCellRightClick(e,agentId,dateObj){
    e.preventDefault();e.stopPropagation();
    if(currentUser.id!==agentId&&!isManager)return;
    const k=dKey(dateObj);const leave=leaves[agentId]?.[k];
    if(!leave||!leave.leaveId)return;
    setContextMenu({x:e.clientX,y:e.clientY,agentId,leave,leaveId:leave.leaveId,clickedDate:k});
  }

  async function handleDeleteAll(){
    if(!contextMenu)return;const{leaveId}=contextMenu;setContextMenu(null);
    try{await apiFetch(`/leaves/${leaveId}`,token,{method:"DELETE"});await loadLeaves(leaveTypes,token,year,month);showNotif("Congé supprimé ✅");}
    catch{showNotif("Erreur","error");}
  }

  async function handleDeleteDay(){
    if(!contextMenu)return;const{leaveId,clickedDate,leave,agentId}=contextMenu;setContextMenu(null);
    try{
      await apiFetch(`/leaves/${leaveId}`,token,{method:"DELETE"});
      const start=leave.leaveStart,end=leave.leaveEnd,code=leave.leaveCode||leave.code;
      if(compareDates(start,clickedDate)<0)await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:code,start_date:start,end_date:addDays(clickedDate,-1),agent_id:agentId})});
      if(compareDates(clickedDate,end)<0)await apiFetch("/leaves",token,{method:"POST",body:JSON.stringify({leave_type_code:code,start_date:addDays(clickedDate,1),end_date:end,agent_id:agentId})});
      await loadLeaves(leaveTypes,token,year,month);showNotif("Jour supprimé ✅");
    }catch(e){console.error(e);showNotif("Erreur","error");}
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
      await loadLeaves(leaveTypes,token,year,month);showNotif("Demande approuvée ✅");
    }catch{showNotif("Erreur","error");}
  }

  async function rejectRequest(reqId){
    try{
      await apiFetch(`/leaves/${reqId}/reject`,token,{method:"PATCH",body:JSON.stringify({manager_comment:rejectComment})});
      setRequests(prev=>prev.map(r=>r.id===reqId?{...r,status:"rejected",comment:rejectComment}:r));
      await loadLeaves(leaveTypes,token,year,month);setRejectModal(null);showNotif("Demande refusée","error");
    }catch{showNotif("Erreur","error");}
  }

  function isInSelection(agentId,day){
    if(selectedAgent!==agentId||selectionStart===null||hoveredDay===null)return false;
    return day>=Math.min(selectionStart,hoveredDay)&&day<=Math.max(selectionStart,hoveredDay);
  }

  function weekLabel(){
    const f=weekDays[0],l=weekDays[6];
    if(f.getMonth()===l.getMonth())return `${f.getDate()} – ${l.getDate()} ${MONTHS_FR[f.getMonth()]} ${f.getFullYear()}`;
    return `${f.getDate()} ${MONTHS_FR[f.getMonth()]} – ${l.getDate()} ${MONTHS_FR[l.getMonth()]} ${f.getFullYear()}`;
  }

  const navItems=[
    {id:"planning",icon:"🗓",label:"Planning"},
    {id:"validations",icon:"✅",label:"Validations",badge:validationBadge},
    {id:"stats",icon:"📊",label:"Statistiques"},
    ...(isAdmin?[{id:"admin",icon:"⚙️",label:"Administration"}]:[]),
  ];

  if(!dataLoaded)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f6fa",fontFamily:"'Outfit',sans-serif"}}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#667eea,#764ba2)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:16}}>📅</div>
        <div style={{fontSize:15,color:"#94a3b8",fontWeight:500}}>Chargement en cours...</div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:"'Outfit','Segoe UI',sans-serif",minHeight:"100vh",background:"#f5f6fa",display:"flex"}}
      onClick={()=>{if(contextMenu)setContextMenu(null);}}>
      <style>{GLOBAL_STYLE}</style>

      {notification&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:notification.type==="error"?"#fef2f2":"#f0fdf4",border:`1px solid ${notification.type==="error"?"#fecaca":"#bbf7d0"}`,color:notification.type==="error"?"#dc2626":"#16a34a",padding:"12px 20px",borderRadius:12,fontWeight:600,fontSize:14,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",animation:"slideIn 0.3s ease"}}>{notification.msg}</div>}
      {contextMenu&&<ContextMenu x={contextMenu.x} y={contextMenu.y} leave={contextMenu.leave} onDeleteDay={handleDeleteDay} onDeleteAll={handleDeleteAll} onClose={()=>setContextMenu(null)}/>}

      {/* SIDEBAR */}
      <aside style={{width:230,background:"linear-gradient(180deg,#1e1b4b 0%,#312e81 100%)",color:"#fff",display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0,boxShadow:"4px 0 20px rgba(0,0,0,0.1)"}}>
        <div style={{padding:"0 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 12px rgba(102,126,234,0.4)"}}>📅</div>
            <div><div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:"-0.3px"}}>PlanniPro</div><div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Gestion des présences</div></div>
          </div>
        </div>
        <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{position:"relative"}}>
              <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,hsl(${agentHue(currentUser.id)},55%,50%),hsl(${agentHue(currentUser.id)+40},65%,60%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700}}>
                {currentUser.avatar_initials||getInitials(`${currentUser.first_name||""} ${currentUser.last_name||""}`)}
              </div>
              <div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:"#34d399",border:"2px solid #1e1b4b"}}/>
            </div>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.first_name} {currentUser.last_name}</div>
              <div style={{fontSize:10,color:currentUser.role==="admin"?"#fbbf24":currentUser.role==="manager"?"#c4b5fd":"#6ee7b7",fontWeight:500}}>{currentUser.role==="admin"?"👑 Admin":currentUser.role==="manager"?"👑 Manager":"👤 Agent"}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{width:"100%",padding:"6px 0",borderRadius:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontSize:11,cursor:"pointer",fontWeight:600}}>🚪 Déconnexion</button>
        </div>
        <nav style={{padding:"12px",flex:1}}>
          {navItems.map(item=>(
            <button key={item.id} className="nav-btn" onClick={()=>{
              setView(item.id);
              if(item.id==="validations"&&!isManager){
                const newSeen=myRequests.filter(r=>r.status==="rejected").map(r=>r.id);
                setSeenRejected(newSeen);
                localStorage.setItem(`seenRejected_${currentUser.id}`,JSON.stringify(newSeen));
              }
            }} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",borderRadius:10,background:view===item.id?"rgba(255,255,255,0.12)":"transparent",color:view===item.id?"#fff":"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:14,fontWeight:view===item.id?600:400,marginBottom:2,boxShadow:view===item.id?"inset 0 0 0 1px rgba(255,255,255,0.15)":"none"}}>
              <span style={{fontSize:16}}>{item.icon}</span><span style={{flex:1,textAlign:"left"}}>{item.label}</span>
              {item.badge>0&&<span style={{background:"#e94560",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700}}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:10,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Légende</div>
          {leaveTypes.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:10,height:10,borderRadius:3,background:t.color}}/><span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{t.label}</span>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
            <div style={{width:10,height:10,borderRadius:3,border:"1.5px dashed #fbbf24",background:"#fef9ec"}}/><span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Jour férié</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,overflow:"auto"}}>
        <div style={{background:"#fff",borderBottom:"1px solid #f1f5f9",padding:"18px 28px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,color:"#1e293b",letterSpacing:"-0.3px"}}>
            {view==="planning"?"📅 Planning":view==="validations"?"✅ Demandes de congés":view==="stats"?"📊 Statistiques":"⚙️ Administration"}
          </h1>
          <p style={{margin:"2px 0 0",fontSize:13,color:"#94a3b8"}}>
            {view==="planning"?(planView==="month"?`${MONTHS_FR[month]} ${year}`:weekLabel()):view==="validations"?(isManager?`${pendingRequests.length} demande(s) en attente`:`${myRequests.length} demande(s) au total`):""}
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
            {/* Barre controls */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              {/* Mois/Semaine */}
              <div style={{display:"flex",background:"#f1f5f9",borderRadius:10,padding:3}}>
                <button onClick={()=>setPlanView("month")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:planView==="month"?"#fff":"transparent",color:planView==="month"?"#1e293b":"#64748b",cursor:"pointer",fontSize:12,fontWeight:600,boxShadow:planView==="month"?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>Mois</button>
                <button onClick={()=>setPlanView("week")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:planView==="week"?"#fff":"transparent",color:planView==="week"?"#1e293b":"#64748b",cursor:"pointer",fontSize:12,fontWeight:600,boxShadow:planView==="week"?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>Semaine</button>
              </div>
              {/* Navigation */}
              <div style={{display:"flex",alignItems:"center",gap:4,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"6px 10px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                <button onClick={()=>{
                  if(planView==="month"){if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}
                  else{const d=new Date(weekAnchor);d.setDate(d.getDate()-7);setWeekAnchor(d);setYear(d.getFullYear());setMonth(d.getMonth());}
                }} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#94a3b8",lineHeight:1,padding:"0 4px"}}>‹</button>
                <span style={{fontWeight:700,fontSize:14,color:"#1e293b",minWidth:planView==="month"?160:220,textAlign:"center"}}>
                  {planView==="month"?`${MONTHS_FR[month]} ${year}`:weekLabel()}
                </span>
                <button onClick={()=>{
                  if(planView==="month"){if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}
                  else{const d=new Date(weekAnchor);d.setDate(d.getDate()+7);setWeekAnchor(d);setYear(d.getFullYear());setMonth(d.getMonth());}
                }} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#94a3b8",lineHeight:1,padding:"0 4px"}}>›</button>
              </div>
              <button onClick={()=>{setYear(now.getFullYear());setMonth(now.getMonth());setWeekAnchor(new Date(now.getFullYear(),now.getMonth(),now.getDate()));}} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:"#64748b",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>Aujourd'hui</button>
              {/* Filtres équipe */}
              <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
                {allTeams.map(t=><button key={t} onClick={()=>setFilterTeam(t)} style={{padding:"6px 12px",borderRadius:20,border:"1.5px solid",fontSize:12,cursor:"pointer",fontWeight:500,background:filterTeam===t?"linear-gradient(135deg,#667eea,#764ba2)":"#fff",color:filterTeam===t?"#fff":"#64748b",borderColor:filterTeam===t?"#667eea":"#e2e8f0",transition:"all 0.2s"}}>{t}</button>)}
              </div>
            </div>

            {/* Types congés + filtre statut */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {leaveTypes.filter(t=>isManager||AGENT_ALLOWED_CODES.includes(t.code)).map(t=>(
                <button key={t.id} onClick={()=>setSelectedLTId(t.id)} style={{padding:"5px 14px",borderRadius:20,border:`2px solid ${t.color}`,fontSize:12,cursor:"pointer",fontWeight:600,background:selectedLTId===t.id?t.color:hexToLight(t.color),color:selectedLTId===t.id?"#fff":t.color,transition:"all 0.2s",boxShadow:selectedLTId===t.id?`0 4px 12px ${t.color}50`:"none"}}>{t.label}</button>
              ))}
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                {[{id:"all",label:"Tous"},{id:"approved",label:"✅ Approuvés"},{id:"pending",label:"🕐 En attente"}].map(f=>(
                  <button key={f.id} onClick={()=>setFilterStatus(f.id)} style={{padding:"5px 12px",borderRadius:20,border:"1.5px solid",fontSize:11,cursor:"pointer",fontWeight:600,background:filterStatus===f.id?"#1e293b":"#fff",color:filterStatus===f.id?"#fff":"#64748b",borderColor:filterStatus===f.id?"#1e293b":"#e2e8f0",transition:"all 0.2s"}}>{f.label}</button>
                ))}
              </div>
            </div>

            {/* Hint */}
            <div style={{fontSize:12,color:"#78350f",marginBottom:12,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"8px 14px"}}>
              {isManager?"👑 Clic gauche : ajouter — Clic droit : supprimer — 🗓 Jours fériés modifiables par manager":"👤 Sélectionnez des dates pour demander un congé — 🗓 Jours fériés bloqués"}
            </div>

            {/* ─── VUE MOIS ─── */}
            {planView==="month"&&(
              <div style={{background:"#fff",borderRadius:14,border:"1px solid #f1f5f9",overflow:"auto",boxShadow:"0 2px 16px rgba(0,0,0,0.06)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                  <colgroup><col style={{width:160}}/>{Array.from({length:daysInMonth},(_,i)=><col key={i}/>)}</colgroup>
                  <thead>
                    <tr>
                      <th style={{padding:"12px 16px",textAlign:"left",fontSize:10,color:"#94a3b8",fontWeight:600,borderBottom:"1px solid #f1f5f9",background:"#f8fafc",textTransform:"uppercase",letterSpacing:"0.5px"}}>AGENT</th>
                      {Array.from({length:daysInMonth},(_,i)=>{
                        const day=i+1,k=dateKey(year,month,day),wk=isWeekend(year,month,day),isToday=todayDay===day,isFer=!!feries[k];
                        const absent=countAbsents(k);
                        return<th key={i} style={{padding:"4px 2px",textAlign:"center",fontSize:9,fontWeight:600,background:isToday?"#eef2ff":isFer?"#fef9ec":wk?"#fafafa":"#f8fafc",color:isToday?"#6366f1":isFer?"#d97706":wk?"#d1d5db":"#94a3b8",borderBottom:`2px solid ${isToday?"#6366f1":isFer?"#fde68a":"#f1f5f9"}`,borderLeft:"1px solid #f8fafc",minWidth:26}}>
                          <div style={{textTransform:"uppercase"}}>{DAYS_FR[(i+firstDay)%7].slice(0,1)}</div>
                          <div style={{fontSize:11,fontWeight:700,color:isToday?"#6366f1":isFer?"#d97706":wk?"#e2e8f0":"#475569",marginTop:1}}>{day}</div>
                          {isFer&&!wk&&<div title={feries[k]} style={{fontSize:8,color:"#f59e0b"}}>🗓</div>}
                          {isToday&&<div style={{width:4,height:4,borderRadius:"50%",background:"#6366f1",margin:"1px auto 0"}}/>}
                          {!wk&&!isFer&&absent>0&&<div style={{fontSize:8,color:"#fff",background:"#94a3b8",borderRadius:4,padding:"0 3px",margin:"1px auto 0",display:"inline-block",fontWeight:700}}>{absent}</div>}
                        </th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map(agent=>(
                      <tr key={agent.id} style={{borderBottom:"1px solid #f8fafc"}}>
                        <td style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8,background:"#fff"}}>
                          <div style={{width:30,height:30,borderRadius:9,background:`linear-gradient(135deg,hsl(${agentHue(agent.id)},55%,55%),hsl(${agentHue(agent.id)+30},65%,65%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{agent.avatar}</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:agent.id===currentUser.id?"#6366f1":"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>{agent.name.split(" ")[0]} {agent.role==="manager"?"👑":""}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>{agent.team}</div>
                          </div>
                        </td>
                        {Array.from({length:daysInMonth},(_,i)=>{
                          const day=i+1,k=dateKey(year,month,day),wk=isWeekend(year,month,day),isFer=!!feries[k];
                          const leave=getLeaveForDay(agent.id,day),inSel=isInSelection(agent.id,day),isToday=todayDay===day;
                          const canInteract=(isManager||currentUser.id===agent.id)&&!wk&&(!isFer||isManager);
                          return<td key={i}
                            onClick={()=>canInteract&&handleCellClick(agent.id,day)}
                            onContextMenu={e=>!wk&&handleCellRightClick(e,agent.id,day)}
                            onMouseEnter={()=>{if(selectedAgent===agent.id)setHoveredDay(day);}}
                            onMouseLeave={()=>setHoveredDay(null)}
                            className={canInteract?"cell-hover":""}
                            title={isFer?`🗓 ${feries[k]}`:""}
                            style={{padding:"3px 2px",textAlign:"center",cursor:canInteract?"pointer":"default",background:wk?"#fafafa":isFer?"#fef9ec":inSel?"#e0e7ff":isToday?"#f5f3ff":"#fff",borderLeft:"1px solid #f8fafc"}}>
                            {isFer&&!wk&&<div style={{width:"calc(100% - 4px)",height:24,margin:"0 2px",background:"rgba(251,191,36,0.15)",border:"1.5px dashed #fbbf24",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"#d97706",fontWeight:700}}>🗓</span></div>}
                            {leave&&!wk&&!isFer&&<div style={{width:"calc(100% - 4px)",height:24,margin:"0 2px",background:leave.status==="pending"?hexToLight(leave.color):leave.color,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:leave.status==="pending"?"none":`0 2px 6px ${leave.color}50`,border:leave.status==="pending"?`1.5px dashed ${leave.color}`:"none"}}>
                              <span style={{fontSize:8,color:leave.status==="pending"?leave.color:"#fff",fontWeight:700,letterSpacing:"0.3px"}}>{leave.status==="pending"?"?":leaveAbbr(leave.label)}</span>
                            </div>}
                            {inSel&&!leave&&!isFer&&<div style={{width:"calc(100% - 4px)",height:24,margin:"0 2px",borderRadius:5,background:"#c7d2fe",border:"1.5px solid #818cf8"}}/>}
                          </td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── VUE SEMAINE ─── */}
            {planView==="week"&&(
              <div style={{background:"#fff",borderRadius:14,border:"1px solid #f1f5f9",overflow:"auto",boxShadow:"0 2px 16px rgba(0,0,0,0.06)"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <th style={{width:160,padding:"12px 16px",textAlign:"left",fontSize:10,color:"#94a3b8",fontWeight:600,borderBottom:"1px solid #f1f5f9",background:"#f8fafc",textTransform:"uppercase",letterSpacing:"0.5px"}}>AGENT</th>
                      {weekDays.map((d,i)=>{
                        const k=dKey(d),wk=d.getDay()===0||d.getDay()===6,isToday=k===dKey(now);
                        const feriesDay=getFeries(d.getFullYear());
                        const isFer=!!feriesDay[k];
                        const absent=countAbsents(k);
                        return<th key={i} style={{padding:"10px 4px",textAlign:"center",fontSize:10,fontWeight:600,background:isToday?"#eef2ff":isFer?"#fef9ec":wk?"#fafafa":"#f8fafc",color:isToday?"#6366f1":isFer?"#d97706":wk?"#d1d5db":"#94a3b8",borderBottom:`2px solid ${isToday?"#6366f1":isFer?"#fde68a":"#f1f5f9"}`,borderLeft:"1px solid #f8fafc"}}>
                          <div style={{textTransform:"uppercase",letterSpacing:"0.5px"}}>{DAYS_FR[i]}</div>
                          <div style={{fontSize:20,fontWeight:800,color:isToday?"#6366f1":isFer?"#d97706":wk?"#e2e8f0":"#1e293b",marginTop:2}}>{d.getDate()}</div>
                          <div style={{fontSize:10,color:"#94a3b8"}}>{MONTHS_FR[d.getMonth()].slice(0,3)}</div>
                          {isFer&&<div style={{fontSize:9,color:"#d97706",marginTop:2}} title={feriesDay[k]}>🗓 {feriesDay[k]}</div>}
                          {!wk&&!isFer&&absent>0&&<div style={{marginTop:4,fontSize:9,color:"#fff",background:"#94a3b8",borderRadius:6,padding:"1px 5px",display:"inline-block",fontWeight:700}}>{absent} absent{absent>1?"s":""}</div>}
                        </th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map(agent=>(
                      <tr key={agent.id} style={{borderBottom:"1px solid #f8fafc"}}>
                        <td style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8,background:"#fff"}}>
                          <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,hsl(${agentHue(agent.id)},55%,55%),hsl(${agentHue(agent.id)+30},65%,65%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{agent.avatar}</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:agent.id===currentUser.id?"#6366f1":"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>{agent.name.split(" ")[0]} {agent.role==="manager"?"👑":""}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>{agent.team}</div>
                          </div>
                        </td>
                        {weekDays.map((d,i)=>{
                          const k=dKey(d),wk=d.getDay()===0||d.getDay()===6;
                          const feriesDay=getFeries(d.getFullYear());
                          const isFer=!!feriesDay[k];
                          const leave=getLeaveForKey(agent.id,k);
                          const inSel=isWeekInSel(agent.id,k);
                          const isToday=k===dKey(now);
                          const canInteract=(isManager||currentUser.id===agent.id)&&!wk&&(!isFer||isManager);
                          return<td key={i}
                            onClick={()=>canInteract&&handleWeekCellClick(agent.id,d)}
                            onContextMenu={e=>!wk&&handleWeekCellRightClick(e,agent.id,d)}
                            onMouseEnter={()=>{if(weekSelAgent===agent.id)setWeekHovered(k);}}
                            onMouseLeave={()=>setWeekHovered(null)}
                            className={canInteract?"cell-hover":""}
                            title={isFer?`🗓 ${feriesDay[k]}`:""}
                            style={{padding:"4px 3px",textAlign:"center",cursor:canInteract?"pointer":"default",background:wk?"#fafafa":isFer?"#fef9ec":inSel?"#e0e7ff":isToday?"#f5f3ff":"#fff",borderLeft:"1px solid #f8fafc",height:50,verticalAlign:"middle"}}>
                            {isFer&&!wk&&<div style={{width:"calc(100% - 6px)",height:30,margin:"0 3px",background:"rgba(251,191,36,0.15)",border:"1.5px dashed #fbbf24",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"#d97706",fontWeight:700}}>🗓</span></div>}
                            {leave&&!wk&&!isFer&&<div style={{width:"calc(100% - 6px)",height:30,margin:"0 3px",background:leave.status==="pending"?hexToLight(leave.color):leave.color,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:leave.status==="pending"?"none":`0 2px 8px ${leave.color}50`,border:leave.status==="pending"?`1.5px dashed ${leave.color}`:"none"}}>
                              <span style={{fontSize:10,color:leave.status==="pending"?leave.color:"#fff",fontWeight:700}}>{leave.status==="pending"?"?":leaveAbbr(leave.label)}</span>
                            </div>}
                            {inSel&&!leave&&!isFer&&<div style={{width:"calc(100% - 6px)",height:30,margin:"0 3px",borderRadius:6,background:"#c7d2fe",border:"1.5px solid #818cf8"}}/>}
                          </td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view==="validations"&&(
          <div style={{padding:24,animation:"fadeIn 0.3s ease"}}>
            {isManager?(
              <>
                {pendingRequests.length===0&&requests.filter(r=>r.status!=="pending").length===0&&<div style={{background:"#fff",borderRadius:16,border:"1px solid #f1f5f9",padding:60,textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}><div style={{fontSize:"3rem",marginBottom:12}}>🎉</div><div style={{fontSize:16,fontWeight:600,color:"#94a3b8"}}>Aucune demande</div></div>}
                {pendingRequests.length>0&&<><div style={{fontSize:13,fontWeight:700,marginBottom:16,color:"#d97706",textTransform:"uppercase",letterSpacing:"0.5px"}}>🕐 En attente · {pendingRequests.length}</div>{pendingRequests.map(req=><RequestCard key={req.id} req={req} isManager onApprove={()=>approveRequest(req.id)} onReject={()=>{setRejectModal(req.id);setRejectComment("");}}/>)}</>}
                {requests.filter(r=>r.status!=="pending").length>0&&<><div style={{fontSize:13,fontWeight:700,margin:"28px 0 16px",color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px"}}>📋 Historique</div>{requests.filter(r=>r.status!=="pending").map(req=><RequestCard key={req.id} req={req} isManager/>)}</>}
              </>
            ):(
              <>
                <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:12,padding:16,marginBottom:24,fontSize:13,color:"#4338ca"}}>💡 Sélectionnez des dates dans le planning pour envoyer une demande de congé.</div>
                {myRequests.length===0&&<div style={{background:"#fff",borderRadius:16,border:"1px solid #f1f5f9",padding:60,textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}><div style={{fontSize:"3rem",marginBottom:12}}>📝</div><div style={{fontSize:16,fontWeight:600,color:"#94a3b8"}}>Aucune demande</div></div>}
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
                return<div key={t.id} className="card" style={{background:"#fff",borderRadius:14,border:`2px solid ${t.color}20`,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:`${t.color}15`}}/>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><div style={{width:12,height:12,borderRadius:4,background:t.color}}/><span style={{fontSize:12,color:"#64748b",fontWeight:500}}>{t.label}</span></div>
                  <div style={{fontSize:40,fontWeight:800,color:t.color,letterSpacing:"-1px"}}>{count}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontWeight:500}}>jours ce mois</div>
                </div>;
              })}
            </div>
          </div>
        )}
      </main>

      {requestModal&&currentLT&&<Modal title="📝 Nouvelle demande de congé">
        <p style={{color:"#64748b",fontSize:13,margin:"0 0 20px"}}>Du <strong style={{color:"#1e293b"}}>{formatDate(requestModal.start)}</strong> au <strong style={{color:"#1e293b"}}>{formatDate(requestModal.end)}</strong></p>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>Type de congé</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {leaveTypes.filter(t=>isManager||AGENT_ALLOWED_CODES.includes(t.code)).map(t=>(
              <button key={t.id} onClick={()=>setSelectedLTId(t.id)} style={{padding:"6px 14px",borderRadius:20,border:`2px solid ${t.color}`,fontSize:12,cursor:"pointer",fontWeight:600,background:selectedLTId===t.id?t.color:hexToLight(t.color),color:selectedLTId===t.id?"#fff":t.color,transition:"all 0.2s"}}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>Motif (optionnel)</label>
          <textarea value={requestReason} onChange={e=>setRequestReason(e.target.value)} rows={3} placeholder="Précisez si nécessaire..." style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,boxSizing:"border-box",resize:"none",transition:"all 0.2s"}}/>
        </div>
        <ModalButtons onCancel={()=>setRequestModal(null)} onConfirm={submitRequest} confirmLabel="Envoyer la demande"/>
      </Modal>}

      {rejectModal&&<Modal title="❌ Refuser la demande">
        <textarea value={rejectComment} onChange={e=>setRejectComment(e.target.value)} placeholder="Motif du refus (obligatoire)..." rows={3} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,boxSizing:"border-box",resize:"none",marginBottom:20,transition:"all 0.2s"}}/>
        <ModalButtons onCancel={()=>setRejectModal(null)} onConfirm={()=>rejectRequest(rejectModal)} confirmLabel="Confirmer le refus" confirmColor={rejectComment.trim()?"#ef4444":"#fca5a5"} disabled={!rejectComment.trim()}/>
      </Modal>}
    </div>
  );
}

function RequestCard({req,isManager,onApprove,onReject}){
  const s={
    pending:{label:"En attente",bg:"#fffbeb",color:"#d97706",border:"#fde68a",icon:"🕐"},
    approved:{label:"Approuvée",bg:"#f0fdf4",color:"#16a34a",border:"#bbf7d0",icon:"✅"},
    rejected:{label:"Refusée",bg:"#fef2f2",color:"#dc2626",border:"#fecaca",icon:"❌"}
  }[req.status]||{label:req.status,bg:"#f8fafc",color:"#64748b",border:"#e2e8f0",icon:"•"};
  return(
    <div className="card" style={{background:"#fff",borderRadius:14,border:"1px solid #f1f5f9",padding:20,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,hsl(${agentHue(req.agentId)},55%,55%),hsl(${agentHue(req.agentId)+30},65%,65%))`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700}}>{req.agentAvatar}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{req.agentName}</div><div style={{fontSize:12,color:"#94a3b8"}}>{req.agentTeam}</div></div>
        <div style={{background:s.bg,color:s.color,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,border:`1px solid ${s.border}`}}>{s.icon} {s.label}</div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:req.reason?10:0}}>
        <div style={{background:"#f8fafc",border:"1px solid #f1f5f9",borderRadius:8,padding:"8px 14px"}}>
          <div style={{fontSize:10,color:"#94a3b8",marginBottom:2,textTransform:"uppercase",letterSpacing:"0.3px"}}>Période</div>
          <div style={{fontSize:13,fontWeight:600,color:"#475569"}}>{req.start===req.end?formatDate(req.start):`${formatDate(req.start)} → ${formatDate(req.end)}`}</div>
        </div>
        <div style={{background:hexToLight(req.leaveType?.color||"#6366f1"),border:`1px solid ${req.leaveType?.color||"#6366f1"}30`,borderRadius:8,padding:"8px 14px"}}>
          <div style={{fontSize:10,color:"#94a3b8",marginBottom:2,textTransform:"uppercase",letterSpacing:"0.3px"}}>Type</div>
          <div style={{fontSize:13,fontWeight:600,color:req.leaveType?.color}}>{req.leaveType?.label}</div>
        </div>
      </div>
      {req.reason&&<div style={{fontSize:12,color:"#64748b",background:"#f8fafc",border:"1px solid #f1f5f9",padding:"8px 12px",borderRadius:8,marginBottom:10}}>💬 {req.reason}</div>}
      {req.comment&&<div style={{fontSize:12,color:"#dc2626",background:"#fef2f2",border:"1px solid #fecaca",padding:"8px 12px",borderRadius:8,marginBottom:10}}>❌ {req.comment}</div>}
      {isManager&&req.status==="pending"&&<div style={{display:"flex",gap:8,marginTop:14}}>
        <button onClick={onApprove} className="btn-primary" style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>✅ Approuver</button>
        <button onClick={onReject} style={{flex:1,padding:"9px 0",borderRadius:8,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",fontSize:13,fontWeight:600}}>❌ Refuser</button>
      </div>}
    </div>
  );
}

export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  if(!currentUser)return <LoginPage onLogin={setCurrentUser}/>;
  return <PlanningApp currentUser={currentUser} onLogout={()=>setCurrentUser(null)}/>;
}
