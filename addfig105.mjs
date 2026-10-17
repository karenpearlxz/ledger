import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;').replace(/\u201c/g,'&ldquo;').replace(/\u201d/g,'&rdquo;').replace(/\u2019/g,'&rsquo;').replace(/\u2018/g,'&lsquo;');
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;

const L=fs.readFileSync('/tmp/cr2.txt','utf8').split('\n');
const rng=(a,b)=>L.slice(a-1,b).join('\n').split(/\n\s*\n/).map(x=>x.replace(/\n/g,' ').replace(/_/g,'').trim()).filter(Boolean).map(x=>bq(esc(x))).join('');
const body=sec('childhood &amp; early life',
p('Elizabeth Stevenson was born in Chelsea, London, on 29 September 1810, the daughter of a Unitarian minister turned civil servant. Her mother died about a year later, and her father, unable to cope with a newborn and a toddler, sent her to Knutsford in Cheshire to be raised by her aunt Hannah Lumb. Knutsford became the model for Cranford, and she remembered its quiet streets and its sharp, kind, eccentric women for the rest of her life.')+
p('Her only brother, John, a sailor, vanished on a voyage to India in 1828 and was never heard of again. A father who sent her away, a brother who disappeared, a mother she never knew: almost all of her fiction is about people holding a community together after someone has gone.'))+
sec('what she did &amp; why she&rsquo;s remembered',
p('Gaskell wrote the novels that first showed Victorian readers how factory workers actually lived. Mary Barton (1848) put Manchester mill families at the centre of a story, North and South (1855) set a southern clergyman&rsquo;s daughter against a northern mill owner, and Cranford (1851-53) is the gentlest and funniest book about women alone ever written. She also wrote the first biography of Charlotte Bront&euml;, her friend, in 1857, and it is still read.'))+
sec('family life',
p('In 1832 she married William Gaskell, a Unitarian minister in Manchester. They had four daughters who lived, Marianne, Meta, Florence and Julia, and a son, William, who died of scarlet fever at nine months in 1845. Her husband suggested she write to get through the grief, and that is how Mary Barton began. She said later that the book came out of a wish to give voice to people who were suffering without being heard.')+
p('She ran a busy house, entertained writers like Dickens and Bront&euml;, did charity work in the Manchester slums, and wrote in the dining room, with the door open, in between everything else. She never had a room of her own.'))+
sec('romantic life',
p('Her marriage seems to have been a real partnership, affectionate and equal for its time. The love story in Cranford is not hers but it feels like it could have been: Miss Matty and Mr Holbrook, who might have married decades earlier and did not, because of family pride and bad timing. Gaskell lets them meet again, in a farmhouse full of books, and says very little about what it costs them.'))+
sec('life until death',
p('She wrote Wives and Daughters for the Cornhill Magazine from 1864, and secretly bought a house, The Lawn at Holybourne in Hampshire, as a surprise retirement present for her husband. On 12 November 1865, she collapsed and died in the drawing room, mid-conversation, of a heart attack, aged 55. The novel was left a few chapters short of the end.'))+
sec('her works',
p('Both extracts are from Cranford, Project Gutenberg ebook 394. The first is the opening of the book. The second is Mr Holbrook&rsquo;s farm and his room full of books, where Miss Matty visits the man she might once have married.')+
h('Cranford, chapter I: our society')+rng(121,175)+
h('Cranford, chapter IV: Woodley and the room of books')+rng(1386,1398)+rng(1402,1423));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug`,
[105,'elizabeth-gaskell','Elizabeth Gaskell','the woman who wrote between interruptions','1810 – 1865','oct 16, 2026','A minister’s wife in Manchester who wrote the first novels about factory families, the funniest book about women alone, and kept the door open while she did it.',body,'A man, as one of them observed to me once, is so in the way in the house!','Elizabeth Gaskell, Cranford']);
console.log(r);process.exit();
