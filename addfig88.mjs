import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(esc).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const pr=(f)=>fs.readFileSync('/tmp/'+f,'utf8').trim().split(/\n\s*\n/).map(x=>p(esc(x.replace(/\s*\n\s*/g,' ')))).join('');
const body=sec('childhood &amp; early life',
p('Orpheus was born in Thrace, the wild northern country the Greeks thought of as half-civilised, to Calliope, the muse of epic poetry, and either the Thracian king Oeagrus or Apollo himself. Depending on who tells it, Apollo gave the boy his first lyre and the Muses taught him to play it. By the time he was grown, the stories say, his singing could make rivers stop, trees pull up their roots to follow him, and stones roll after his feet.'))+
sec('what he did &amp; why he&rsquo;s remembered',
p('He sailed with Jason on the Argo, and when the ship passed the island of the Sirens he played so loudly and so beautifully that the crew never heard their song. That alone would have made him a hero. But he is remembered for one thing: he is the man who walked into the underworld for love and sang the dead into weeping. Later Greeks turned him into a prophet; the Orphic mystery cult claimed his teachings about the soul and the afterlife, and Plato quotes &ldquo;Orphic&rdquo; poems. He is the patron saint of every artist who believes a song might change what is fixed.'))+
sec('family life',
p('His mother was a goddess and he outlived nothing she could protect him from. Some accounts give him a son, Musaeus, also a singer. After his death the Muses gathered the scattered pieces of his body and buried them at the foot of Mount Olympus, where nightingales were said to sing sweeter than anywhere else. His lyre was set in the sky as the constellation Lyra.'))+
sec('romantic life',
p('He married Eurydice, a nymph. Even the wedding went wrong: Hymen, the god of marriage, came without a blessing and his torch only smoked. Soon after, Eurydice stepped on a snake in the grass and died. Orpheus went down through the gate at Taenarum and sang to Hades and Persephone. The Furies cried for the first time. The gods gave her back on one condition, that he not look at her until they reached the light. Almost at the surface, afraid she had fallen behind, he turned. She slipped back into the dark with one faint &ldquo;farewell,&rdquo; and as Ovid writes, she did not blame him, because how could she complain of being loved?'))+
sec('life until death',
p('He sat seven days at the river Styx without eating, and the ferryman would not take him across again. He went up into the mountains of Rhodope and refused all women for three years. The Ciconian women, followers of Dionysus, took it as contempt. They found him singing on a hill and threw spears and stones, which fell harmless at his feet while he played, until their drums and screaming drowned the lyre. Then they tore him apart. His head and lyre floated down the river Hebrus to the sea, still singing, and washed up on Lesbos, the island that would later produce Sappho. His ghost went down, and this time he found Eurydice in the fields of the blessed, and could finally look at her as much as he wanted.'))+
sec('his works',
h('Orpheus left no writing we can trust (the &ldquo;Orphic Hymns&rdquo; were written centuries after any real Orpheus). His life is the work. Here is how Ovid told it, Metamorphoses Book X, lines 1&ndash;63, in H. T. Riley&rsquo;s 1851 translation:')+pr('or1.txt')+
h('His death and the reunion, Metamorphoses Book XI, lines 50&ndash;66:')+pr('or2.txt')+
h('&ldquo;Orpheus with his lute,&rdquo; the song Shakespeare and Fletcher gave to Queen Katherine&rsquo;s maid in Henry VIII (1613):')+poem('or3.txt'));
const ord=88, slug='orpheus', name='Orpheus';
const epithet='Thrace, mythic age \u00b7 the singer who went down into the underworld for love and looked back';
const lifespan='mythic';
const quote='for why should she complain of being beloved?';
const quote_source='Ovid, Metamorphoses X (trans. H. T. Riley, 1851)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 29, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
