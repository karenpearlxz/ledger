import express from 'express';
import { getPool } from '../lib/db.js';
import { route } from '../lib/http.js';
import { swertresResponse } from '../lib/swertres-store.js';

export const swertresRouter=express.Router();
swertresRouter.get('/',route(async(_req,res)=>{
 const client=await getPool().connect();
 try{
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const data=await swertresResponse(client);
  await client.query('COMMIT');
  res.set('Cache-Control','no-store').json(data);
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}));
