// node examples/ask-agent.mjs "Quelles preuves avons-nous ?"
import {ask} from '../mapomo.mjs';
const s=await ask(process.argv[2]||'What evidence do we have so far?');
for(const m of s.messages)console.log(m.role.toUpperCase().padEnd(9),m.role==='tool'?m.content.name:m.content.text);
