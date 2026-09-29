// Downloads the valuation method the server runs and compares it with reference/valuation.mjs.
import fs from 'node:fs';import crypto from 'node:crypto';import {api} from '../mapomo.mjs';
const m=await api('method'),local=fs.readFileSync(new URL('../reference/valuation.mjs',import.meta.url),'utf8').split('\n').slice(4).join('\n');
console.log('Serveur / server  sha256:',m.sha256);
console.log('Copie / local copy sha256:',crypto.createHash('sha256').update(local).digest('hex'));
console.log(m.sha256===crypto.createHash('sha256').update(local).digest('hex')?'Identiques / identical.':'Différentes : le serveur a une autre version (voir m.source). / Different: the server runs another version.');
