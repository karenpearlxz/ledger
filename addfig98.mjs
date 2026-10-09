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
p('Gerard Manley Hopkins was born on 28 July 1844 in Stratford, Essex, the eldest of nine children in a comfortable, artistic Anglican family. His father ran a marine insurance firm and wrote poetry on the side; his aunt taught him to draw. As a boy at Highgate School he was small, stubborn and intense. Once, to prove a point about willpower, he refused to drink any liquid for a week, until his tongue went black and he collapsed at drill.')+
p('He went up to Balliol College, Oxford in 1863, where his tutors included Walter Pater and Benjamin Jowett. Friends called him "the star of Balliol". He filled notebooks with sketches of clouds, leaves and running water, trying to pin down what made each thing exactly itself.'))+
sec('what he did &amp; why he\'s remembered',
p('At Oxford he fell under the spell of John Henry Newman and in 1866 converted to Roman Catholicism, a choice that cut him off from much of his family. Two years later he decided to become a Jesuit priest, and he burned his poems, believing poetry was a vanity he had to give up.')+
p('For seven years he wrote almost nothing. Then in 1875 a German ship, the Deutschland, sank in the Thames estuary with five Franciscan nuns aboard, and his superior casually said someone ought to write a poem about it. Hopkins took that as permission and produced "The Wreck of the Deutschland", a poem so strange that the Jesuit magazine refused to print it.')+
p('He invented his own vocabulary for what he was doing. "Inscape" was the unique inner pattern of a thing, "instress" the force that lets you feel it, and "sprung rhythm" his way of counting only stressed syllables so lines could rush and pile up like real speech. Almost none of it was published while he lived. His friend Robert Bridges kept the manuscripts and finally printed them in 1918, nearly thirty years after his death, and modern poets have been borrowing from him ever since.'))+
sec('family life',
p('His parents were loving but devastated by his conversion; his father wrote him pained letters asking him to wait. Hopkins went ahead anyway. The relationship survived, a little stiffly, and he kept writing home for the rest of his life, often sending sketches and descriptions of weather.'))+
sec('romantic life',
p('Hopkins took a vow of celibacy and kept it. His journals show he was deeply moved by beauty in people as well as in nature, and at nineteen he became infatuated with Digby Dolben, a young poet and distant cousin of Bridges whom he met only once. Dolben drowned in 1867, and Hopkins carried that unspoken feeling quietly. He confessed his "temptations" to his confessor and turned the rest into devotion.'))+
sec('life until death',
p('As a priest he was moved around constantly: parishes in Liverpool slums, Glasgow, Oxford, Lancashire. In 1884 he was sent to Dublin to be Professor of Greek at University College, where he spent his days marking endless exam papers and felt exiled, exhausted and useless. Out of that came the "terrible sonnets", some of the most honest poems about depression ever written.')+
p('In 1889 he caught typhoid, probably from the old drains in the college building. He died on 8 June 1889, at forty-four. His last words were reported as "I am so happy, I am so happy." He is buried in the Jesuit plot at Glasnevin Cemetery in Dublin.'))+
sec('his works',
p('All from Poems of Gerard Manley Hopkins (1918, ed. Robert Bridges). Read them out loud; they make far more sense in the mouth than on the page. Start joyful with the nature sonnets, then go to "Spring and Fall", which is about a little girl crying over falling leaves, and end with "Carrion Comfort", which is a man physically wrestling despair and refusing to lose.')+
h('God\'s Grandeur')+poem('gm1.txt')+
h('Pied Beauty')+poem('gm2.txt')+
h('Felix Randal')+poem('gm3.txt')+
h('Spring and Fall: to a young child')+poem('gm4.txt')+
h('(Carrion Comfort)')+poem('gm5.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[98,'gerard-manley-hopkins','Gerard Manley Hopkins','the priest who burned his poems','1844 – 1889','oct 9, 2026','Jesuit priest who gave up poetry, came back to it in secret, invented sprung rhythm, and was not published until thirty years after he died.',body,'It is the blight man was born for, / It is Margaret you mourn for.','"Spring and Fall," Poems, 1918']);
console.log(r);process.exit();