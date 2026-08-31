(()=>{
  const URL='https://bnqbavlkvrpcbhqxctda.supabase.co';
  const KEY='sb_publishable_VdXBsOFWR1Y6N7GNm8lh_g_0Vl7319q';
  const sb=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  const DATA_KEY='riyadah_v14_ultimate';
  let busy=false,schoolId=null,last='';
  const idOf=(x,p='item')=>String(x?.id||x?.key||x?.code||x?.source_key||`${p}:${JSON.stringify(x).slice(0,180)}`);
  const text=(x,...keys)=>{for(const k of keys)if(x&&x[k]!=null&&String(x[k]).trim()!=='')return String(x[k]).trim();return ''};
  const arr=(x,...keys)=>{for(const k of keys)if(Array.isArray(x?.[k]))return x[k];return []};

  async function ensureWorkspace(user){
    const {data:m,error:me}=await sb.from('school_memberships').select('school_id,role,status').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle();
    if(me)throw me;
    if(m?.school_id){schoolId=m.school_id;return schoolId;}
    const {data:p,error:pe}=await sb.from('profiles').select('full_name,school_name').eq('id',user.id).single();
    if(pe)throw pe;
    const name=text(p,'school_name')||`${text(p,'full_name')||user.email} — فضاء شخصي`;
    const {data:s,error:se}=await sb.from('schools').insert({name,created_by:user.id}).select('id').single();
    if(se){const {data:again,error:ae}=await sb.from('school_memberships').select('school_id').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle();if(ae||!again)throw se;schoolId=again.school_id;return schoolId;}
    const {error:mi}=await sb.from('school_memberships').insert({school_id:s.id,user_id:user.id,role:'teacher',status:'active'});
    if(mi)throw mi;schoolId=s.id;return schoolId;
  }
  async function upsertLevels(user,data){const levels=arr(data,'levels','niveaux');for(let i=0;i<levels.length;i++){const x=levels[i]||{},name=text(x,'name','title','label')||`المستوى ${i+1}`,key=idOf(x,`level:${i}`);const {error}=await sb.from('levels').upsert({school_id:schoolId,source_key:key,name,code:text(x,'code'),sort_order:i,created_by:user.id},{onConflict:'school_id,source_key'});if(error)throw error;}}
  async function upsertSubjects(user,data){const subjects=arr(data,'subjects','matieres','materials');for(let i=0;i<subjects.length;i++){const x=subjects[i]||{},name=text(x,'name','title','label')||String(x||'');if(!name)continue;const key=idOf(x,`subject:${i}`);const {error}=await sb.from('subjects').upsert({school_id:schoolId,source_key:key,name,code:text(x,'code')},{onConflict:'school_id,source_key'});if(error)throw error;}}
  async function upsertClasses(user,data){const {data:levels,error:le}=await sb.from('levels').select('id,source_key').eq('school_id',schoolId);if(le)throw le;const lm=new Map((levels||[]).map(x=>[x.source_key,x.id]));const classes=arr(data,'classes','groups','sections','afwaj');for(let i=0;i<classes.length;i++){const x=classes[i]||{},key=idOf(x,`class:${i}`),name=text(x,'name','title','label')||`قسم ${i+1}`,lk=text(x,'levelId','level_id','levelKey'),level_id=lk?lm.get(lk)||null:null;const {error}=await sb.from('classes').upsert({school_id:schoolId,source_key:key,name,level_id,teacher_id:user.id,school_year:text(x,'year','school_year')||'2026/2027'},{onConflict:'school_id,source_key'});if(error)throw error;}}
  async function upsertStudents(user,data){const {data:classes,error:ce}=await sb.from('classes').select('id,source_key').eq('school_id',schoolId);if(ce)throw ce;const cm=new Map((classes||[]).map(x=>[x.source_key,x.id]));const students=arr(data,'students','learners','eleves','learnersList');for(let i=0;i<students.length;i++){const x=students[i]||{},key=idOf(x,`student:${i}`),full=text(x,'name','full_name','fullName'),first=text(x,'first_name','firstName')||full.split(/\s+/)[0]||`متعلم ${i+1}`,last=text(x,'last_name','lastName')||full.split(/\s+/).slice(1).join(' ')||' ',ck=text(x,'classId','class_id','classKey');const {error}=await sb.from('students').upsert({school_id:schoolId,source_key:key,first_name:first,last_name:last,student_code:text(x,'code','student_code','id'),class_id:ck?cm.get(ck)||null:null,gender:text(x,'gender','sexe'),notes:text(x,'notes','note')},{onConflict:'school_id,source_key'});if(error)throw error;}}
  async function pushSpecial(user,data){const mind=arr(data,'mindmaps','mindMaps','maps');for(let i=0;i<mind.length;i++){const x=mind[i]||{},payload={school_id:schoolId,source_key:idOf(x,`mindmap:${i}`),title:text(x,'title','name')||`خريطة ${i+1}`,source_filename:text(x,'source_filename','filename','fileName'),source_language:text(x,'source_language','language','lang'),structure:x.structure||x.tree||x};const {error}=await sb.from('mindmaps').upsert(payload,{onConflict:'school_id,source_key'});if(error)throw error;}const flu=arr(data,'fluency','fluencyRecords');for(let i=0;i<flu.length;i++){const x=flu[i]||{},payload={school_id:schoolId,source_key:idOf(x,`fluency:${i}`),class_id:null,student_id:null,level:text(x,'level'),words_per_minute:Number(x.words_per_minute??x.wpm)||null,accuracy:Number(x.accuracy)||null,mastery:text(x,'mastery','status'),created_by:user.id};const {error}=await sb.from('fluency_records').upsert(payload,{onConflict:'school_id,source_key'});if(error)throw error;}}
  async function normalize(user,data){await ensureWorkspace(user);await upsertLevels(user,data);await upsertSubjects(user,data);await upsertClasses(user,data);await upsertStudents(user,data);await pushSpecial(user,data);}
  async function tick(){if(busy||!sb)return;const {data:{session}}=await sb.auth.getSession();if(!session)return;const frame=document.getElementById('appFrame');if(!frame)return;let raw=null;try{raw=frame.contentWindow.localStorage.getItem(DATA_KEY)}catch{}if(!raw||raw===last)return;busy=true;try{await normalize(session.user,JSON.parse(raw));last=raw;document.title='رَوّاد — سحابي'}catch(e){console.warn('Cloud normalization:',e)}finally{busy=false}}
  sb?.auth.onAuthStateChange(()=>{last='';schoolId=null});
  setInterval(tick,3500);setTimeout(tick,1200);

  const adminCss=`<style id="riyadah-admin-css">
#riyadah-admin-launch{position:fixed;right:18px;bottom:18px;z-index:99999;border:0;border-radius:14px;padding:12px 16px;background:#0b5ed7;color:#fff;font-weight:900;box-shadow:0 8px 30px #0003;cursor:pointer;font-family:inherit}
#riyadah-admin-overlay{position:fixed;inset:0;z-index:100000;background:#071525cc;display:none;align-items:center;justify-content:center;padding:14px;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif}
#riyadah-admin-modal{width:min(1180px,100%);max-height:94vh;overflow:auto;background:#f4f7fb;border-radius:24px;padding:0;direction:rtl;box-shadow:0 25px 90px #0009}
.ra-head{background:linear-gradient(135deg,#0b2038,#1769d3);color:#fff;padding:22px 24px;border-radius:24px 24px 0 0}.ra-head-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.ra-head h2{margin:0;font-size:24px}.ra-head p{margin:6px 0 0;opacity:.82}.ra-close{border:0;background:#ffffff20;color:#fff;border-radius:10px;padding:8px 12px;cursor:pointer;font-weight:900}
.ra-content{padding:18px}.ra-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:15px}.ra-card{background:#fff;border:1px solid #e1e8f0;border-radius:15px;padding:14px;box-shadow:0 4px 15px #102a4308}.ra-card .label{font-size:12px;color:#66788a}.ra-card b{display:block;font-size:27px;margin-top:4px}.ra-card.accent{background:#eaf3ff;border-color:#b9d7fb}.ra-card.green{background:#e8f8f1;border-color:#bde7d3}.ra-card.red{background:#fff0f0;border-color:#f3c5c5}
.ra-sections{display:grid;grid-template-columns:1fr 1.8fr;gap:14px}.ra-panel{background:#fff;border:1px solid #e1e8f0;border-radius:17px;padding:16px;margin-bottom:14px}.ra-panel h3{margin:0 0 12px}.ra-panel-sub{font-size:13px;color:#66788a;margin:-5px 0 12px}.ra-form{display:grid;gap:9px}.ra-form input,.ra-form select{width:100%;padding:11px;border:1px solid #cbd5df;border-radius:10px;font:inherit;background:#fff}.ra-form .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ra-btn{border:0;border-radius:9px;padding:9px 12px;font:inherit;font-weight:850;cursor:pointer;margin:2px}.ra-primary{background:#1769d3;color:#fff}.ra-ok{background:#dff7ec;color:#08734f}.ra-warn{background:#fff1d8;color:#8a5200}.ra-danger{background:#ffe1e1;color:#9b2020}.ra-light{background:#eef3f8;color:#173b67}.ra-btn:disabled{opacity:.5;cursor:not-allowed}.ra-note{padding:11px 12px;border-radius:11px;background:#eef6ff;color:#1558a0;font-size:13px;line-height:1.7}.ra-error{padding:11px 12px;background:#fff0f0;color:#9b2020;border-radius:11px;font-size:13px;line-height:1.7}.ra-success{padding:11px 12px;background:#e7f7f0;color:#08734f;border-radius:11px;font-size:13px;line-height:1.7}
.ra-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.ra-toolbar input,.ra-toolbar select{padding:10px;border:1px solid #cbd5df;border-radius:10px;font:inherit;background:#fff}.ra-toolbar input{flex:1;min-width:190px}.ra-table-wrap{overflow:auto}.ra-table{width:100%;border-collapse:collapse;font-size:13px;min-width:760px}.ra-table th,.ra-table td{padding:10px;border-bottom:1px solid #e7edf3;text-align:right;vertical-align:middle}.ra-table th{background:#f5f8fb;color:#526578}.ra-status{display:inline-block;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:900}.ra-active{background:#def7ec;color:#086b4b}.ra-inactive{background:#fee7e7;color:#9b2020}.ra-role{display:inline-block;padding:4px 8px;border-radius:999px;background:#edf4ff;color:#1558a0;font-size:11px;font-weight:900}.ra-actions{white-space:nowrap}.ra-empty{padding:28px;text-align:center;color:#66788a}.ra-loading{padding:30px;text-align:center;color:#1558a0}
@media(max-width:850px){.ra-grid{grid-template-columns:repeat(2,1fr)}.ra-sections{grid-template-columns:1fr}.ra-form .two{grid-template-columns:1fr}.ra-content{padding:12px}.ra-head{padding:17px}.ra-head h2{font-size:20px}}
</style>`;

  async function adminCall(action,body={}){
    const {data:{session}}=await sb.auth.getSession();
    if(!session)throw Error('انتهت جلسة المدير. أعد تسجيل الدخول.');
    const {data,error}=await sb.functions.invoke('admin-user-management',{body:{action,...body}});
    if(error)throw error;
    if(data?.error)throw Error(data.error);
    return data;
  }

  function roleLabel(r){return r==='admin'?'مدير':r==='inspector'?'مفتش':'أستاذ'}

  async function renderAdmin(doc){
    const root=doc?.getElementById('riyadah-admin-modal');
    if(!root)return;
    root.innerHTML='<div class="ra-loading">⏳ جاري تحميل لوحة الإدارة…</div>';
    try{
      const {users}=await adminCall('list');
      const profiles=users||[];
      const stats={all:profiles.length,active:profiles.filter(u=>u.profile?.is_active).length,inactive:profiles.filter(u=>u.profile?.is_active===false).length,teachers:profiles.filter(u=>u.profile?.role==='teacher').length,inspectors:profiles.filter(u=>u.profile?.role==='inspector').length};
      root.innerHTML=`<div class="ra-head"><div class="ra-head-top"><div><h2>🛡️ لوحة قيادة المدير</h2><p>إدارة المستخدمين والأساتذة والمفتشين وصلاحيات الولوج</p></div><button class="ra-close" id="ra-close">✕ إغلاق</button></div></div><div class="ra-content"><div class="ra-grid"><div class="ra-card accent"><span class="label">إجمالي الحسابات</span><b>${stats.all}</b></div><div class="ra-card green"><span class="label">الحسابات النشطة</span><b>${stats.active}</b></div><div class="ra-card red"><span class="label">الحسابات المعطلة</span><b>${stats.inactive}</b></div><div class="ra-card"><span class="label">الأساتذة</span><b>${stats.teachers}</b></div><div class="ra-card"><span class="label">المفتشون</span><b>${stats.inspectors}</b></div></div><div class="ra-sections"><div><div class="ra-panel"><h3>➕ إضافة أستاذ</h3><div class="ra-panel-sub">ينشئ المدير حساب الأستاذ مباشرة. سيحصل الأستاذ على بريد إلكتروني وكلمة مرور مؤقتة.</div><div id="ra-add-msg"></div><div class="ra-form"><input id="ra-name" placeholder="الاسم الكامل للأستاذ"><input id="ra-email" type="email" placeholder="البريد الإلكتروني"><div class="two"><input id="ra-pass" type="password" placeholder="كلمة مرور مؤقتة (8 أحرف على الأقل)"><input id="ra-phone" placeholder="الهاتف (اختياري)"></div><input id="ra-school" placeholder="المؤسسة / المديرية (اختياري)"><button class="ra-btn ra-primary" id="ra-add">👨‍🏫 إنشاء حساب الأستاذ</button></div></div><div class="ra-panel"><h3>ℹ️ صلاحيات المدير</h3><div class="ra-note">المدير هو الوحيد الذي يدير الحسابات. يمكنه تفعيل أو تعطيل الحسابات، وتعيين الصفة أستاذ أو مفتش. حساب المدير الحالي محمي ولا يمكن تعطيله من هذه اللوحة.</div></div></div><div><div class="ra-panel"><h3>👥 إدارة المستخدمين</h3><div class="ra-toolbar"><input id="ra-search" placeholder="بحث بالاسم أو البريد أو المؤسسة"><select id="ra-filter"><option value="all">كل الحسابات</option><option value="teacher">الأساتذة</option><option value="inspector">المفتشون</option><option value="active">النشطون</option><option value="inactive">المعطلون</option></select><button class="ra-btn ra-light" id="ra-refresh">↻ تحديث</button></div><div id="ra-body"></div></div></div></div></div>`;
      doc.getElementById('ra-close').onclick=()=>{doc.getElementById('riyadah-admin-overlay').style.display='none'};
      doc.getElementById('ra-refresh').onclick=()=>renderAdmin(doc);

      const addMsg=doc.getElementById('ra-add-msg');
      doc.getElementById('ra-add').onclick=async()=>{
        const btn=doc.getElementById('ra-add');btn.disabled=true;addMsg.innerHTML='';
        try{
          const name=doc.getElementById('ra-name').value.trim(),email=doc.getElementById('ra-email').value.trim(),password=doc.getElementById('ra-pass').value,phone=doc.getElementById('ra-phone').value.trim(),school=doc.getElementById('ra-school').value.trim();
          if(!name||!email||password.length<8)throw Error('أدخل الاسم والبريد وكلمة مرور مؤقتة من 8 أحرف على الأقل.');
          await adminCall('create_teacher',{full_name:name,email,password,phone,school_name:school});
          addMsg.innerHTML='<div class="ra-success">✅ تم إنشاء حساب الأستاذ وتفعيله بنجاح. احتفظ بكلمة المرور المؤقتة وشاركها مع الأستاذ بشكل آمن.</div>';
          doc.getElementById('ra-name').value='';doc.getElementById('ra-email').value='';doc.getElementById('ra-pass').value='';doc.getElementById('ra-phone').value='';
          setTimeout(()=>renderAdmin(doc),700);
        }catch(e){addMsg.innerHTML=`<div class="ra-error">❌ ${e.message||e}</div>`}finally{btn.disabled=false}
      };

      const body=doc.getElementById('ra-body');
      const draw=()=>{
        const q=doc.getElementById('ra-search').value.trim().toLowerCase(),f=doc.getElementById('ra-filter').value;
        const rows=profiles.filter(u=>{const p=u.profile||{};const fm=f==='all'||(f==='active'&&p.is_active)||(f==='inactive'&&p.is_active===false)||p.role===f;const qm=!q||[u.email,p.full_name,p.school_name,p.role,p.requested_role].some(v=>String(v||'').toLowerCase().includes(q));return fm&&qm});
        const currentAdmin=profiles.find(u=>u.profile?.role==='admin');
        body.innerHTML=rows.length?`<div class="ra-table-wrap"><table class="ra-table"><thead><tr><th>المستخدم</th><th>الصفة</th><th>المؤسسة</th><th>الحالة</th><th>آخر دخول</th><th>الإجراءات</th></tr></thead><tbody>${rows.map(u=>{const p=u.profile||{},isAdmin=u.id===currentAdmin?.id;return `<tr><td><b>${p.full_name||'بدون اسم'}</b><br><small>${u.email||'—'}</small></td><td><span class="ra-role">${roleLabel(p.role)}</span></td><td>${p.school_name||'—'}</td><td><span class="ra-status ${p.is_active?'ra-active':'ra-inactive'}">${p.is_active?'🟢 نشط':'🔴 معطل'}</span></td><td>${u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString('ar-MA'):'لم يدخل بعد'}</td><td class="ra-actions">${isAdmin?'<b>حساب المدير</b>':`${p.is_active?`<button class="ra-btn ra-danger" data-act="deactivate" data-id="${u.id}">تعطيل</button>`:`<button class="ra-btn ra-ok" data-act="activate" data-id="${u.id}">تفعيل</button>`}<button class="ra-btn ra-warn" data-act="teacher" data-id="${u.id}">أستاذ</button><button class="ra-btn ra-warn" data-act="inspector" data-id="${u.id}">مفتش</button>`}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="ra-empty">لا توجد حسابات مطابقة للبحث.</div>';
        body.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const act=b.dataset.act;if(act==='activate'||act==='deactivate')await adminCall('set_status',{user_id:b.dataset.id,is_active:act==='activate'});else await adminCall('set_role',{user_id:b.dataset.id,role:act});await renderAdmin(doc)}catch(e){alert('تعذر تنفيذ العملية: '+(e.message||e))}finally{b.disabled=false}});
      };
      doc.getElementById('ra-search').oninput=draw;doc.getElementById('ra-filter').onchange=draw;draw();
    }catch(e){root.innerHTML=`<div class="ra-panel ra-error"><b>تعذر تحميل لوحة الإدارة.</b><br>${e.message||e}<br><small>تحقق من اتصال Supabase ومن نشر وظيفة إدارة المستخدمين.</small></div>`}
  }

  async function mountAdmin(){
    const frame=document.getElementById('appFrame');
    if(!frame?.contentDocument||!sb)return;
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return;
    const {data:p,error}=await sb.from('profiles').select('role,is_active').eq('id',session.user.id).maybeSingle();
    if(error||p?.role!=='admin'||p?.is_active!==true)return;
    const doc=frame.contentDocument;
    if(!doc.getElementById('riyadah-admin-css'))doc.head.insertAdjacentHTML('beforeend',adminCss);
    let btn=doc.getElementById('riyadah-admin-launch');
    if(!btn){btn=doc.createElement('button');btn.id='riyadah-admin-launch';btn.type='button';btn.textContent='🛡️ إدارة المنصة';doc.body.appendChild(btn)}
    let ov=doc.getElementById('riyadah-admin-overlay');
    if(!ov){ov=doc.createElement('div');ov.id='riyadah-admin-overlay';ov.innerHTML='<div id="riyadah-admin-modal"></div>';doc.body.appendChild(ov)}
    if(!btn.__bound){btn.__bound=true;btn.onclick=()=>{ov.style.display='flex';renderAdmin(doc)}}
  }
  setInterval(mountAdmin,2200);setTimeout(mountAdmin,1800);

  async function bridgeSession(){
    const frame=document.getElementById('appFrame');if(!frame?.contentWindow||!sb)return;
    const {data:{session}}=await sb.auth.getSession();if(!session)return;
    try{const w=frame.contentWindow,username=session.user.user_metadata?.full_name||session.user.email||'مستخدم';w.localStorage.setItem('riyadah_v15_auth_v1',JSON.stringify({username,hash:'supabase-session',created:new Date().toISOString()}));w.sessionStorage.setItem('riyadah_v15_session_v1',JSON.stringify({username,expires:Date.now()+8*60*60*1000,cloudUserId:session.user.id,role:'admin'}));const auth=w.document.getElementById('authScreen');if(auth)auth.style.display='none';if(typeof w.updateAuthUI==='function')w.updateAuthUI();if(typeof w.render==='function')w.render()}catch(e){console.warn('Auth bridge:',e)}
  }
  const watchFrame=()=>{const frame=document.getElementById('appFrame');if(frame&&!frame.__riyadahBridge){frame.__riyadahBridge=true;frame.addEventListener('load',()=>setTimeout(bridgeSession,150))}};
  setInterval(watchFrame,500);setTimeout(bridgeSession,800);
})();