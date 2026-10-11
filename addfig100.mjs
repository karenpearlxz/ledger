import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(l=>esc(l).replace(/^ +/,m=>'&nbsp;'.repeat(m.length))).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const body=sec('childhood &amp; early life',
p('Walter Whitman was born on 31 May 1819 in West Hills, Long Island, the second of nine children. His father Walter was a carpenter and farmer who kept losing money; his mother Louisa was a Quaker-leaning, practical woman he adored all his life. When he was four the family moved to Brooklyn, then a growing town, and moved house again and again as his father\'s building schemes failed.')+
p('School ended for him at eleven. He went to work as an office boy, then learned the printer\'s trade, and read everything he could find. He taught in country schools in his teens, boarding with the families of his pupils, and hated it. He was a printer and a newspaper man before he was a poet.'))+
sec('what he did &amp; why he\'s remembered',
p('In July 1855 he paid for the first edition of Leaves of Grass, twelve poems with no author\'s name on the title page, only a portrait of a man in work clothes with his hat on. He set some of the type himself. The book had no rhyme, no regular meter, and a speaker who said he contained multitudes and loved the body as much as the soul. It sold almost nothing, and many reviewers were disgusted. Ralph Waldo Emerson wrote him a letter greeting him at the beginning of a great career, and Whitman printed it, without asking, on the spine of the next edition.')+
p('He kept revising that one book for the rest of his life, through nine editions, until it held hundreds of poems. He is remembered as the poet who made American speech a poetic language, who wrote about ordinary workers, soldiers, the poor and the outcast as if they were the heroes, and who treated desire and the body as part of the divine.'))+
sec('family life',
p('The family was not a calm one. His father died in 1855, just after the first Leaves came out. His brother Edward was disabled and needed care all his life, his brother Andrew died of drink and illness, and his sister Hannah was unhappy and difficult. His brother George fought in the Union army and was wounded at Fredericksburg in December 1862; Walt went south to find him, and that trip was the start of his time as a war nurse. His mother Louisa died in May 1873, and he said afterwards that it was the great dividing line of his life.'))+
sec('romantic life',
p('Whitman never married. His poems celebrate what he called the love of comrades, and his private notebooks and letters point strongly toward his love being for men, though in 1890 he claimed in a letter to have fathered six children, a claim historians have never been able to confirm, and he never described his private life plainly. In New York in the 1850s he spent time among young working men. In Washington during the war he met Peter Doyle, a streetcar conductor and former Confederate soldier, in 1865. They were close for years; Doyle later said they were together from the first night, and the letters they exchanged are intimate and affectionate.')+
p('He also loved passionately in the city\'s rougher places, like the Pfaff\'s Cellar bohemian crowd, and he wrote poems about that attachment, including the two short ones below, which come from the Calamus section of Leaves of Grass.'))+
sec('life until death',
p('When the Civil War began he first reported for papers, then in December 1862 went to Washington and spent three years visiting wounded soldiers in the army hospitals. He brought them fruit, writing paper, stamps and conversation, and he sat with the dying. He estimated he visited some eighty to a hundred thousand men. He wrote about them in Drum-Taps and in the prose of Specimen Days. When Lincoln was assassinated in April 1865, he wrote the elegies When Lilacs Last in the Dooryard Bloom\'d and O Captain! My Captain!, the second of which became his most popular poem, though he later grew tired of it.')+
p('He lost a clerkship at the Department of the Interior in 1865 when the Secretary read Leaves of Grass and called it indecent. A friend, William O\'Connor, wrote a fierce pamphlet defending him as \'The Good Gray Poet\'. In 1873 he had a stroke and moved to Camden, New Jersey, where he lived on small gifts from friends, in a house crammed with papers. He kept writing and talking with visitors; a young disciple, Horace Traubel, recorded his conversations in the last years. He died on 26 March 1892, aged 72, and is buried in a tomb he designed himself, in Harleigh Cemetery in Camden.'))+
sec('his works',
p('All of these are from Leaves of Grass, public domain, in the form of the final edition. Some of them are among the most famous short poems in American writing. Start with the astronomer and the spider, then read the two Calamus poems about love and loneliness, and the one that is his Lincoln lament.')+
h('When I Heard the Learn\'d Astronomer')+poem('w2.txt')+
h('A Noiseless Patient Spider')+poem('w3.txt')+
h('I Hear America Singing')+poem('w1.txt')+
h('I Saw in Louisiana a Live-Oak Growing')+poem('w4.txt')+
h('To a Stranger')+poem('w5.txt')+
h('When I Heard at the Close of the Day')+poem('w9.txt')+
h('I Dream\'d in a Dream')+poem('w10.txt')+
h('I Sit and Look Out')+poem('w6.txt')+
h('A Clear Midnight')+poem('w7.txt')+
h('O Captain! My Captain!')+poem('w8.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[100,'walt-whitman','Walt Whitman','the poet who sat with the dying and sang the body','1819 – 1892','oct 11, 2026','Printer, journalist and Civil War nurse who self-published one book and spent his life rewriting it, giving American poetry its own voice.',body,'Look\'d up in perfect silence at the stars.','"When I Heard the Learn\'d Astronomer," Leaves of Grass']);
console.log(r);process.exit();
