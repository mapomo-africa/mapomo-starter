const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountSegmentation(root,{submission:s,available,api,onApply}){
 const labels={chairs:'Chairs',tents:'Tents',vehicles:'Vehicles',banners:'Banners',screens:'Screens',lighting:'Stage lights'};
 root.innerHTML=`<h2>Count visible equipment</h2><p>Choose one photo or video frame. Check each outline before using the count. Counts from different views are never added automatically.</p>${!available?'<p class="warning">Automatic equipment detection is awaiting activation.</p>':''}${!s.payload.photo_ids.length?'<p>Attach original footage or photos to count equipment. A YouTube link alone does not provide frames here.</p>':`<div class="row"><label>Equipment<select data-category><option value="all">All equipment</option>${Object.entries(labels).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label><label>Photo / video frame<select data-photo>${s.payload.photo_ids.map((id,n)=>`<option value="${id}">${s.payload.frames?.find(f=>f.photo_id===id)?.seconds!==undefined?s.payload.frames.find(f=>f.photo_id===id).seconds+'s':'Photo '+(n+1)}</option>`).join('')}</select></label></div><button type="button" data-detect ${available?'':'disabled'}>Find equipment</button><div data-segment-status role="status"></div><div class="seg-summary" data-summary></div><div data-editor></div>`}`;
 if(!s.payload.photo_ids.length)return;
 const status=root.querySelector('[data-segment-status]'),editor=root.querySelector('[data-editor]');
 const show=seg=>{
  const selected=new Set(seg.correction?.accepted_ids||seg.objects.map(o=>o.id)),manual=[...(seg.correction?.manual_boxes||[])];
  editor.innerHTML=`<div class="seg-workspace"><div><div class="seg-canvas"><img alt="Selected evidence for equipment counting" src="${esc(seg.photo_url||'/field-api/file/'+seg.photo_id)}" draggable="false"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Equipment annotations"></svg></div><p class="muted">Click a numbered outline to exclude or restore it. To add a missed object, enable drawing and drag a box around it.</p><label><input type="checkbox" data-draw> Draw missed equipment</label><button type="button" data-undo>Undo last added box</button></div><div><p class="seg-count" data-count></p><p>Visible objects in this image. The total outside the image remains unknown.</p><div class="seg-object-list" data-list></div><label>Counting explanation<textarea data-note maxlength="1000" placeholder="What did you check? Any overlaps or hidden equipment?">${esc(seg.correction?.note||'')}</textarea></label><label><input type="checkbox" data-checked> I inspected this image and checked the selected objects.</label><button type="button" data-apply>Use this count in the review</button><p class="muted">Replaces the draft ${esc(labels[seg.resource])} line. Approval and party assignment remain separate.</p></div></div>`;
  const svg=editor.querySelector('svg');
  const draw=()=>{
   editor.querySelector('[data-count]').textContent=`${selected.size+manual.length} selected`;
   svg.innerHTML=seg.objects.map((o,n)=>{const [x,y,w,h]=o.xywh.map(v=>v*1000);return `<g class="${selected.has(o.id)?'seg-selected':'seg-excluded'}" data-object="${esc(o.id)}">${o.mask?`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${o.mask.width} ${o.mask.height}" preserveAspectRatio="none"><path d="${esc(o.mask.path)}"/></svg>`:''}<rect x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${x+3}" y="${y+22}">${n+1}</text></g>`}).join('')+manual.map((b,n)=>{const [x,y,w,h]=b.map(v=>v*1000);return `<g class="seg-manual"><rect x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${x+3}" y="${y+22}">+${n+1}</text></g>`}).join('');
   editor.querySelector('[data-list]').innerHTML=seg.objects.map((o,n)=>`<button type="button" data-toggle="${esc(o.id)}" aria-pressed="${selected.has(o.id)}">${n+1} ${selected.has(o.id)?'✓':'excluded'}</button>`).join('');
   editor.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggle(b.dataset.toggle));
  };
  const toggle=id=>{selected.has(id)?selected.delete(id):selected.add(id);draw()};
  svg.onclick=e=>{if(editor.querySelector('[data-draw]').checked)return;const g=e.target.closest('[data-object]');if(g)toggle(g.dataset.object)};
  let start;const point=e=>{const r=svg.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]};
  svg.onpointerdown=e=>{if(!editor.querySelector('[data-draw]').checked)return;e.preventDefault();start=point(e);svg.setPointerCapture(e.pointerId)};
  svg.onpointerup=e=>{if(!start)return;const end=point(e),b=[Math.min(start[0],end[0]),Math.min(start[1],end[1]),Math.abs(start[0]-end[0]),Math.abs(start[1]-end[1])];start=null;if(b[2]>.002&&b[3]>.002&&manual.length<100)manual.push(b);draw()};
  editor.querySelector('[data-undo]').onclick=()=>{manual.pop();draw()};
  editor.querySelector('[data-apply]').onclick=async e=>{e.target.disabled=true;try{const r=await api('segment-review',{id:seg.id,accepted_ids:[...selected],manual_boxes:manual,checked:editor.querySelector('[data-checked]').checked,note:editor.querySelector('[data-note]').value});await onApply(r.item);status.textContent='Count saved as a draft observation. Review the unit and price before approval.'}catch(err){status.textContent=err.message}finally{e.target.disabled=false}};
  draw();
 };
 root.querySelector('[data-detect]').onclick=async e=>{if(root.querySelector('[data-category]').value==='all')return detectAll(root.querySelector('[data-photo]').value,e.target);e.target.disabled=true;status.textContent='Finding equipment…';try{const seg=await api('segment',{id:s.id,photo_id:root.querySelector('[data-photo]').value,resource:root.querySelector('[data-category]').value});results.set(seg.resource,seg);summary();show(seg);status.textContent=seg.objects.length?`${seg.objects.length} proposed objects. Check omissions and false detections.`:'No objects detected. This does not prove the equipment is absent; inspect the image and draw missed objects.'}catch(err){status.textContent=err.message}finally{e.target.disabled=false}};
 root.addEventListener('mapomo:load-segmentation',async e=>{try{const seg=await api('segment/'+e.detail);if(seg.photo_id&&!s.payload.photo_ids.includes(seg.photo_id))throw Error('Annotations belong to another report');show(seg);status.textContent='New proposed annotations loaded. Inspect and accept the selections.'}catch(err){status.textContent=err.message}});
 // Every equipment category is detected at once and kept per photo; each one is reviewed separately
 // before its count can replace a draft line. Detection runs by itself for photos not yet examined.
 const results=new Map(),summaryEl=root.querySelector('[data-summary]');let active=null;
 const summary=()=>{summaryEl.replaceChildren();if(!results.size)return;for(const [resource,label] of Object.entries(labels)){if(!results.has(resource))continue;const seg=results.get(resource),b=document.createElement('button');b.type='button';b.className='seg-chip'+(resource===active?' active':'')+(seg==='pending'?' pending':seg instanceof Error?' failed':seg.objects.length?'':' empty');const name=document.createElement('span');name.textContent=label;const count=document.createElement('b');count.textContent=seg==='pending'?'…':seg instanceof Error?'!':String(seg.correction?(seg.correction.accepted_ids.length+seg.correction.manual_boxes.length):seg.objects.length);b.append(name,count);if(seg instanceof Error)b.title=seg.message;b.disabled=seg==='pending'||seg instanceof Error;b.onclick=()=>{active=resource;summary();show(seg);root.querySelector('[data-category]').value=resource};summaryEl.append(b)}};
 const pick=()=>{const found=[...results.entries()].filter(([,v])=>v&&v.objects);if(!found.length)return;const [resource,seg]=found.sort((a,b)=>b[1].objects.length-a[1].objects.length)[0];active=resource;summary();show(seg)};
 async function detectAll(photo,button){
  if(button)button.disabled=true;results.clear();active=null;editor.replaceChildren();for(const k of Object.keys(labels))results.set(k,'pending');summary();status.textContent='Finding all equipment…';
  await Promise.all(Object.keys(labels).map(resource=>api('segment',{id:s.id,photo_id:photo,resource}).then(seg=>results.set(resource,seg)).catch(err=>results.set(resource,err instanceof Error?err:Error(String(err)))).finally(summary)));
  const counts=[...results.entries()].filter(([,v])=>v.objects?.length).map(([k,v])=>`${labels[k]} ${v.objects.length}`);
  status.textContent=counts.length?`Found: ${counts.join(', ')}. Open each category to check it before using its count.`:'No equipment detected. This does not prove it is absent; inspect the image and draw missed objects.';
  pick();if(button)button.disabled=false;
 }
 async function load(photo){
  results.clear();active=null;editor.replaceChildren();summary();
  const list=(await api('segments/'+s.id)).filter(x=>x.photo_id===photo).sort((a,b)=>String(b.created).localeCompare(String(a.created)));
  const latest=new Map();for(const x of list)if(!latest.has(x.resource))latest.set(x.resource,x.id);
  if(!latest.size){if(available)return detectAll(photo,root.querySelector('[data-detect]'));return}
  for(const [resource,id] of latest)results.set(resource,await api('segment/'+id));
  summary();pick();status.textContent='Saved detections for this photo. Open each category to check it.';
 }
 root.querySelector('[data-photo]').onchange=e=>load(e.target.value).catch(err=>{status.textContent=err.message});
 load(root.querySelector('[data-photo]').value).catch(err=>{status.textContent=err.message});
}
