import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const D=JSON.parse(fs.readFileSync('/tmp/dn.json','utf8'));
const poem=(k)=>{let t=D[k].split('\n').filter(l=>!/^_.*_$/.test(l.trim())).map(l=>l.trim()===''?'':l).join('\n').trim();
 return bq(t.split('\n').map(l=>esc(l).replace(/^( +)/,m=>'&nbsp;'.repeat(m.length))).join('<br>'));};
const body=sec('childhood &amp; early life',
p('John Donne was born in London in 1572 into the wrong religion. His family was Catholic at a time when that could get you fined, jailed or killed. His mother, Elizabeth, was descended from the family of Thomas More, who had been beheaded for refusing to renounce the Pope. His uncle Jasper Heywood was a Jesuit sent to run the English mission in secret. His father, an ironmonger, died when John was about four, and his mother remarried quickly.')+
p('He went to Oxford at around eleven and could not take a degree there, because that required swearing an oath of Protestant supremacy. He later studied law at Lincoln&rsquo;s Inn. In 1593 his younger brother Henry was arrested for sheltering a Catholic priest and died of plague in Newgate prison. Donne himself had seen exactly how far the state would go, and it shaped everything he wrote about faith, doubt and fear.'))+
sec('what he did &amp; why he&rsquo;s remembered',
p('Donne is the great poet of the &ldquo;metaphysical&rdquo; school, which means he argues. His poems open mid-sentence, mid-quarrel, mid-bed, and they pull in compasses, fleas, maps and alchemy to make a case about love or death. Almost no one before him had written desire and theology in the same voice, because for Donne they were the same subject, how to be completely given over to something larger than yourself.')+
p('He is also the author of one of the most quoted sentences in English prose, from his <i>Devotions</i>: &ldquo;No man is an island&rdquo; and &ldquo;never send to know for whom the bell tolls; it tolls for thee.&rdquo;'))+
sec('family life',
p('After his father died, his mother married a doctor named John Syminges, who also died, and she lived long enough to see her son turn Protestant, which she must have felt as a loss. Donne married Anne More in 1601 and they had twelve children in sixteen years. Five did not survive childhood, and his daughter Lucy died in 1627 at eighteen. He wrote from inside that grief for most of his life, not as a pose.'))+
sec('romantic life',
p('As a young man he was a known rake, the kind who wrote the bitter, funny, sexual verses, and who sailed with the Earl of Essex to Cadiz and the Azores for adventure. Then he became secretary to Sir Thomas Egerton, a powerful official, and fell for Egerton&rsquo;s young niece Anne More, who was about seventeen. They married in secret in 1601. When her father, Sir George More, found out, he had Donne fired and briefly thrown in the Fleet prison. Donne wrote to him a short letter in terror. The marriage was legally upheld and the families eventually made peace, but for years he had no position and no money, and the couple lived on friends&rsquo; charity. A joke attributed to him from this period: &ldquo;John Donne, Anne Donne, Un-done.&rdquo; Whether he really wrote it or not, it was true.')+
p('The love he wrote to Anne is real in a way the earlier poems were not. &ldquo;A Valediction: Forbidding Mourning&rdquo; is traditionally thought to have been written for her before he left on a trip to the Continent.'))+
sec('life until death',
p('For years he refused the Church. King James I would not give him a secular job and told him bluntly that he would only be rewarded if he took holy orders. In 1615 he did, and he became one of the most famous preachers in England, and in 1621 Dean of St Paul&rsquo;s. Anne died in 1617 giving birth to their twelfth child, a stillbirth, and he never remarried. Her death is where the dark, desperate Holy Sonnets begin to read as personal.')+
p('In 1623 he nearly died of a fever and wrote the <i>Devotions</i> while sick, listening to the church bell ring for other people. In his last weeks in 1631, he stood in his shroud on an urn while an artist sketched him, then kept the drawing by his bed so he would be looking at his own death while he dressed. He died on 31 March 1631. His poems, which he had hardly allowed to be printed, were published two years later.'))+
sec('his works',
p('These come from the Grierson edition of his poems (Project Gutenberg ebook 48688) in his original seventeenth-century spelling, which I have left alone. The first four are the love poems, from the playful to the devoted. The last four are the ones about God and death.')+
h('The Good-Morrow')+poem('gm')+
h('The Sun Rising')+poem('sun')+
h('Song (Go and catch a falling star)')+poem('song')+
h('The Flea')+poem('flea')+
h('The Canonization')+poem('can')+
h('A Valediction: Forbidding Mourning')+poem('val')+
h('Holy Sonnet X (Death be not proud)')+poem('death')+
h('Holy Sonnet XIV (Batter my heart)')+poem('batter')+
h('Hymn to God my God, in my sickness')+poem('sick')+
h('A Hymn to God the Father')+poem('father'));
const r=await one('insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug',
[108,'john-donne','John Donne','the poet who argued with God and with love','1572 - 1631','oct 19, 2026','A Catholic-born rake turned Dean of St Paul&rsquo;s who wrote desire, grief and faith as one argument.',body,'Death, thou shalt die.','Holy Sonnet X']);
console.log(r);process.exit();