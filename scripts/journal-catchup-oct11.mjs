import fs from 'node:fs/promises';
import { request } from '/home/kit/node_modules/playwright/index.mjs';
import { env } from '../server/src/lib/env.js';
import { getPool, closePool } from '../server/src/lib/db.js';
const base='https://warily-vigilantly-factual-catbird.kitten.space';
const backupDir='/home/kit/ledger-backups';
await fs.mkdir(backupDir,{recursive:true,mode:0o700});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const client=await getPool().connect();
const snapshot={schema:env.DATABASE_SCHEMA,takenAt:new Date().toISOString(),tables:{}};
try {
 await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const {rows}=await client.query('select table_name from information_schema.tables where table_schema=$1 and table_type=$2',[env.DATABASE_SCHEMA,'BASE TABLE']);
 for(const {table_name} of rows) {
  if(!/^[a-z_]+$/.test(table_name)) throw Error('unsafe identifier');
  snapshot.tables[table_name]=(await client.query('SELECT * FROM "'+table_name+'"')).rows;
 }
 await client.query('COMMIT');
} catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();await closePool();}
const backup=backupDir+'/before-journal-'+stamp+'.json';
await fs.writeFile(backup,JSON.stringify(snapshot,null,2),{mode:0o600});
const reread=JSON.parse(await fs.readFile(backup,'utf8'));
if(!Array.isArray(reread.tables.journal_entries))throw Error('backup incomplete');
const api=await request.newContext({baseURL:base});
try{
 const unlock=await api.post('/api/auth/unlock',{data:{passcode:env.LEDGER_PASSCODE}});
 if(!unlock.ok())throw Error('unlock '+unlock.status());
 const before=await (await api.get('/api/content/journal')).json();
 const newest=before.entries.reduce((a,e)=>e.entryDate>a?e.entryDate:a,'');
 const source=JSON.parse(await fs.readFile('/tmp/ledger-dashboard-oct11.json','utf8')).journal;
 const candidates=source.filter(e=>e.entryDate>newest).sort((a,b)=>a.entryDate.localeCompare(b.entryDate));
 const added=[];
 for(const entry of candidates){
  if(before.entries.some(e=>e.entryDate===entry.entryDate&&e.body===entry.body))continue;
  const r=await api.post('/api/content/journal',{data:entry});
  if(r.status()!==201)throw Error('post failed '+r.status()+' '+await r.text());
  added.push((await r.json()).entry);
 }
 const after=await (await api.get('/api/content/journal')).json();
 for(const entry of [...before.entries,...added]){
  if(!after.entries.some(e=>e.id===entry.id&&e.body===entry.body&&e.entryDate===entry.entryDate))throw Error('entry missing or changed');
 }
 if(after.entries.length!==before.entries.length+added.length)throw Error('count mismatch');
 const result={backup,tableCounts:Object.fromEntries(Object.entries(snapshot.tables).map(([k,v])=>[k,v.length])),beforeCount:before.entries.length,newestBefore:newest,added,afterCount:after.entries.length};
 await fs.writeFile(backupDir+'/catchup-result-'+stamp+'.json',JSON.stringify(result,null,2),{mode:0o600});
 console.log(JSON.stringify(result,null,2));
}finally{await api.dispose();}
