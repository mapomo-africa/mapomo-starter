// Local server for your team's Mapomo. It serves web/ at /field/ and forwards /field-api/* to the
// Mapomo team API, adding your key. The key stays on this machine: never put it in web/.
// Node 20+, no dependencies:  node server.mjs   then open http://localhost:5173/field/
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const env=Object.fromEntries((fs.existsSync('.env')?fs.readFileSync('.env','utf8'):'').split('\n').map(l=>l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map(m=>[m[1],m[2]]));
const API=(process.env.MAPOMO_URL||env.MAPOMO_URL||'https://workspace-production-5979.up.railway.app').replace(/\/$/,'')+'/api/v1/';
const KEY=process.env.MAPOMO_KEY||env.MAPOMO_KEY,PORT=+(process.env.PORT||env.PORT||5173);
if(!KEY?.startsWith('mpk_')){console.error('Put your team key in .env:  MAPOMO_KEY=mpk_…  (ask an organiser)');process.exit(1)}
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 try{
  if(url.pathname.startsWith('/field-api/')){
   const chunks=[];for await(const c of req)chunks.push(c);
   const r=await fetch(API+url.pathname.slice('/field-api/'.length)+url.search,{method:req.method,headers:{Authorization:'Bearer '+KEY,...(req.headers['content-type']?{'Content-Type':req.headers['content-type']}:{}),...(req.headers.range?{Range:req.headers.range}:{})},body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
   const headers={};r.headers.forEach((v,k)=>{if(!['content-encoding','content-length','transfer-encoding','connection'].includes(k))headers[k]=v});
   res.writeHead(r.status,headers);return res.end(Buffer.from(await r.arrayBuffer()));
  }
  if(url.pathname==='/'||url.pathname==='/field'){res.writeHead(302,{Location:'/field/'});return res.end()}
  const rel=url.pathname.startsWith('/field/')?url.pathname.slice(7)||'index.html':null;
  const file=rel&&path.join(path.resolve('web'),path.normalize(rel));
  if(!file||!file.startsWith(path.resolve('web'))||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
 }catch(e){res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Mapomo API unreachable: '+e.message}))}
}).listen(PORT,'127.0.0.1',()=>console.log(`Your Mapomo: http://localhost:${PORT}/field/  →  ${API}`));
