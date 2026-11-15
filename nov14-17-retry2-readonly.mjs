import fs from 'node:fs';
import {getPool,closePool} from './server/src/lib/db.js';
import {env} from './server/src/lib/env.js';
const b=JSON.parse(fs.readFileSync('/home/kit/ledger-backups/before-swertres-results-2026-11-14T10-31-53-392Z-abddfb.json','utf8'));
const canon=x=>x===null?'null':Array.isArray(x)?'['+x.map(canon).join(',')+']':typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}':JSON.stringify(x);
const c=await getPool().connect(); let out={sameSchema:env.DATABASE_SCHEMA===b.schema,tables:{},excluded:['sessions']};
try {
 await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const names=(await c.query("select table_name from information_schema.tables where table_schema=$1 and table_type='BASE TABLE' order by table_name",[env.DATABASE_SCHEMA])).rows.map(x=>x.table_name);
 out.sameTableSet=canon(names)===canon(Object.keys(b.tables).sort());
 for(const t of names){
  if(t==='sessions')continue;
  let rows=(await c.query('select * from "'+t.replace(/"/g,'""')+'"')).rows;
  let before=(b.tables[t]||[]).map(canon).sort(), after=JSON.parse(JSON.stringify(rows)).map(canon).sort();
  let c1=new Map(),c2=new Map();for(const v of before)c1.set(v,(c1.get(v)||0)+1); for(const v of after)c2.set(v,(c2.get(v)||0)+1);
  let removed=0,added=0;for(const k of new Set([...c1.keys(),...c2.keys()])){removed+=Math.max(0,(c1.get(k)||0)-(c2.get(k)||0));added+=Math.max(0,(c2.get(k)||0)-(c1.get(k)||0));}
  out.tables[t]={before:before.length,after:after.length,removed,added};
 }
 await c.query('COMMIT');
}catch(e){await c.query('ROLLBACK'); throw e}finally{c.release();await closePool()}
fs.writeFileSync('/tmp/nov14-17-retry2-readonly-compare.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
