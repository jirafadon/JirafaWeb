script>
// ═══════════════════════════════════════════════════════════════════════════
// LICENSE TYPES  — code shows in cell like the paper diagram
// ═══════════════════════════════════════════════════════════════════════════
const LIC = {
  V:  {name:'Vacaciones',           color:'#3dba78'},
  DC: {name:'Desc. Compensatorio',  color:'#4a9eda'},
  PG: {name:'Permiso Guardia',      color:'#f5a623'},
  LM: {name:'Lic. Médica',          color:'#e05252'},
  LS: {name:'Lic. s/Sueldo',        color:'#f0a030'},
  LP: {name:'Lic. Parental',        color:'#b07ee8'},
  DP: {name:'Día Personal',         color:'#8a9ab5'},
};

const G_COLORS={A:'#f5a623',B:'#3dba78',C:'#4a9eda',D:'#b07ee8',E:'#e05252',OP:'#5ab8a8',REL:'#8a9ab5'};
const G_LABEL ={A:'Guardia A',B:'Guardia B',C:'Guardia C',D:'Guardia D',E:'Guardia E',OP:'Operador',REL:'Relevante'};

// Build legend
(function(){
  const lg=document.getElementById('lic-leg');
  Object.entries(LIC).forEach(([code,v])=>{
    const item=document.createElement('div');item.className='ll-item';
    const badge=document.createElement('span');badge.className='ll-badge';badge.style.background=v.color;badge.textContent=code;
    item.appendChild(badge);
    const nm=document.createElement('span');nm.style.cssText='font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--tdim)';nm.textContent=v.name;
    item.appendChild(nm);lg.appendChild(item);
  });
})();



// ═══════════════════════════════════════════════════════════════════════════
// ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════
const REF_DATE=new Date('2025-12-01T12:00:00');
const REF_POS={A:1,B:3,C:5,D:6,E:0};
const CYCLES={
  A:[[2,6],['F',1],[3,6],['F',1],[4,6],['F',2],[1,6],['F',2]],
  B:[[1,6],['F',2],[2,6],['F',1],[3,6],['F',1],[4,6],['F',2]],
  C:[[4,6],['F',2],[1,6],['F',2],[2,6],['F',1],[3,6],['F',1]],
  D:[[3,6],['F',1],[4,6],['F',2],[1,6],['F',2],[2,6],['F',1]],
  E:[[3,6],['F',1],[4,6],['F',2],[1,6],['F',2],[2,6],['F',1]],
};
function getTurno(g,ds){
  if(g==='OP'||g==='REL')return null; // no algorithmic turno
  const d=new Date(ds+'T12:00:00');
  const diff=Math.round((d-REF_DATE)/86400000);
  const cp=((REF_POS[g]+diff)%30+30)%30;
  let p=0;for(const[st,cnt]of CYCLES[g]){if(cp<p+cnt)return st;p+=cnt;}return'F';
}

