import 'dotenv/config';import {one} from './server/src/lib/db.js';
import pg from 'pg';
const r=await one("select string_agg(name,'|') n from figures");console.log(r.n.match(/Herbert|Lucan|Vaughan|Traherne/gi));process.exit(0)
