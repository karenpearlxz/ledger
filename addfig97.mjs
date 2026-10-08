import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(l=>esc(l).replace(/^ /,'&nbsp;&nbsp;')).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const body=sec('childhood &amp; early life',
p('Alfred Edward Housman was born in March 1859 at Fockbury, near Bromsgrove in Worcestershire, the oldest of seven children. From his house he could see the blue hills of Shropshire on the horizon, a county he barely ever visited and later turned into a whole imaginary country of doomed farm boys.')+
p('His mother died on his twelfth birthday. He had been praying for her to live, and after she died he quietly stopped believing in God. His father drank and let the family money drain away, so the clever eldest son became the one the others leaned on.'))+
sec('what he did &amp; why he\'s remembered',
p('He went to St John\'s College, Oxford, as a brilliant classics scholar, and then, to everyone\'s shock, failed his final exams outright. Something had gone wrong in his heart, and most biographers think it was his friend Moses Jackson, a cheerful athletic science student Housman fell in love with and could never tell.')+
p('He followed Jackson to London and took a dull job as a clerk at the Patent Office for ten years. At night he went to the British Museum reading room and did Latin scholarship so sharp and so savage that the universities could not ignore him. In 1892 the failed student became Professor of Latin at University College London, and later held the Kennedy chair at Cambridge.')+
p('In 1896 he paid to publish a small book of poems, A Shropshire Lad. It sold slowly, then never stopped selling. Soldiers carried it in their pockets in the trenches of the First World War, because it was already full of young men dying for reasons nobody explained to them.'))+
sec('family life',
p('He stayed close to his siblings, especially his younger brother Laurence, a writer and artist, and his sister Katharine. He never married and had no children. Laurence later became his literary executor and published the more personal poems Alfred had kept in drawers.'))+
sec('romantic life',
p('Moses Jackson was the great love of his life, and it was never returned in the way he wanted. Jackson married, moved to India to run a college, and Housman was not invited to the wedding. They wrote to each other for decades.')+
p('In 1922, hearing that Jackson was dying in Canada, Housman rushed out Last Poems so his friend could read it. Jackson died in early 1923. Housman kept his letters until his own death.'))+
sec('life until death',
p('At Cambridge he became a legend of a different kind: a stiff, silent don famous for crushing other scholars in footnotes, while also loving fine food, wine and, surprisingly, flying in early airplanes. He spent years editing the obscure Roman astronomical poet Manilius, which he considered his real work.')+
p('He died in Cambridge on 30 April 1936, at seventy-seven. His ashes were buried by the wall of St Laurence\'s Church in Ludlow, in the Shropshire he had mostly only looked at from far away.'))+
sec('his works',
p('All from A Shropshire Lad (1896). Plain words, short lines, and a grief that sneaks up on you. "Is My Team Ploughing" is a conversation between a dead boy and his living friend, and the last stanza is one of the coldest twists in English poetry.')+
h('II. Loveliest of trees, the cherry now')+poem('hp1.txt')+
h('XIII. When I was one-and-twenty')+poem('hp2.txt')+
h('XIX. To an Athlete Dying Young')+poem('hp4.txt')+
h('XXVII. Is my team ploughing')+poem('hp3.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[97,'a-e-housman','A. E. Housman','the professor who wrote about dying farm boys','1859 – 1936','oct 8, 2026','Ruthless Latin scholar who failed his Oxford exams, loved a friend who never loved him back, and wrote A Shropshire Lad, the saddest small book in English.',body,"And I am two-and-twenty, / And oh, 'tis true, 'tis true.",'"When I was one-and-twenty," A Shropshire Lad, 1896']);
console.log(r);process.exit();