// ═══════════════════════════════════════════════════════════════════════════
// FERIADOS
// ═══════════════════════════════════════════════════════════════════════════
const ferCache={};
function easterDate(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),dy=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,dy);}
function addDd(d,n){const nd=new Date(d);nd.setDate(nd.getDate()+n);return nd;}
function dk2(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function xfer(y,m,day){const d=new Date(y,m-1,day),dow=d.getDay();if(dow===2||dow===3)return addDd(d,-(dow-1));if(dow===4||dow===5)return addDd(d,8-dow);return d;}
function buildFutureHols(y){
  const map={};const add=(d,n,t='inamovible')=>{if(d&&d.getFullYear()===y)map[dk2(d)]={nombre:n,tipo:t};};
  add(new Date(y,0,1),'Año Nuevo');add(new Date(y,2,24),'Día Nacional de la Memoria');
  add(new Date(y,3,2),'Día del Veterano de Malvinas');add(new Date(y,4,1),'Día del Trabajador');
  add(new Date(y,4,25),'Día de la Revolución de Mayo');add(new Date(y,5,20),'Paso a la Inmortalidad del Gral. Belgrano');
  add(new Date(y,6,9),'Día de la Independencia');add(new Date(y,11,8),'Inmaculada Concepción');
  add(new Date(y,11,25),'Navidad');
  const easter=easterDate(y);
  add(addDd(easter,-48),'Carnaval (lunes)');add(addDd(easter,-47),'Carnaval (martes)');
  add(addDd(easter,-3),'Jueves Santo','no_laborable');add(addDd(easter,-2),'Viernes Santo');
  add(xfer(y,6,17),'Paso a la Inmortalidad del Gral. Güemes','trasladable');
  add(xfer(y,8,17),'Paso a la Inmortalidad del Gral. San Martín','trasladable');
  add(xfer(y,10,12),'Día del Respeto a la Diversidad Cultural','trasladable');
  add(xfer(y,11,20),'Día de la Soberanía Nacional','trasladable');
  return map;
}
async function getFeriados(y){
  if(ferCache[y])return ferCache[y];
  if(y>2026){ferCache[y]=buildFutureHols(y);return ferCache[y];}
  try{const r=await fetch('https://argentinadatos.com/v1/feriados/'+y);if(!r.ok)throw 0;const data=await r.json();const map={};data.forEach(f=>{map[f.fecha]={nombre:f.nombre,tipo:f.tipo};});ferCache[y]=map;}
  catch(e){ferCache[y]=buildFutureHols(y);}
  return ferCache[y];
}
function allFer(years){const m={};years.forEach(y=>{if(ferCache[y])Object.assign(m,ferCache[y]);});return m;}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════════
let USERS=[],EVENTS=[],ME=null,REL_SCHEDULE={},RECARGOS=[];

// ─── Persistencia con localStorage ───
function lsGet(key){try{const v=localStorage.getItem(key);return v?JSON.parse(v):null;}catch(e){return null;}}
function lsSet(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
function lsDel(key){try{localStorage.removeItem(key);}catch(e){}}

async function loadData(){
  USERS=lsGet('gd-users')||[];
  EVENTS=lsGet('gd-events')||[];
  ME=lsGet('gd-me')||null;
  REL_SCHEDULE=lsGet('gd-rel-sched')||{};
  RECARGOS=lsGet('gd-recargos')||[];
  // Fallback: try window.storage if available
  if(typeof window.storage!=='undefined'){
    try{const r=await window.storage.get('gd-users',true);if(r&&JSON.parse(r.value).length>0&&USERS.length===0)USERS=JSON.parse(r.value);}catch(e){}
    try{const r=await window.storage.get('gd-events',true);if(r&&JSON.parse(r.value).length>0&&EVENTS.length===0)EVENTS=JSON.parse(r.value);}catch(e){}
    try{const r=await window.storage.get('gd-me',false);if(r&&!ME)ME=JSON.parse(r.value);}catch(e){}
    try{const r=await window.storage.get('gd-rel-sched',true);if(r)REL_SCHEDULE=JSON.parse(r.value);}catch(e){}
    try{const r=await window.storage.get('gd-recargos',true);if(r)RECARGOS=JSON.parse(r.value);}catch(e){}
  }
}
async function saveRelSchedule(){
  lsSet('gd-rel-sched',REL_SCHEDULE);
  if(typeof window.storage!=='undefined')try{await window.storage.set('gd-rel-sched',JSON.stringify(REL_SCHEDULE),true);}catch(e){}
}
async function saveRecargos(){
  lsSet('gd-recargos',RECARGOS);
  if(typeof window.storage!=='undefined')try{await window.storage.set('gd-recargos',JSON.stringify(RECARGOS),true);}catch(e){}
}
async function saveUsers(){
  lsSet('gd-users',USERS);
  if(typeof window.storage!=='undefined')try{await window.storage.set('gd-users',JSON.stringify(USERS),true);}catch(e){}
}
async function saveEvents(){
  lsSet('gd-events',EVENTS);
  if(typeof window.storage!=='undefined')try{await window.storage.set('gd-events',JSON.stringify(EVENTS),true);}catch(e){}
}
async function saveMe(){
  if(ME){lsSet('gd-me',ME);}else{lsDel('gd-me');}
  if(typeof window.storage!=='undefined')try{if(ME)await window.storage.set('gd-me',JSON.stringify(ME),false);else await window.storage.delete('gd-me',false);}catch(e){}
}

// ═══════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
function toggleNewUserForm(){
  const f=document.getElementById('new-user-form'),arr=document.getElementById('new-user-arrow');
  const open=f.classList.toggle('on');
  arr.textContent=open?'▲':'▼';
}
function openLogin(){buildUserGrid();document.getElementById('m-login').classList.remove('off');}
function buildUserGrid(){
  const g=document.getElementById('user-grid');g.innerHTML='';
  const lbl=document.getElementById('users-section-label');
  // Auto-open new user form if no users exist
  const hasUsers=USERS.length>0;
  const form=document.getElementById('new-user-form');
  const arr=document.getElementById('new-user-arrow');
  if(!hasUsers){
    form.classList.add('on');arr.textContent='▲';
    g.innerHTML='<div style="grid-column:1/-1;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:var(--tdim);letter-spacing:2px;padding:6px 0">SIN USUARIOS — REGISTRATE ABAJO</div>';
    lbl.textContent='USUARIOS REGISTRADOS';return;
  }
  form.classList.remove('on');arr.textContent='▼';
  lbl.textContent=`USUARIOS REGISTRADOS (${USERS.length})`;
  USERS.forEach(u=>{
    const card=el('div','usr-card'+(ME&&ME.id===u.id?' sel':''),'');
    const av=el('div','usr-av2','');av.style.background=G_COLORS[u.guardia]||'#8a9ab5';av.textContent=u.name.charAt(0).toUpperCase();
    card.appendChild(av);
    card.appendChild(el('div','usr-nm',u.name));
    card.appendChild(el('div','usr-gd',G_LABEL[u.guardia]||u.guardia));
    card.onclick=(e)=>{if(!e.target.classList.contains('usr-del'))selectUser(u);};
    const del=el('button','usr-del','✕');del.title='Eliminar usuario';del.style.cssText='position:absolute;top:4px;right:4px;background:none;border:none;color:#3a4a5a;font-size:11px;cursor:pointer;padding:1px 4px;border-radius:2px;line-height:1;';
    del.onmouseenter=()=>del.style.color='var(--red)';del.onmouseleave=()=>del.style.color='#3a4a5a';
    del.onclick=(e)=>{e.stopPropagation();deleteUser(u.id);};
    card.style.position='relative';
    card.appendChild(del);
    g.appendChild(card);
  });
}
function toggleSP(){
  const body=document.getElementById('sp-body'),arr=document.getElementById('sp-arr');
  const open=body.classList.toggle('on');
  arr.textContent=open?'▲':'▼';
}
async function selectUser(u){ME=u;await saveMe();updateUBar();closeM('m-login');renderEvP();renderCal();}
async function deleteUser(id){
  if(!confirm('¿Eliminar este usuario? Sus licencias también serán borradas.'))return;
  USERS=USERS.filter(u=>u.id!==id);
  EVENTS=EVENTS.filter(e=>e.userId!==id);
  if(ME&&ME.id===id){ME=null;await saveMe();updateUBar();}
  await saveUsers();await saveEvents();buildUserGrid();renderEvP();renderCal();
}
async function registerUser(){
  const name=document.getElementById('nu-nm').value.trim();
  const g=document.getElementById('nu-g').value;
  if(!name||!g){alert('Completá nombre y rol');return;}
  const u={id:'u'+Date.now(),name,guardia:g,createdAt:new Date().toISOString()};
  USERS.push(u);await saveUsers();ME=u;await saveMe();updateUBar();closeM('m-login');renderEvP();renderCal();
}
async function logout(){ME=null;await saveMe();updateUBar();renderEvP();renderCal();}
function updateUBar(){
  const nu=document.getElementById('no-u'),yu=document.getElementById('yes-u'),ua=document.getElementById('u-acts'),evp=document.getElementById('evp');
  const relPanel=document.getElementById('rel-panel');
  const qbar=document.getElementById('quick-bar');
  const dHint=document.getElementById('drag-hint');
  if(ME){
    nu.style.display='none';yu.style.display='';ua.style.display='';
    document.getElementById('u-av').textContent=ME.name.charAt(0).toUpperCase();
    document.getElementById('u-av').style.background=G_COLORS[ME.guardia]||'#8a9ab5';
    document.getElementById('u-nm').textContent=ME.name.toUpperCase();
    document.getElementById('u-gd').textContent=G_LABEL[ME.guardia]||ME.guardia;
    evp.style.display='';
    qbar.style.display='';
    document.getElementById('rec-panel').style.display='';
    renderRecPanel();
    if(['A','B','C','D','E'].includes(ME.guardia)){
      document.getElementById('sg2').value=ME.guardia;
      dHint.classList.add('on');
    } else {
      dHint.classList.remove('on');
    }
    if(ME.guardia==='REL'){relPanel.style.display='';renderRelPanel();}
    else relPanel.style.display='none';
  } else {
    nu.style.display='';yu.style.display='none';ua.style.display='none';evp.style.display='none';
    qbar.style.display='none';relPanel.style.display='none';
    document.getElementById('rec-panel').style.display='none';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS CRUD
// ═══════════════════════════════════════════════════════════════════════════
let evTab='mine';
function showET(t){evTab=t;document.querySelectorAll('.ev-tab').forEach(b=>b.classList.toggle('on',b.dataset.e===t));renderEvList();}

function openAddEvent(){
  if(!ME)return openLogin();
  document.querySelectorAll('.lt-btn').forEach(b=>{b.classList.remove('sel');b.style.background='';b.style.borderColor='';});
  const n=new Date();const today=dk(n.getFullYear(),n.getMonth()+1,n.getDate());
  document.getElementById('ev-from').value=today;
  document.getElementById('ev-to').value=today;
  document.getElementById('ev-note').value='';
  document.getElementById('ev-dc-hours').value=6;
  document.getElementById('dc-hours-row').style.display='none';
  document.getElementById('ev-err').classList.remove('on');
  document.getElementById('m-event').classList.remove('off');
}

// Show DC hours field when DC type is selected
(function(){
  const g=document.getElementById('lic-type-grid');
  Object.entries(LIC).forEach(([code,v])=>{
    const b=document.createElement('div');b.className='lt-btn';b.dataset.k=code;
    const lc=document.createElement('span');lc.className='lt-code';lc.style.background=v.color+'cc';lc.textContent=code;
    const ln=document.createElement('span');ln.className='lt-name';ln.style.color=v.color;ln.textContent=v.name;
    b.appendChild(lc);b.appendChild(ln);
    b.onclick=()=>{
      document.querySelectorAll('.lt-btn').forEach(x=>{x.classList.remove('sel');x.style.background='';x.style.borderColor='';});
      b.classList.add('sel');b.style.background=v.color+'22';b.style.borderColor=v.color;
      // Show DC hours row only for DC license
      document.getElementById('dc-hours-row').style.display=code==='DC'?'':'none';
    };
    g.appendChild(b);
  });
})();

async function saveEvent(){
  const typeEl=document.querySelector('.lt-btn.sel');
  const from=document.getElementById('ev-from').value;
  const to=document.getElementById('ev-to').value;
  const note=document.getElementById('ev-note').value.trim();
  const err=document.getElementById('ev-err');
  if(!typeEl){err.textContent='⚠ Seleccioná el tipo de licencia.';err.classList.add('on');return;}
  if(!from||!to){err.textContent='⚠ Completá las fechas.';err.classList.add('on');return;}
  if(from>to){err.textContent='⚠ La fecha de inicio debe ser anterior o igual a la de fin.';err.classList.add('on');return;}

  const licType=typeEl.dataset.k;
  const userGuardia=ME.guardia;

  // DC: hours per day validation
  let dcHours=null;
  if(licType==='DC'){
    dcHours=parseInt(document.getElementById('ev-dc-hours').value)||6;
    if(dcHours<1||dcHours>6){err.textContent='⚠ DC: las horas deben ser entre 1 y 6.';err.classList.add('on');return;}
  }

  // Validate: no license on franco days; shift if >6 consecutive working days
  if(['A','B','C','D','E'].includes(userGuardia)){
    const validDates=computeLicenseDates(userGuardia,from,to);
    if(validDates.warnings.length>0){
      const msg=validDates.warnings.join('\n');
      if(!confirm('⚠ Advertencia:\n'+msg+'\n\n¿Continuar con el ajuste automático?'))return;
    }
    if(validDates.effectiveTo!==to){
      document.getElementById('ev-to').value=validDates.effectiveTo;
    }
  }

  const now=new Date();
  const ev={
    id:'ev'+Date.now(),
    userId:ME.id,userName:ME.name,guardia:ME.guardia,
    type:licType,
    startDate:from,endDate:to,note,
    dcHours:dcHours,
    createdAt:now.toISOString(),
    createdAtStr:fmtTs(now),
    createdBy:ME.name
  };
  EVENTS.push(ev);await saveEvents();closeM('m-event');renderEvP();renderCal();if(S)renderRT(RT);
  if(ME&&ME.guardia==='REL')renderRelPanel();
}

// Compute which dates a license actually applies (skipping francos, shifting if >6 consecutive)
function computeLicenseDates(guardia,from,to){
  const warnings=[];
  // Build list of dates between from and to
  let cur=new Date(from+'T12:00:00');
  const end=new Date(to+'T12:00:00');
  const days=[];
  while(cur<=end){
    days.push(dk(cur.getFullYear(),cur.getMonth()+1,cur.getDate()));
    cur.setDate(cur.getDate()+1);
  }
  // Filter out franco days
  const francos=days.filter(d=>getTurno(guardia,d)==='F');
  if(francos.length>0)warnings.push(`Se omiten ${francos.length} día(s) franco en el rango seleccionado.`);

  // Check: no more than 6 consecutive working days without a franco
  // The algorithm ensures francos exist naturally; we warn if the range skips too many
  const workDays=days.filter(d=>getTurno(guardia,d)!=='F');
  let consec=0,maxConsec=0;
  for(const d of days){
    if(getTurno(guardia,d)!=='F'){consec++;maxConsec=Math.max(maxConsec,consec);}
    else consec=0;
  }
  let effectiveTo=to;
  if(maxConsec>6){
    // Find the last date of the 6th consecutive working day
    consec=0;let last6=from;
    for(const d of days){
      if(getTurno(guardia,d)!=='F'){consec++;if(consec<=6)last6=d;}
      else consec=0;
    }
    effectiveTo=last6;
    warnings.push(`La licencia supera 6 días laborables consecutivos. Se ajusta el fin al ${formatDate(last6)} (día siguiente si hay franco).`);
  }
  return{francos,workDays,effectiveTo,warnings};
}

async function deleteEvent(id){
  if(!confirm('¿Eliminar esta licencia?'))return;
  EVENTS=EVENTS.filter(e=>e.id!==id);await saveEvents();renderEvP();renderCal();if(S)renderRT(RT);
}

function getEvsByDate(date){
  if(!ME)return[];
  return EVENTS.filter(e=>date>=e.startDate&&date<=e.endDate);
}
function getEvsByDateAndG(date,guardia){
  if(!ME)return[];
  return EVENTS.filter(e=>e.guardia===guardia&&date>=e.startDate&&date<=e.endDate);
}

function toggleEvP(){
  const body=document.getElementById('evp-body');
  const arr=document.getElementById('evp-arr');
  body.classList.toggle('on');
  arr.textContent=body.classList.contains('on')?'▲':'▼';
}
function renderEvP(){if(!ME)return;document.getElementById('evp-cnt').textContent=EVENTS.filter(e=>e.userId===ME.id).length||'';renderEvList();}

function renderEvList(){
  const list=document.getElementById('ev-list');list.innerHTML='';
  const evs=evTab==='mine'?(ME?EVENTS.filter(e=>e.userId===ME.id):[]):[...EVENTS].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  if(evs.length===0){list.innerHTML='<div class="ev-empty">SIN REGISTROS</div>';return;}
  evs.forEach(ev=>{
    const li=LIC[ev.type]||{name:ev.type,color:'#8a9ab5'};
    const item=el('div','ev-item','');
    const lbar=el('div','ev-lbar','');lbar.style.background=li.color;item.appendChild(lbar);
    const info=el('div','ev-info','');
    if(evTab==='all'){const who=el('div','ev-who','');who.textContent=ev.userName+' · '+G_LABEL[ev.guardia];info.appendChild(who);}
    // Code badge
    const badge=el('div','ev-code-badge','');badge.style.background=li.color;badge.textContent=ev.type;info.appendChild(badge);
    const tn=el('div','ev-type-name','');tn.style.color=li.color;tn.textContent=li.name;info.appendChild(tn);
    const dts=el('div','ev-dates','');
    dts.textContent=ev.startDate===ev.endDate?formatDate(ev.startDate):`${formatDate(ev.startDate)}  →  ${formatDate(ev.endDate)}`;
    if(ev.type==='DC'&&ev.dcHours){dts.textContent+= `  ·  ${ev.dcHours}h/día`;}
    info.appendChild(dts);
    if(ev.note){const nt=el('div','ev-note','');nt.textContent=ev.note;info.appendChild(nt);}
    // Timestamp — key new feature
    const ts=el('div','ev-ts','');
    ts.innerHTML=`&#9203; Registrado: ${ev.createdAtStr||fmtTs(new Date(ev.createdAt))} &nbsp;&nbsp; por <strong style="color:var(--adim)">${ev.createdBy||ev.userName}</strong>`;
    info.appendChild(ts);
    item.appendChild(info);
    if(!ME||ev.userId===ME.id){const del=el('button','ev-del','✕');del.title='Eliminar';del.onclick=()=>deleteEvent(ev.id);item.appendChild(del);}
    list.appendChild(item);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE UTILS
// ═══════════════════════════════════════════════════════════════════════════
const DOW_L=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DOW_S=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DOW_VS=['D','L','M','M','J','V','S'];
const MES_L=['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MES_S=['','ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const TNFO=[{n:1,i:'00:00',f:'05:59'},{n:2,i:'06:00',f:'11:59'},{n:3,i:'12:00',f:'17:59'},{n:4,i:'18:00',f:'23:59'}];

function dk(y,m,d){return`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function pd(s){const p=s.split('-');return{y:+p[0],m:+p[1],d:+p[2]};}
function dowOf(s){const p=pd(s);return new Date(p.y,p.m-1,p.d).getDay();}
function formatDate(s){const{y,m,d}=pd(s);return`${d} ${MES_S[m]} ${y}`;}
function fmtTs(d){return`${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;}
function getWeek(ds){const p=pd(ds),dow=new Date(p.y,p.m-1,p.d).getDay(),off=dow===0?-6:1-dow,days=[];for(let i=0;i<7;i++){const nd=new Date(p.y,p.m-1,p.d);nd.setDate(p.d+off+i);days.push(dk(nd.getFullYear(),nd.getMonth()+1,nd.getDate()));}return days;}
function getMonthDays(y,m){const last=new Date(y,m,0).getDate(),days=[];for(let d=1;d<=last;d++)days.push(dk(y,m,d));return days;}
function setToday(){const n=new Date();document.getElementById('sf').value=dk(n.getFullYear(),n.getMonth()+1,n.getDate());}

// Special rows — registered Operador/Relevante users
function getSpecialRows(){return USERS.filter(u=>u.guardia==='OP'||u.guardia==='REL');}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH STATE
// ═══════════════════════════════════════════════════════════════════════════
let S=null,RT='dia',CT='mes';
let calDate=dk(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate());

async function buscar(){
  const g=document.getElementById('sg2').value,f=document.getElementById('sf').value;
  const err=document.getElementById('err'),ra=document.getElementById('ra'),ldg=document.getElementById('ldg');
  err.classList.remove('on');ra.classList.remove('on');
  if(!g||!f){err.textContent='⚠ Seleccioná guardia y fecha.';err.classList.add('on');return;}
  const{y:yr,m:mes}=pd(f);if(yr<2025||yr>2030){err.textContent='⚠ Rango: 2025–2030.';err.classList.add('on');return;}
  ldg.classList.add('on');
  await Promise.all([yr-1,yr,yr+1].filter(y=>y>=2025&&y<=2030).map(getFeriados));
  ldg.classList.remove('on');
  const turno=getTurno(g,f),{d:dia}=pd(f),dow=new Date(yr,mes-1,dia).getDay(),fer=allFer([yr])[f];
  S={g,f,turno,yr,mes,dia,dow,fer};
  document.getElementById('rd').textContent=`${dia} de ${MES_L[mes]} de ${yr}`;
  document.getElementById('rt2').innerHTML=`GUARDIA <span class="gl">${g}</span>`;
  const rb=document.getElementById('rb');rb.innerHTML='';
  rb.appendChild(el('span','badge b-dow',DOW_L[dow]));
  if(turno==='F')rb.appendChild(el('span','badge b-fra','Franco'));
  else rb.appendChild(el('span','badge b-tur',`Turno ${turno}  ·  ${TNFO[turno-1].i}–${TNFO[turno-1].f}`));
  if(fer){const cls=fer.tipo==='no_laborable'?'badge b-nol':'badge b-fer';rb.appendChild(el('span',cls,(fer.tipo==='no_laborable'?'◈':'★')+' '+fer.nombre));}
  // License badge for today
  const myEvs=getEvsByDateAndG(f,g);
  if(myEvs.length>0){
    myEvs.forEach(ev=>{const li=LIC[ev.type];const b=el('span','badge','');b.style.background=li.color+'33';b.style.border=`1px solid ${li.color}66`;b.style.color=li.color;b.textContent=ev.type+' '+li.name;rb.appendChild(b);});
  }
  ra.classList.add('on');renderRT(RT);calDate=f;if(['A','B','C','D','E'].includes(g))document.getElementById('cal-g').value=g;renderCal();
  document.getElementById('ra').scrollIntoView({behavior:'smooth',block:'start'});
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT TABS
// ═══════════════════════════════════════════════════════════════════════════
function showRT(t){RT=t;document.querySelectorAll('#rtabs .tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));['dia','semana','mes','anio'].forEach(x=>document.getElementById('t-'+x).classList.toggle('on',x===t));if(S)renderRT(t);}
function renderRT(t){if(t==='dia')renderRDia();else if(t==='semana')renderRSemana();else if(t==='mes')renderRMes();else renderRAnio();}

function renderRDia(){
  const c=document.getElementById('t-dia');c.innerHTML='';
  const{g,f,turno}=S;
  c.appendChild(el('div','slbl','TURNOS DEL DÍA'));
  if(turno==='F'){const ff=el('div','ff','');ff.innerHTML='<div class="ff-f">F</div><div><div class="ff-l">DÍA FRANCO</div><div class="ff-s">Sin turno asignado</div></div>';c.appendChild(ff);}
  else if(turno){const row=el('div','trow','');TNFO.forEach(t=>{const a=t.n===turno,card=el('div','tc2 '+(a?'act':'ina'),'');if(a){const b=el('div','tcb','▶ TU TURNO');card.appendChild(b);}card.appendChild(el('div','tcn',''+t.n));card.appendChild(el('div','tch',t.i+'  '+t.f));row.appendChild(card);});c.appendChild(row);}
  // Licencias HOY — all guardias
  const evHoy=getEvsByDate(f);
  if(evHoy.length>0){
    c.appendChild(el('div','slbl','AUSENCIAS HOY EN EL SECTOR'));
    const evl=el('div','ev-list','');
    evHoy.forEach(ev=>{
      const li=LIC[ev.type]||{name:ev.type,color:'#8a9ab5'};
      const item=el('div','ev-item','');
      const lbar=el('div','ev-lbar','');lbar.style.background=li.color;item.appendChild(lbar);
      const info=el('div','ev-info','');
      const who=el('div','ev-who','');who.textContent=ev.userName+' · '+G_LABEL[ev.guardia];info.appendChild(who);
      const badge=el('div','ev-code-badge','');badge.style.background=li.color;badge.textContent=ev.type;info.appendChild(badge);
      const tn=el('div','ev-type-name','');tn.style.color=li.color;tn.textContent=li.name;info.appendChild(tn);
      if(ev.note){const nt=el('div','ev-note','');nt.textContent=ev.note;info.appendChild(nt);}
      const ts=el('div','ev-ts','');ts.innerHTML=`&#9203; ${ev.createdAtStr||fmtTs(new Date(ev.createdAt))} &nbsp; por <strong style="color:var(--adim)">${ev.createdBy||ev.userName}</strong>`;info.appendChild(ts);
      item.appendChild(info);evl.appendChild(item);
    });c.appendChild(evl);
  }
  // Week strip
  const week=getWeek(f);const fmap=allFer([...new Set(week.map(x=>+x.split('-')[0]))]);
  const wp=el('div','wsp','');const p0=pd(week[0]),p6=pd(week[6]);
  wp.appendChild(el('div','wsph',`SEM ${p0.d} ${MES_S[p0.m]}–${p6.d} ${MES_S[p6.m]} ${p6.y}  ·  GUARDIA ${g}`));
  const wg=el('div','wsg','');
  const WN=['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
  week.forEach((wd2,i)=>{
    const{d:dd}=pd(wd2),wt=getTurno(g,wd2),isSel=wd2===f,isFer=!!fmap[wd2];
    const dayEvs=getEvsByDateAndG(wd2,g);
    const hasLic=dayEvs.length>0;
    let cls='wd';if(isSel)cls+=' ws';if(isFer)cls+=' wf2';if(wt==='F'&&!hasLic)cls+=' wp';
    const card=el('div',cls,'');
    card.appendChild(el('div','wdn',WN[i]));card.appendChild(el('div','wdd',''+dd));
    if(hasLic){
      const ev=dayEvs[0];const li=LIC[ev.type];
      const lbl=el('div','wd-lic','');lbl.style.background=li.color;lbl.textContent=ev.type;
      lbl.title=`${ev.userName}: ${li.name}${ev.note?' ('+ev.note+')':''}`;card.appendChild(lbl);
    } else {
      let tc='wdt';if(wt&&wt!=='F')tc+=` c${wt}`;card.appendChild(el('div',tc,wt?''+wt:'·'));
    }
    const dots=el('div','w-evdots','');dayEvs.slice(1).forEach(ev=>{const d=el('div','evdot','');d.style.background=LIC[ev.type].color;d.title=ev.userName;dots.appendChild(d);});if(dayEvs.length>1)card.appendChild(dots);
    if(isFer){card.appendChild(el('div','fdot',''));card.appendChild(el('div','ftt',fmap[wd2].nombre));}
    wg.appendChild(card);
  });
  wp.appendChild(wg);c.appendChild(wp);
}

function renderRSemana(){
  const c=document.getElementById('t-semana');c.innerHTML='';
  const week=getWeek(S.f),p0=pd(week[0]),p6=pd(week[6]);
  const fmap=allFer([...new Set(week.map(x=>+x.split('-')[0]))]);
  c.appendChild(buildTable(week,S.f,S.g,fmap,`SEMANA: ${p0.d} ${MES_S[p0.m]}–${p6.d} ${MES_S[p6.m]} ${p6.y}`,false));
}
function renderRMes(){
  const c=document.getElementById('t-mes');c.innerHTML='';
  c.appendChild(buildTable(getMonthDays(S.yr,S.mes),S.f,S.g,allFer([S.yr]),`${MES_L[S.mes].toUpperCase()} ${S.yr}`,false));
}
function renderRAnio(){
  const c=document.getElementById('t-anio');c.innerHTML='';
  const scr=el('div','yscr','');let sel=null;
  for(let m=1;m<=12;m++){const isCur=m===S.mes;const sec=buildTable(getMonthDays(S.yr,m),S.f,S.g,allFer([S.yr]),`${MES_L[m].toUpperCase()} ${S.yr}`,isCur);if(isCur)sel=sec;scr.appendChild(sec);}
  c.appendChild(scr);if(sel)requestAnimationFrame(()=>sel.scrollIntoView({block:'start'}));
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════════════════
function showCT(t){CT=t;document.querySelectorAll('.ctab').forEach(b=>b.classList.toggle('on',b.dataset.c===t));renderCal();}
function calNav(dir){
  const{y,m,d}=pd(calDate);
  if(CT==='sem'){const nd=new Date(y,m-1,d);nd.setDate(d+dir*7);calDate=dk(nd.getFullYear(),nd.getMonth()+1,nd.getDate());}
  else if(CT==='mes'){let nm=m+dir,ny=y;if(nm<1){nm=12;ny--;}if(nm>12){nm=1;ny++;}if(ny<2025||ny>2030)return;calDate=dk(ny,nm,1);}
  else{const ny=y+dir;if(ny<2025||ny>2030)return;calDate=dk(ny,m,d);}
  renderCal();
}
function calGoToday(){const n=new Date();calDate=dk(n.getFullYear(),n.getMonth()+1,n.getDate());renderCal();}

async function renderCal(){
  const{y,m}=pd(calDate);const g=document.getElementById('cal-g').value;
  const yrs=CT==='sem'?[...new Set(getWeek(calDate).map(x=>+x.split('-')[0]))]:[y];
  await Promise.all([...new Set(yrs)].filter(y=>y>=2025&&y<=2030).map(getFeriados));
  document.getElementById('fn').classList.toggle('on',y>2026);
  const lbl=document.getElementById('cal-lbl');
  if(CT==='sem'){const w=getWeek(calDate);const p0=pd(w[0]),p6=pd(w[6]);lbl.textContent=`${p0.d} ${MES_S[p0.m]}–${p6.d} ${MES_S[p6.m]} ${p6.y}`;}
  else if(CT==='mes')lbl.textContent=`${MES_L[m].toUpperCase()} ${y}`;
  else lbl.textContent=`AÑO ${y}`;
  const body=document.getElementById('cal-body');body.innerHTML='';
  const selDate=S?S.f:calDate;const selG=g||(S?S.g:'A');
  if(CT==='sem'){const w=getWeek(calDate);const fmap=allFer([...new Set(w.map(x=>+x.split('-')[0]))]);const p0=pd(w[0]),p6=pd(w[6]);body.appendChild(buildTable(w,selDate,selG,fmap,`SEMANA ${p0.d} ${MES_S[p0.m]}–${p6.d} ${MES_S[p6.m]} ${p6.y}`,false));}
  else if(CT==='mes'){body.appendChild(buildTable(getMonthDays(y,m),selDate,selG,allFer([y]),`${MES_L[m].toUpperCase()} ${y}`,false));}
  else{const scr=el('div','yscr','');let cur=null;for(let mm=1;mm<=12;mm++){const isCur=mm===m;const sec=buildTable(getMonthDays(y,mm),selDate,selG,allFer([y]),`${MES_L[mm].toUpperCase()} ${y}`,isCur);if(isCur)cur=sec;scr.appendChild(sec);}body.appendChild(scr);if(cur)requestAnimationFrame(()=>cur.scrollIntoView({block:'start'}));}
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════════════════════════════
function toggleTheme(){
  const isLight=document.body.classList.toggle('light');
  document.getElementById('theme-btn').textContent=isLight?'● OSCURO':'☀ CLARO';
  lsSet('gd-theme',isLight?'light':'dark');
}
(function(){
  const t=lsGet('gd-theme');
  if(t==='light'){document.body.classList.add('light');const b=document.getElementById('theme-btn');if(b)b.textContent='● OSCURO';}
})();

// ═══════════════════════════════════════════════════════════════════════════
// REL TURNO PICKER
// ═══════════════════════════════════════════════════════════════════════════
let relPickerFrom=null,relPickerTo=null;
let relDsDragging=false,relDsStart=null,relDsEnd=null;

function openRelPicker(from,to){
  relPickerFrom=from;relPickerTo=to;
  const{d:d1,m:m1,y:y1}=pd(from),{d:d2,m:m2,y:y2}=pd(to);
  const same=from===to;
  document.getElementById('rel-picker-dates').textContent=same?`${d1} ${MES_S[m1]} ${y1}`:`${d1} ${MES_S[m1]} ${y1}  →  ${d2} ${MES_S[m2]} ${y2}`;
  // Wire up buttons
  document.querySelectorAll('.rel-t-btn').forEach(btn=>{
    btn.onclick=async()=>{
      const val=btn.dataset.val;
      // Apply to all days in range
      let cur=new Date(relPickerFrom+'T12:00:00');
      const end=new Date(relPickerTo+'T12:00:00');
      while(cur<=end){
        const ds=dk(cur.getFullYear(),cur.getMonth()+1,cur.getDate());
        if(val==='')delete REL_SCHEDULE[ds];
        else REL_SCHEDULE[ds]=val==='F'?'F':parseInt(val);
        cur.setDate(cur.getDate()+1);
      }
      await saveRelSchedule();
      document.getElementById('rel-picker').classList.add('off');
      relClearHighlights();
      renderCal();if(S)renderRT(RT);
    };
  });
  document.getElementById('rel-picker').classList.remove('off');
}

function relPickerCancel(){
  document.getElementById('rel-picker').classList.add('off');
  relClearHighlights();
}

function relClearHighlights(){
  document.querySelectorAll('td.rel-ds-start,td.rel-ds-range').forEach(t=>{
    t.classList.remove('rel-ds-start','rel-ds-range');
  });
  relDsDragging=false;relDsStart=null;relDsEnd=null;
}
// ═══════════════════════════════════════════════════════════════════════════
let dsActive=false,dsStartDate=null,dsEndDate=null,dsGuardia=null,dsSelLic=null,dsDCH=6;
let dsDragging=false;

function dsInit(){
  // Build lic grid in picker
  const g=document.getElementById('ds-lic-grid');g.innerHTML='';
  Object.entries(LIC).forEach(([code,v])=>{
    const b=document.createElement('div');b.className='ds-lic-btn';
    const lc=document.createElement('span');lc.className='ds-lic-code';lc.style.background=v.color;lc.textContent=code;
    const ln=document.createElement('span');ln.className='ds-lic-name';ln.textContent=v.name;
    b.appendChild(lc);b.appendChild(ln);
    b.addEventListener('click',()=>{
      document.querySelectorAll('.ds-lic-btn').forEach(x=>{x.classList.remove('sel');x.style.borderColor='';x.style.background='';});
      b.classList.add('sel');b.style.borderColor=v.color;b.style.background=v.color+'18';
      dsSelLic=code;
      document.getElementById('ds-dc-row').classList.toggle('on',code==='DC');
      const sv=document.getElementById('ds-save');sv.disabled=false;sv.style.opacity='1';
    });
    g.appendChild(b);
  });
}

function dsOpen(fromDate,toDate,guardia){
  if(!ME)return openLogin();
  dsStartDate=fromDate;dsEndDate=toDate;dsGuardia=guardia;dsSelLic=null;dsDCH=6;
  document.getElementById('ds-dc-val').textContent=6;
  document.getElementById('ds-note').value='';
  document.getElementById('ds-dc-row').classList.remove('on');
  const sv=document.getElementById('ds-save');sv.disabled=true;sv.style.opacity='.4';
  document.querySelectorAll('.ds-lic-btn').forEach(x=>{x.classList.remove('sel');x.style.borderColor='';x.style.background='';});
  const{d:d1,m:m1,y:y1}=pd(fromDate),{d:d2,m:m2,y:y2}=pd(toDate);
  const same=fromDate===toDate;
  document.getElementById('ds-range-dates').textContent=same?`${d1} ${MES_S[m1]} ${y1}`:`${d1} ${MES_S[m1]} ${y1}  →  ${d2} ${MES_S[m2]} ${y2}`;
  document.getElementById('ds-picker').classList.remove('off');
}

function dsCancel(){
  document.getElementById('ds-picker').classList.add('off');
  dsClearHighlights();
}

function adjDCH(d){
  dsDCH=Math.min(6,Math.max(1,dsDCH+d));
  document.getElementById('ds-dc-val').textContent=dsDCH;
}

async function dsSave(){
  if(!dsSelLic||!dsStartDate||!dsEndDate)return;
  const note=document.getElementById('ds-note').value.trim();
  const now=new Date();
  // Validate franco
  let effectiveTo=dsEndDate;
  if(['A','B','C','D','E'].includes(dsGuardia)){
    const v=computeLicenseDates(dsGuardia,dsStartDate,dsEndDate);
    effectiveTo=v.effectiveTo;
  }
  const ev={
    id:'ev'+Date.now(),
    userId:ME.id,userName:ME.name,guardia:dsGuardia||ME.guardia,
    type:dsSelLic,
    startDate:dsStartDate,endDate:effectiveTo,note,
    dcHours:dsSelLic==='DC'?dsDCH:null,
    createdAt:now.toISOString(),createdAtStr:fmtTs(now),createdBy:ME.name
  };
  EVENTS.push(ev);await saveEvents();
  document.getElementById('ds-picker').classList.add('off');
  dsClearHighlights();
  renderEvP();renderCal();if(S)renderRT(RT);
}

function dsClearHighlights(){
  document.querySelectorAll('td.ds-start,td.ds-range,td.ds-hover').forEach(td=>{
    td.classList.remove('ds-start','ds-range','ds-hover');
  });
  dsStartDate=null;dsEndDate=null;dsDragging=false;
}

// ═══════════════════════════════════════════════════════════════════════════
// TABLE BUILDER — with license codes in cells + drag-select
// ═══════════════════════════════════════════════════════════════════════════
function buildTable(days,selDate,selG,fmap,title,isCur){
  const sec=el('div','ms','');
  const mh=el('div','mh'+(isCur?' cur':''),'');
  mh.innerHTML=`<span>${title}</span><span style="font-size:8px;opacity:.5">${days.length}d</span>`;
  sec.appendChild(mh);
  const scr=el('div','tscr','');const tbl=document.createElement('table');tbl.className='gt';

  // ─ Header row ─
  const n=new Date();
  const todayStr=dk(n.getFullYear(),n.getMonth()+1,n.getDate());
  const thead=document.createElement('thead');const trh=document.createElement('tr');
  const corner=document.createElement('th');corner.className='gn';trh.appendChild(corner);
  days.forEach(date=>{
    const{d:dd}=pd(date),dow=dowOf(date),isSel=date===selDate,isFer=!!fmap[date],isToday=date===todayStr;
    const th=document.createElement('th');
    let thCls=isSel&&isFer?'sfc':isSel?'sc':isFer?'fc':'';
    if(isToday)thCls+=(thCls?' ':'')+'th-today';
    th.className=thCls;
    if(isToday)th.dataset.today='1';
    if(isFer)th.title=fmap[date].nombre;
    th.innerHTML=`<div class="dd">${DOW_VS[dow]}</div><div class="dn">${dd}</div>${isToday?'<div class="today-dot"></div>':''}${isFer?'<div class="fd2"></div>':''}`;
    trh.appendChild(th);
  });
  thead.appendChild(trh);tbl.appendChild(thead);

  // ─ Rows for each guardia A-E ─
  const tbody=document.createElement('tbody');
  ['A','B','C','D','E'].forEach(g=>{
    const tr=document.createElement('tr');if(g===selG)tr.className='gs';
    const nameTd=document.createElement('td');nameTd.className='gn';
    nameTd.innerHTML=`G·${g}`;if(g===selG)nameTd.style.color=G_COLORS[g];
    tr.appendChild(nameTd);
    days.forEach(date=>{
      const turno=getTurno(g,date);
      const isSel=date===selDate,isFer=!!fmap[date],isSelG=g===selG;
      const dayEvs=getEvsByDateAndG(date,g);
      const td=document.createElement('td');
      td.dataset.date=date;td.dataset.g=g;

      // Column/row highlight classes
      let cls='';
      if(isSel&&isSelG)cls+=(isFer?' ixf':' ix');
      else if(isSel)cls+=' cs';
      else if(isSelG)cls+=' rs';
      if(isFer&&!isSel)cls+=' cf';
      if(dayEvs.length===0){
        if(turno==='F')cls+=' tf';else if(turno)cls+=` t${turno}`;
      }
      td.className=cls.trim();

      const inner=el('div','cell-inner','');
      if(dayEvs.length>0){
        const ev=dayEvs[0];const li=LIC[ev.type]||{name:ev.type,color:'#8a9ab5'};
        td.style.background=li.color+'28';
        if(isSel&&isSelG)td.style.background=li.color+'50';
        const licCell=el('div','lic-cell','');
        licCell.style.background=li.color+'18';
        const code=el('div','lic-code','');code.style.color=li.color;code.textContent=ev.type;licCell.appendChild(code);
        if(turno&&turno!=='F'){const tsmall=el('div','lic-turno','');tsmall.style.color=li.color+'99';tsmall.textContent='T'+turno;licCell.appendChild(tsmall);}
        if(dayEvs.length>1){const more=el('div','lic-more','');more.style.background=li.color+'88';licCell.appendChild(more);}
        const tts=dayEvs.map(ev=>`${LIC[ev.type]?.name||ev.type}: ${ev.userName} (${ev.createdAtStr||fmtTs(new Date(ev.createdAt))})`).join('\n');
        td.title=tts;
        inner.appendChild(licCell);
      } else {
        const cn=el('div','cn','');
        cn.textContent=turno==='F'?'F':(turno?''+turno:'·');
        inner.appendChild(cn);
        if(isFer)td.title=fmap[date].nombre;
      }
      td.appendChild(inner);tr.appendChild(td);

      // Tap on ANY cell → action sheet (when logged in)
      if(ME){
        td.style.cursor='pointer';
        td.addEventListener('click',(e)=>{
          if(dsDragging)return;
          openCellActions(date,g,turno,dayEvs);
        });
      }
      // Recargo dot
      if(ME){
        const recs=RECARGOS.filter(r=>r.date===date&&r.guardia===g);
        if(recs.length>0){
          const dot=el('div','rec-dot'+(isEsSobreFranco(g,date,recs[0].turno)?' franco':''),'');
          td.appendChild(dot);
        }
      }
    });
    tbody.appendChild(tr);
  });

  // ─ Fixed row: OPERADOR — follows Guardia D cycle ─
  (()=>{
    const tr=document.createElement('tr');
    tr.className='spec-row op-row';
    const nameTd=document.createElement('td');nameTd.className='gn';
    nameTd.innerHTML=`<span style="font-size:9px;color:var(--t2);font-weight:700;letter-spacing:.5px;">OP</span><br><span style="font-size:7px;color:var(--tdim)">Operador</span>`;
    tr.appendChild(nameTd);
    days.forEach(date=>{
      const turno=getTurno('D',date);// OP sigue ciclo D
      const isSel=date===selDate,isFer=!!fmap[date];
      const dayEvs=getEvsByDateAndG(date,'OP');
      const td=document.createElement('td');
      let cls='';
      if(turno==='F')cls='tf';else if(turno)cls=`t${turno}`;
      if(isSel)cls+=' cs';if(isFer&&!isSel)cls+=' cf';
      td.className=cls.trim();
      const inner=el('div','cell-inner','');
      if(dayEvs.length>0){
        const ev=dayEvs[0];const li=LIC[ev.type]||{name:ev.type,color:'#8a9ab5'};
        td.style.background=li.color+'28';
        const lc=el('div','lic-code','');lc.style.color=li.color;lc.style.fontSize='10px';lc.textContent=ev.type;
        td.title=`${li.name}: ${ev.userName}`;inner.appendChild(lc);
      } else {
        const cn=el('div','cn','');cn.textContent=turno==='F'?'F':(turno?''+turno:'·');inner.appendChild(cn);
        if(isFer)td.title=fmap[date].nombre;
      }
      td.appendChild(inner);tr.appendChild(td);
    });
    tbody.appendChild(tr);
  })();

  // ─ Fixed row: RELEVANTE — drag-select editable by REL user ─
  (()=>{
    const tr=document.createElement('tr');
    tr.className='spec-row rel-row';
    const nameTd=document.createElement('td');nameTd.className='gn';
    nameTd.innerHTML=`<span style="font-size:9px;color:#8a9ab5;font-weight:700;letter-spacing:.5px;">REL</span><br><span style="font-size:7px;color:var(--tdim)">Relevante</span>`;
    tr.appendChild(nameTd);
    days.forEach(date=>{
      const isSel=date===selDate,isFer=!!fmap[date];
      const sched=REL_SCHEDULE[date];
      const dayEvs=getEvsByDateAndG(date,'REL');
      const td=document.createElement('td');
      td.dataset.date=date;td.dataset.relrow='1';
      let cls='rel-cell';
      if(sched==='F')cls+=' tf';
      else if(sched===undefined)cls+=' tf';
      else cls+=` t${sched}`;
      if(isSel)cls+=' cs';if(isFer&&!isSel)cls+=' cf';
      td.className=cls.trim();
      const inner=el('div','cell-inner','');
      if(dayEvs.length>0&&ME){
        const ev=dayEvs[0];const li=LIC[ev.type]||{name:ev.type,color:'#8a9ab5'};
        td.style.background=li.color+'28';
        const lc=el('div','lic-code','');lc.style.color=li.color;lc.style.fontSize='10px';lc.textContent=ev.type;
        td.title=`${li.name}: ${ev.userName}`;inner.appendChild(lc);
      } else {
        const disp=sched!==undefined?String(sched):'·';
        const cn=el('div','cn','');cn.textContent=disp;inner.appendChild(cn);
        if(isFer)td.title=fmap[date].nombre;
      }
      td.appendChild(inner);tr.appendChild(td);
    });
    tbody.appendChild(tr);

    // ── REL drag-select (only for REL user) ──
    if(ME&&ME.guardia==='REL'){
      tr.style.cursor='crosshair';
      const getRelTd=(cx,cy)=>{
        const e=document.elementFromPoint(cx,cy);
        return e?.closest('td[data-relrow]')||null;
      };
      const updateRelRange=(endTd)=>{
        if(!endTd||!relDsStart)return;
        const hd=endTd.dataset.date;
        const[a,b]=hd<relDsStart?[hd,relDsStart]:[relDsStart,hd];
        relDsStart=a;relDsEnd=b;
        tr.querySelectorAll('td[data-relrow]').forEach(t=>{
          const d=t.dataset.date;
          t.classList.remove('rel-ds-start','rel-ds-range');
          if(d===relDsStart)t.classList.add('rel-ds-start');
          else if(d>relDsStart&&d<=relDsEnd)t.classList.add('rel-ds-range');
        });
      };
      scr.addEventListener('mousedown',(e)=>{
        const td=e.target.closest('td[data-relrow]');
        if(!td)return;
        e.preventDefault();
        relClearHighlights();
        relDsDragging=true;relDsStart=td.dataset.date;relDsEnd=td.dataset.date;
        td.classList.add('rel-ds-start');
      },{passive:false,capture:false});
      scr.addEventListener('touchstart',(e)=>{
        const td=e.target.closest('td[data-relrow]');
        if(!td)return;
        e.preventDefault();
        relClearHighlights();
        relDsDragging=true;relDsStart=td.dataset.date;relDsEnd=td.dataset.date;
        td.classList.add('rel-ds-start');
      },{passive:false,capture:false});
      scr.addEventListener('mousemove',(e)=>{
        if(!relDsDragging)return;
        updateRelRange(getRelTd(e.clientX,e.clientY));
      });
      scr.addEventListener('touchmove',(e)=>{
        if(!relDsDragging)return;
        e.preventDefault();
        const t=e.touches[0];
        updateRelRange(getRelTd(t.clientX,t.clientY));
      },{passive:false});
      const finishRelDrag=()=>{
        if(!relDsDragging)return;
        relDsDragging=false;
        if(relDsStart)openRelPicker(relDsStart,relDsEnd||relDsStart);
      };
      scr.addEventListener('mouseup',finishRelDrag);
      scr.addEventListener('touchend',finishRelDrag);
    }
  })();

  tbl.appendChild(tbody);scr.appendChild(tbl);sec.appendChild(scr);

  // Scroll so today's column is visible (left-aligned with a little padding)
  requestAnimationFrame(()=>{
    const todayTh=scr.querySelector('th[data-today]');
    if(todayTh){
      const nameColW=56;// width of sticky name column
      scr.scrollLeft=Math.max(0,todayTh.offsetLeft-nameColW-4);
    }
  });

  // ── Drag-select: attach to scroll container so touch move works across cells ──
  if(ME && ['A','B','C','D','E'].includes(ME.guardia)){
    const userG=ME.guardia;

    const getTdAt=(clientX,clientY)=>{
      const el=document.elementFromPoint(clientX,clientY);
      return el?.closest('td[data-date][data-g="'+userG+'"]')||null;
    };

    const updateRange=(endTd)=>{
      if(!endTd||!dsStartDate)return;
      const hoverDate=endTd.dataset.date;
      // support dragging left too
      const [a,b]=hoverDate<dsStartDate?[hoverDate,dsStartDate]:[dsStartDate,hoverDate];
      dsStartDate=a;dsEndDate=b;
      tbl.querySelectorAll(`td[data-g="${userG}"]`).forEach(t=>{
        const d=t.dataset.date;
        t.classList.remove('ds-start','ds-range');
        if(d===dsStartDate)t.classList.add('ds-start');
        else if(d>dsStartDate&&d<=dsEndDate)t.classList.add('ds-range');
      });
    };

    scr.addEventListener('mousedown',(e)=>{
      const td=e.target.closest(`td[data-date][data-g="${userG}"]`);
      if(!td)return;
      e.preventDefault();
      dsClearHighlights();
      dsDragging=true;
      dsStartDate=td.dataset.date;dsEndDate=td.dataset.date;dsGuardia=userG;
      td.classList.add('ds-start');
    },{passive:false});

    scr.addEventListener('touchstart',(e)=>{
      const td=e.target.closest(`td[data-date][data-g="${userG}"]`);
      if(!td)return;
      e.preventDefault();
      dsClearHighlights();
      dsDragging=true;
      dsStartDate=td.dataset.date;dsEndDate=td.dataset.date;dsGuardia=userG;
      td.classList.add('ds-start');
    },{passive:false});

    scr.addEventListener('mousemove',(e)=>{
      if(!dsDragging)return;
      updateRange(getTdAt(e.clientX,e.clientY));
    });

    scr.addEventListener('touchmove',(e)=>{
      if(!dsDragging)return;
      e.preventDefault();
      const t=e.touches[0];
      updateRange(getTdAt(t.clientX,t.clientY));
    },{passive:false});

    const finishDrag=()=>{
      if(!dsDragging)return;
      dsDragging=false;
      if(dsStartDate)dsOpen(dsStartDate,dsEndDate||dsStartDate,userG);
    };
    scr.addEventListener('mouseup',finishDrag);
    scr.addEventListener('touchend',finishDrag);
  }

  return sec;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function closeM(id){document.getElementById(id).classList.add('off');}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.add('off');}));
// Close drag-select picker on overlay click
document.getElementById('ds-picker').addEventListener('click',e=>{if(e.target===document.getElementById('ds-picker'))dsCancel();});
document.getElementById('rel-picker').addEventListener('click',e=>{if(e.target===document.getElementById('rel-picker'))relPickerCancel();});
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e;}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){document.querySelectorAll('.overlay:not(.off)').forEach(o=>o.classList.add('off'));dsCancel();}
  if(e.key==='Enter'&&!e.target.closest('.overlay'))buscar();
});
// Safety: if user releases completely outside any table, reset drag flag
document.addEventListener('mouseup',()=>{dsDragging=false;});
document.addEventListener('touchend',()=>{dsDragging=false;});

// ═══════════════════════════════════════════════════════════════════════════
// RELEVANTE PANEL
// ═══════════════════════════════════════════════════════════════════════════
let REL_COVERAGES=[];

async function loadRelData(){
  REL_COVERAGES=lsGet('gd-rel-cov')||[];
  if(typeof window.storage!=='undefined')try{const r=await window.storage.get('gd-rel-cov',false);if(r&&!REL_COVERAGES.length)REL_COVERAGES=JSON.parse(r.value);}catch(e){}
}
async function saveRelData(){
  lsSet('gd-rel-cov',REL_COVERAGES);
  if(typeof window.storage!=='undefined')try{await window.storage.set('gd-rel-cov',JSON.stringify(REL_COVERAGES),false);}catch(e){}
}

function toggleRelPanel(){
  const body=document.getElementById('rel-body'),arr=document.getElementById('rel-arr');
  const open=body.style.display==='none';body.style.display=open?'':'none';arr.textContent=open?'▲':'▼';
  if(open)renderRelPanel();
}

function renderRelPanel(){
  if(!ME||ME.guardia!=='REL')return;
  renderRelFranco();
  renderRelCoverageList();
}

function renderRelFranco(){
  const div=document.getElementById('rel-franco-stats');div.innerHTML='';
  // Count franco hours in current month from last worked day
  const now=new Date();
  const y=now.getFullYear(),m=now.getMonth()+1;
  const todayStr=dk(y,m,now.getDate());
  // Relevante has no algorithmic turno, so we look at their coverages to find last worked day
  const myCovs=REL_COVERAGES.filter(c=>c.userId===ME.id).sort((a,b)=>b.fromDate.localeCompare(a.fromDate));
  // Find last day worked this month
  const workedDaysThisMonth=myCovs.filter(c=>{
    // any coverage day in this month
    return c.fromDate.startsWith(`${y}-${String(m).padStart(2,'0')}`)||c.toDate.startsWith(`${y}-${String(m).padStart(2,'0')}`);
  });
  // Count total days this month so far
  const daysInMonth=new Date(y,m,0).getDate();
  const daysElapsed=Math.min(now.getDate(),daysInMonth);
  // Count worked days (coverage days) this month
  let workedCount=0;
  const monthDays=getMonthDays(y,m).filter(d=>d<=todayStr);
  monthDays.forEach(d=>{
    const covered=myCovs.some(c=>d>=c.fromDate&&d<=c.toDate);
    if(covered)workedCount++;
  });
  const francoCount=daysElapsed-workedCount;
  const francoHours=francoCount*6; // 6h por turno = 1 día franco
  div.innerHTML=`
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <div style="background:#0d1117;border:1px solid var(--border);border-radius:3px;padding:9px 14px;min-width:110px;">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--tdim);letter-spacing:2px;margin-bottom:4px">DÍAS TRABAJADOS</div>
        <div style="font-size:26px;font-weight:900;color:#8a9ab5;line-height:1">${workedCount}</div>
        <div style="font-family:var(--font-mono);font-size:8px;color:var(--tdim);margin-top:2px">en ${MES_L[m]}</div>
      </div>
      <div style="background:#0d1117;border:1px solid var(--border);border-radius:3px;padding:9px 14px;min-width:110px;">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--tdim);letter-spacing:2px;margin-bottom:4px">DÍAS FRANCO</div>
        <div style="font-size:26px;font-weight:900;color:var(--amber);line-height:1">${francoCount}</div>
        <div style="font-family:var(--font-mono);font-size:8px;color:var(--tdim);margin-top:2px">desde últ. trabajado</div>
      </div>
      <div style="background:#0d1117;border:1px solid var(--border);border-radius:3px;padding:9px 14px;min-width:110px;">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--tdim);letter-spacing:2px;margin-bottom:4px">HORAS FRANCO</div>
        <div style="font-size:26px;font-weight:900;color:var(--green);line-height:1">${francoHours}h</div>
        <div style="font-family:var(--font-mono);font-size:8px;color:var(--tdim);margin-top:2px">aprox. (6h/día)</div>
      </div>
    </div>
    <div style="font-family:var(--font-mono);font-size:9px;color:var(--tdim);margin-top:7px;letter-spacing:1px">
      Período: ${MES_L[m]} ${y} · Días transcurridos: ${daysElapsed}
    </div>`;
}

function renderRelCoverageList(){
  const list=document.getElementById('rel-coverage-list');list.innerHTML='';
  const myCovs=REL_COVERAGES.filter(c=>c.userId===ME.id).sort((a,b)=>b.fromDate.localeCompare(a.fromDate));
  if(myCovs.length===0){
    list.innerHTML='<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:var(--tdim);padding:10px 0;letter-spacing:1px">Sin coberturas registradas</div>';
    return;
  }
  myCovs.forEach(cov=>{
    const item=el('div','ev-item','');
    const lbar=el('div','ev-lbar','');lbar.style.background='#8a9ab5';item.appendChild(lbar);
    const info=el('div','ev-info','');
    const who=el('div','ev-who','');who.textContent=`T${cov.turno} · Guardia ${cov.guardia} · ${cov.quien}`;info.appendChild(who);
    const dts=el('div','ev-dates','');dts.textContent=cov.fromDate===cov.toDate?formatDate(cov.fromDate):`${formatDate(cov.fromDate)} → ${formatDate(cov.toDate)}`;info.appendChild(dts);
    if(cov.note){const nt=el('div','ev-note','');nt.textContent=cov.note;info.appendChild(nt);}
    const ts=el('div','ev-ts','');ts.innerHTML=`&#9203; ${fmtTs(new Date(cov.createdAt))}`;info.appendChild(ts);
    item.appendChild(info);
    const del=el('button','ev-del','✕');del.title='Eliminar';del.onclick=async()=>{if(!confirm('¿Eliminar cobertura?'))return;REL_COVERAGES=REL_COVERAGES.filter(c=>c.id!==cov.id);await saveRelData();renderRelPanel();};
    item.appendChild(del);
    list.appendChild(item);
  });
}

function openAddRelCoverage(){
  const n=new Date();const today=dk(n.getFullYear(),n.getMonth()+1,n.getDate());
  document.getElementById('rc-turno').value='';
  document.getElementById('rc-guardia').value='';
  document.getElementById('rc-quien').value='';
  document.getElementById('rc-from').value=today;
  document.getElementById('rc-to').value=today;
  document.getElementById('rc-note').value='';
  document.getElementById('rc-err').classList.remove('on');
  document.getElementById('m-rel-cov').classList.remove('off');
}

async function saveRelCoverage(){
  const turno=document.getElementById('rc-turno').value;
  const guardia=document.getElementById('rc-guardia').value;
  const quien=document.getElementById('rc-quien').value.trim();
  const from=document.getElementById('rc-from').value;
  const to=document.getElementById('rc-to').value;
  const note=document.getElementById('rc-note').value.trim();
  const err=document.getElementById('rc-err');
  if(!turno||!guardia||!quien||!from||!to){err.textContent='⚠ Completá todos los campos obligatorios.';err.classList.add('on');return;}
  if(from>to){err.textContent='⚠ La fecha de inicio debe ser anterior o igual a la de fin.';err.classList.add('on');return;}
  const cov={id:'rc'+Date.now(),userId:ME.id,turno,guardia,quien,fromDate:from,toDate:to,note,createdAt:new Date().toISOString()};
  REL_COVERAGES.push(cov);await saveRelData();closeM('m-rel-cov');renderRelPanel();
}

// ═══════════════════════════════════════════════════════════════════════════
// RECARGOS
// ═══════════════════════════════════════════════════════════════════════════
let recMonth=new Date().getMonth()+1,recYear=new Date().getFullYear();
let recPickerDate=null,recPickerG=null;

function isEsSobreFranco(guardia,date,turno){
  // Solo aplica a guardias A-E con turno numérico
  if(!['A','B','C','D','E'].includes(guardia))return false;
  if(!turno||turno==='F')return false;
  const scheduledTurno=getTurno(guardia,date);
  if(scheduledTurno==='F')return false; // no puede recargar en su propio franco
  // El día anterior debe ser franco
  const d=new Date(date+'T12:00:00');
  d.setDate(d.getDate()-1);
  const prevDay=dk(d.getFullYear(),d.getMonth()+1,d.getDate());
  const prevTurno=getTurno(guardia,prevDay);
  if(prevTurno!=='F')return false;
  // Y el turno recargado es anterior al turno programado ese día
  return parseInt(turno)<parseInt(scheduledTurno);
}

function openCellActions(date,guardia,turno,dayEvs){
  const panel=document.getElementById('cell-actions');
  const turnoLabel=turno==='F'?'Franco':turno?`T${turno}`:'·';
  document.getElementById('ca-date').textContent=`${formatDate(date).toUpperCase()}  ·  Guardia ${guardia}  ·  ${turnoLabel}`;

  const acts=document.getElementById('ca-actions');acts.innerHTML='';

  // ── Licenses section ──
  const secLic=el('div','ca-section','');
  const secLicTitle=el('div','ca-sec-title','LICENCIAS');
  secLic.appendChild(secLicTitle);

  if(dayEvs.length>0){
    dayEvs.forEach(ev=>{
      const li=LIC[ev.type]||{name:ev.type,color:'#8a9ab5'};
      const row=el('div','ca-lic-row','');
      // Badge
      const badge=el('span','ca-lic-badge','');
      badge.textContent=`${ev.type}`;
      badge.style.background=li.color;
      // Name + user
      const info=el('div','ca-lic-info','');
      const nm=el('span','ca-lic-name',li.name);nm.style.color=li.color;
      const usr=el('span','ca-lic-user',` — ${ev.userName}`);
      info.appendChild(nm);info.appendChild(usr);
      row.appendChild(badge);row.appendChild(info);
      // Delete button (own events only)
      if(ev.userId===ME.id){
        const del=el('button','ca-lic-del','✕');
        del.onclick=(e)=>{e.stopPropagation();closeCellActions();deleteEvent(ev.id);};
        row.appendChild(del);
      }
      secLic.appendChild(row);
    });
  } else {
    const empty=el('div','ca-lic-empty','Sin licencias este día');
    secLic.appendChild(empty);
  }
  acts.appendChild(secLic);

  // ── Divider ──
  acts.appendChild(el('div','ca-divider',''));

  // ── Bottom buttons: + Licencia  |  ⬆ Recargo ──
  const btnRow=el('div','ca-btn-row','');

  // Add license button
  const bLic=el('button','ca-bottom-btn','');
  bLic.innerHTML='<span>📋</span> Licencia';
  bLic.onclick=()=>{
    closeCellActions();
    document.getElementById('ev-from').value=date;
    document.getElementById('ev-to').value=date;
    document.getElementById('ev-note').value='';
    document.getElementById('ev-dc-hours').value=6;
    document.getElementById('dc-hours-row').style.display='none';
    document.getElementById('ev-err').classList.remove('on');
    document.querySelectorAll('.lt-btn').forEach(b=>{b.classList.remove('sel');b.style.background='';b.style.borderColor='';});
    document.getElementById('m-event').classList.remove('off');
  };
  btnRow.appendChild(bLic);

  // Recargo button
  const sobreFranco=isEsSobreFranco(guardia,date,turno);
  const bRec=el('button','ca-bottom-btn rec','');
  bRec.innerHTML=`<span>⬆</span> Rec.${sobreFranco?' 🔴':''}`;
  bRec.title=sobreFranco?'Recargo sobre franco (primer día post-franco en turno anterior)':'Recargo en día trabajado';
  bRec.onclick=()=>{closeCellActions();openRecPicker(date,guardia,turno,sobreFranco);};
  btnRow.appendChild(bRec);

  acts.appendChild(btnRow);
  panel.classList.remove('off');
}
function closeCellActions(){document.getElementById('cell-actions').classList.add('off');}

function openRecPicker(date,guardia,turno,sobreFranco){
  recPickerDate=date;recPickerG=guardia;
  document.getElementById('rec-picker-sub').textContent=`${formatDate(date)} · Guardia ${guardia}`;
  const ind=document.getElementById('rec-franco-indicator');
  ind.innerHTML=sobreFranco
    ?'<span class="rec-franco-tag">🔴 RECARGO SOBRE FRANCO</span>'
    :'<span class="rec-normal-tag">⬆ RECARGO EN DÍA TRABAJADO</span>';
  document.getElementById('rec-guardia').value=guardia;
  document.getElementById('rec-turno').value=turno||'';
  document.getElementById('rec-note').value='';
  document.getElementById('rec-err').classList.remove('on');
  document.getElementById('rec-picker').classList.remove('off');
}
function closeRecPicker(){document.getElementById('rec-picker').classList.add('off');}

async function saveRecargo(){
  const guardia=document.getElementById('rec-guardia').value;
  const turno=document.getElementById('rec-turno').value;
  const note=document.getElementById('rec-note').value.trim();
  const err=document.getElementById('rec-err');
  if(!guardia||!turno){err.textContent='⚠ Seleccioná guardia y turno.';err.classList.add('on');return;}
  const sobreFranco=isEsSobreFranco(guardia,recPickerDate,turno);
  const rec={
    id:'rec'+Date.now(),date:recPickerDate,guardia,turno:parseInt(turno),note,
    sobreFranco,userId:ME.id,userName:ME.name,createdAt:new Date().toISOString()
  };
  RECARGOS.push(rec);await saveRecargos();
  closeRecPicker();renderCal();if(S)renderRT(RT);renderRecPanel();
}

async function deleteRecargo(id){
  if(!confirm('¿Eliminar este recargo?'))return;
  RECARGOS=RECARGOS.filter(r=>r.id!==id);await saveRecargos();renderRecPanel();renderCal();if(S)renderRT(RT);
}

function toggleRecPanel(){
  const b=document.getElementById('rec-panel-body'),a=document.getElementById('rec-panel-arr');
  const open=b.classList.toggle('on');a.textContent=open?'▲':'▼';
  if(open)renderRecPanel();
}
function recNavMonth(d){
  recMonth+=d;if(recMonth>12){recMonth=1;recYear++;}if(recMonth<1){recMonth=12;recYear--;}
  renderRecPanel();
}
function renderRecPanel(){
  const lbl=document.getElementById('rec-month-lbl');
  if(!lbl)return;
  lbl.textContent=`${MES_L[recMonth].toUpperCase()} ${recYear}`;
  const monthRecs=RECARGOS.filter(r=>{const p=pd(r.date);return p.m===recMonth&&p.y===recYear;});
  const franco=monthRecs.filter(r=>r.sobreFranco);
  document.getElementById('rec-cnt-badge').textContent=monthRecs.length?`${monthRecs.length} recargo${monthRecs.length>1?'s':''}` :'';
  const sum=document.getElementById('rec-summary');sum.innerHTML='';
  const mkStat=(val,lbl2,color)=>{
    const d2=el('div','rec-stat','');
    const v=el('div','rec-stat-val','');v.textContent=val;v.style.color=color;
    const l=el('div','rec-stat-lbl','');l.textContent=lbl2;
    d2.appendChild(v);d2.appendChild(l);sum.appendChild(d2);
  };
  mkStat(monthRecs.length,'TOTAL','#ff6b35');
  mkStat(franco.length,'SOBRE FRANCO','#ff3b30');
  mkStat(monthRecs.length-franco.length,'DÍA TRABAJO','#ff8c5a');
  const list=document.getElementById('rec-list');list.innerHTML='';
  if(monthRecs.length===0){
    list.innerHTML='<div style="font-family:var(--font-mono);font-size:12px;color:var(--tdim);text-align:center;padding:16px;letter-spacing:1px">SIN RECARGOS ESTE MES</div>';
    return;
  }
  [...monthRecs].sort((a,b)=>a.date.localeCompare(b.date)).forEach(r=>{
    const item=el('div','rec-item'+(r.sobreFranco?' franco':''),'');
    const info=el('div','rec-item-info','');
    const date=el('div','rec-item-date','');date.textContent=`${formatDate(r.date)}  ·  T${r.turno}  ·  ${r.userName}`;
    const main=el('div','rec-item-main','');main.textContent=`Guardia ${r.guardia}`;
    const tag=el('span','rec-item-tag '+(r.sobreFranco?'franco':'normal'),'');
    tag.textContent=r.sobreFranco?'🔴 Sobre franco':'⬆ Día trabajado';
    info.appendChild(date);info.appendChild(main);info.appendChild(tag);
    if(r.note){const n=el('div','',r.note);n.style.cssText='font-size:13px;color:var(--tdim);margin-top:4px;';info.appendChild(n);}
    item.appendChild(info);
    if(ME&&r.userId===ME.id){const d2=el('button','rec-del','✕');d2.onclick=()=>deleteRecargo(r.id);item.appendChild(d2);}
    list.appendChild(item);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
(async()=>{
  const savedTheme=lsGet('gd-theme');
  if(savedTheme==='light'){document.body.classList.add('light');const b=document.getElementById('theme-btn');if(b)b.textContent='● OSCURO';}
  await loadData();
  await loadRelData();
  dsInit();
  // Wire cell-actions overlay close
  document.getElementById('cell-actions').addEventListener('click',e=>{if(e.target===document.getElementById('cell-actions'))closeCellActions();});
  document.getElementById('rec-picker').addEventListener('click',e=>{if(e.target===document.getElementById('rec-picker'))closeRecPicker();});
  updateUBar();
  const n=new Date();calDate=dk(n.getFullYear(),n.getMonth()+1,n.getDate());
  await renderCal();
  if(ME){renderEvP();document.getElementById('evp-body').classList.add('on');document.getElementById('evp-arr').textContent='▲';renderRecPanel();}
})();
</script>
</body>
</html>