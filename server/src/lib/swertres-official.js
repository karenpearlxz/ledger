import { load } from 'cheerio';
import { drawInstant } from './swertres.js';

export const OFFICIAL_SOURCE = 'https://www.pcso.gov.ph/searchlottoresult.aspx';
const PREFIX = 'ctl00$ctl00$cphContainer$cpContent$';

export function parseOfficialResults(html) {
 const $ = load(html), table = $('#cphContainer_cpContent_GridView1');
 if (table.length !== 1) throw Error('Official results table missing');
 const heads = table.find('tr').first().find('th').map((_,e)=>$(e).text().trim()).get();
 if (heads.join('|') !== 'LOTTO GAME|COMBINATIONS|DRAW DATE|JACKPOT (PHP)|WINNERS') throw Error('Official table headers changed');
 if (table.find('a').length) throw Error('Official table is paginated; refusing a partial archive');
 const found = new Map();
 table.find('tr').slice(1).each((_,tr)=>{
  const cells = $(tr).find('td'), game = cells.eq(0).text().trim();
  const time = {'3D Lotto 2PM':'14:00','3D Lotto 5PM':'17:00','3D Lotto 9PM':'21:00'}[game];
  if (!time) { if (/^3D Lotto/i.test(game)) throw Error('Unknown official 3D game'); return; }
  if(cells.length !== 5) throw Error('Malformed official result row');
  const label = cells.eq(2).text().trim(), m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(label);
  if(!m) throw Error('Unknown official date '+label);
  const d = new Date(Date.UTC(Number(m[3]),Number(m[1])-1,Number(m[2])));
  if(d.getUTCMonth() !== Number(m[1])-1 || d.getUTCDate() !== Number(m[2])) throw Error('Invalid official date');
  const combo = cells.eq(1).text().replace(/\s+/g,'');
  if(!/^\d-\d-\d$/.test(combo)) throw Error('Invalid official combination');
  const row = {draw_date:d.toISOString().slice(0,10),draw_time:time,combo,source:OFFICIAL_SOURCE}, key = row.draw_date+'|'+time;
  if(found.has(key) && found.get(key).combo !== combo) throw Error('Conflicting official result '+key);
  found.set(key,row);
 });
 return [...found.values()].sort((a,b)=>(a.draw_date+a.draw_time).localeCompare(b.draw_date+b.draw_time));
}

async function readHTML(response) {
 if(!response.ok) throw Error('Official PCSO HTTP '+response.status);
 if(!response.headers.get('content-type')?.includes('text/html')) throw Error('Official response is not HTML');
 const reader=response.body.getReader(), chunks=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>2_000_000)throw Error('Official response exceeds size limit');chunks.push(value);}}finally{await reader.cancel();}
 return Buffer.concat(chunks).toString('utf8');
}

export async function fetchOfficialResults(from,to,fetcher=fetch) {
 const headers={'User-Agent':'LedgerResults/1.0','Accept':'text/html'};
 const response=await fetcher(OFFICIAL_SOURCE,{headers,signal:AbortSignal.timeout(30_000)});
 const html=await readHTML(response),$=load(html),form=new URLSearchParams();
 $('input[type=hidden][name]').each((_,e)=>form.set($(e).attr('name'),$(e).attr('value')||''));
 for(const key of ['__VIEWSTATE','__EVENTVALIDATION'])if(!form.get(key))throw Error('Official search form missing '+key);
 $('select[name]').each((_,e)=>form.set($(e).attr('name'),$(e).find('option[selected]').attr('value')||$(e).find('option').first().attr('value')));
 const dateFields=(date,start)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid query date');
  const [year,month,day]=date.split('-'),part=start?'Start':'End';
  const monthName=new Intl.DateTimeFormat('en-US',{month:'long',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  const fields={['ddl'+part+'Month']:monthName,['ddl'+part+(start?'Date':'Day')]:String(Number(day)),['ddl'+part+'Year']:year};
  for(const [k,v]of Object.entries(fields)){
   if(!$('select[name="'+PREFIX+k+'"] option').toArray().some(e=>$(e).attr('value')===v))throw Error('Official form does not support '+k+' '+v);
   form.set(PREFIX+k,v);
  }
 };
 dateFields(from,true);dateFields(to,false);
 form.set(PREFIX+'ddlSelectGame','0');form.set(PREFIX+'btnSearch','Search Lotto');
 const cookie=(response.headers.getSetCookie?.()||[]).map(c=>c.split(';')[0]).join('; ');
 const posted=await fetcher(OFFICIAL_SOURCE,{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded',...(cookie?{Cookie:cookie}:{})},body:form,signal:AbortSignal.timeout(30_000)});
 const rows=parseOfficialResults(await readHTML(posted));
 if(rows.some(r=>r.draw_date<from||r.draw_date>to))throw Error('Official response ignored date range');
 return rows;
}

export function exactOfficialEvaluations(picks,results,now=new Date()) {
 const index=new Map(results.filter(r=>r.official_verified_at).map(r=>[r.draw_date+'|'+r.draw_time,r]));
 return picks.flatMap(p=>{
  const r=index.get(p.pick_date+'|'+p.draw_time);
  if(!r || drawInstant(r.draw_date,r.draw_time)>now || drawInstant(r.draw_date,r.draw_time)<=new Date(p.created_at))return [];
  return [{pick:p,result:r}];
 });
}
