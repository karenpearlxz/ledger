import 'dotenv/config';import {query} from './server/src/lib/db.js';
const r=await query('select ordinal,slug from figures order by ordinal desc');console.log(JSON.stringify(r.rows?r.rows.map(x=>x.ordinal+x.slug):r));process.exit(0)
