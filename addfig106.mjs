import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const T=fs.readFileSync('/tmp/sy.txt','utf8');
const cut=(a,b)=>{const i=T.indexOf(a);const j=T.indexOf(b,i);if(i<0||j<0)throw new Error('miss '+a);return T.slice(i,j+b.length);};
const fmt=(t)=>t.split(/\n\s*\n/).map(x=>x.replace(/\n/g,' ').trim()).filter(Boolean).map(x=>bq(esc(x))).join('');
const a=fmt(cut("'The tale,' she said, 'will","he has no desire for that of which he feels no want.'"));
const b=fmt(cut("'These are the lesser mysteries of love","Would that be an ignoble life?'"));
const body=sec('childhood &amp; early life',
p('Here is the first thing to say about Diotima of Mantinea, and it is the thing she would want said plainly: nobody can prove she existed. She appears in one place, in Plato\u2019s Symposium, written around 385 BC, and everything we know about her comes from a single speech that Socrates says he is only repeating. Plato\u2019s other characters are real people with dates and enemies. Diotima has a town, Mantinea in Arcadia, and a job. That is all.')+
p('Scholars have argued about her for two thousand years. Some think she was a real priestess Socrates knew. Others think Plato invented her so that the most important idea in the dialogue could come from someone Socrates could humbly learn from. Either way, a woman is the teacher of the man who is the foundation of Western philosophy, and he says so without embarrassment.'))+
sec('what she did &amp; why she&rsquo;s remembered',
p('Diotima gave us the ladder of love. Socrates tells the drinking party that she taught him everything he knows about love, that she once delayed the plague in Athens by ten years through sacrifices, and that she cross-examined him exactly the way he usually cross-examines others. He walked in believing Love was a beautiful god. She told him he had it backwards: love is not beauty, it is the <em>wanting</em> of beauty, which means it is made of lack.')+
p('From that comes the idea behind the phrase Platonic love, which she would barely recognise. For Diotima it is not love without desire. It is desire that keeps climbing, from one body, to all bodies, to minds, to laws, to knowledge, until it reaches beauty itself.'))+
sec('family life',
p('Nothing is recorded. But she invents a family for Love himself, and it is the best part of the speech: Love is the child of Poros, Plenty, and Penia, Poverty. His mother seduced his drunk, sleeping father in Zeus\u2019s garden because she had nothing and wanted something. So Love inherits both parents, scheming and resourceful like his father, barefoot and homeless like his mother, dying and reviving over and over. It is a very good description of what wanting someone feels like.'))+
sec('romantic life',
p('If Diotima ever loved anyone, the text is silent. What she gives instead is a theory of why love hurts. Love is always between having and not having, so it can never rest. She also says the aim of love is not to possess the beloved but to \u201cgive birth in beauty\u201d, to make something, a child, a poem, a law, a better self, that outlasts you. A woman who tells a philosopher that love is a kind of pregnancy of the soul is not being delicate.'))+
sec('life until death',
p('Unknown. Socrates says only that she was wise and that he met her long ago. The Symposium ends with Alcibiades staggering in drunk to confess that he is hopelessly in love with Socrates, who is the living example of her ladder: he looks past a beautiful face to the mind. Socrates was executed in 399 BC. Diotima goes quietly out of the record, having said what she came to say.'))+
sec('her works',
p('She wrote nothing. These two passages are her words as Plato reports them, in Benjamin Jowett\u2019s Victorian translation from Project Gutenberg ebook 1600. The first is the birth of Love. The second is the ladder.')+
h('Symposium, Diotima on the parentage of Love')+a+
h('Symposium, Diotima on the ladder of beauty')+b);
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug`,
[106,'diotima-of-mantinea','Diotima of Mantinea','the woman who taught Socrates about love','5th century BC (possibly fictional)','oct 17, 2026','A priestess who may or may not have existed, and who taught Socrates that love is made of wanting.',body,'Love is the child of Plenty and Poverty, always between having and lacking.','Plato, Symposium (Diotima, paraphrase of 203b-204a)']);
console.log(r);process.exit();
