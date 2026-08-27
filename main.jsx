import React,{useEffect,useMemo,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {
 LayoutDashboard,Users,UserRoundPlus,BookOpen,ClipboardCheck,Activity,BarChart3,
 ShieldCheck,Network,Brain,Settings,Download,Upload,Plus,Trash2,Edit3,Search,
 Moon,Sun,Printer,FileJson,FileSpreadsheet,RefreshCw,Save,Link as LinkIcon,
 Menu,X,ChevronLeft,CheckCircle2,AlertCircle,ExternalLink,GraduationCap
} from "lucide-react";
import "./styles.css";

const KEY="riyadah-v5-data";
const empty={learners:[],groups:[],assessments:[],tracking:[],fluency:[],settings:{school:"",teacher:"",academicYear:"2026/2027",dark:false}};
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||empty}catch{return empty}};
const uid=()=>crypto?.randomUUID?.()||Date.now()+"-"+Math.random().toString(16).slice(2);

function download(name,content,type="text/plain"){
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function csv(rows){
 if(!rows.length)return "";
 const keys=Object.keys(rows[0]); return "\ufeff"+[keys,...rows.map(r=>keys.map(k=>String(r[k]??"").replaceAll('"','""')))]
 .map(r=>r.map(x=>`"${x}"`).join(",")).join("\n");
}

const nav=[
 ["dashboard","الرئيسية",LayoutDashboard],["learners","المتعلمون والأقسام",Users],
 ["support","الدعم المكثف",Activity],["assessments","الرائز القبلي والبعدي",ClipboardCheck],
 ["tracking","شبكات التتبع",Network],["fluency","الطلاقة",BookOpen],["mindmap","خرائط ذهنية",Brain],
 ["reports","التقارير",BarChart3],["inspector","المفتشة المؤطرة",ShieldCheck],["integrations","التكاملات",LinkIcon],
 ["settings","الإعدادات",Settings]
];

function App(){
 const [data,setData]=useState(load); const [page,setPage]=useState("dashboard"); const [mobile,setMobile]=useState(false);
 const [toast,setToast]=useState("");
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(data)),[data]);
 useEffect(()=>{document.documentElement.classList.toggle("dark",!!data.settings.dark)},[data.settings.dark]);
 const notify=x=>{setToast(x);setTimeout(()=>setToast(""),2200)};
 const update=(key,value)=>setData(d=>({...d,[key]:value}));
 const reset=()=>{if(confirm("سيتم حذف جميع بيانات المنصة محلياً. هل أنت متأكد؟")){setData(empty);notify("تمت إعادة ضبط المنصة")}};
 const backup=()=>download("riyadah-backup.json",JSON.stringify(data,null,2),"application/json");
 const restore=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setData(JSON.parse(r.result));notify("تم استرجاع النسخة الاحتياطية")}catch{notify("ملف غير صالح")}};r.readAsText(f)};
 const content={
  dashboard:<Dashboard data={data} go={setPage}/>,
  learners:<Learners data={data} update={update} notify={notify}/>,
  support:<Support data={data} update={update}/>,
  assessments:<Assessments data={data} update={update}/>,
  tracking:<Tracking data={data} update={update}/>,
  fluency:<Fluency data={data} update={update}/>,
  mindmap:<MindMap notify={notify}/>,
  reports:<Reports data={data}/>,
  inspector:<Inspector data={data}/>,
  integrations:<Integrations/>,
  settings:<SettingsPage data={data} setData={setData} backup={backup} restore={restore} reset={reset} notify={notify}/>
 };
 return <div className="app">
  <aside className={"sidebar "+(mobile?"open":"")}>
   <div className="brand"><div className="logo"><Brain size={27}/></div><div><b>رُوّاد</b><small>منصة مؤسسات الريادة</small></div><button className="close" onClick={()=>setMobile(false)}><X/></button></div>
   <nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?"active":""} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={20}/><span>{label}</span></button>)}</nav>
   <div className="sideBottom"><span>السنة الدراسية</span><b>{data.settings.academicYear}</b></div>
  </aside>
  {mobile&&<div className="overlay" onClick={()=>setMobile(false)}/>}
  <main>
   <header><button className="menu" onClick={()=>setMobile(true)}><Menu/></button><div><h1>{nav.find(x=>x[0]===page)?.[1]||"رُوّاد"}</h1><p>{data.settings.school||"فضاء العمل التربوي الذكي"}</p></div>
   <div className="headerActions"><button title="نسخة احتياطية" onClick={backup}><Download size={19}/></button><button title="الوضع الليلي" onClick={()=>setData(d=>({...d,settings:{...d.settings,dark:!d.settings.dark}}))}>{data.settings.dark?<Sun/>:<Moon/>}</button></div></header>
   <section className="page">{content[page]}</section>
  </main>
  {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
 </div>
}

