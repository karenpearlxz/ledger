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
p('Samuel Taylor Coleridge was born on 21 October 1772 in Ottery St Mary, Devon, the youngest of ten children of the Reverend John Coleridge, a vicar and schoolmaster who adored him. Samuel was the pet of the house and his brother Frank hated him for it. At seven, after a fight over a piece of cheese, Samuel lunged at Frank with a knife, then ran off and spent a rainy night alone by the River Otter. They found him the next morning, cold and shaking.')+
p('He read everything early, including the Arabian Nights, which frightened him so much he could only read it in daylight. When he was nine his father died suddenly, and Samuel was sent to Christ\'s Hospital, a charity school in London. He was lonely and homesick, rarely went home, and spent hours on the school roof staring at the sky. It was there he became friends for life with Charles Lamb.'))+
sec('what he did &amp; why he\'s remembered',
p('At Cambridge he ran up debts, fell into despair, and enlisted in the cavalry under the absurd name "Silas Tomkyn Comberbache." He was a hopeless horseman; his brothers bought him out. In 1795 he met William Wordsworth, and their friendship changed English poetry. In 1798 they published Lyrical Ballads together, opening with Coleridge\'s Rime of the Ancient Mariner. That book is usually treated as the start of English Romanticism.')+
p('He wrote only a handful of great poems, almost all within a few years: the Mariner, Kubla Khan, Christabel, Frost at Midnight. Kubla Khan came, he said, in an opium dream; he woke with two or three hundred lines in his head and was writing them down when "a person on business from Porlock" knocked. When he returned to his desk, the rest was gone. After that he became the most brilliant talker and critic in England. He coined "willing suspension of disbelief," and his lectures on Shakespeare, especially Hamlet, are still read.'))+
sec('family life',
p('He married, had four children (Hartley, Berkeley, who died as a baby, Derwent and Sara), and then mostly left them. Frost at Midnight is written to the sleeping baby Hartley, promising him the open fields and lakes Coleridge never had. Hartley grew up to be a gifted, troubled poet who also drank himself into failure. Sara became a writer and edited her father\'s works after his death, as if to finish the conversation he never had with her.'))+
sec('romantic life',
p('In 1795 he married Sara Fricker, mostly because his friend Robert Southey was marrying her sister and the two young men planned a utopian commune in Pennsylvania called "Pantisocracy." The commune collapsed. The marriage was unhappy almost from the start.')+
p('In 1799, at the Wordsworths\' house, he met Sara Hutchinson, Wordsworth\'s future sister-in-law, and fell hopelessly in love. He called her "Asra" in his notebooks and loved her for about ten years without it ever becoming anything. His great poem Dejection: An Ode was first written as a letter to her. He and his wife separated in 1808.'))+
sec('life until death',
p('He had taken laudanum (opium dissolved in alcohol) for pain since youth, and by his thirties he was badly addicted. He went to Malta for his health, came back worse, quarrelled with Wordsworth in 1810, and spent years in misery, sometimes hiring men to stop him from entering chemists\' shops.')+
p('In 1816 he moved into the home of Dr James Gillman in Highgate, meaning to stay a month. He stayed eighteen years. Under Gillman\'s care his opium use was controlled and he became "the Sage of Highgate," with young admirers like Keats and Carlyle coming to hear him talk for hours. He died there on 25 July 1834. For his own epitaph he asked the reader to pray for "S.T.C.," who "many a year with toil of breath / Found death in life."'))+
sec('his works',
p('The Rime of the Ancient Mariner is a ghost story about guilt. An old sailor stops a guest on his way to a wedding and will not let him go until he has heard it all.')+
h('The Rime of the Ancient Mariner, Part the First (1798)')+poem('f_r1.txt')+
h('From Part the Second: the becalmed ship')+poem('f_r2.txt')+
h('From Part the Seventh: the ending')+poem('f_r3.txt')+
h('Kubla Khan (written 1797, published 1816)')+poem('f_kubla.txt')+
h('Frost at Midnight (February 1798)')+poem('f_frost.txt')+
h('From Biographia Literaria (1817)')+bq('...so as to transfer from our inward nature a human interest and a semblance of truth sufficient to procure for these shadows of imagination that willing suspension of disbelief for the moment, which constitutes poetic faith.'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[90,'samuel-taylor-coleridge','Samuel Taylor Coleridge','the dreamer interrupted','1772 – 1834','oct 1, 2026','Wrote the Ancient Mariner and lost the rest of Kubla Khan to a knock on the door. Brilliant, addicted, and in love with the wrong Sara for a decade.',body,'A sadder and a wiser man, / He rose the morrow morn.','The Rime of the Ancient Mariner']);
console.log(r);process.exit();
