import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(esc).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const pr=(f)=>bq(esc(fs.readFileSync('/tmp/'+f,'utf8').trim().replace(/\n/g,' ')).replace(/_([^_]+)_/g,'<em>$1</em>'));
const body=sec('childhood &amp; early life',
p('Dorothy Wordsworth was born on Christmas Day 1771 in Cockermouth, the only daughter among five children. Her mother died when she was six, and Dorothy was sent away to relatives in Halifax. She did not live under the same roof as her brother William again for almost twenty years. She grew up in other people\'s houses, loved but always a guest, and wrote letters to William that read like a girl planning her escape. "I look forward with such delight," she wrote at nineteen, to the day they would have a cottage of their own.')+
p('She had no fortune, no formal schooling beyond a few years, and none of the prospects a woman of her class was supposed to want. What she had was an eye. She noticed everything.'))+
sec('what she did &amp; why she\'s remembered',
p('In 1795 she finally got her cottage, first in Dorset, then in Somerset beside Coleridge, then in 1799 at Dove Cottage in Grasmere. She kept house, copied out William\'s poems, walked twenty miles a day with him, and kept journals that were never meant for anyone but him. They were not published in full until long after her death.')+
p('Those journals are now read as literature in their own right, and they show something uncomfortable: some of William\'s most famous poems began as her sentences. The daffodils that "danced" by Ullswater danced first in her notebook, two years before he wrote "I wandered lonely as a cloud." The old leech gatherer of <em>Resolution and Independence</em> was a man she wrote down. Coleridge called her his "exquisite sister" and said her eye watched "the subtlest beauties." She was the raw nerve of the Lake Poets, and she signed none of it.'))+
sec('family life',
p('Her life was William. When he married her friend Mary Hutchinson in 1802, Dorothy simply moved with them, and lived in his household for the rest of her life, helping raise his five children, two of whom died within months of each other in 1812. Her brother John, a sea captain, drowned in 1805 when his ship went down off Portland, and she grieved him for years.'))+
sec('romantic life',
p('She never married, and she seems never to have wanted to. The intensity of her bond with William has fed two centuries of speculation. What is on the page is this: the night before his wedding she wore the ring, and in the morning gave it back, and William slipped it on her finger again and "blessed me fervently." Her Victorian editor William Knight cut that passage, along with others he thought too private. What he left of the wedding morning is still startling. She could not bear to watch. She threw herself on a bed and lay there "neither hearing nor seeing anything."'))+
sec('life until death',
p('She travelled through Scotland with William and Coleridge in 1803 and wrote a travel journal that is arguably her masterpiece. She went on writing letters and a few poems, including "Floating Island," which William printed among his own. In 1829, at fifty-seven, she fell seriously ill, and over the next few years her mind failed, probably from arteriosclerosis or early dementia. For the last twenty years she lived in an upstairs room at Rydal Mount, warmed by an enormous fire she always wanted bigger, sometimes lucid, often reciting poems over and over, her brother\'s and her own. William died in 1850. She outlived him by five years and died on 25 January 1855, aged eighty-three.'))+
sec('her works',
p('All from the Grasmere Journal, in William Knight\'s 1897 edition (Project Gutenberg #42856). Read them slowly. She writes like someone describing things to a person she loves who is not in the room.')+
h('The first entry. 14 May 1800, the day William left')+pr('dwa.txt')+
h('The daffodils. 15 April 1802, two years before William\'s poem')+pr('dwb.txt')+
h('The leech gatherer. The old man who became Resolution and Independence')+pr('dwc.txt')+
h('The wedding day. 4 October 1802')+pr('dwd.txt')+
p('The line everyone remembers from the daffodils, "they tossed and reeled and danced," is hers. William\'s version is better known. Hers is wilder.'));
const r=await one(`update ledger.figures set body=$1 where slug=$2 returning slug,ordinal`,[body,"dorothy-wordsworth"]);
console.log(r);process.exit();
