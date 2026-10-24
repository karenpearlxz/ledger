import 'dotenv/config';import fs from 'fs';import {one} from './server/src/lib/db.js';
const {body,epi,quote}=JSON.parse(fs.readFileSync('/home/kit/ledger/h.json','utf8'));
const mx=await one('select coalesce(max(ordinal),0) m from figures');
const r=await one('insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal',[Number(mx.m)+1,'boethius','Boethius',epi,'c. 477 – c. 524 CE',"oct 24, 2026",epi,body,quote,'The Consolation of Philosophy, Book I (H. R. James tr., Gutenberg 14328)']);
console.log(r);process.exit(0)
