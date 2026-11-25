import 'dotenv/config';import {many} from './server/src/lib/db.js';
console.log(JSON.stringify(await many('select ordinal,name,chip_date,created_at from figures order by ordinal desc limit 3')));process.exit(0)
