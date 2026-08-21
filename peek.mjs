import 'dotenv/config';
import { many } from './server/src/lib/db.js';
const r = await many('select ordinal, slug, name, epithet, lifespan, chip_date, summary, left(body,600) b, quote, quote_source from figures order by ordinal desc limit 2');
console.log(JSON.stringify(r,null,1));
process.exit(0);
