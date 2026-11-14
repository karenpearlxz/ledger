import 'dotenv/config';import {one} from './server/src/lib/db.js';
const r=await one("update figures set body=replace(body,'from the 1748 volume via','via') where ordinal=133 returning length(body) l");console.log(r);process.exit(0)
