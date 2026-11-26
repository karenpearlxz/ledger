// Monetary calculations stay in integer centavos. Decimal API strings are never
// multiplied as floating-point numbers, including partially repaid loans.
export const MAX_CENTAVOS = 9_999_999_999;
export function parseCentavos(value) {
  if (typeof value !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) throw new Error('enter a positive amount with at most two decimal places');
  const [whole, fraction=''] = value.split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if (!Number.isSafeInteger(cents) || cents<1 || cents>MAX_CENTAVOS) throw new Error('amount must be between 0.01 and 99,999,999.99');
  return cents;
}
export function decimalAmount(cents) {
  if (!Number.isSafeInteger(cents) || cents<0) throw new Error('invalid centavos');
  return `${Math.floor(cents/100)}.${String(cents%100).padStart(2,'0')}`;
}
export function remainingCentavos(principal, payments) {
  if (!Number.isSafeInteger(principal) || principal<1 || principal>MAX_CENTAVOS) throw new Error('invalid principal');
  let remaining=principal;
  for (const amount of payments) {
    if (!Number.isSafeInteger(amount) || amount<1) throw new Error('invalid payment');
    remaining-=amount;
    if (remaining<0) throw new Error('payments cannot exceed the amount lent');
  }
  return remaining;
}
export function isIsoDate(value) {
  if (typeof value!=='string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith('0000')) return false;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;
}
