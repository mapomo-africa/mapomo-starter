// Small client for the Mapomo team API, for scripts (Node 20+). The key comes from .env.
import fs from 'node:fs';
const env=Object.fromEntries((fs.existsSync(new URL('./.env',import.meta.url))?fs.readFileSync(new URL('./.env',import.meta.url),'utf8'):'').split('\n').map(l=>l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map(m=>[m[1],m[2]]));
const BASE=(process.env.MAPOMO_URL||env.MAPOMO_URL||'https://workspace-production-5979.up.railway.app').replace(/\/$/,'')+'/api/v1/',KEY=process.env.MAPOMO_KEY||env.MAPOMO_KEY;
export async function api(path,data){
 const r=await fetch(BASE+path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
 const out=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(out.error||'HTTP '+r.status),{status:r.status});return out;
}
// Sends one message to the agent and waits until it has finished (the loop runs on the server).
export async function ask(text,{conversation_id,case_id,attachments}={}){
 const c=conversation_id?{conversation_id}:await api('agent/open',case_id?{case_id}:{});
 let s=await api('agent/send',{conversation_id:c.conversation_id,text,request_id:'req-'+crypto.randomUUID(),...(attachments?{attachments}:{})});
 while(['queued','running'].includes(s.run?.status)){s=await api('agent/advance',{conversation_id:c.conversation_id,run_id:s.run.id});if(s.busy)await new Promise(r=>setTimeout(r,3000))}
 return s;
}
export async function uploadPhoto(file,{country='SN',synthetic=true}={}){return api('upload',{country,synthetic,name:file.split('/').pop(),data:fs.readFileSync(file).toString('base64')})}