function Dashboard({data,go}){
 const weak=data.learners.filter(x=>x.status==="متعثر").length;
 return <><div className="hero"><div><span>منصة رُوّاد</span><h2>إدارة مؤسستك التعليمية<br/>من مكان واحد.</h2><p>الرائز القبلي والبعدي، الدعم المكثف، التتبع، الطلاقة، التقارير والملفات الفردية.</p></div><GraduationCap size={80}/></div>
 <div className="cards"><Stat title="المتعلمون" n={data.learners.length} icon={<Users/>}/><Stat title="الأقسام" n={data.groups.length} icon={<BookOpen/>}/><Stat title="المتعثرون" n={weak} icon={<AlertCircle/>}/><Stat title="الرائزات" n={data.assessments.length} icon={<ClipboardCheck/>}/></div>
 <div className="grid2"><Panel title="الوصول السريع"><div className="quick">{[["learners","إضافة متعلم"],["assessments","إدخال رائز"],["tracking","شبكة تتبع"],["mindmap","إنشاء خريطة ذهنية"],["reports","تقرير المؤسسة"]].map(([p,t])=><button key={p} onClick={()=>go(p)}><Plus size={17}/>{t}</button>)}</div></Panel>
 <Panel title="حالة المنصة"><div className="status"><CheckCircle2/> البيانات تحفظ تلقائياً على هذا الجهاز.<br/><CheckCircle2/> النسخ الاحتياطي والاسترجاع متاحان.<br/><CheckCircle2/> التصدير والطباعة يعملان بدون خادم.</div></Panel></div></>
}
function Stat({title,n,icon}){return <div className="stat"><div className="statIcon">{icon}</div><div><small>{title}</small><strong>{n}</strong></div></div>}
function Panel({title,children,action}){return <div className="panel"><div className="panelHead"><h3>{title}</h3>{action}</div>{children}</div>}
function Empty({text="لا توجد بيانات بعد."}){return <div className="empty">{text}</div>}

