import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;').replace(/\u201c/g,'&ldquo;').replace(/\u201d/g,'&rdquo;').replace(/\u2019/g,'&rsquo;').replace(/\u2018/g,'&lsquo;');
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;
const L=fs.readFileSync('/tmp/ap2.txt','utf8').split('\n');
const rng=(a,b)=>L.slice(a-1,b).join('\n').split(/\n\s*\n/).map(x=>x.replace(/\n/g,' ').trim()).filter(Boolean).map(x=>bq(esc(x))).join('');
const body=sec('childhood &amp; early life',
p('Socrates was born in Athens around 470 BC, in the deme of Alopece. His father Sophroniscus was a stonemason and his mother Phaenarete was a midwife, and Socrates liked to joke that he practised his mother&rsquo;s trade, only on souls: he helped people give birth to ideas and then told them honestly when the child was not worth keeping.')+
p('He probably learned stonecutting first. He grew up as Athens became an empire, saw the Parthenon built, and was an adult when the city fell into its long war with Sparta. Very little else is known for certain about his youth, and most of what we have comes from Plato and Xenophon, who both knew him as an old man.'))+
sec('what he did &amp; why he\'s remembered',
p('Socrates wrote nothing. He is remembered because he walked around the Athenian marketplace asking people what they meant by words like justice, courage, and piety, and because their answers kept falling apart in front of them. He did not teach for money and he did not claim to know. Philosophy before him was mostly about the cosmos; after him it was about how a person should live.')+
p('He also served as a hoplite at Potidaea, Delium, and Amphipolis, and the people who served with him said he endured cold and hunger better than anyone. At Delium he reportedly walked out of the retreat so calmly that pursuers left him alone.'))+
sec('family life',
p('His wife was Xanthippe, who history has treated as a shrew, mostly because of the jokes the later writers wanted to make. She had three sons by him: Lamprocles, Sophroniscus, and Menexenus. When he was an old man with little money and no job, she was the one raising small children. Plato&rsquo;s Phaedo has her crying at the prison on his last morning, holding the youngest child, and Socrates asking that she be taken home.'))+
sec('romantic life',
p('Socrates said that the one subject he truly understood was love. In Plato&rsquo;s Symposium he says he learned it from a priestess named Diotima, who taught him that desire for a beautiful body is only the first step on a ladder that climbs toward beauty itself. The same dialogue has Alcibiades, the brilliant and dangerous young general, drunkenly confessing that he tried to seduce Socrates and was refused, which wounded him more than any rejection.')+
p('Some ancient writers claim he had a second wife named Myrto; historians doubt it.'))+
sec('life until death',
p('In 399 BC, when he was about seventy, three men named Meletus, Anytus, and Lycon charged him with impiety and corrupting the young. Athens was raw from defeat, tyranny, and civil war, and some of his old students, Alcibiades and Critias among them, had been disasters for the city. A jury of 501 citizens found him guilty by a narrow margin, and when asked to propose his own penalty, he first suggested he be given free meals for life, as a public benefactor. Then he offered a small fine. They voted for death.')+
p('The execution was delayed about a month because a sacred ship was away at Delos. His friend Crito arranged an escape and Socrates refused it, arguing that he had lived all his life under Athens&rsquo; laws and could not break them now because they had treated him badly. He spent the last day talking about the soul with his friends, drank the hemlock, walked until his legs grew heavy, and lay down. His last words, in the Phaedo, were to Crito: we owe a cock to Asclepius, so pay it and do not forget.'))+
sec('his works',
p('Socrates left no writing, so these are his words as Plato gave them in the Apology, his defence at the trial, in Benjamin Jowett&rsquo;s public-domain translation from Project Gutenberg. Plato was there, and while he surely polished it, this is the closest we have to the man speaking.')+
h('on the oracle at Delphi')+rng(624,650)+rng(698,716)+
h('on the fear of death')+rng(984,1003)+
h('on being the gadfly')+rng(1054,1072)+
h('on the unexamined life')+rng(1303,1311)+
h('on what death might be')+rng(1396,1451)+
h('the last words of the speech')+rng(1454,1455));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug`,
[104,'socrates','Socrates','the man who wrote nothing and changed everything','c. 470 – 399 BC','oct 15, 2026','An Athenian stonemason&rsquo;s son who asked questions in the marketplace until the city sentenced him to death for it, and who was calm about it.',body,'The hour of departure has arrived, and we go our ways—I to die, and you to live. Which is better God only knows.','Plato, Apology, trans. Jowett']);
console.log(r);process.exit();