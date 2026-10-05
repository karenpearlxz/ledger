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
p('Anne Brontë was born in January 1820 at Thornton, the sixth and last child of Patrick Brontë, an Irish clergyman, and his wife Maria. Before she turned two the family moved to the parsonage at Haworth, a stone house with a graveyard on two sides and the moors on the third, and before she turned two her mother was dead of cancer. Anne never remembered her.')+
p('Her aunt Elizabeth Branwell came to raise the children, and Anne, the baby, slept in her aunt\'s room and absorbed her stern Methodist faith more than any of the others. Then in 1825 the two eldest sisters, Maria and Elizabeth, came home from a brutal charity school and died of tuberculosis weeks apart. The four who were left, Charlotte, Branwell, Emily and Anne, made worlds out of paper. Anne and Emily, inseparable, invented Gondal, an island kingdom of queens, prisons and murders, and wrote it in tiny script for decades.'))+
sec('what she did &amp; why she\'s remembered',
p('Anne is the Brontë people forget, and the one who went out and earned a living. At nineteen she became a governess to the Ingham family, whose children were so violent and spoiled that she was eventually sacked for failing to control them. Then she spent five years with the Robinsons at Thorp Green. She put all of it into Agnes Grey (1847), a quiet, exact, furious book about what it is to be a clever woman treated as furniture.')+
p('Her second novel, The Tenant of Wildfell Hall (1848), was a bomb. Helen Graham leaves her drunken, abusive husband, takes their son, and supports herself as a painter under a false name, which was illegal for a married woman at the time. It outsold Wuthering Heights on release. Critics called it coarse. Anne answered in the preface to the second edition: if she had warned one reckless young man or kept one thoughtless girl from falling into the same trap, the book was not written in vain. It is now read as one of the first sustained feminist novels in English.'))+
sec('family life',
p('Her life was bound to her siblings. Branwell joined her at Thorp Green as a tutor and had an affair with Mrs Robinson, the mistress of the house; Anne resigned in 1845, and he was dismissed soon after and fell apart into drink and opium. Watching him is part of why Wildfell Hall feels so unsparing. In 1846 the sisters published a joint book of poems as Currer, Ellis and Acton Bell. It sold two copies.')+
p('After Anne died, Charlotte stopped Wildfell Hall from being reprinted, writing that its subject was "a mistake." Many readers think Charlotte did her little sister\'s reputation more damage than any critic.'))+
sec('romantic life',
p('Almost nothing is certain. In 1839 a young curate named William Weightman arrived at Haworth, handsome and funny, the kind of man who sent all three sisters valentines when he learned none had ever received one. Some biographers believe Anne loved him. He died of cholera in 1842 at twenty-eight. Several of her poems afterward, including "A Reminiscence," mourn someone lost and buried beneath the church floor, and Weightman was buried in the church at Haworth. She never named him, and she never married.'))+
sec('life until death',
p('Branwell died in September 1848, Emily in December, both of tuberculosis. Anne was diagnosed weeks later. Unlike Emily, who refused every doctor, Anne tried every treatment and asked to see the sea once more. In May 1849 Charlotte and their friend Ellen Nussey took her to Scarborough. She looked out at the water and, on the 28th, sitting in a chair, told Charlotte: "Take courage, Charlotte, take courage." She was twenty-nine. She is the only Brontë not buried at Haworth; she lies in St Mary\'s churchyard in Scarborough, on a cliff above the sea she loved.'))+
sec('her works',
p('All from Poems by Currer, Ellis, and Acton Bell, Project Gutenberg #1019. "Last Lines" was written in January 1849, just after her diagnosis; Charlotte printed it in 1850 with a note: "These lines written, the desk was closed, the pen laid aside, for ever."')+
h('A Reminiscence')+poem('a1.txt')+
h('Lines Composed in a Wood on a Windy Day')+poem('a2.txt')+
h('If This Be All')+poem('a3.txt')+
h('Last Lines (1849)')+poem('a4.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[94,'anne-bronte','Anne Brontë','the forgotten Brontë who wrote the first door-slam','1820 – 1849','oct 5, 2026','Youngest Brontë sister, governess, poet, and author of The Tenant of Wildfell Hall, a novel about a woman leaving her abusive husband that outsold Wuthering Heights.',body,'Take courage, Charlotte, take courage.','her last words, Scarborough, 1849']);
console.log(r);process.exit();