function Learners({data,update,notify}){
 const [tab,setTab]=useState("learners"),[q,setQ]=useState(""),[show,setShow]=useState(false),[edit,setEdit]=useState(null);
 const filtered=data.learners.filter(x=>(x.name||"").includes(q)||(x.group||"").includes(q));
 const save=f=>{const x={...f,id:f.id||uid()};update("learners",f.id?data.learners.map(a=>a.id===f.id?x:a):[...data.learners,x]);setShow(false);setEdit(null);notify("تم حفظ المتعلم")};
 const del=id=>{if(confirm("حذف المتعلم؟"))update("learners",data.learners.filter(x=>x.id!==id))};
 return <><div className="tabs"><button className={tab==="learners"?"sel":""} onClick={()=>setTab("learners")}>المتعلمون</button><button className={tab==="groups"?"sel":""} onClick={()=>setTab("groups")}>الأقسام</button></div>
 {tab==="learners"?<Panel title="سجل المتعلمين" action={<><div className="search"><Search size={17}/><input placeholder="بحث..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="primary" onClick={()=>{setEdit(null);setShow(true)}}><Plus/> متعلم جديد</button></>}>
 {!filtered.length?<Empty/>:<div className="tableWrap"><table><thead><tr><th>الاسم الكامل</th><th>القسم</th><th>الحالة</th><th>المعرف</th><th></th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><b>{x.name}</b></td><td>{x.group||"—"}</td><td><span className={"badge "+(x.status==="متعثر"?"bad":"ok")}>{x.status||"عادي"}</span></td><td>{x.code||"—"}</td><td className="rowActions"><button onClick={()=>{setEdit(x);setShow(true)}}><Edit3/></button><button onClick={()=>del(x.id)}><Trash2/></button></td></tr>)}</tbody></table></div>}
 </Panel>:<Groups data={data} update={update}/>}
 {show&&<Modal title={edit?"تعديل متعلم":"إضافة متعلم"} onClose={()=>setShow(false)}><LearnerForm initial={edit} groups={data.groups} onSave={save}/></Modal>}</>
}
function LearnerForm({initial,groups,onSave}){const [f,setF]=useState(initial||{name:"",group:"",status:"عادي",code:"",notes:""});return <form onSubmit={e=>{e.preventDefault();if(!f.name.trim())return;onSave(f)}}><Field label="الاسم الكامل"><input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><Field label="القسم"><input list="groups" value={f.group} onChange={e=>setF({...f,group:e.target.value})}/><datalist id="groups">{groups.map(g=><option key={g.id}>{g.name}</option>)}</datalist></Field><Field label="الحالة"><select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option>عادي</option><option>متعثر</option><option>متفوق</option></select></Field><Field label="المعرف"><input value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></Field><Field label="ملاحظات"><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></Field><button className="primary full"><Save/> حفظ</button></form>}
function Groups({data,update}){const [name,setName]=useState("");return <Panel title="إدارة الأقسام"><div className="inline"><input placeholder="اسم القسم..." value={name} onChange={e=>setName(e.target.value)}/><button className="primary" onClick={()=>{if(name.trim()){update("groups",[...data.groups,{id:uid(),name:name.trim()}]);setName("")}}}><Plus/> إضافة</button></div><div className="chips">{data.groups.map(g=><div className="chip" key={g.id}>{g.name}<button onClick={()=>update("groups",data.groups.filter(x=>x.id!==g.id))}><X size={15}/></button></div>)}</div></Panel>}

function Support({data,update}){const [f,setF]=useState({learner:"",date:new Date().toISOString().slice(0,10),domain:"اللغة العربية",score:"",note:""});return <Panel title="سجل الدعم المكثف" action={<span className="muted">تُحفظ السجلات محلياً</span>}><form className="formGrid" onSubmit={e=>{e.preventDefault();update("tracking",[...data.tracking,{id:uid(),type:"دعم مكثف",...f}]);setF({...f,learner:"",score:"",note:""})}}><Field label="المتعلم"><select value={f.learner} onChange={e=>setF({...f,learner:e.target.value})}><option value="">اختر...</option>{data.learners.map(x=><option key={x.id} value={x.name}>{x.name}</option>)}</select></Field><Field label="التاريخ"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><Field label="المجال"><input value={f.domain} onChange={e=>setF({...f,domain:e.target.value})}/></Field><Field label="النتيجة"><input type="number" min="0" max="100" value={f.score} onChange={e=>setF({...f,score:e.target.value})}/></Field><Field label="ملاحظة"><input value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></Field><button className="primary"><Save/> تسجيل</button></form><Records rows={data.tracking.filter(x=>x.type==="دعم مكثف")} update={update} data={data} keyName="tracking"/></Panel>}

function Assessments({data,update}){const [f,setF]=useState({learner:"",kind:"قبلي",domain:"اللغة العربية",score:"",max:"100",date:new Date().toISOString().slice(0,10)});return <Panel title="الرائز القبلي والبعدي"><form className="formGrid" onSubmit={e=>{e.preventDefault();if(!f.learner)return;update("assessments",[...data.assessments,{id:uid(),...f,score:+f.score,max:+f.max}]);setF({...f,score:""})}}><Field label="المتعلم"><select value={f.learner} onChange={e=>setF({...f,learner:e.target.value})}><option value="">اختر...</option>{data.learners.map(x=><option key={x.id}>{x.name}</option>)}</select></Field><Field label="نوع الرائز"><select value={f.kind} onChange={e=>setF({...f,kind:e.target.value})}><option>قبلي</option><option>بعدي</option></select></Field><Field label="المجال"><input value={f.domain} onChange={e=>setF({...f,domain:e.target.value})}/></Field><Field label="النتيجة"><input required type="number" min="0" value={f.score} onChange={e=>setF({...f,score:e.target.value})}/></Field><Field label="السقف"><input type="number" value={f.max} onChange={e=>setF({...f,max:e.target.value})}/></Field><Field label="التاريخ"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><button className="primary"><Save/> تسجيل الرائز</button></form><Records rows={data.assessments} update={update} data={data} keyName="assessments"/></Panel>}

