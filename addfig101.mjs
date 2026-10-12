import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(l=>esc(l).replace(/^ +/,m=>'&nbsp;'.repeat(m.length))).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const body=sec('childhood &amp; early life',
p('Emma Lazarus was born on 22 July 1849 in New York City into a wealthy Sephardic Jewish family; her father Moses made his money in sugar refining. She grew up in comfort, taught at home by private tutors, and read in several languages. Her family was Jewish but not especially observant, and for the first half of her life she thought of herself mostly as a New Yorker and a writer, not as a Jewish writer.')+
p('She began writing young. At seventeen her father had a first book, Poems and Translations, privately printed, and it reached Ralph Waldo Emerson, who answered her and began a long, sometimes uneven, correspondence. He was a mentor and also a cooler critic than she wanted. She later dedicated a book to him.'))+
sec('what she did &amp; why she\'s remembered',
p('Today she is remembered for fourteen lines. In 1883 she wrote a sonnet to help raise money for the pedestal of the Statue of Liberty. Nobody paid it much attention at the time. After her death a friend campaigned to save it, and in 1903 it was cast on a bronze plaque and mounted inside the pedestal. Its last lines became the way the world talks about the statue and about arrival in America.')+
p('But the poem grew out of work she was already doing. In 1881 Russian pogroms drove thousands of Jewish refugees to New York. Lazarus, who had been quietly polite about her own heritage, went to see them on Ward\'s Island, helped raise money and set up aid, and wrote essays for the American public defending them. That changed her poetry. Songs of a Semite (1882) was her answer, and she is one of the first American poets to write openly as a Jew.'))+
sec('family life',
p('She lived with her parents and sisters for most of her life and stayed close to them. Her father\'s death in 1885 hit her hard. After that she spent much of her last two years travelling in Europe, partly to recover and partly to meet the writers she admired.'))+
sec('romantic life',
p('She never married. Her letters and the record around her show warm, intense friendships, with women like Helena de Kay Gilder and with men in literary circles, and a deep attachment to her work. Biographers have speculated about her private feelings, but little survives that settles it, so I will not pretend to know.'))+
sec('life until death',
p('In Europe in 1883 and again from 1885 she met Robert Browning and other writers and was received as a poet of standing. She came home in 1887 already seriously ill. She died in New York on 19 November 1887, aged 38, probably of cancer. The great poem was still unnoticed. She did not live to see it become famous.'))+
sec('her works',
p('All three are from The Poems of Emma Lazarus, public domain. The first is the sonnet on the statue. The second is a call she wrote to Jewish readers in the same years. The last two are quieter and show a poet with a good ear for light and for grief.')+
h('The New Colossus')+poem('l1.txt')+
h('The Banner of the Jew (opening stanzas)')+poem('l2.txt')+
h('Venus of the Louvre')+poem('l4.txt')+
h('Long Island Sound')+poem('l3.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[101,'emma-lazarus','Emma Lazarus','the poet whose sonnet outlived her','1849 – 1887','oct 12, 2026','New York poet who turned to the cause of Jewish refugees and wrote the sonnet now on the Statue of Liberty, which only became famous after her death.',body,'I lift my lamp beside the golden door!','"The New Colossus," 1883']);
console.log(r);process.exit();
