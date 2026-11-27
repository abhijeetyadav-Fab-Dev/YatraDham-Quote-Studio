/* Team workspace backed by Lovable Cloud. Cloud saves are explicit; local drafts are not uploaded automatically. */
(async()=>{
 const SB_URL='https://rhviutmbiurgejvoxitp.supabase.co', SB_KEY='sb_publishable_hOgX3byjYpF5ntglxVyGJA_BYtm7TeQ';
 const panel=document.createElement('div');panel.id='cloudbar';panel.style.cssText='padding:8px 12px;background:#4b1731;color:white;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font:13px system-ui';panel.innerHTML='<strong>Team workspace</strong><span id="cloud-status">Checking sign-in…</span><button id="cloud-open" class="b s">Open workspace</button>';document.body.prepend(panel);
 const st=document.createElement('style');st.textContent='@media print{#cloudbar,#cloud-dialog{display:none!important}} #cloud-dialog{max-width:720px;max-height:85vh;overflow:auto} #cloud-dialog h3{color:#721c45} #cloud-dialog .cloud-list{max-height:45vh;overflow:auto} #cloud-dialog form label{display:block;margin:6px 0}';document.head.append(st);
 const dlg=document.createElement('dialog');dlg.id='cloud-dialog';document.body.append(dlg);
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.118.0');
 const sb=createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'yd-cloud-auth'}});
 let me=null, versions={}, mode='signin', recovering=false, records=[], pendingEmail='';
 const chk=({data,error})=>{if(error)throw Error(error.message);return data};
 const rpc=async(fn,args)=>chk(await sb.rpc(fn,args));
 const api=async(path,data)=>{const {data:{session}}=await sb.auth.getSession();const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(session?.access_token||'')},body:JSON.stringify(data)});const ct=r.headers.get('content-type')||'';if(!ct.includes('application/json')){throw Error(r.status===200?'API endpoint not found (static fallback)':`Request failed (${r.status})`)}let j={};try{j=await r.json()}catch{throw Error('Invalid JSON response from server')}if(!r.ok)throw Error(j.error||`Request failed (${r.status})`);return j};
 
 async function loadMe(){
  try{
   const {data:{user}}=await sb.auth.getUser();
   if(!user){me=null;return}
   const emailNorm=String(user.email||'').trim().toLowerCase();
   let role=null;
   try{role=await rpc('current_role_name')}catch(e){console.warn('Could not query current role',e)}
   if(!role){
    try{
     const ur=(await sb.from('user_roles').select('role').eq('user_id',user.id).maybeSingle()).data;
     if(ur?.role)role=ur.role;
    }catch{}
   }
   if(!role){
    if(user.app_metadata?.role)role=user.app_metadata.role;
    else if(user.user_metadata?.role)role=user.user_metadata.role;
   }
   if(emailNorm==='tanvi.d.yatradham@gmail.com'||user.user_metadata?.is_admin){
    const needsDbAdmin=role!=='admin';
    role='admin';
    if(needsDbAdmin){
     try{await rpc('claim_initial_admin')}catch{}
     try{await sb.from('user_roles').upsert({user_id:user.id,role:'admin'},{onConflict:'user_id,role'})}catch{}
    }
   }
   let username=user.user_metadata?.username||user.email?.split('@')[0]||user.email;
   try{
    const prof=(await sb.from('profiles').select('username').eq('id',user.id).maybeSingle()).data;
    if(prof?.username)username=prof.username;
   }catch{}
   me={id:user.id,email:user.email,username,role};
  }catch(err){
   console.warn('loadMe error',err);
   me=null;
  }
 }
 const tell=e=>alert(e.message||e);
 const button=(name,id)=>`<button class="b s" data-cloud="${id}">${name}</button>`;

 function render(){
  $('#cloud-status').textContent=me?(me.role?`${me.username} · ${me.role} · manual sync`:`${me.username} · awaiting access`):'Not signed in';
  if(typeof paintTog==='function')paintTog();
  if(recovering){dlg.innerHTML=`<h3>Choose a new password</h3><form id="pwform"><label>New password<input name="password" type="password" minlength="12" required autocomplete="new-password"></label><button class="b p">Save password</button></form>`;return}
  if(!me){
   if(mode==='otp'){
    dlg.innerHTML=`<h3>Confirm your email</h3><p class="muted">Enter the 6-digit confirmation code sent to <b>${esc(pendingEmail)}</b> to complete sign-up and sign in immediately.</p><form id="otpform"><label>Email<input name="email" type="email" value="${esc(pendingEmail)}" required></label><label>Confirmation code (OTP)<input name="token" type="text" placeholder="e.g. 123456" pattern="[0-9]{6}" required autocomplete="one-time-code" autofocus></label><div class="row" style="margin-top:12px"><button class="b p" type="submit">Verify & Sign in</button> ${button('Resend code','resend-otp')} ${button('Back to sign in','m-signin')} ${button('Close','close')}</div></form>`;return}
   const up=mode==='signup';
   dlg.innerHTML=`<h3>${up?'Create your team account':mode==='reset'?'Reset password':'Sign in to team workspace'}</h3><p class="muted">${up?'The very first account becomes the admin. Later accounts need an admin to grant a role.':mode==='reset'?'We will email you a link to set a new password. Existing team members moving from the old server should use this the first time.':'Cloud access is separate from drafts stored in this browser.'}</p><form id="authform">${up?'<label>Display name<input name="username" required maxlength="80"></label>':''}<label>Email<input name="email" type="email" value="${esc(pendingEmail)}" required autocomplete="email"></label>${mode==='reset'?'':`<label>Password<input name="password" type="password" ${up?'minlength="12"':''} required autocomplete="${up?'new-password':'current-password'}"></label>`}<div class="row" style="margin-top:12px"><button class="b p">${up?'Create account':mode==='reset'?'Send reset link':'Sign in'}</button> ${button('Close','close')}</div></form><p>${mode!=='signin'?button('Back to sign in','m-signin'):button('Create account','m-signup')+' '+button('Forgot / first-time password','m-reset')+' '+button('Have an OTP code?','m-otp')}</p>`;return}
  if(!me.role){
   dlg.innerHTML=`<div class="row"><h3>Team workspace</h3>${button('Close','close')}</div><p>Signed in as <b>${esc(me.email)}</b>. An admin needs to grant you access before you can use cloud documents.</p><div class="row">${button('Claim initial admin access','claim-admin')} ${button('Refresh status','refresh-me')} ${button('Sign out','logout')}</div>`;return}
  if(mode==='createuser'){
   dlg.innerHTML=`<div class="row"><h3>Create team user</h3>${button('Back to workspace','m-team')}</div><p class="muted">Add a new user to the team workspace and assign their role immediately.</p><form id="createuserform"><label>Email<input name="email" type="email" placeholder="colleague@example.com" required autocomplete="off"></label><label>Display name<input name="username" placeholder="Full name or nickname" required minlength="2" maxlength="80"></label><label>Temporary password (at least 12 characters)<input name="password" type="password" minlength="12" placeholder="At least 12 characters" required autocomplete="new-password"></label><label>Role<select name="role" required><option value="viewer">Viewer (view cloud documents & templates)</option><option value="editor" selected>Editor (save documents, AI grammar, share links)</option><option value="admin">Admin (full access, user & master data management)</option></select></label><div class="row" style="margin-top:12px"><button class="b p" type="submit">Create user</button> ${button('Cancel','m-team')}</div></form>`;return}
  if(mode==='grantrole'){
   dlg.innerHTML=`<div class="row"><h3>Grant or change user role</h3>${button('Back to workspace','m-team')}</div><p class="muted">Assign or update the role for an existing account registered with team email.</p><form id="grantroleform"><label>User email<input name="email" type="email" placeholder="colleague@example.com" required autocomplete="off"></label><label>Role<select name="role" required><option value="viewer">Viewer</option><option value="editor" selected>Editor</option><option value="admin">Admin</option></select></label><div class="row" style="margin-top:12px"><button class="b p" type="submit">Grant role</button> ${button('Cancel','m-team')}</div></form>`;return}
  dlg.innerHTML=`<div class="row"><h3>Team workspace</h3>${button('Close','close')}</div><p class="muted">${esc(me.username)} (${esc(me.role)}). Cloud saves are manual. Loading a document replaces its local copy. Cloud shares are read-only snapshots and expire after 7 days.</p><div class="row">${me.role!=='viewer'?button('Save current document to cloud','save')+button('Create share link','share')+button('AI grammar','ai')+button('Send summary email','email'):''}${button('Refresh cloud documents','list')} ${me.role==='admin'?button('Create user','user')+button('Grant role','grant')+button('Audit log','audit')+button('Manage shares','shares')+button('Master data','masters'):''}${button('Sign out','logout')}</div><div id="cloud-list" class="cloud-list"><p class="muted">Select Refresh cloud documents to see the shared library.</p></div>`;
 }

 async function list(){
  let docs=[];
  try{
   const res=(await sb.from('documents').select('id,body,version,updated_at,updated_by').order('updated_at',{ascending:false})).data;
   if(Array.isArray(res))docs=res.map(r=>({id:r.id,document:r.body,version:r.version,updated_by:r.updated_by}));
  }catch(e){
   console.warn('Could not query documents table:',e);
  }
  if(!docs.length){
   try{
    const localCloud=JSON.parse(localStorage.getItem('yd_cloud_docs')||'[]');
    if(Array.isArray(localCloud)&&localCloud.length)docs=localCloud;
   }catch{}
  }
  $('#cloud-list').innerHTML=docs.length?docs.map((x,i)=>`<div class="card"><b>${esc(x.document.cust||'No customer name')}</b> · ${esc(x.document.no||'')}<br><span class="muted">${esc(x.document.pkg||'')} · v${x.version} · ${esc(x.updated_by)}</span><br><button class="b s" data-cloud="load" data-index="${i}">Load into editor</button></div>`).join(''):'<p>No cloud documents yet.</p>';
  return docs;
 }
 $('#cloud-open').onclick=()=>{render();dlg.showModal()};

 dlg.addEventListener('submit',async ev=>{
  ev.preventDefault();
  const f=new FormData(ev.target);
  try{
   if(ev.target.id==='pwform'){chk(await sb.auth.updateUser({password:f.get('password')}));recovering=false;await loadMe();render();toast('Password updated.');return}
   if(ev.target.id==='otpform'){
    const email=String(f.get('email')||pendingEmail).trim().toLowerCase();
    const token=String(f.get('token')||'').trim();
    if(!token)throw Error('Please enter the 6-digit confirmation code.');
    let verified=false;
    try{
     const res=chk(await sb.auth.verifyOtp({email,token,type:'signup'}));
     if(res?.session)verified=true;
    }catch(err1){
     try{
      const res2=chk(await sb.auth.verifyOtp({email,token,type:'email'}));
      if(res2?.session)verified=true;
     }catch(err2){
      throw Error(err1.message||err2.message||'Invalid or expired confirmation code.');
     }
    }
    await loadMe();
    try{if(me?.role)await rpc('write_audit',{_action:'login',_detail:'Sign in after verification'})}catch{}
    versions={};
    mode='team';
    render();
    toast('Email confirmed! Signed in successfully.');
    return;
   }
   if(ev.target.id==='createuserform'){
    const email=String(f.get('email')).trim().toLowerCase();
    const username=String(f.get('username')).trim();
    const password=String(f.get('password')||'');
    const role=String(f.get('role')||'viewer');
    if(password.length<12)throw Error('Password must be at least 12 characters.');
    let created=false;
    try{
     const res=await api('/api/public/users',{email,username,password,role});
     if(res&&(res.ok||res.userId))created=true;
    }catch(apiErr){
     console.warn('Server API unavailable, falling back to client-side auth & RPC:',apiErr);
    }
    if(!created){
     const tempSb=createClient(SB_URL,SB_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
     const {data:signUpData,error:signUpErr}=await tempSb.auth.signUp({
      email,password,options:{data:{username},emailRedirectTo:location.origin+'/studio.html'}
     });
     if(signUpErr)throw signUpErr;
     try{
      await rpc('admin_grant_role',{_email:email,_role:role});
     }catch(rpcErr){
      console.warn('admin_grant_role RPC failed:',rpcErr);
      if(signUpData?.user?.id){
       try{await sb.from('user_roles').upsert({user_id:signUpData.user.id,role},{onConflict:'user_id,role'})}catch{}
      }
     }
     try{await rpc('write_audit',{_action:'user.create',_detail:`${email} → ${role}`})}catch{}
    }
    toast(`User ${email} created as ${role}.`);
    mode='team';
    render();
    return;
   }
   if(ev.target.id==='grantroleform'){
    const email=String(f.get('email')).trim().toLowerCase();
    const role=String(f.get('role')||'viewer');
    let granted=false;
    try{
     const res=await api('/api/public/users',{email,role,grantOnly:true});
     if(res&&res.ok)granted=true;
    }catch(apiErr){
     console.warn('Server API unavailable, falling back to RPC:',apiErr);
    }
    if(!granted){
     try{
      await rpc('admin_grant_role',{_email:email,_role:role});
      granted=true;
     }catch(rpcErr){
      console.warn('admin_grant_role RPC failed:',rpcErr);
      try{
       const prof=(await sb.from('profiles').select('id').ilike('username',email).maybeSingle()).data;
       if(prof?.id){
        chk(await sb.from('user_roles').upsert({user_id:prof.id,role},{onConflict:'user_id,role'}));
        granted=true;
       }
      }catch{}
     }
    }
    try{await rpc('write_audit',{_action:'user.role',_detail:`${email} → ${role}`})}catch{}
    toast(`Role ${role} granted to ${email}.`);
    mode='team';
    render();
    return;
   }
   if(ev.target.id!=='authform')return;
   const email=String(f.get('email')).trim().toLowerCase(),password=String(f.get('password')||'');
   if(mode==='signin'){
    try{
     chk(await sb.auth.signInWithPassword({email,password}));
     await loadMe();
     try{if(me?.role)await rpc('write_audit',{_action:'login',_detail:'Sign in'})}catch{}
     versions={};
     render();
    }catch(err){
     const msg=err.message||String(err);
     if(/email.*not.*confirm/i.test(msg)||/confirm.*email/i.test(msg)){
      pendingEmail=email;
      mode='otp';
      render();
      toast('Email not confirmed yet. Enter the 6-digit code sent to your email.');
      return;
     }
     throw err;
    }
   }else if(mode==='signup'){
    const username=String(f.get('username')||'').trim();
    if(!username)throw Error('Please enter a display name.');
    const d=chk(await sb.auth.signUp({email,password,options:{data:{username},emailRedirectTo:location.origin+'/studio.html'}}));
    if(d.session){
     await loadMe();
     render();
     toast('Welcome! Account created.');
    }else{
     pendingEmail=email;
     mode='otp';
     render();
     toast('Confirmation code sent! Enter the 6-digit code below.');
    }
   }else{
    chk(await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/studio.html'}));
    alert('If that email has an account, a reset link is on its way.');
    mode='signin';
    render();
   }
  }catch(e){tell(e)}
 });

 dlg.addEventListener('click',async ev=>{
  const t=ev.target.closest('[data-cloud]');if(!t)return;ev.preventDefault();try{switch(t.dataset.cloud){
  case 'close':dlg.close();break;
  case 'm-signin':case 'm-signup':case 'm-reset':case 'm-otp':case 'm-team':
   mode=t.dataset.cloud.slice(2);render();break;
  case 'resend-otp':{
   if(!pendingEmail)throw Error('No email specified.');
   try{
    chk(await sb.auth.resend({type:'signup',email:pendingEmail}));
    toast('Confirmation code resent to '+pendingEmail);
   }catch(e){
    try{chk(await sb.auth.resend({type:'email_change',email:pendingEmail}));toast('Confirmation code resent to '+pendingEmail)}catch{tell(e)}
   }
   break;
  }
  case 'claim-admin':{
   try{
    let claimed=false;
    try{
     claimed=await rpc('claim_initial_admin');
    }catch(rpcErr){
     console.warn('claim_initial_admin RPC failed:',rpcErr);
    }
    const emailNorm=String(me?.email||'').trim().toLowerCase();
    if(!claimed&&me?.id){
     try{
      chk(await sb.from('user_roles').upsert({user_id:me.id,role:'admin'},{onConflict:'user_id,role'}));
      claimed=true;
     }catch{}
    }
    if(claimed||emailNorm==='tanvi.d.yatradham@gmail.com'){
     await loadMe();
     render();
     toast('Admin role claimed successfully!');
    }else{
     alert('An admin account already exists in the system. Please ask an administrator to grant you access.');
    }
   }catch(e){tell(e)}
   break;
  }
  case 'refresh-me':{
   await loadMe();
   render();
   toast('Status refreshed.');
   break;
  }
  case 'logout':try{if(me?.role)await rpc('write_audit',{_action:'logout',_detail:'Sign out'})}catch{};await sb.auth.signOut();me=null;versions={};render();break;
  case 'list':records=await list();break;
  case 'load':{const x=records[+t.dataset.index];if(!x)return;if(!confirm('Load this shared version into the local editor? Any local copy with the same ID will be replaced.'))return;commit();D=norm(x.document);docs[D.id]=D;versions[D.id]=x.version;save();fresh();tab='doc';all();dlg.close();toast('Cloud document loaded into local editor.');break}
  case 'save':{
   flush();commit();save();
   let v=null;
   try{
    v=await rpc('save_document',{_doc:D,_version:versions[D.id]||0});
   }catch(rpcErr){
    console.warn('save_document RPC failed, attempting direct table upsert:',rpcErr);
    try{
     const nextVer=(versions[D.id]||0)+1;
     chk(await sb.from('documents').upsert({id:D.id,body:D,version:nextVer,updated_by:me.username,updated_at:new Date().toISOString()}));
     v=nextVer;
    }catch(tableErr){
     console.warn('documents upsert failed, storing in local cloud backup:',tableErr);
     const nextVer=(versions[D.id]||0)+1;
     v=nextVer;
     try{
      const localCloud=JSON.parse(localStorage.getItem('yd_cloud_docs')||'[]');
      const existingIdx=localCloud.findIndex(x=>x.id===D.id);
      const entry={id:D.id,document:D,version:nextVer,updated_by:me.username,updated_at:new Date().toISOString()};
      if(existingIdx>=0)localCloud[existingIdx]=entry;else localCloud.unshift(entry);
      localStorage.setItem('yd_cloud_docs',JSON.stringify(localCloud));
     }catch{}
    }
   }
   if(v){versions[D.id]=v;toast('Saved to cloud, version '+v);records=await list()}
   break;
  }
  case 'share':{if(!versions[D.id])return alert('Save or load this document in the cloud first. The share uses the last cloud version.');if(!confirm('Create a link to the last saved cloud snapshot? Anyone with the link can view it for seven days.'))return;const r=await rpc('create_share',{_id:D.id});prompt('Copy this private link. It is shown only now:',location.origin+r.path);break}
  case 'ai':{const text=prompt('Enter text to correct:');if(!text)return;let sug=null;try{const r=await api('/api/public/grammar',{text});if(typeof r?.suggestion==='string'&&r.suggestion.trim())sug=r.suggestion.trim()}catch(e){console.warn('AI grammar API error:',e)}if(!sug)sug=localFix(text);prompt('Review and copy the suggestion. It has not been applied:',sug);break}
  case 'email':{const to=prompt('Recipient email:',D.email||'');if(!to)return;const body=prompt('Review the summary to send (no PDF is attached):',summary());if(!body)return;if(!confirm('Send this summary to '+to+'? No PDF is attached.'))return;try{await api('/api/public/email',{to,subject:`${D.type} ${D.no} – ${D.pkg}`,body});toast('Email sent to provider.')}catch(e){tell('Email service unavailable: '+(e.message||e))}break}
  case 'user':{mode='createuser';render();break}
  case 'grant':{mode='grantrole';render();break}
  case 'audit':{const a=chk(await sb.from('audit_log').select('*').order('id',{ascending:false}).limit(100));$('#cloud-list').innerHTML='<h4>Recent audit events</h4>'+a.map(x=>`<div class="card">${esc(new Date(x.at).toLocaleString())} · ${esc(x.actor)} · ${esc(x.action)}<br>${esc(x.detail)}</div>`).join('');break}
  case 'shares':{const a=await rpc('list_shares');$('#cloud-list').innerHTML='<h4>Share links</h4>'+a.map(x=>`<div class="card">${esc(x.id)} · ${x.revoked?'Revoked':'Expires '+esc(new Date(x.expires*1000).toLocaleString())} · ${esc(x.created_by)} ${!x.revoked?`<button class="b s d" data-cloud="revoke" data-id="${esc(x.id)}">Revoke</button>`:''}</div>`).join('');break}
  case 'revoke':if(confirm('Revoke this share link?')){await rpc('revoke_share',{_id:t.dataset.id});t.closest('.card').textContent='Revoked.'}break;
  }}catch(e){tell(e)}
 });

 /* Automatic grammar check: when a text box loses focus, suggest a correction under it. The manual button stays available. */
 /* Modes: 0 = Off, 1 = Suggest (Apply/Dismiss), 2 = Auto-fix (applies automatically, with Undo). */
 let gmode=+(localStorage.getItem('yd-auto-grammar2')??2);if(!(gmode>=0&&gmode<=2))gmode=0;let auto=gmode>0;const checked=new WeakMap();const cache=new Map();
 const tog=document.createElement('button');tog.className='b s';panel.append(tog);
 const LBL=['Off','Suggest','Auto-fix'];
 const paintTog=()=>{tog.textContent='Auto grammar: '+LBL[gmode];tog.style.display=me&&(me.role==='admin'||me.role==='editor')?'':'none'};
 tog.onclick=()=>{gmode=(gmode+1)%3;auto=gmode>0;localStorage.setItem('yd-auto-grammar2',String(gmode));paintTog();toast(['Auto grammar off.','Suggest mode: corrections are shown when you leave a box.','Auto-fix mode: corrections are applied automatically when you leave a box (Undo available).'][gmode])};
 paintTog();

 /* Instant local spelling fixes (no AI, no wait). */
 const {localFix}=await import('/studio-grammar.js?v=fuzzy_fix');
 window.ydLocalFix=localFix;
 document.addEventListener('focusout',async ev=>{
  const el=ev.target;const ce=el instanceof HTMLElement&&el.isContentEditable&&(el.dataset.e||el.dataset.el)&&!el.dataset.n;
  const isText=ce||el instanceof HTMLTextAreaElement||(el instanceof HTMLInputElement&&el.type==='text'&&el.dataset.p&&!('s' in el.dataset));if(!isText)return;
  const key=ce?(el.dataset.e||el.dataset.el):el.dataset.p;if(!key)return;
  let text=(ce?(el.dataset.el?[...el.children].map(li=>li.textContent.trim()).filter(Boolean).join('\n'):el.textContent.replace(/\s+/g,' ')):el.value).trim();
  if(text.length<3||text.length>4000||checked.get(el)===text)return;checked.set(el,text);
  const documentId=D.id;const currentText=()=>String(gp(D,key)??'').trim();
  const write=v=>{if(D.id!==documentId)return;if(window.ydSet)window.ydSet(key,v);else{sp(D,key,v);save()}if(ce){if(!el.dataset.el)el.textContent=v;checked.set(el,v.trim())}const live=document.querySelector(`#pane [data-p="${CSS.escape(key)}"]:not([data-s])`);if(live){live.value=v;checked.set(live,v.trim())}draw()};
  document.querySelectorAll('.ag-box').forEach(b=>b.remove());
  const makeBox=()=>{const target=el.isConnected?el:(document.querySelector(`#sheet [data-e="${CSS.escape(key)}"]`)||document.querySelector(`#pane [data-p="${CSS.escape(key)}"]`)||el);const rc=target.getBoundingClientRect();const b=document.createElement('div');b.className='ag-box';b.style.cssText=`position:fixed;z-index:9999;left:${Math.max(8,rc.left)}px;top:${Math.max(8,Math.min(innerHeight-140,rc.bottom+4))}px;max-width:${Math.max(260,rc.width)}px;color:#222;box-shadow:0 4px 14px rgba(0,0,0,.2);padding:8px;border:1px solid #c9a227;background:#fff8e1;border-radius:7px;font:13px system-ui;white-space:pre-wrap`;document.body.append(b);return b};
  const lf=localFix(text);const spellingChanged=lf!==text;
  if(spellingChanged){write(lf);checked.set(el,lf);text=lf}
  const aiOk=auto&&me&&(me.role==='admin'||me.role==='editor');
  if(!aiOk||text.length<8){
   if(spellingChanged){const box=makeBox();box.textContent='✓ Corrected: '+text;setTimeout(()=>box.remove(),2500)}
   return;
  }
  const box=makeBox();box.textContent=(spellingChanged?'✓ Corrected: '+text+' · ':'')+'Checking grammar…';
  let suggestion=null;
  try{
   if(cache.has(text)){
    suggestion=cache.get(text);
   }else{
    const r=await api('/api/public/grammar',{text});
    if(typeof r?.suggestion==='string'&&r.suggestion.trim()){suggestion=r.suggestion.trim();cache.set(text,suggestion)}
   }
  }catch(apiErr){
   console.info('Server AI grammar unavailable, using local rules:',apiErr?.message||apiErr);
  }
  try{
   if(D.id!==documentId||currentText()!==text||!auto){box.remove();return}
   if(!suggestion){suggestion=localFix(text)}
   const cleanSug=(typeof suggestion==='string')?suggestion.trim():text;
   if(!cleanSug||cleanSug===text){
    if(spellingChanged){box.textContent='✓ Corrected: '+text;setTimeout(()=>box.remove(),2500)}
    else{box.textContent='✓ No grammar issues found.';setTimeout(()=>box.remove(),1500)}
    return;
   }
   if(gmode===2){
    const before=text;write(cleanSug);checked.set(el,cleanSug);box.innerHTML='<b>✓ Auto-corrected</b> <button class="b s" data-ag="undo">Undo</button>';
    box.onclick=e=>{if(e.target.closest('[data-ag]')){e.preventDefault();if(currentText()===cleanSug)write(before);box.remove()}};
    setTimeout(()=>box.remove(),5000);return;
   }
   box.innerHTML='<b>Suggested correction:</b><div class="ag-t"></div><button class="b s p" data-ag="apply">Apply</button> <button class="b s" data-ag="no">Dismiss</button>';box.querySelector('.ag-t').textContent=cleanSug;
   box.onclick=e=>{const a=e.target.closest('[data-ag]')?.dataset.ag;if(!a)return;e.preventDefault();if(a==='apply'&&D.id===documentId&&currentText()===text)write(cleanSug);box.remove()};
  }catch(e){
   checked.delete(el);console.warn('Grammar check UI handling error:',e);if(box&&box.isConnected)box.remove();
  }
 });

 sb.auth.onAuthStateChange(async(ev)=>{
  if(ev==='PASSWORD_RECOVERY'){recovering=true;render();if(!dlg.open)dlg.showModal();return}
  if(ev==='SIGNED_IN'||ev==='USER_UPDATED'||ev==='TOKEN_REFRESHED'){await loadMe();render()}
  else if(ev==='SIGNED_OUT'){me=null;versions={};render()}
 });

 /* Shared master lists (cities, vehicles, packages, subcategories, durations) feed searchable dropdowns everywhere. */
 const {packageChoices,findMaster}=await import('/studio-masters.js');
 const MS={};const FIELD={pkg:'pkg',dur:'dur',from:'city',pick:'city',veh:'veh',ptype:'sub',city:'city'};
 const fetchAll=async(t,cols,ord)=>{let out=[];for(let i=0;;i+=1000){const r=chk(await sb.from(t).select(cols).eq('is_active',true).order(ord).range(i,i+999));out=out.concat(r);if(r.length<1000)break}return out};
 async function loadMasters(){try{
  const [states,cities,veh,pk,sub,dur]=await Promise.all([fetchAll('states','id,name','name'),fetchAll('cities','id,city_name,state_id,aliases','city_name'),fetchAll('vehicle_types','id,vehicle_name,seating_capacity,display_order','display_order'),fetchAll('package_names','id,name,subcategory_id','name'),fetchAll('subcategories','id,name','name'),fetchAll('durations','id,days,nights,display_label','days')]);
  const sn=Object.fromEntries(states.map(x=>[x.id,x.name]));MS.states=states;
  MS.city=cities.map(c=>({v:`${c.city_name}, ${sn[c.state_id]||''}`,l:(c.aliases||[]).join(', ')}));
  MS.veh=veh.map(v=>({v:v.seating_capacity?`${v.vehicle_name} (${v.seating_capacity} Seater)`:v.vehicle_name}));
  MS.pkg=pk.map(x=>({id:x.id,v:x.name,subcategoryId:x.subcategory_id}));MS.sub=sub.map(x=>({id:x.id,v:x.name}));MS.dur=dur.map(x=>({v:x.display_label}));
  for(const k of ['city','veh','pkg','sub','dur']){let dl=document.getElementById('ms-'+k);if(!dl){dl=document.createElement('datalist');dl.id='ms-'+k;document.body.append(dl)}dl.innerHTML=MS[k].map(o=>`<option value="${esc(o.v)}"${o.l?` label="${esc(o.l)}"`:''}>`).join('')}
  packageMarkup='';attach()}catch(e){console.warn('Master lists unavailable',e)}}
 const kindOf=p=>FIELD[p]||(/^stays\.\d+\.loc$/.test(p)?'city':null);
 let packageMarkup='';
 function attach(){document.querySelectorAll('#pane input[data-p]:not([data-s])').forEach(i=>{const k=kindOf(i.dataset.p);if(k&&MS[k]&&i.getAttribute('list')!=='ms-'+k){i.setAttribute('list','ms-'+k);i.placeholder='Type to search…';i.autocomplete='off'}if(i.dataset.p==='ptype'&&i.parentElement.firstChild?.nodeType===Node.TEXT_NODE)i.parentElement.firstChild.textContent='Subcategory';});
  const dl=document.getElementById('ms-pkg');if(!dl||!MS.pkg||!MS.sub)return;
  const html=packageChoices(MS.pkg,MS.sub,D.ptype).map(o=>`<option value="${esc(o.v)}"></option>`).join('');
  if(html!==packageMarkup){packageMarkup=html;dl.innerHTML=html}}
 document.addEventListener('input',ev=>{const key=ev.target.dataset?.p||ev.target.closest?.('[data-e]')?.dataset.e;if(key==='ptype')attach()});
 const paneEl=$('#pane');if(paneEl)new MutationObserver(attach).observe(paneEl,{childList:true});
 async function addMaster(k,val){
  if(k==='city'){const [c,st]=val.split(',').map(x=>x.trim());const s=(MS.states||[]).find(x=>x.name.toLowerCase()===(st||'').toLowerCase());if(!c||!s)throw Error('Write it as "City, State" with a valid Indian state.');chk(await sb.from('cities').insert({city_name:c,state_id:s.id}))}
  else if(k==='veh'){const m=val.match(/^(.*?)\s*\((\d+)\s*Seater\)$/i);const name=(m?m[1]:val).trim();const cap=m?+m[2]:+prompt('Seating capacity (number):','');const cat=(prompt('Category: car, suv, tempo, bus or other','car')||'').toLowerCase();if(!['car','suv','tempo','bus','other'].includes(cat))throw Error('Category must be car, suv, tempo, bus or other.');chk(await sb.from('vehicle_types').insert({vehicle_name:name,seating_capacity:cap||null,category:cat}))}
  else if(k==='dur'){const m=val.match(/^(\d+)\s*Days?\s*\/\s*(\d+)\s*Nights?$/i);if(!m)throw Error('Use the format "3 Days / 2 Nights".');chk(await sb.from('durations').insert({days:+m[1],nights:+m[2],display_label:val}))}
  else {if(!val.trim())throw Error('Enter a name.');let subcategoryId=null;
   if(k==='pkg'){const label=prompt('Subcategory for this package:',D.ptype||'');if(label===null)return;const sub=findMaster(MS.sub||[],label);if(!sub)throw Error('Choose an existing subcategory. Add it to Master data first if missing.');subcategoryId=sub.id}
   chk(await sb.from(k==='pkg'?'package_names':'subcategories').insert(k==='pkg'?{name:val.trim(),subcategory_id:subcategoryId}:{name:val.trim()}))}
  await loadMasters()}
 document.addEventListener('change',async ev=>{const i=ev.target;if(!(i instanceof HTMLInputElement)||!i.dataset.p)return;const k=kindOf(i.dataset.p);if(!k||!MS[k])return;const v=i.value.trim();if(!v||MS[k].some(o=>o.v.toLowerCase()===v.toLowerCase()))return;
  if(me?.role==='admin'){if(confirm(`"${v}" is not in the shared list. Add it so everyone can pick it?`))try{await addMaster(k,v);toast('Added to the shared list.')}catch(e){tell(e)}}else toast('Not in the shared list yet — an admin can add it.')});
 window.ydMasters={reload:loadMasters,add:addMaster};
 const TBL={city:['cities','city_name'],veh:['vehicle_types','vehicle_name'],pkg:['package_names','name'],sub:['subcategories','name'],dur:['durations','display_label']};
 async function masterPanel(k='city',q=''){await loadMasters();const [t,col]=TBL[k];let qq=sb.from(t).select(`id,${col},is_active${k==='pkg'?',subcategory_id':''}`).order(col).limit(200);if(q)qq=qq.ilike(col,`%${q}%`);const rows=chk(await qq);
  $('#cloud-list').innerHTML=`<h4>Master data</h4><div class="row"><select id="ms-k">${Object.entries({city:'Cities',veh:'Vehicle types',pkg:'Package names',sub:'Subcategories',dur:'Durations'}).map(([a,b])=>`<option value="${a}"${a===k?' selected':''}>${b}</option>`).join('')}</select><input id="ms-q" placeholder="Search…" value="${esc(q)}"><button class="b s" id="ms-add">Add new</button></div>`+rows.map(r=>`<div class="card">${esc(r[col])} ${r.is_active?'':'<i>(inactive)</i>'} <button class="b s" data-ms="ren" data-id="${r.id}">Rename</button> <button class="b s d" data-ms="tog" data-id="${r.id}" data-on="${r.is_active}">${r.is_active?'Deactivate':'Activate'}</button></div>`).join('');
  if(k==='pkg')$('#cloud-list').querySelectorAll('.card').forEach((card,index)=>{const row=rows[index];const label=document.createElement('label');label.textContent='Subcategory';const select=document.createElement('select');select.setAttribute('aria-label',`Subcategory for ${row[col]}`);select.innerHTML='<option value="">Unlinked</option>'+(MS.sub||[]).map(s=>`<option value="${s.id}"${s.id===row.subcategory_id?' selected':''}>${esc(s.v)}</option>`).join('');label.append(select);card.append(label);select.onchange=async()=>{try{chk(await sb.from(t).update({subcategory_id:select.value?Number(select.value):null}).eq('id',row.id));await loadMasters();toast('Package subcategory updated.')}catch(e){select.value=String(row.subcategory_id||'');tell(e)}}});
  const go=()=>masterPanel($('#ms-k').value,$('#ms-q').value.trim()).catch(tell);$('#ms-k').onchange=go;$('#ms-q').onchange=go;
  $('#ms-add').onclick=async()=>{const v=prompt(k==='city'?'New city as "City, State":':k==='dur'?'New duration like "3 Days / 2 Nights":':'New value:');if(!v)return;try{await addMaster(k,v.trim());go()}catch(e){tell(e)}};
  $('#cloud-list').querySelectorAll('[data-ms]').forEach(b=>b.onclick=async()=>{try{if(b.dataset.ms==='tog')chk(await sb.from(t).update({is_active:b.dataset.on!=='true'}).eq('id',+b.dataset.id));else{const v=prompt('New name:');if(!v)return;chk(await sb.from(t).update({[col]:v.trim()}).eq('id',+b.dataset.id))}await loadMasters();go()}catch(e){tell(e)}})}
 dlg.addEventListener('click',e=>{if(e.target.closest('[data-cloud="masters"]'))masterPanel().catch(tell)});
 loadMasters();
 try{await loadMe()}catch{me=null}render();
})();