function Tracking({data,update}){const [f,setF]=useState({learner:"",domain:"القراءة",level:"في طور الاكتساب",date:new Date().toISOString().slice(0,10),note:""});return <Panel title="شبكات التتبع"><form className="formGrid" onSubmit={e=>{e.preventDefault();update("tracking",[...data.tracking,{id:uid(),type:"تتبع",...f}])}}><Field label="المتعلم"><select value={f.learner} onChange={e=>setF({...f,learner:e.target.value})}><option value="">اختر...</option>{data.learners.map(x=><option key={x.id}>{x.name}</option>)}</select></Field><Field label="المجال"><input value={f.domain} onChange={e=>setF({...f,domain:e.target.value})}/></Field><Field label="المستوى"><select value={f.level} onChange={e=>setF({...f,level:e.target.value})}><option>مكتسب</option><option>في طور الاكتساب</option><option>غير مكتسب</option></select></Field><Field label="التاريخ"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><Field label="ملاحظة"><input value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></Field><button className="primary"><Save/> إضافة</button></form><Records rows={data.tracking.filter(x=>x.type==="تتبع")} update={update} data={data} keyName="tracking"/></Panel>}

function Fluency({data,update}){const [f,setF]=useState({learner:"",words:"",correct:"",errors:"",date:new Date().toISOString().slice(0,10)});return <Panel title="شبكات الطلاقة"><form className="formGrid" onSubmit={e=>{e.preventDefault();const pct=f.words?Math.round((+f.correct/+f.words)*100):0;update("fluency",[...data.fluency,{id:uid(),...f,pct}]);setF({...f,learner:"",words:"",correct:"",errors:""})}}><Field label="المتعلم"><select value={f.learner} onChange={e=>setF({...f,learner:e.target.value})}><option value="">اختر...</option>{data.learners.map(x=><option key={x.id}>{x.name}</option>)}</select></Field><Field label="عدد الكلمات"><input type="number" value={f.words} onChange={e=>setF({...f,words:e.target.value})}/></Field><Field label="الصحيحة"><input type="number" value={f.correct} onChange={e=>setF({...f,correct:e.target.value})}/></Field><Field label="الأخطاء"><input type="number" value={f.errors} onChange={e=>setF({...f,errors:e.target.value})}/></Field><Field label="التاريخ"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><button className="primary"><Save/> تسجيل</button></form><Records rows={data.fluency} update={update} data={data} keyName="fluency"/></Panel>}

function Records({rows,update,data,keyName}){if(!rows.length)return <Empty text="لا توجد سجلات بعد."/>;return <div className="tableWrap"><table><thead><tr><th>المتعلم</th><th>التاريخ</th><th>النوع/المجال</th><th>النتيجة</th><th></th></tr></thead><tbody>{rows.slice().reverse().map(r=><tr key={r.id}><td>{r.learner}</td><td>{r.date}</td><td>{r.kind||r.domain||r.type}</td><td>{r.pct!=null?r.pct+"%":r.score!=null?`${r.score}/${r.max}`:r.level}</td><td><button onClick={()=>update(keyName,data[keyName].filter(x=>x.id!==r.id))}><Trash2/></button></td></tr>)}</tbody></table></div>}

function MindMap({notify}){const [text,setText]=useState("عنوان الدرس\nمفهوم أساسي\nفكرة أولى\nفكرة ثانية\nتطبيق");const [items,setItems]=useState([]);const generate=()=>{const a=text.split("\n").map(x=>x.trim()).filter(Boolean);setItems(a);notify("تم إنشاء الخريطة الذهنية")};return <div className="grid2"><Panel title="مولّد الخرائط الذهنية"><p className="muted">ألصق عناوين الدرس، كل فكرة في سطر، ثم أنشئ الخريطة.</p><textarea className="bigText" value={text} onChange={e=>setText(e.target.value)}/><button className="primary" onClick={generate}><Brain/> إنشاء الخريطة</button></Panel><Panel title="المعاينة"><div className="mindmap">{(items.length?items:text.split("\n").filter(Boolean)).map((x,i)=><div className={i===0?"node root":"node"} key={i}>{x}</div>)}</div><button onClick={()=>window.print()}><Printer/> طباعة</button></Panel></div>}

