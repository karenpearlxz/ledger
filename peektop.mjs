import 'dotenv/config';
import { many } from './server/src/lib/db.js';
const rows = await many(`select slug, ordinal, name, chip_date from figures order by ordinal desc limit 60`);
console.log(rows.slice(0,6));
console.log(rows.map(r=>r.slug).join(', '));
process.exit(0);
