// Renders the assistant's Markdown as DOM nodes. Text is never parsed as HTML.
const node=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n};
const INLINE=/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|\[[^\]]+\]\(https:\/\/[^)\s]+\))/;
function inline(parent,text){
 for(const part of text.split(INLINE)){
  if(!part)continue;
  let n;
  if(/^`[^`]+`$/.test(part)){n=node('code');n.textContent=part.slice(1,-1)}
  else if(/^(\*\*|__).+(\*\*|__)$/.test(part)){n=node('strong');inline(n,part.slice(2,-2))}
  else if(/^\*[^*].*\*$/.test(part)){n=node('em');inline(n,part.slice(1,-1))}
  else if(/^\[[^\]]+\]\(https:\/\//.test(part)){const m=part.match(/^\[([^\]]+)\]\((https:\/\/[^)\s]+)\)$/);n=node('a');n.href=m[2];n.target='_blank';n.rel='noopener noreferrer';n.textContent=m[1]}
  else n=document.createTextNode(part);
  parent.append(n);
 }
}
const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
const isRule=line=>/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
export function markdown(text){
 const out=document.createDocumentFragment(),lines=String(text??'').replace(/\r\n?/g,'\n').split('\n');
 let para=null,list=null;
 const close=()=>{para=null;list=null};
 for(let i=0;i<lines.length;i++){
  const line=lines[i],trim=line.trim();
  if(!trim){close();continue}
  if(trim.startsWith('```')){close();const pre=node('pre'),code=node('code'),body=[];for(i++;i<lines.length&&!lines[i].trim().startsWith('```');i++)body.push(lines[i]);code.textContent=body.join('\n');pre.append(code);out.append(pre);continue}
  if(/^(-{3,}|\*{3,}|_{3,})$/.test(trim)){close();out.append(node('hr'));continue}
  const heading=trim.match(/^(#{1,6})\s+(.*)$/);
  if(heading){close();const h=node(heading[1].length<=2?'h3':'h4');inline(h,heading[2]);out.append(h);continue}
  if(trim.startsWith('|')&&i+1<lines.length&&isRule(lines[i+1])){
   close();const wrap=node('div','md-table'),table=node('table'),head=node('thead'),tr=node('tr');
   for(const c of cells(trim)){const th=node('th');inline(th,c);tr.append(th)}
   head.append(tr);table.append(head);const body=node('tbody');
   for(i+=2;i<lines.length&&lines[i].trim().startsWith('|');i++){const row=node('tr');for(const c of cells(lines[i])){const td=node('td');inline(td,c);row.append(td)}body.append(row)}
   i--;table.append(body);wrap.append(table);out.append(wrap);continue
  }
  const item=trim.match(/^([-*+]|\d+[.)])\s+(.*)$/);
  if(item){para=null;const tag=/\d/.test(item[1])?'ol':'ul';if(!list||list.tagName.toLowerCase()!==tag){list=node(tag);if(tag==='ol'&&parseInt(item[1])>1)list.start=parseInt(item[1]);out.append(list)}const li=node('li');inline(li,item[2]);list.append(li);continue}
  if(list&&/^\s{2,}/.test(line)){const li=list.lastChild;li.append(document.createElement('br'));inline(li,trim);continue}
  list=null;
  if(para){para.append(document.createElement('br'));inline(para,trim)}
  else{para=node('p');inline(para,trim);out.append(para)}
 }
 return out;
}