function Reports({data}){const avg=useMemo(()=>data.assessments.length?Math.round(data.assessments.reduce((s,x)=>s+(x.max?x.score/x.max*100:0),0)/data.assessments.length):0,[data.assessments]);return <><div className="cards"><Stat title="متوسط النتائج" n={avg+"%"} icon={<BarChart3/>}/><Stat title="المتعلمون" n={data.learners.length} icon={<Users/>}/><Stat title="سجلات التتبع" n={data.tracking.length} icon={<Network/>}/></div><Panel title="تقرير مختصر" action={<><button onClick={()=>window.print()}><Printer/> طباعة</button><button onClick={()=>download("learners.csv",csv(data.learners),"text/csv") }><FileSpreadsheet/> CSV</button><button onClick={()=>download("riyadah-report.json",JSON.stringify(data,null,2),"application/json")}><FileJson/> JSON</button></>}><div className="report"><h2>{data.settings.school||"مؤسسة الريادة"}</h2><p>السنة الدراسية: {data.settings.academicYear}</p><div className="progress"><span style={{width:avg+"%"}}/></div><p>متوسط الرائزات المسجلة: <b>{avg}%</b></p><p>عدد المتعلمين: <b>{data.learners.length}</b> — المتعثرون: <b>{data.learners.filter(x=>x.status==="متعثر").length}</b></p></div></Panel></>}

function Inspector({data}){return <Panel title="المفتشة المؤطرة"><div className="inspector"><ShieldCheck size={55}/><h2>فضاء التأطير والمواكبة</h2><p>يمكن تخصيص هذه الصفحة لتجميع الملاحظات، الزيارات، خطط التحسين، والتوجيهات.</p><Field label="ملاحظات التأطير"><textarea placeholder="اكتب الملاحظات هنا..."/></Field><button className="primary" onClick={()=>alert("تم حفظ الملاحظات محلياً في هذه الجلسة.")}><Save/> حفظ</button></div></Panel>}

function Integrations(){const links=[["Google Classroom","https://classroom.google.com/"],["Canva","https://www.canva.com/"],["مسار","https://massar.men.gov.ma/"]];return <Panel title="التكاملات"><div className="integrationGrid">{links.map(([n,u])=><a className="integration" href={u} target="_blank" rel="noreferrer" key={n}><ExternalLink/><b>{n}</b><span>فتح الخدمة</span></a>)}</div><div className="notice"><AlertCircle/> هذه الروابط تفتح الخدمات الرسمية في نافذة جديدة. لا يتم حفظ كلمات المرور داخل المنصة.</div></Panel>}

function SettingsPage({data,setData,backup,restore,reset,notify}){const file=useRef();return <div className="grid2"><Panel title="إعدادات المؤسسة"><Field label="اسم المؤسسة"><input value={data.settings.school} onChange={e=>setData(d=>({...d,settings:{...d.settings,school:e.target.value}}))}/></Field><Field label="اسم الأستاذ"><input value={data.settings.teacher} onChange={e=>setData(d=>({...d,settings:{...d.settings,teacher:e.target.value}}))}/></Field><Field label="السنة الدراسية"><input value={data.settings.academicYear} onChange={e=>setData(d=>({...d,settings:{...d.settings,academicYear:e.target.value}}))}/></Field><button className="primary" onClick={()=>notify("تم الحفظ تلقائياً")}><Save/> حفظ</button></Panel><Panel title="النسخ الاحتياطي"><button onClick={backup}><Download/> تصدير نسخة احتياطية</button><button onClick={()=>file.current.click()}><Upload/> استرجاع نسخة</button><input ref={file} hidden type="file" accept=".json" onChange={restore}/><hr/><button className="danger" onClick={reset}><RefreshCw/> مسح جميع البيانات وإعادة البدء</button></Panel></div>}

function Modal({title,onClose,children}){return <div className="modalBg"><div className="modal"><div className="modalHead"><h3>{title}</h3><button onClick={onClose}><X/></button></div>{children}</div></div>}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}

createRoot(document.getElementById("root")).render(<App/>);
