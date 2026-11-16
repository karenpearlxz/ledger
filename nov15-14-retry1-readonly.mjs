import fs from 'node:fs';
import {getPool,closePool} from './server/src/lib/db.js';
import {env} from './server/src/lib/env.js';
const c=await getPool().connect();const out={schema:env.DATABASE_SCHEMA,tables:{}};
try {await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'); const names=(await c.query("select table_name from information_schema.tables where table_schema=$1 and table_type='BASE TABLE' order by table_name",[env.DATABASE_SCHEMA])).rows.map(x=>x.table_name);for(const t of names){if(t==='sessions') continue;out.tables[t]=(await c.query('select * from "'+t.replace(/"/g,'""')+'"')).rows;} await c.query('COMMIT');fs.writeFileSync('/tmp/nov15-14-retry1-live-readonly.json',JSON.stringify(out),{mode:0o600}); console.log(JSON.stringify({schema:out.schema,tables:Object.keys(out.tables).length}));}catch(e){await c.query('ROLLBACK');throw e}finally{c.release();await closePool()}
