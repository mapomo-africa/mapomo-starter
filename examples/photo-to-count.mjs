// node examples/photo-to-count.mjs chemin/vers/photo.jpg chairs   (chairs, tents, vehicles, banners, screens, lighting)
// Upload a photo, create a report, run the detection on it, print what was found (to be reviewed).
import {api,uploadPhoto} from '../mapomo.mjs';
const [file,resource='chairs']=process.argv.slice(2);if(!file)throw Error('Give a photo path');
const photo=await uploadPhoto(file);
const report=await api('submission',{country:'SN',synthetic:true,title:'Essai équipe',date:new Date().toISOString().slice(0,10),location:'Saly',event:'essai-'+Date.now(),photo_ids:[photo.id]});
const seg=await api('segment',{id:report.id,photo_id:photo.id,resource});
console.log({report:report.id,resource,proposed:seg.objects?.length??seg.count,note:'Proposed objects only: inspect them before accepting.'});
