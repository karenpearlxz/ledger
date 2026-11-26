import crypto from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { many, one, transaction } from '../lib/db.js';
import { route, badRequest, isoDate } from '../lib/http.js';
import { parseCentavos, decimalAmount, remainingCentavos, isIsoDate } from '../lib/owed.js';

export const owedRouter=express.Router();
const uuid=z.string().uuid();
const date=z.string().refine(isIsoDate,'enter a valid calendar date');
const money=z.string().refine(v=>{try{parseCentavos(v);return true}catch{return false}},'enter a positive amount with at most two decimal places, up to 99,999,999.99');
const loanBody=z.object({name:z.string().trim().min(1).max(100),amount:money,lentDate:date,dueDate:date.nullable().default(null),notes:z.string().max(4000).default('')}).strict();
const paymentBody=z.object({amount:money,paidDate:date,notes:z.string().max(2000).default('')}).strict();
const settleBody=z.object({paidDate:date,notes:z.string().max(2000).default('Marked paid'),expectedRemainingCents:z.number().int().min(0).max(9999999999)}).strict();
const selectLoans=`select l.*, coalesce((select jsonb_agg(jsonb_build_object(
  'id',p.id,'amountCents',p.amount_cents,'paidDate',p.paid_date::text,'notes',p.notes,'createdAt',p.created_at
) order by p.paid_date desc,p.created_at desc,p.id) from owed_payments p where p.loan_id=l.id),'[]'::jsonb) as payments from owed_loans l`;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function shape(row){
  const amountCents=Number(row.amount_cents);
  const payments=row.payments.map(p=>({...p,amountCents:Number(p.amountCents),amount:decimalAmount(Number(p.amountCents))}));
  const remainingCents=remainingCentavos(amountCents,payments.map(p=>p.amountCents));
  const paidCents=amountCents-remainingCents;
  return {id:row.id,name:row.name,amountCents,amount:decimalAmount(amountCents),lentDate:isoDate(row.lent_date),dueDate:isoDate(row.due_date),notes:row.notes,
    paidCents,paid:decimalAmount(paidCents),remainingCents,remaining:decimalAmount(remainingCents),status:remainingCents===0?'paid':paidCents>0?'partial':'outstanding',
    version:row.version,payments,createdAt:row.created_at,updatedAt:row.updated_at};
}
const operationHash=body=>crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const failure=(status,message)=>Object.assign(new Error(message),{owedStatus:status});
async function readLoan(client,id){return shape((await client.query(selectLoans+' where l.id=$1',[id])).rows[0])}
async function mutate(id,fn){
  return transaction(async client=>{
    const locked=(await client.query('select id from owed_loans where id=$1 for update',[id])).rows[0];
    if(!locked)throw failure(404,'no such loan');
    return fn(client,await readLoan(client,id));
  });
}
async function touch(client,id){await client.query('update owed_loans set version=version+1,updated_at=now() where id=$1',[id])}
function change(fn){return route(async(req,res)=>{try{await fn(req,res)}catch(e){if(e.owedStatus)return res.status(e.owedStatus).json({error:e.message});throw e}})}

owedRouter.use((req,res,next)=>{
  res.set('Cache-Control','private, no-store');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
    let same=true;const origin=req.get('origin');
    if(origin){try{same=new URL(origin).host===req.get('host')}catch{same=false}}
    if(!same||req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'open Money in Ledger to make changes'});
    if(req.method!=='DELETE'&&!req.is('application/json'))return res.status(415).json({error:'send JSON to save a loan or payment'});
  }
  next();
});
owedRouter.param('id',(req,res,next,id)=>uuid.safeParse(id).success?next():res.status(404).json({error:'no such loan'}));
owedRouter.param('paymentId',(req,res,next,id)=>uuid.safeParse(id).success?next():res.status(404).json({error:'no such payment'}));

