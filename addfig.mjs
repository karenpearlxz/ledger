import 'dotenv/config';
import fs from 'node:fs';
import { one, query } from './server/src/lib/db.js';

const html = fs.readFileSync('/home/kit/fig36.html', 'utf8');
const start = html.indexOf('<div class="collapsible-body">');
const bodyStart = start + '<div class="collapsible-body">'.length;
// body ends at the last "      </div>\n    </div>" pair
const endMarker = html.lastIndexOf('      </div>\n    </div>');
const body = html.slice(bodyStart, endMarker).trim();

const epithet = 'Artemisia Lomi Gentileschi · Rome, 8 July 1593 – Naples, after January 1654 · raped at seventeen, tortured at eighteen to prove she was not lying, and then spent forty years running the most successful workshop any woman in Europe had ever run, charging Roman prices and refusing to haggle';
const quote = 'Questo è l’anello che mi dai, e queste sono le tue promesse.\nThis is the ring that you give me, and these are your promises.\n\nÈ vero, è vero, è vero, è vero.\n\nI have told the truth and always will, because it is true, and I will do what is needed to confirm it.';

const existing = await one('select id from figures where slug = $1', ['artemisia-gentileschi']);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, 'artemisia-gentileschi', 'Artemisia Gentileschi', epithet, '', 'aug 21, 2026', epithet, body, quote,
   'trial transcript, Archivio di Stato, Rome, 1612'],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
