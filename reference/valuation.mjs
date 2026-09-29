// COPIE DE LECTURE — READ-ONLY COPY. Méthode de valorisation exécutée par le serveur Mapomo.
// Vérifier que le serveur exécute bien ce code : node examples/method.mjs (compare l'empreinte sha256).
// Modifier ce fichier ne change pas le serveur. Vous pouvez l'importer pour tester une variante en local :
// ses résultats sont alors « non canoniques ».
export const countries={SN:'XOF',NG:'NGN',GH:'GHS',KE:'KES',ZA:'ZAR',CD:'CDF'};
export const resources=['chairs','tents','stage','sound_system','vehicles','banners','screens','lighting','other'];
export function required(v,name,max=300){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(`${name} is required (maximum ${max} characters)`);return v.trim()}
export function decimal(v){if(typeof v!=='string'||!/^\d{1,15}(\.\d{1,6})?$/.test(v))throw Error('Use a nonnegative decimal with at most six decimal places');let [a,b='']=v.split('.');return BigInt(a)*1000000n+BigInt(b.padEnd(6,'0'))}
export function format(n){return `${n/1000000n}.${String(n%1000000n).padStart(6,'0')}`.replace(/\.?0+$/,'')||'0'}
export function interval(lo,hi){let l=decimal(lo),h=hi===null||hi===''?null:decimal(hi);if(h!==null&&h<l)throw Error('Upper bound must be at least the lower bound');return [l,h]}
export function date(v){required(v,'Date',10);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Use a valid date');return v}
export function estimate(sub,review,rates){
 if(!Array.isArray(review.items)||review.items.length>100)throw Error('Up to 100 reviewed resource lines required');
 const used=new Set();let totalLow=0n,totalHigh=0n,unknown=false;
 const lines=review.items.map(item=>{
  const key=required(item.component,'Distinct component',100);if(used.has(key))throw Error('Repeated economic component: '+key);used.add(key);
  if(!resources.includes(item.resource))throw Error('Unknown resource');
  const [ql,qh]=interval(item.low,item.high);required(item.note,'Observation basis',1500);
  const rate=rates.find(r=>r.id===item.rate_id);
  if(!rate){unknown=true;return {...item,value:{low:'0',high:null},rate:null,reason:'No applicable reviewed price'}}
  const p=rate.payload;
  if(rate.country!==sub.country||rate.synthetic!==sub.synthetic||p.resource!==item.resource||p.currency!==countries[sub.country]||p.unit!==item.unit||sub.payload.date<p.start||sub.payload.date>p.end||p.location!==sub.payload.location)throw Error('Rate must match country, location, date, resource, unit and evidence category');
  const [pl,ph]=interval(p.low,p.high);const low=ql*pl/1000000n;const high=qh===null||ph===null?null:(qh*ph+999999n)/1000000n;
  totalLow+=low;if(high===null)unknown=true;else totalHigh+=high;
  return {...item,rate:rate.id,value:{low:format(low),high:high===null?null:format(high)}};
 });
 return {basis:'observed_resource_value',currency:countries[sub.country],low:format(totalLow),high:unknown?null:format(totalHigh),lines,scope:'Reviewed visible resources at this event; unobserved costs excluded. Party is beneficiary, not presumed payer.'};
}
export function partyTotals(rows,{byCampaign=false,byParty=true}={}){const groups=new Map(),events=new Set();for(const {submission:s,review:r} of rows){if(r.status!=='approved')continue;const event=[s.country,s.synthetic,s.event].join('|');if(events.has(event))throw Error('Two approved submissions share one event; resolve duplicate');events.add(event);const campaign=(r.campaign_id===undefined?s.payload?.campaign_id:r.campaign_id)||'unassigned';const party=byParty?r.party_id||'unresolved':'all';const k=JSON.stringify([s.country,s.synthetic,byCampaign?campaign:null,party,r.estimate.currency]);let g=groups.get(k)||{country:s.country,synthetic:s.synthetic,party_id:party,...(byCampaign?{campaign_id:campaign}:{}),currency:r.estimate.currency,events:0,low:0n,high:0n,paid:0n,payment_events:0,unknown:false};g.events++;if(r.payment){g.paid+=decimal(r.payment.amount);g.payment_events++}g.low+=decimal(r.estimate.low);if(r.estimate.high===null)g.unknown=true;else g.high+=decimal(r.estimate.high);groups.set(k,g)}return [...groups.values()].map(g=>({...g,low:format(g.low),paid:format(g.paid),high:g.unknown?null:format(g.high),basis:'observed_resource_value'}))}