owedRouter.get('/',route(async(_req,res)=>{
  const loans=(await many(selectLoans+' order by l.lent_date desc,l.created_at desc,l.id')).map(shape);
  const totalOutstandingCents=loans.reduce((sum,l)=>sum+l.remainingCents,0);
  if(!Number.isSafeInteger(totalOutstandingCents))throw Error('outstanding total is too large');
  res.json({loans,totalOutstandingCents,totalOutstanding:decimalAmount(totalOutstandingCents),today:today()});
}));
owedRouter.get('/:id',route(async(req,res)=>{
  const row=await one(selectLoans+' where l.id=$1',[req.params.id]);
  if(!row)return res.status(404).json({error:'no such loan'});
  res.json({loan:shape(row)});
}));
owedRouter.post('/',change(async(req,res)=>{
  const parsed=loanBody.extend({operationId:uuid}).safeParse(req.body);if(!parsed.success)return badRequest(res,parsed);
  const {operationId,...b}=parsed.data;if(b.dueDate&&b.dueDate<b.lentDate)throw failure(400,'due date cannot be before date lent');
  const loan=await transaction(async client=>{
    const hash=operationHash({...b,amount:decimalAmount(parseCentavos(b.amount))});
    const {rows}=await client.query('insert into owed_loans(name,amount_cents,lent_date,due_date,notes,operation_id,operation_hash) values($1,$2,$3,$4,$5,$6,$7) on conflict(operation_id) do nothing returning id',[b.name,parseCentavos(b.amount),b.lentDate,b.dueDate,b.notes,operationId,hash]);
    if(rows[0])return readLoan(client,rows[0].id);
    const previous=(await client.query('select id,operation_hash from owed_loans where operation_id=$1',[operationId])).rows[0];
    if(!previous||previous.operation_hash!==hash)throw failure(409,'this operation was already used for a different loan');
    return readLoan(client,previous.id);
  });res.status(201).json({loan});
}));
owedRouter.put('/:id',change(async(req,res)=>{
  const parsed=loanBody.extend({version:z.number().int().positive()}).safeParse(req.body);if(!parsed.success)return badRequest(res,parsed);
  const b=parsed.data;if(b.dueDate&&b.dueDate<b.lentDate)throw failure(400,'due date cannot be before date lent');
  const loan=await mutate(req.params.id,async(client,current)=>{
    if(b.version!==current.version)throw failure(409,'this loan changed elsewhere. Review the latest details and save again');
    const amountCents=parseCentavos(b.amount);
    if(amountCents<current.paidCents)throw failure(400,'amount lent cannot be less than payments already recorded');
    if(current.payments.some(p=>p.paidDate<b.lentDate))throw failure(400,'date lent cannot be after an existing payment');
    await client.query('update owed_loans set name=$2,amount_cents=$3,lent_date=$4,due_date=$5,notes=$6,version=version+1,updated_at=now() where id=$1',[req.params.id,b.name,amountCents,b.lentDate,b.dueDate,b.notes]);
    return readLoan(client,req.params.id);
  });res.json({loan});
}));
owedRouter.delete('/:id',change(async(req,res)=>{
  await mutate(req.params.id,async client=>{await client.query('delete from owed_loans where id=$1',[req.params.id])});
  res.json({ok:true});
}));

async function savePayment(req,res,editing){
  const parsed=(editing?paymentBody.extend({version:z.number().int().positive()}):paymentBody.extend({operationId:uuid})).safeParse(req.body);if(!parsed.success)return badRequest(res,parsed);
  const b=parsed.data,amountCents=parseCentavos(b.amount);
  const loan=await mutate(req.params.id,async(client,current)=>{
    const hash=operationHash({amount:decimalAmount(amountCents),paidDate:b.paidDate,notes:b.notes});
    if(!editing){
      const previous=(await client.query('select loan_id,operation_hash from owed_payments where operation_id=$1',[b.operationId])).rows[0];
      if(previous){
        if(previous.loan_id!==req.params.id||previous.operation_hash!==hash)throw failure(409,'this operation was already used for a different payment');
        return current;
      }
    }
    if(editing&&b.version!==current.version)throw failure(409,'this payment changed elsewhere. Review the latest details and save again');
    const previous=editing?current.payments.find(p=>p.id===req.params.paymentId):null;
    if(editing&&!previous)throw failure(404,'no such payment');
    if(b.paidDate<current.lentDate)throw failure(400,'payment date cannot be before date lent');
    if(amountCents>current.remainingCents+(previous?.amountCents??0))throw failure(400,'payment cannot exceed the remaining balance');
    if(editing)await client.query('update owed_payments set amount_cents=$3,paid_date=$4,notes=$5 where id=$1 and loan_id=$2',[req.params.paymentId,req.params.id,amountCents,b.paidDate,b.notes]);
    else {
      const inserted=await client.query('insert into owed_payments(loan_id,amount_cents,paid_date,notes,operation_id,operation_hash) values($1,$2,$3,$4,$5,$6) on conflict(operation_id) do nothing returning id',[req.params.id,amountCents,b.paidDate,b.notes,b.operationId,hash]);
      if(!inserted.rows.length)throw failure(409,'this operation was already used for a different payment');
    }
    await touch(client,req.params.id);return readLoan(client,req.params.id);
  });res.status(editing?200:201).json({loan});
}
owedRouter.post('/:id/payments',change((req,res)=>savePayment(req,res,false)));
owedRouter.put('/:id/payments/:paymentId',change((req,res)=>savePayment(req,res,true)));
owedRouter.delete('/:id/payments/:paymentId',change(async(req,res)=>{
  const loan=await mutate(req.params.id,async(client,current)=>{
    if(!current.payments.some(p=>p.id===req.params.paymentId))throw failure(404,'no such payment');
    await client.query('delete from owed_payments where id=$1 and loan_id=$2',[req.params.paymentId,req.params.id]);
    await touch(client,req.params.id);return readLoan(client,req.params.id);
  });res.json({loan});
}));
owedRouter.post('/:id/settle',change(async(req,res)=>{
  const parsed=settleBody.safeParse(req.body);if(!parsed.success)return badRequest(res,parsed);
  const b=parsed.data;
  const loan=await mutate(req.params.id,async(client,current)=>{
    if(current.remainingCents===0)return current;
    if(current.remainingCents!==b.expectedRemainingCents)throw failure(409,'the balance changed. Review the latest amount before marking paid');
    if(b.paidDate<current.lentDate)throw failure(400,'payment date cannot be before date lent');
    await client.query('insert into owed_payments(loan_id,amount_cents,paid_date,notes) values($1,$2,$3,$4)',[req.params.id,current.remainingCents,b.paidDate,b.notes]);
    await touch(client,req.params.id);return readLoan(client,req.params.id);
  });res.json({loan});
}));
