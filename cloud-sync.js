(()=>{
  const URL='https://bnqbavlkvrpcbhqxctda.supabase.co';
  const KEY='sb_publishable_VdXBsOFWR1Y6N7GNm8lh_g_0Vl7319q';
  const sb=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  const DATA_KEY='riyadah_v14_ultimate';
  let busy=false, schoolId=null, last='';
  const idOf=(x,p='item')=>String(x?.id||x?.key||x?.code||x?.source_key||`${p}:${JSON.stringify(x).slice(0,180)}`);
  const text=(x,...keys)=>{for(const k of keys){if(x&&x[k]!=null&&String(x[k]).trim()!=='')return String(x[k]).trim()}return ''};
  const arr=(x,...keys)=>{for(const k of keys)if(Array.isArray(x?.[k]))return x[k];return []};
  async function ensureWorkspace(user){
    const {data:m,error:me}=await sb.from('school_memberships').select('school_id,role,status').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle();
    if(me)throw me;
    if(m?.school_id){schoolId=m.school_id;return schoolId;}
    const {data:p,error:pe}=await sb.from('profiles').select('full_name,school_name').eq('id',user.id).single();
    if(pe)throw pe;
    const name=text(p,'school_name')||`${text(p,'full_name')||user.email} — فضاء شخصي`;
    const {data:s,error:se}=await sb.from('schools').insert({name,created_by:user.id}).select('id').single();
    if(se){
      const {data:again,error:ae}=await sb.from('school_memberships').select('school_id').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle();
      if(ae||!again)throw se; schoolId=again.school_id;return schoolId;
    }
    const {error:mi}=await sb.from('school_memberships').insert({school_id:s.id,user_id:user.id,role:'teacher',status:'active'});
    if(mi)throw mi; schoolId=s.id; return schoolId;
  }
  async function upsertLevels(user,data){
    const levels=arr(data,'levels','niveaux');
    for(let i=0;i<levels.length;i++){
      const x=levels[i]||{};const name=text(x,'name','title','label')||`المستوى ${i+1}`;const key=idOf(x,`level:${i}`);
      await sb.from('levels').upsert({school_id:schoolId,source_key:key,name,code:text(x,'code'),sort_order:i,created_by:user.id},{onConflict:'school_id,source_key'});
    }
  }
  async function upsertSubjects(user,data){
    const subjects=arr(data,'subjects','matieres','materials');
    for(let i=0;i<subjects.length;i++){
      const x=subjects[i]||{};const name=text(x,'name','title','label')||String(x||'');if(!name)continue;const key=idOf(x,`subject:${i}`);
      await sb.from('subjects').upsert({school_id:schoolId,source_key:key,name,code:text(x,'code')},{onConflict:'school_id,source_key'});
    }
  }
  async function upsertClasses(user,data){
    const levels=(await sb.from('levels').select('id,source_key').eq('school_id',schoolId)).data||[];const lm=new Map(levels.map(x=>[x.source_key,x.id]));
    const classes=arr(data,'classes','groups','sections','afwaj');
    for(let i=0;i<classes.length;i++){
      const x=classes[i]||{};const key=idOf(x,`class:${i}`);const name=text(x,'name','title','label')||`قسم ${i+1}`;let lk=text(x,'levelId','level_id','levelKey');
      const level_id=lk?lm.get(lk)||null:null;
      await sb.from('classes').upsert({school_id:schoolId,source_key:key,name,level_id,teacher_id:user.id,school_year:text(x,'year','school_year')||'2026/2027'},{onConflict:'school_id,source_key'});
    }
  }
  async function upsertStudents(user,data){
    const classes=(await sb.from('classes').select('id,source_key').eq('school_id',schoolId)).data||[];const cm=new Map(classes.map(x=>[x.source_key,x.id]));
    const students=arr(data,'students','learners','eleves','learnersList');
    for(let i=0;i<students.length;i++){
      const x=students[i]||{};const key=idOf(x,`student:${i}`);const full=text(x,'name','full_name','fullName');const first=text(x,'first_name','firstName')||full.split(/\s+/)[0]||`متعلم ${i+1}`;const last=text(x,'last_name','lastName')||full.split(/\s+/).slice(1).join(' ')||' ';
      const ck=text(x,'classId','class_id','classKey');
      await sb.from('students').upsert({school_id:schoolId,source_key:key,first_name:first,last_name:last,student_code:text(x,'code','student_code','id'),class_id:ck?cm.get(ck)||null:null,gender:text(x,'gender','sexe'),notes:text(x,'notes','note')},{onConflict:'school_id,source_key'});
    }
  }
  async function pushSpecial(user,data){
    const mind=arr(data,'mindmaps','mindMaps','maps');
    for(let i=0;i<mind.length;i++){const x=mind[i]||{};await sb.from('mindmaps').upsert({school_id:schoolId,source_key:idOf(x,`mindmap:${i}`),title:text(x,'title','name')||`خريطة ${i+1}`,source_filename:text(x,'source_filename','filename','fileName'),source_language:text(x,'source_language','language','lang'),structure:x.structure||x.tree||x},{onConflict:'school_id,source_key'});}
    const flu=arr(data,'fluency','fluencyRecords');
    for(let i=0;i<flu.length;i++){const x=flu[i]||{};await sb.from('fluency_records').upsert({school_id:schoolId,source_key:idOf(x,`fluency:${i}`),class_id:null,student_id:null,level:text(x,'level'),words_per_minute:Number(x.words_per_minute??x.wpm)||null,accuracy:Number(x.accuracy)||null,mastery:text(x,'mastery','status'),created_by:user.id},{onConflict:'school_id,source_key'});}
  }
  async function normalize(user,data){await ensureWorkspace(user);await upsertLevels(user,data);await upsertSubjects(user,data);await upsertClasses(user,data);await upsertStudents(user,data);await pushSpecial(user,data);}
  async function tick(){if(busy||!sb)return;const {data:{session}}=await sb.auth.getSession();if(!session)return;const frame=document.getElementById('appFrame');if(!frame)return;let raw=null;try{raw=frame.contentWindow.localStorage.getItem(DATA_KEY)}catch{}if(!raw||raw===last)return;busy=true;try{const data=JSON.parse(raw);await normalize(session.user,data);last=raw;document.title='رَوّاد — سحابي';}catch(e){console.warn('Cloud normalization:',e)}finally{busy=false}}
  sb?.auth.onAuthStateChange(()=>{last='';schoolId=null});
  setInterval(tick,3500);setTimeout(tick,1200);
})();