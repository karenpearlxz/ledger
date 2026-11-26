import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCentavos, decimalAmount, remainingCentavos, isIsoDate } from '../src/lib/owed.js';

test('decimal strings retain every centavo without floating-point arithmetic', () => {
  for (const [input, cents] of [['0.01',1],['0.10',10],['0.2',20],['1',100],['10.99',1099],['99999999.99',9999999999]]) {
    assert.equal(parseCentavos(input),cents);
    assert.equal(parseCentavos(decimalAmount(cents)),cents);
  }
  assert.equal(parseCentavos('0.10')+parseCentavos('0.20'),30);
  assert.equal(decimalAmount(30),'0.30');
  assert.equal(decimalAmount(0),'0.00');
});
test('invalid, negative, nondecimal and overprecision amounts are rejected', () => {
  for (const input of ['','0','0.00','-1','1.001','1e2','NaN','Infinity','100000000','1,000',null,undefined,0.1]) assert.throws(()=>parseCentavos(input),String(input));
  for (const input of [-1,NaN,Infinity,1.1,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>decimalAmount(input));
});
test('partial payments, exact settlement and removal preserve the remaining balance', () => {
  const principal=parseCentavos('1000.50'), a=parseCentavos('100.10'), b=parseCentavos('200.20');
  assert.equal(remainingCentavos(principal,[]),100050);
  assert.equal(remainingCentavos(principal,[a,b]),70020);
  assert.equal(remainingCentavos(principal,[a,b,70020]),0);
  assert.equal(remainingCentavos(principal,[a,70020]),20020);
  assert.throws(()=>remainingCentavos(100,[101]));
  assert.throws(()=>remainingCentavos(100,[50,51]));
  assert.throws(()=>remainingCentavos(0,[]));
  assert.throws(()=>remainingCentavos(100,[-1]));
});
test('calendar dates are genuine and leap years are respected', () => {
  for (const date of ['2026-11-27','2024-02-29','2000-02-29']) assert.equal(isIsoDate(date),true,date);
  for (const date of ['2026-02-29','2026-02-31','2026-13-01','2026-01-32','0000-01-01','2026-1-01','bad','']) assert.equal(isIsoDate(date),false,date);
});
