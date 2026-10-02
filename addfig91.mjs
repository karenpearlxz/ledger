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
p('William Wordsworth was born on 7 April 1770 in Cockermouth, a small town on the edge of the Lake District, the second of five children of John Wordsworth, a lawyer who managed the estates of the hated Sir James Lowther. His mother Ann died when he was eight. His father died five years later, on a winter night after getting lost on the fells. The Lowthers refused to pay the debts they owed the family, and the children were split up among relatives who did not much want them.')+
p('What saved him was the landscape. At Hawkshead Grammar School he was allowed to roam, and he spent his boyhood skating on frozen lakes at night, stealing birds from other boys\' snares, and once taking a boat out alone onto Ullswater, until a huge black peak seemed to rise up behind the hills and stride after him. He rowed back shaking. He spent the rest of his life trying to explain moments like that.'))+
sec('what he did &amp; why he\'s remembered',
p('After Cambridge, where he was bored, he walked across revolutionary France in 1790 and went back in 1791 a fervent republican. Then came the Terror, war between England and France, and a long breakdown of faith in politics. He came out of it through nature, and through two people: his sister Dorothy and Samuel Taylor Coleridge, whom he met in 1795.')+
p('In 1798 he and Coleridge published Lyrical Ballads. Coleridge took the supernatural; Wordsworth took ordinary life, beggars, shepherds, a mad mother, an idiot boy, written in "the real language of men." It ends with Tintern Abbey. His preface to the 1800 edition defined poetry as "the spontaneous overflow of powerful feelings" taken from "emotion recollected in tranquillity." That sentence more or less invented the modern idea of what a poet is. He spent fifty years on The Prelude, an autobiography in verse of his own mind, which was only published after he died. In 1843 he became Poet Laureate.'))+
sec('family life',
p('The person at the center of his life was Dorothy. Separated as children, they found each other again in their twenties and never parted. They lived together at Dove Cottage in Grasmere from 1799, walking miles every day. Her journals are full of the things he turned into poems; the famous daffodils by Ullswater are hers first, written down on 15 April 1802. At the end of Tintern Abbey he turns from the river and speaks directly to her.')+
p('He had five children with his wife Mary. In 1812 two of them, Catherine, aged three, and Thomas, aged six, died within six months of each other. He never fully recovered. His beloved brother John, a sea captain, had already drowned in a shipwreck in 1805, which is why so much of his later work feels like it is holding grief at arm\'s length.'))+
sec('romantic life',
p('In France in 1792 he fell in love with Annette Vallon, a young Frenchwoman from Blois. She became pregnant, and their daughter Caroline was born in December 1792, just as war cut him off from them. He did not see them again for ten years. In 1802, during a brief peace, he and Dorothy went to Calais to meet Annette and Caroline, by then nine, for a month on the beach, so that he could settle things before marrying someone else. The affair was hidden by his family and was only discovered by scholars in the 1920s.')+
p('That someone else was Mary Hutchinson, whom he had known since childhood. They married in October 1802. It was a quiet, deep, lasting marriage, and late in life their letters to each other show a tenderness nobody suspected. Mary\'s sister Sara was the woman Coleridge loved hopelessly for years.'))+
sec('life until death',
p('The young radical became, in the eyes of the next generation, a conservative who had sold out. He accepted a government post as Distributor of Stamps, opposed reform, and Shelley and Byron mocked him; Browning wrote "The Lost Leader" about him. His friendship with Coleridge broke in 1810 over a careless remark repeated by a third person, and was only half mended.')+
p('He lived at Rydal Mount near Grasmere for his last thirty-seven years, with Mary and Dorothy, who after 1829 slowly lost her mind and spent two decades in an upstairs room. He cared for her to the end. His daughter Dora died in 1847, and after that he stopped writing. He caught a cold on a walk and died on 23 April 1850, St George\'s Day, aged eighty. He is buried in Grasmere churchyard among his children.'))+
sec('his works',
p('Tintern Abbey was written in his head on a walking tour with Dorothy in July 1798 and set down without changing a line. He is standing above the River Wye, five years after he first saw it, measuring who he was then against who he is now.')+
h('Lines Composed a Few Miles above Tintern Abbey (1798)')+poem('f_tin.txt')+
p('The "Lucy" poems are about a girl who may never have existed. Nobody knows who she was, and he never said. They are some of the shortest and most devastating poems in English.')+
h('She dwelt among the untrodden ways (1799)')+poem('f_dwelt.txt')+
h('A slumber did my spirit seal (1799)')+poem('f_slum.txt')+
h('The world is too much with us (1807)')+poem('f_world.txt')+
h('From the Preface to Lyrical Ballads (1800)')+bq('...all good poetry is the spontaneous overflow of powerful feelings... it takes its origin from emotion recollected in tranquillity.'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[91,'william-wordsworth','William Wordsworth','emotion recollected in tranquillity','1770 – 1850','oct 2, 2026','Orphaned boy of the Lake District who turned walking into poetry. Hid a French daughter for a lifetime, lived beside his sister for fifty years, and wrote Lucy, a girl nobody can identify.',body,'But she is in her grave, and, oh, / The difference to me!','She dwelt among the untrodden ways']);
console.log(r);process.exit();
