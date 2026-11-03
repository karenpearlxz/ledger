import { isoDate } from './http.js';
import { drawInstant } from './swertres.js';
import { OFFICIAL_SOURCE } from './swertres-official.js';

// Secondary-source rows remain available for display, never for learning or analysis.
export function officialHistory(rows, from, to, now=new Date()) {
 return rows.map(r=>({...r,draw_date:isoDate(r.draw_date)})).filter(r=>
  r.official_verified_at && r.source===OFFICIAL_SOURCE &&
  r.draw_date>=from && r.draw_date<=to &&
  drawInstant(r.draw_date,r.draw_time)<=now
 );
}

export async function loadOfficialHistory(client, from, to, now=new Date()) {
 const {rows}=await client.query(
  'select draw_date,draw_time,combo,source,official_verified_at from swertres_results where official_verified_at is not null and source=$3 and draw_date >= $1 and draw_date <= $2 order by draw_date,draw_time',
  [from,to,OFFICIAL_SOURCE]
 );
 const history=officialHistory(rows,from,to,now);
 if(history.length<30)throw Error('Insufficient officially verified history; run swertres:results before generating picks');
 const yesterday=new Date(to+'T12:00:00Z');yesterday.setUTCDate(yesterday.getUTCDate()-1);
 if(history.at(-1).draw_date<yesterday.toISOString().slice(0,10))throw Error('Officially verified history is not current; run swertres:results before generating picks');
 return history;
}
