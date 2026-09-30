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
p('William Blake was born on 28 November 1757 above his father\'s hosiery shop at 28 Broad Street, Soho, London. His parents were religious Dissenters, and William never went to regular school; his mother taught him to read at home. At around eight or ten he told his family he had seen a tree on Peckham Rye filled with angels, their wings "bespangling every bough like stars." His father nearly thrashed him for lying. His mother stepped in.')+
p('He drew constantly, so at ten he was sent to Henry Pars\'s drawing school, and at fourteen he was apprenticed to the engraver James Basire. Basire sent the boy to sketch the tombs in Westminster Abbey, and Blake spent years alone with gothic kings and queens carved in stone. He later claimed he saw Christ and the apostles walking in the Abbey aisles.'))+
sec('what he did &amp; why he\'s remembered',
p('Blake was a poet, painter and printmaker who invented his own printing method, "relief etching," so he could publish his poems as hand-coloured books where word and image were one object. Songs of Innocence (1789) and Songs of Experience (1794) were paired as "the two contrary states of the human soul." He saw the same London as everyone else and wrote about child chimney sweeps, church hypocrisy, and "mind-forged manacles."')+
p('He also built an entire private mythology, with gods named Urizen (cold reason), Los (imagination) and Orc (revolution), in long prophetic books like The Marriage of Heaven and Hell, Milton and Jerusalem. Almost nobody bought them. He sold perhaps thirty copies of Songs in his life. Today he is ranked among the greatest English poets, and the hymn "Jerusalem," from the preface to Milton, is practically a second national anthem.'))+
sec('family life',
p('Blake was closest to his younger brother Robert, whom he taught to draw. When Robert died of tuberculosis in 1787, aged nineteen, William nursed him for weeks and said he watched his brother\'s spirit rise through the ceiling "clapping its hands for joy." He then slept for three days straight. He later said Robert\'s ghost showed him the relief-etching technique in a dream. He had no children.'))+
sec('romantic life',
p('In 1781 he was heartbroken after a girl named Polly Wood rejected him. Telling the story to Catherine Boucher, a market gardener\'s daughter, she said she pitied him. "Then I love you for it," he answered. They married in 1782. Catherine signed the register with an X; Blake taught her to read, write, draw, and colour his prints, and she became his working partner at the press for 45 years.')+
p('The marriage was not always gentle. Blake wrote about free love and there were strains, especially early on. But the famous image is of a devoted pair: a friend recalled that when Blake was lost in visions Catherine would sit silently beside him so he would not feel alone, and she said, "I have very little of Mr. Blake\'s company; he is always in Paradise."'))+
sec('life until death',
p('Blake lived mostly poor and was often dismissed as mad. In 1803, at Felpham, he threw a drunken soldier named John Scofield out of his garden; the soldier accused him of saying "Damn the King," and Blake was tried for sedition, which could have meant hanging. He was acquitted. In his last years a small band of young artists who called themselves "the Ancients" gathered around him, and he worked on illustrations for Dante\'s Divine Comedy until the end.')+
p('He died on 12 August 1827. On his deathbed he drew a portrait of Catherine, saying "you have ever been an angel to me," then sang hymns and songs until he stopped. He was buried in an unmarked grave in Bunhill Fields. Catherine said she still talked to him every day, and in 2018 a stone finally marked the spot.'))+
sec('his works',
p('Songs of Innocence and of Experience are meant to be read against each other. The lamb and the tyger ask the same question from opposite ends.')+
h('The Lamb (Songs of Innocence, 1789)')+poem('f_lamb.txt')+
h('The Tyger (Songs of Experience, 1794)')+poem('f_tyger.txt')+
h('The Sick Rose')+poem('f_rose.txt')+
h('London')+poem('f_london.txt')+
h('A Poison Tree')+poem('f_poison.txt')+
h('From Auguries of Innocence')+bq('To see a World in a Grain of Sand<br>And a Heaven in a Wild Flower,<br>Hold Infinity in the palm of your hand<br>And Eternity in an hour.')+
h('From The Marriage of Heaven and Hell (Proverbs of Hell)')+bq('The road of excess leads to the palace of wisdom.<br>Prudence is a rich, ugly old maid courted by Incapacity.<br>The tygers of wrath are wiser than the horses of instruction.<br>If the fool would persist in his folly he would become wise.<br>Expect poison from the standing water.<br>If the doors of perception were cleansed every thing would appear to man as it is, infinite.'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[89,'william-blake','William Blake','the visionary engraver','1757 – 1827','sep 30, 2026','Saw angels in a tree at eight, printed his poems by hand, died poor and called mad, and is now one of the greatest English poets.',body,'If the doors of perception were cleansed every thing would appear to man as it is, infinite.','The Marriage of Heaven and Hell']);
console.log(r);process.exit();
