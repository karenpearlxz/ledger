import 'dotenv/config';import fs from 'fs';import {one} from './server/src/lib/db.js';
const {body}=JSON.parse(fs.readFileSync('/home/kit/ledger/h.json','utf8'));
console.log(await one('update figures set body=$1 where ordinal=131 returning ordinal,length(body) l',[body]));process.exit(0)