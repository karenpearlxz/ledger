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
p('Alfred Tennyson was born on 6 August 1809 in Somersby, a tiny Lincolnshire village where his father George was the rector. He was the fourth of twelve children, and the house was not a happy one. George Tennyson had been disinherited in favour of his younger brother, and he never got over it. He drank, he raged, he sank into black depressions, and at times the children were genuinely afraid of him.')+
p('Alfred escaped into words. He was writing verse by eight, filling slates with lines in the style of James Thomson, and by twelve he had written an epic of six thousand lines. When he heard that Byron had died in 1824, the fourteen-year-old walked out alone and carved <em>Byron is dead</em> into a sandstone rock, because it felt as if the whole world had darkened. The family called the dread that ran through them the &ldquo;black blood of the Tennysons,&rdquo; and it followed him his whole life: epilepsy, madness, addiction and melancholy all appeared among his siblings.'))+
sec('what he did &amp; why he\'s remembered',
p('At Trinity College, Cambridge, he was taken into the Apostles, a secret society of brilliant young men, and there he met the person who would shape the rest of his life: Arthur Henry Hallam. Hallam was dazzling, confident, the friend everyone wanted, and he believed Tennyson was a genius before anyone else did.')+
p('His early books were savaged by the critics, and Tennyson, thin-skinned to the bone, went silent for nearly ten years. Then in 1833 Hallam died suddenly in Vienna of a brain haemorrhage, at twenty-two. Tennyson spent the next seventeen years writing short elegies to him, which became <em>In Memoriam A.H.H.</em> (1850), the poem that gave the world &ldquo;&rsquo;Tis better to have loved and lost / Than never to have loved at all&rdquo; and &ldquo;Nature, red in tooth and claw.&rdquo; Queen Victoria, widowed, said it was her comfort next to the Bible. That same year he became Poet Laureate after Wordsworth, and held the post for forty-two years, longer than anyone.')+
p('He wrote <em>The Charge of the Light Brigade</em> within minutes of reading a newspaper report, the Arthurian epic <em>Idylls of the King</em>, and the dark monologue <em>Maud</em>. By the end he was the most famous poet alive, the first ever made a peer for his writing: Baron Tennyson.'))+
sec('family life',
p('The family never shook the curse. His brother Edward was confined to an asylum for nearly sixty years. His brother Septimus suffered crushing depression, Arthur fought alcoholism, and Charles became addicted to opium. Tennyson himself lost his inheritance in a bad investment scheme in the 1840s and fell into a breakdown so deep he went for water-cure treatment. His sister Emily had been engaged to Hallam, which meant his grief had to be shared, and in some ways competed for, inside his own family.'))+
sec('romantic life',
p('He met Emily Sellwood in 1836 and they became engaged around 1838. Then he called it off, because he had no money and, many biographers suspect, because he was terrified of passing on the family darkness. They were kept apart for about ten years. Only after <em>In Memoriam</em> brought money and fame did they finally marry, in June 1850, when he was forty. Emily ran his letters, his business and his moods for the rest of his life. They had two sons, Hallam (named after his friend) and Lionel; a first son was stillborn. Lionel died of fever on the way home from India in 1886, and Tennyson grieved him in verse too.'))+
sec('life until death',
p('He lived between Farringford on the Isle of Wight and Aldworth in Surrey, a tall, shaggy, short-sighted man in a cloak and wide-brimmed hat who hated tourists peering through his hedges. In 1889, crossing the Solent at eighty, he wrote <em>Crossing the Bar</em> in about twenty minutes and told his son it should end every collection of his poems. He died at Aldworth on 6 October 1892 with moonlight on the bed and a volume of Shakespeare open beside him, and was buried in Poets&rsquo; Corner, Westminster Abbey.'))+
sec('his works',
h('Ulysses (1833, published 1842). Written in the weeks after Hallam died. Tennyson said it gave &ldquo;the feeling about the need of going forward, and braving the struggle of life.&rdquo; The old king, home from Troy, refuses to rot.')+poem('ty_uly.txt')+
h('The Lady of Shalott, Part II (1842 text). She may only see the world through a mirror.')+poem('ty_sh2.txt')+
h('The Lady of Shalott, Part IV. She looks at Lancelot directly, the mirror cracks, and the curse comes for her.')+poem('ty_sh4.txt')+
h('Break, Break, Break (1834). Also for Hallam: the world carries on and doesn&rsquo;t care.')+poem('ty_brk.txt')+
h('Crossing the Bar (1889). He asked for this to close every edition of his work.')+poem('ty_bar.txt'));
const ord=86, slug='alfred-lord-tennyson', name='Alfred, Lord Tennyson';
const epithet='Somersby, Lincolnshire, 6 August 1809 \u2013 Aldworth, Surrey, 6 October 1892 \u00b7 the melancholy laureate who spent seventeen years grieving his best friend in verse';
const lifespan='6 August 1809 \u2013 6 October 1892';
const quote='To strive, to seek, to find, and not to yield.';
const quote_source='Alfred Tennyson, Ulysses (1842)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 27, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
