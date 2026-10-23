import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const P=JSON.parse(fs.readFileSync('/tmp/medusa.json','utf8'));
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(t)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${t}</blockquote>`;
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const body=
sec('childhood &amp; early life',
p('Medusa did not start as a monster. In the oldest version we have, Hesiod lists her as one of three Gorgon sisters, daughters of the sea-gods Phorcys and Ceto, who lived out past the western edge of the world, in the land toward Night. Her two sisters, Sthenno and Euryale, were immortal. Medusa was the only one who could die, and Hesiod gives her one strange, sad phrase, that she &ldquo;suffered a woeful fate.&rdquo; That is all he says about what happened to her.')+
p('Ovid, writing about 700 years later, fills in the missing years. In his telling she was the most famous beauty of her time, courted by many men, and the best thing about her was her hair. He says people he had met claimed to have seen it.'))+
sec('what she did &amp; why she is remembered',
p('She is remembered as the face you cannot look at. Anyone who met her eyes turned to stone, so heroes had to approach her backwards, using a polished shield as a mirror. The Greeks put her face on shields, temple pediments and the aegis of Athena, as a thing that protects by terrifying. Modern readers keep coming back to her because the story has two halves that do not fit together. The myth says monster, and the oldest poets say mortal woman, and Ovid says victim.'))+
sec('family life',
p('Her parents were Phorcys and Ceto, old sea powers who also produced the Graeae, three grey sisters sharing a single eye and a single tooth, and the sea-monsters of Greek myth. Her sisters Sthenno and Euryale chased Perseus after he killed her, which is the only moment in the myths where they act for her. After her death two children sprang from her severed neck, the winged horse Pegasus and the giant Chrysaor, whose son was the three-headed Geryon, killed later by Heracles. Hesiod says their father was the Dark-haired One, which is Poseidon.'))+
sec('romantic life',
p('Her only love story is the one that ruined her. Hesiod says she lay with Poseidon in a soft meadow among spring flowers. Ovid is plainer about what happened and where. Poseidon violated her in Athena&rsquo;s temple, and Athena, unable to look, covered her eyes with her shield. The goddess did not punish him. She changed Medusa&rsquo;s hair into snakes, the thing she had been loved for, and made her face a weapon. Later writers argued about whether this was cruelty or protection. Either way she was punished for being attacked, and then hunted for the punishment.'))+
sec('life until death',
p('Perseus was sent to bring back her head by a king who wanted him dead. Athena and Hermes armed him with winged sandals, a curved blade, a cap that made him invisible, and a bag to carry the head in. He stole the single eye from the Graeae so they would tell him where she was, found her asleep, and cut off her head while looking only at her reflection. Even afterwards the head kept its power. He used it to turn the sea monster, then Atlas, then a roomful of enemies to stone, and in the end he gave it to Athena, who wears it on her shield.'))+
sec('their works',
p('Medusa wrote nothing, so what survives is what other people said about her. These are the oldest accounts, Hesiod in the Evelyn-White prose translation and Ovid in Riley&rsquo;s, both public domain.')+
h('Hesiod, Theogony, on the Gorgons (c. 700 BC)')+bq(P.hes1)+
h('Hesiod, Shield of Heracles, the Gorgons chasing Perseus')+bq(P.hes2)+
h('Ovid, Metamorphoses IV, Perseus tells how he killed her')+bq(P.tell)+
h('Ovid, Metamorphoses IV, why her hair became snakes')+bq(P.why)+
h('Ovid, Metamorphoses IV, what the head did after her death')+bq(P.coral));
const r=await one('insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal',
[109,'medusa','Medusa','the mortal Gorgon, punished for what was done to her','mythic, Greek','oct 20, 2026','The only mortal Gorgon: a woman violated in a temple, cursed for it, then hunted for the curse.',body,'The sovereign of the sea is said to have deflowered her in the Temple of Minerva. The daughter of Jove turned away, and covered her chaste eyes with her shield.','Ovid, Metamorphoses IV (Riley tr.)']);
console.log(r);process.exit();