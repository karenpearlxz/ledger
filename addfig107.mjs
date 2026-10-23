import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const T=fs.readFileSync('/tmp/sy.txt','utf8');

const T0=fs.readFileSync('/tmp/ct.txt','utf8').split('\n');
const poem=(n)=>{let i=T0.indexOf(n+'.');let out=[];for(let k=i+1;k<T0.length;k++){const l=T0[k];if(/^[LXVIC]+\.$/.test(l))break;out.push(l.replace(/\s{3,}\d+\s*$/,'').replace(/^ {4}/,''));}
 return bq(out.join('\n').trim().split('\n').map(l=>esc(l).replace(/^( +)/,m=>'&nbsp;'.repeat(m.length))).join('<br>'));};
const body=sec('childhood &amp; early life',
p('Gaius Valerius Catullus was born around 84 BC in Verona, to a family rich enough that Julius Caesar stayed at his father\u2019s house when passing through. He was a provincial from the north who moved to Rome as a young man, which is exactly the kind of person who ends up writing the sharpest poems about the city. He belonged to a circle of young poets who rejected grand public epics for short, personal, polished poems about their own lives. They were called the neoterics, the new ones.'))+
sec('what he did &amp; why he&rsquo;s remembered',
p('Catullus wrote about love the way people actually feel it, which was almost unheard of. About 116 poems survive, and they swing from tenderness to filth to grief with no warning. He wrote lovers\u2019 vows, vicious insults aimed at Caesar and at his rivals, and a heartbreaking elegy for his dead brother. Two thousand years on, his two-line poem about loving and hating at once is still the shortest accurate description of a toxic relationship anyone has managed.'))+
p('Almost everything he wrote about love is aimed at \u201cLesbia\u201d, a pseudonym that is a tribute to Sappho. Ancient writers say she was a real woman, Clodia, a married aristocrat from one of Rome\u2019s most powerful families, older than him and far above him in rank.')+
sec('family life',
p('His brother died far from home in the Troad, in what is now northwestern Turkey. Catullus travelled across the sea to reach the grave, an experience he turned into poem 101, one of the great elegies in any language. His father was a respected man. Beyond that we know little, and Catullus never married.'))+
sec('romantic life',
p('The Lesbia poems read like a diary of one affair, in order: the dizzy early kisses, the possessive jealousy, the discovery that she was sleeping with other men (including, according to him, his own friend Caelius), the cycles of breaking up and going back, and finally the humiliation of still loving her after he had stopped respecting her. He also wrote to a boy named Juventius. He does not pretend to be consistent.'))+
sec('life until death',
p('He seems to have served briefly in Bithynia on the staff of the governor Memmius and came home poor and bitter about it. He died young, around 54 BC, probably aged about thirty. His poems almost vanished: the whole book survived in a single manuscript found in Verona around 1300, which was then lost again, after copies were made.'))+
sec('his works',
p('Catullus was written in Latin. These are the Lesbia poems and the elegy for his brother, in Robinson Ellis\u2019s Victorian translation (Project Gutenberg ebook 18867), which keeps the elegiac couplets of the original. In the first poem, you will see him ask her to love him and forget the whole world.')+
h('V. Let us live and love')+poem('V')+
h('VII. How many kisses')+poem('VII')+
h('LI. He seems to me like a god (after Sappho)')+poem('LI')+
h('LXX. A woman&rsquo;s words')+poem('LXX')+
h('LXXII. I know you now')+poem('LXXII')+
h('LXXXV. Odi et amo')+poem('LXXXV')+
h('XCII. She rails at me, she loves me')+poem('XCII')+
h('CI. For his brother')+poem('CI'));
const r=await one('insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug',
[107,'catullus','Catullus','the poet who loved and hated at once','c. 84 - c. 54 BC','oct 18, 2026','A young Roman poet whose affair with a married aristocrat produced the most honest love poems of the ancient world.',body,'Half I hate, half love. How so? one haply requireth. Nay, I know not; alas feel it, in agony groan.','Catullus, poem LXXXV (tr. Robinson Ellis)']);
console.log(r);process.exit();
