// node examples/team-instructions.mjs "Réponds en français, en listes courtes, et termine par ce qui reste inconnu."
// Your instructions are added after Mapomo's fixed rules. They shape tone, format and priorities;
// they cannot switch off the rules (no invented figures, statuses, sources, unknowns).
import {api} from '../mapomo.mjs';
console.log(await api('instructions',{text:process.argv[2]||''}));
