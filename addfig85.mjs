import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(esc).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const body =
sec('childhood &amp; early life',
 p('Percy Bysshe Shelley was born on 4 August 1792 at Field Place in Sussex, the eldest son of a Whig MP and heir to a baronetcy and a fortune. He was the golden boy of a house full of younger sisters, whom he entertained with stories of a Great Old Snake in the garden and chemistry experiments that occasionally set things on fire.')+
 p('At Eton he was small, pretty, and would not fag for older boys, so they hunted him. They called him &ldquo;Mad Shelley,&rdquo; surrounded him in the yard and tugged at his clothes until he screamed. He fought back with books: he read about electricity, alchemy, ghosts, and radical politics, and swore privately to be wise and just and free. At eighteen he had published two gothic novels.')+
 p('He went up to Oxford in 1810 and lasted less than a year. With his friend Thomas Jefferson Hogg he printed a pamphlet called <em>The Necessity of Atheism</em> and mailed it to bishops. When the college asked if he wrote it, he refused to answer and was expelled. His father told him to apologise or be cut off. He chose to be cut off.')
)+
sec('what he did &amp; why he\u2019s remembered',
 p('Shelley is one of the great Romantic poets and the most politically dangerous of them. He believed poetry could change the world, and wrote that &ldquo;poets are the unacknowledged legislators of the world.&rdquo; He argued for atheism, vegetarianism, free love, and the overthrow of tyranny, at a time when those ideas could get your books seized and your children taken.')+
 p('After the Peterloo Massacre of 1819, when cavalry charged a peaceful crowd in Manchester, he wrote <em>The Masque of Anarchy</em>, with its famous call: &ldquo;Ye are many, they are few.&rdquo; No one dared publish it until he had been dead ten years. Gandhi later quoted it. His sonnet &ldquo;Ozymandias,&rdquo; about a shattered statue of a king in the desert, is still the cleanest poem ever written about how power ends.')+
 p('In his lifetime he sold almost nothing and was known mainly as a scandal. He did not live to see himself famous.')
)+
sec('family life',
 p('His father never forgave him. The expulsion, then the elopements, then the atheism made Shelley an outcast from Field Place; his sisters were kept from him. He lived off debts and advances against an inheritance he would never collect, forever moving to dodge creditors.')+
 p('His children were his heaviest grief. After his first wife died, the Court of Chancery ruled he was morally unfit to raise his two children by her, Ianthe and Charles, because of his beliefs, and gave them to strangers. With Mary he lost a premature daughter, then Clara at one year old in Venice, then William, three and a half, of fever in Rome in 1819. Only Percy Florence survived. Mary sank into a depression so deep it walled her off from him for months.')
)+
sec('romantic life',
 p('At nineteen he eloped to Scotland with Harriet Westbrook, a sixteen-year-old schoolgirl who told him she was being bullied at home. He married her largely to rescue her, and three years later he had fallen for someone else.')+
 p('That someone was Mary Godwin, sixteen, daughter of his idol the philosopher William Godwin and of Mary Wollstonecraft. They declared their love at her mother&rsquo;s grave in St Pancras churchyard. In July 1814 they ran away to the Continent, taking Mary&rsquo;s stepsister Claire Clairmont along. Harriet, abandoned and pregnant, drowned herself in the Serpentine in 1816. Shelley married Mary three weeks after the body was found.')+
 p('That same summer, at the Villa Diodati on Lake Geneva with Lord Byron, a ghost-story contest produced Mary&rsquo;s <em>Frankenstein</em>. Shelley adored her, edited her, and also kept falling in love with other women: a convent-trapped Italian girl named Emilia Viviani, and later Jane Williams, to whom he wrote some of his most tender lyrics. He believed love multiplied rather than divided. Mary, who paid for that belief, was less sure.')
)+
sec('life until death',
 p('In 1818 the Shelleys left England for Italy for good: Venice, Naples, Rome, Pisa, then a lonely white house called Casa Magni on the Bay of Lerici. In those four years he wrote nearly everything he is remembered for, <em>Prometheus Unbound</em>, the <em>Ode to the West Wind</em>, &ldquo;To a Skylark,&rdquo; <em>Adonais</em> (his elegy for Keats), <em>Epipsychidion</em>.')+
 p('On 8 July 1822 he sailed his new boat, the <em>Don Juan</em>, from Livorno back to Lerici with his friend Edward Williams and a boy named Charles Vivian. A storm hit. The boat went down. He could not swim, and had once said he would rather sink than be saved.')+
 p('His body washed up ten days later near Viareggio, the face eaten away, identified by a volume of Keats in his jacket pocket, folded back as if hastily put away. By quarantine law it had to be burned on the beach. Byron, Leigh Hunt and Edward Trelawny watched the pyre; Trelawny said the heart would not burn, and pulled it from the fire. Mary kept what remained of it wrapped in silk, in her desk, for the rest of her life. It was found after her death, folded in a copy of <em>Adonais</em>. Shelley was twenty-nine.')
)+
sec('their works',
 h('Ozymandias (1818) &mdash; written in a friendly contest with Horace Smith. Fourteen lines on every empire that ever thought it would last.')+poem('oz.txt')+
 h('Ode to the West Wind (1819) &mdash; written in a wood by the Arno outside Florence, weeks before William died. Listen to the part where he begs to be carried off: &ldquo;I fall upon the thorns of life! I bleed!&rdquo;')+poem('ww.txt')+
 h('Love&rsquo;s Philosophy (1819) &mdash; the whole of nature as an argument for a kiss. Very Shelley.')+poem('lp.txt')+
 h('To &mdash; (&ldquo;Music, when soft voices die&rdquo;) &mdash; found among his papers after he drowned.')+poem('mu.txt')+
 h('To &mdash; (&ldquo;One word is too often profaned&rdquo;) &mdash; probably for Jane Williams. &ldquo;The desire of the moth for the star&rdquo; is his.')+poem('ow.txt')+
 h('From <em>A Defence of Poetry</em> (1821)')+bq('&ldquo;Poetry is the record of the best and happiest moments of the happiest and best minds... Poetry lifts the veil from the hidden beauty of the world, and makes familiar objects be as if they were not familiar... Poets are the unacknowledged legislators of the World.&rdquo;')+
 h('From <em>The Masque of Anarchy</em> (1819)')+bq('Rise like Lions after slumber<br>In unvanquishable number&mdash;<br>Shake your chains to earth like dew<br>Which in sleep had fallen on you&mdash;<br>Ye are many&mdash;they are few.')
);
const ord=85, slug='percy-bysshe-shelley', name='Percy Bysshe Shelley';
const epithet='Field Place, Sussex, 4 August 1792 \u2013 Gulf of La Spezia, 8 July 1822 \u00b7 the expelled atheist who wrote Ozymandias, eloped with Mary Godwin, and drowned at twenty-nine';
const lifespan='4 August 1792 \u2013 8 July 1822';
const quote='Poets are the unacknowledged legislators of the World.';
const quote_source='Percy Bysshe Shelley, A Defence of Poetry (1821)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 26, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
