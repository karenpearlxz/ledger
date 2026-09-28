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
p('George Gordon Byron was born in London on 22 January 1788 with a deformed right foot that he would limp on, and resent, for the rest of his life. His father, &ldquo;Mad Jack&rdquo; Byron, had burned through two wives&rsquo; fortunes and fled to France, where he died when George was three. His mother Catherine raised him in cramped rooms in Aberdeen, alternately smothering him and screaming at him, once calling him &ldquo;a lame brat.&rdquo; A Calvinist nurse, May Gray, taught him scripture and, as he later hinted, abused him. At ten, a great-uncle died and the boy became the sixth Baron Byron, inheriting the crumbling, haunted Newstead Abbey.'))+
sec('what he did &amp; why he&rsquo;s remembered',
p('After Harrow and Cambridge (where he kept a tame bear because dogs were banned), he toured Portugal, Spain, Greece and Albania. In 1812 he published the first cantos of <em>Childe Harold&rsquo;s Pilgrimage</em> and, in his own words, &ldquo;awoke one morning and found myself famous.&rdquo; He gave the world the Byronic hero: brooding, proud, guilty of some unnamed sin, magnetic and doomed. Lady Caroline Lamb summed him up as &ldquo;mad, bad, and dangerous to know.&rdquo; His comic epic <em>Don Juan</em> is still one of the funniest long poems in English. He died trying to free Greece, and Greeks still name streets after him.'))+
sec('family life',
p('His closest bond was with his half-sister Augusta Leigh, whom he barely knew as a child and met properly as an adult. Society whispered that they were lovers, and her daughter Medora was rumoured to be his. In 1815 he married the mathematically brilliant Annabella Milbanke, whom he called his &ldquo;Princess of Parallelograms.&rdquo; Their daughter Ada was born that December. A month later Annabella left, taking Ada, and Byron never saw either again. Ada grew up to be Ada Lovelace, who wrote the first computer program. He also had a daughter, Allegra, with Claire Clairmont (Mary Shelley&rsquo;s stepsister); he placed her in a convent, where she died of fever at five.'))+
sec('romantic life',
p('He loved everyone and was faithful to no one: Caroline Lamb, who sent him a lock of her pubic hair and later stabbed herself at a ball; Lady Oxford; choirboy John Edleston at Cambridge, whose death wrecked him; countless women in Venice. His last real love was Teresa Guiccioli, a nineteen-year-old countess married to a man three times her age, with whom he settled into something close to domestic calm in Ravenna. Under the scandal was a man who wrote, &ldquo;The great object of life is sensation, to feel that we exist, even though in pain.&rdquo;'))+
sec('life until death',
p('The separation scandal of 1816 made him a pariah, and he left England forever. That summer at Villa Diodati on Lake Geneva, with Percy and Mary Shelley, he proposed the ghost-story contest that produced <em>Frankenstein</em>. He moved through Venice, Ravenna, Pisa and Genoa. In 1823 he sailed to Greece and poured his own money into the war of independence against the Ottomans, paying for a fleet and commanding a brigade at Missolonghi. He caught a fever before seeing battle, and his doctors bled him until he died on 19 April 1824, aged thirty-six. Greece declared three weeks of mourning. Westminster Abbey refused to bury him; they gave him a memorial only in 1969.'))+
sec('his works',
h('She Walks in Beauty (1814). Written the morning after he saw his cousin&rsquo;s widow, Mrs Wilmot, at a party in black mourning dress spangled with jet.')+poem('by_sw.txt')+
h('When We Two Parted (1815, published 1816). He claimed it was dated 1808 to hide who it was about: Lady Frances Wedderburn Webster.')+poem('by_wt.txt')+
h('So, We&rsquo;ll Go No More a Roving (1817). Sent in a letter to Thomas Moore after the Venice carnival wore him out. He was twenty-nine.')+poem('by_go.txt')+
h('From his journal, 1813')+bq('&ldquo;The great object of life is sensation&mdash;to feel that we exist, even though in pain. It is this &lsquo;craving void&rsquo; which drives us to gaming&mdash;to battle&mdash;to travel&mdash;to intemperate, but keenly felt pursuits of every description.&rdquo; (letter to Annabella Milbanke, 1813)'));
const ord=87, slug='lord-byron', name='George Gordon, Lord Byron';
const epithet='London, 22 January 1788 \u2013 Missolonghi, Greece, 19 April 1824 \u00b7 mad, bad and dangerous to know; the poet who died for Greece';
const lifespan='22 January 1788 \u2013 19 April 1824';
const quote='She walks in Beauty, like the night / Of cloudless climes and starry skies';
const quote_source='Lord Byron, She Walks in Beauty (1814)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 28, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
