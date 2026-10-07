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
p('Edna St. Vincent Millay was born in Rockland, Maine, in February 1892. Her middle name came from St. Vincent\'s Hospital in New York, where staff had saved her uncle\'s life, and the family called her Vincent her whole life. When she was eight her mother, Cora, threw her gambling husband out and divorced him, which was not a thing women did quietly in 1900.')+
p('Cora worked as a traveling nurse and was gone for days at a time, so Vincent raised her two younger sisters, Norma and Kathleen, in a poor rented house in Camden. The kitchen sometimes froze. Cora filled the house with books anyway and told her daughters they could be anything. Vincent was writing poems before she was a teenager.'))+
sec('what she did &amp; why she\'s remembered',
p('At nineteen she sent a long poem called "Renascence" to a contest for an anthology, The Lyric Year. It is about a girl lying on a hill who feels the sky press down on her, dies, is buried, and begs to be let back into the world. It placed only fourth, and people were openly outraged, including the man who won, who said she deserved it more. A wealthy woman named Caroline Dow heard her read it and paid her way to Vassar.')+
p('After college she moved to Greenwich Village and became the most famous poet in America, the girl who wrote about sex and freedom like a man was allowed to. In 1923 she won the Pulitzer Prize for Poetry, the third woman ever to do it. She sold out lecture halls and read her poems in a voice people described as unforgettable.'))+
sec('family life',
p('Her sisters stayed her closest people all her life, and her mother eventually came to live with her. She never had children. The mother who left a bad man and kept going is all over Vincent\'s attitude: love was something you chose, and walked away from when it stopped being worth it.'))+
sec('romantic life',
p('She had a lot of lovers, men and women, and did not apologize. At Vassar she was involved with women; in the Village the critic Edmund Wilson proposed to her and was turned down, and so were several others. She wrote love poems that treat the end of love as ordinary, almost funny, which shocked readers more than the affairs did.')+
p('In 1923 she married Eugen Boissevain, a Dutch importer whose first wife had died. He took care of the money, the house, and her, so she could write, and they agreed the marriage would be open. They bought a farm called Steepletop in upstate New York. In her forties she fell hard for a younger poet, George Dillon, and wrote a sonnet sequence out of it, Fatal Interview. Eugen stayed through all of it.'))+
sec('life until death',
p('In 1936 she was thrown from a car door and badly hurt her back. The pain led to years of morphine and alcohol dependence, which Eugen also struggled with alongside her. Her later political poems for the war effort were not well received, and she knew it. Eugen died in 1949. She lived alone at Steepletop for a year, and in October 1950 she was found dead at the foot of the stairs, aged fifty-eight, with a glass and a bottle of wine beside her and a poem she\'d been working on.'))+
sec('her works',
p('All poems below are from Renascence and Other Poems (1917), Project Gutenberg #109. Start with the title poem. She wrote it at nineteen.')+
h('Renascence')+poem('e1.txt')+
h('God\'s World')+poem('e2.txt')+
h('Afternoon on a Hill')+poem('e3.txt')+
h('Ashes of Life')+poem('e4.txt')+
h('Witch-Wife')+poem('e5.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[96,'edna-st-vincent-millay','Edna St. Vincent Millay','the girl who burned her candle at both ends','1892 – 1950','oct 7, 2026','American poet who raised her sisters in poverty, wrote "Renascence" at nineteen, won the Pulitzer, and loved whoever she wanted without asking permission.',body,'My candle burns at both ends; / It will not last the night; / But ah, my foes, and oh, my friends— / It gives a lovely light!','"First Fig," A Few Figs from Thistles, 1920']);
console.log(r);process.exit();
