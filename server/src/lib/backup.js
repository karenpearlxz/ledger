import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { env } from './env.js';
import { getPool } from './db.js';

/** Full consistent read-only schema snapshot. Must finish on disk before any writes. */
export async function backupLedger(label = 'swertres') {
  const dir = '/home/kit/ledger-backups';
  await fs.mkdir(dir,{recursive:true,mode:0o700});
  const filename=dir+'/before-'+label+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(3).toString('hex')+'.json';
  const client=await getPool().connect();
  const snapshot={takenAt:new Date().toISOString(),schema:env.DATABASE_SCHEMA,tables:{}};
  try{
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const tables=(await client.query("select table_name from information_schema.tables where table_schema=$1 and table_type='BASE TABLE' order by table_name",[env.DATABASE_SCHEMA])).rows;
    for(const {table_name:t} of tables){
      const safe='"'+t.replace(/"/g,'""')+'"';
      snapshot.tables[t]=(await client.query('select * from '+safe)).rows;
    }
    await client.query('COMMIT');
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
  if(!snapshot.tables.journal_entries || !snapshot.tables.schema_migrations)throw Error('Incomplete backup');
  const file=await fs.open(filename,'wx',0o600);
  try{await file.writeFile(JSON.stringify(snapshot,null,2));await file.sync();}finally{await file.close();}
  const disk=JSON.parse(await fs.readFile(filename,'utf8'));
  if(Object.keys(disk.tables).length!==Object.keys(snapshot.tables).length)throw Error('Backup verification failed');
  return filename;
}
