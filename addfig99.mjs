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
p('Amy Levy was born on 10 November 1861 in Clapham, south London, into a well-off Jewish family that was thoroughly English. Her father Lewis was a stockbroker, and the household had books, servants and ambition for its daughters. She started writing early, and she was not shy about it: she was publishing poems in magazines as a teenager.')+
p('She went to school in Brighton and Dresden, and in 1879 she went up to Newnham College, Cambridge, one of the first women\'s colleges, becoming the first Jewish woman to study there. She left without finishing a degree, but by then she already had a book in the works.'))+
sec('what she did &amp; why she\'s remembered',
p('At nineteen she published Xantippe and Other Verse (1881). The title poem lets Socrates\' wife, the woman history remembers as a nag, finally speak for herself, and she is bitter, brilliant and trapped in a house with a man who talks to everyone but her. It is a quiet argument against a very old joke.')+
p('She went on to publish a second book of poems, A Minor Poet and Other Verse (1884), and three novels, including The Romance of a Shop (1888), about four sisters who open a photography studio, and Reuben Sachs (1888), a sharp, unsparing portrait of London\'s middle-class Jewish world that some readers found harsh and others found devastatingly true. She also wrote essays and was one of the first people to write about the modern city as a place you could love. She belonged to the circle of the "New Woman": she worked in the British Museum reading room, moved among writers and socialists, and was friends with Olive Schreiner and Clementina Black.'))+
sec('family life',
p('She stayed close to her family, who supported her writing and her travels, and she wrote about their world with love and an outsider\'s eye at once. She was increasingly deaf, which made social life tiring, and she struggled throughout her short life with depression, which she wrote about in her letters and, indirectly, in her poems.'))+
sec('romantic life',
p('Amy never married, and her closest emotional ties were to women. In Florence in 1886 she met the writer Vernon Lee (Violet Paget), and she fell hard. She dedicated poems to her, and the sonnet below remembers a walk on Bellosguardo. Lee was fond of her but kept her at a distance, and Amy\'s feelings were never quite matched. She was also deeply attached to Clementina Black, to whom A London Plane-Tree is dedicated, and several of her poems suggest love for a woman she had lost. Scholars today often read her as one of the earliest openly queer voices in English women\'s writing, though she never put a label on it.'))+
sec('life until death',
p('In the late 1880s she travelled widely, to Florence and the Black Forest, and kept writing at a furious pace. She finished her last book of poems, A London Plane-Tree and Other Verse, and was correcting the proofs when she died. On 10 September 1889, at twenty-seven, she took her own life at her parents\' home in London. Her friends were stunned, and Clementina Black and others wrote about her afterwards. Her book came out after her death.')+
p('Her work was nearly forgotten for a century. It has come back because she wrote about things people are still living through: loneliness in crowds, friendships that are more than friendships, and a city that is somehow both a wound and a home.'))+
sec('her works',
p('Everything below is from A London Plane-Tree and Other Verse (1889), now in the public domain. Start with the plane-tree, a little love song to a city she refused to apologise for, then read the sonnet to Vernon Lee, which says everything about her in its last line.')+
h('A London Plane-Tree')+poem('al1.txt')+
h('London in July')+poem('al2.txt')+
h('London Poets')+poem('al3.txt')+
h('To Vernon Lee')+poem('al5.txt')+
h('In the Mile End Road')+poem('al4.txt')+
h('Contradictions')+poem('al6.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[99,'amy-levy','Amy Levy','the poet who loved London and would not be pitied','1861 – 1889','oct 10, 2026','Cambridge pioneer, giver of voice to Socrates\' wife, and one of the first poets to write the modern city, who died at twenty-seven with a book still in proofs.',body,'Hope unto you, and unto me Despair.','"To Vernon Lee," A London Plane-Tree, 1889']);
console.log(r);process.exit();
