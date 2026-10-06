import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(esc).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const body=sec('childhood &amp; early life',
p('Sara Teasdale was born in St. Louis in August 1884, the late, unexpected baby of a wealthy, devout, much older couple. Her parents were in their forties, her siblings nearly grown, and the household treated her like something made of glass. She was called delicate, kept home from school until she was nine, and taught to think of herself as fragile. She learned early to watch the world from a window, which is more or less what her poems do.')+
p('As a young woman she fell in with a group of St. Louis girls who called themselves the Potters and put out a hand-made art magazine, The Potter\'s Wheel, for three years. It was there she started writing the short, musical lyrics she never stopped writing.'))+
sec('what she did &amp; why she\'s remembered',
p('Teasdale wrote small poems about enormous feelings: longing, pride, wanting to be loved without being swallowed by it. Critics later called her old-fashioned because she rhymed while the modernists were tearing poetry apart, but readers bought her books by the thousands. In 1918 her collection Love Songs won the first prize that would become the Pulitzer Prize for Poetry. She was the first person ever to receive it.')+
p('Her most famous poem today is "There Will Come Soft Rains," written during the 1918 flu pandemic and the First World War. It imagines a spring where humans are gone and nature does not notice. Ray Bradbury borrowed it in 1950 for his story of an automated house still running after a nuclear war, and that story is how most people meet her now.'))+
sec('family life',
p('She stayed close to her parents for much of her life and lived under their protection well into adulthood, which gave her comfort and quietly caged her. Her health, real and imagined, was always the family\'s main subject. She had no children. She once said she wanted to make "a few perfect lyrics," not a family, and that the poems were the life.'))+
sec('romantic life',
p('This is where she gets interesting. For years she was courted by the poet Vachel Lindsay, loud, broke, brilliant, and so in love with her that he wrote her almost daily. She loved him back, maybe more than anyone. But she did not believe he could give her security, and in 1914 she married Ernst Filsinger, a steady St. Louis businessman who had worshipped her poems before he met her. She chose safety over the man who made her feel alive, and many of her best poems sound like someone arguing with that choice.')+
p('Filsinger traveled constantly for work. In 1929 Teasdale went to Reno and divorced him, quietly, while he was abroad. She told almost no one. Lindsay, meanwhile, had married someone else and fallen into debt and depression. In 1931 he killed himself by drinking Lysol. Teasdale was wrecked by it.'))+
sec('life until death',
p('After the divorce she lived alone in New York, close to her friend Margaret Conklin, a young woman she treated almost like a daughter. Her health, never good, got worse; a bout of pneumonia left her exhausted and frightened of becoming an invalid. On January 29, 1933, at forty-eight, she took an overdose of sleeping pills and was found in her bath. A last book, Strange Victory, came out that year. People still argue over how much of "I Shall Not Care," written twenty years earlier, was a prophecy.'))+
sec('her works',
p('"Barter," "The Look," "I Shall Not Care," and "I Am Not Yours" are from Love Songs (1917), the book that won her the prize, Project Gutenberg #442. "There Will Come Soft Rains" is from Flame and Shadow (1920), Project Gutenberg #591.')+
h('Barter')+poem('s1.txt')+
h('The Look')+poem('s2.txt')+
h('"I Am Not Yours"')+poem('s4.txt')+
h('I Shall Not Care')+poem('s3.txt')+
h('There Will Come Soft Rains')+poem('s5.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[95,'sara-teasdale','Sara Teasdale','the first poet to win the pulitzer, who chose safety over fire','1884 – 1933','oct 6, 2026','American lyric poet whose Love Songs won the first Pulitzer for poetry. Turned down the poet who loved her for a safe marriage, and wrote the poems that argued with that choice.',body,'Spend all you have for loveliness, / Buy it and never count the cost.','"Barter," Love Songs, 1917']);
console.log(r);process.exit();
