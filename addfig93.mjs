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
p('Thomas Hardy was born in 1840 in a thatched cottage at Higher Bockhampton in Dorset, and he was very nearly not born at all. The doctor took one look at the limp, silent baby, declared him dead, and set him aside to attend to his mother. A nurse noticed he was breathing. He spent the rest of his long life with the faint sense that existence was an accident the universe had not quite meant to allow.')+
p('His father was a stonemason who played the fiddle at village dances; his mother Jemima, who had grown up in real poverty, was a ferocious reader who pushed him toward books. He was small and frail, kept home from school until he was eight, and absorbed everything: the folk songs, the ghost stories, the hangings. At sixteen he watched a woman named Martha Brown hanged in Dorchester for killing her abusive husband, and never forgot how her dress clung to her in the rain. Decades later she became Tess.'))+
sec('what he did &amp; why he\'s remembered',
p('He trained as an architect and spent his twenties restoring churches, which he later admitted meant destroying a good deal of medieval work. What he wanted was to be a poet, but nobody bought poems, so he wrote novels. Far from the Madding Crowd made him famous in 1874. Then came The Return of the Native, The Mayor of Casterbridge, Tess of the d\'Urbervilles and Jude the Obscure, all set in a half-imagined Wessex where decent people are ground down by chance, class and their own hearts.')+
p('Tess was attacked for calling a "fallen" woman pure. Jude was so savaged (one bishop reportedly burned it) that Hardy quit fiction entirely in 1895 at fifty-five and went back to poetry. He wrote over nine hundred poems in the next thirty years, and many people now think the poems are the greater achievement.'))+
sec('family life',
p('He stayed close to his mother all his life and was deeply shaped by her bleak, watchful view of fate. He had no children. His siblings Henry, Mary and Kate never married either, and the family has been described as quietly inward-looking, almost a closed circle.'))+
sec('romantic life',
p('In 1870 he went to Cornwall to restore a church at St Juliot and met the rector\'s sister-in-law, Emma Gifford, who rode her horse wildly along the cliffs with her hair loose. They married in 1874. Over the years the marriage curdled into silence; by the end Emma lived in the attic rooms of their house, Max Gate, writing bitter private notes about him, and they barely spoke.')+
p('Then in November 1912 Emma died suddenly. Hardy was flattened, not by loss of the wife upstairs but by memory of the girl on the cliffs. He went back to Cornwall and wrote the Poems of 1912-13, some of the most haunting grief poems in English, full of guilt for what he let die while she was alive. In 1914 he married his secretary Florence Dugdale, nearly forty years younger, who then had to live in a house where her husband was writing love poems to his dead wife.'))+
sec('life until death',
p('He lived to eighty-seven, famous and honoured, still writing. He died at Max Gate in January 1928. The nation wanted him in Westminster Abbey; he had wanted to lie at Stinsford with his family and Emma. The compromise was macabre and very Hardy: his heart was removed and buried at Stinsford, and the rest of him was cremated and placed in Poets\' Corner. Local legend says the family cat ate part of the heart before burial.'))+
sec('his works',
p('From Satires of Circumstance (1914), Project Gutenberg #2863. The first was written months before the First World War, imagining the dead woken by naval gunnery. The second is about the Titanic, and the third is for Emma.')+
h('Channel Firing (April 1914)')+poem('ha.txt')+
h('The Convergence of the Twain (lines on the loss of the Titanic)')+poem('hb.txt')+
h('The Voice (December 1912)')+poem('hc.txt'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug,ordinal`,
[93,'thomas-hardy','Thomas Hardy','the man who wrote to his dead wife','1840 – 1928','oct 4, 2026','Declared dead at birth, he grew up to write Tess and Jude, quit novels after the outrage, and spent his last decades writing poems of guilt and longing to the wife he had stopped speaking to.',body,'Woman much missed, how you call to me, call to me','The Voice']);
console.log(r);process.exit();
