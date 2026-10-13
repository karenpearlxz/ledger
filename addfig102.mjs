import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(l=>esc(l).replace(/^ +/,m=>'&nbsp;'.repeat(m.length))).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;

const d=JSON.parse(fs.readFileSync('/tmp/ec.json','utf8'));
const ch=(k)=>h('Enchiridion, '+k)+bq(esc(d[k]));

const body=sec('childhood &amp; early life',
p('Epictetus was born into slavery around 50 to 60 AD in Hierapolis, in Phrygia, in what is now Turkey. His name is barely a name; epiktetos just means &ldquo;acquired.&rdquo; He ended up in Rome as the slave of Epaphroditus, a freedman who served as secretary to Nero. Ancient writers disagree about his leg. One story says his master twisted it until it broke while Epictetus calmly warned him it would snap. Another says he was simply born lame. Either way, he limped for life, and one of his best-known lines is about exactly that: sickness is an impediment to the body, not to the will.')+
p('His master let him study. He sat in the lectures of Musonius Rufus, the most respected Stoic teacher in Rome, who trained the young slave in philosophy.'))+
sec('what he did &amp; why he\'s remembered',
p('Epictetus built a whole way of living on one cut: some things are up to us, and most things are not. Your opinions, your choices, your desires are yours. Your body, your reputation, other people, and death are not. He taught that suffering mostly comes from confusing the two. Stoicism had been a philosophy for senators and emperors; he made it a practice for ordinary frightened people, and the man who made it was a former slave.')+
p('He wrote nothing himself. One of his students, Arrian, took notes in shorthand and later published them as the Discourses and then boiled them down to the Enchiridion, the &ldquo;handbook.&rdquo; Marcus Aurelius, who was an emperor, leaned on him so heavily that he quotes him throughout the Meditations. Centuries later, a soldier named James Stockdale ejected over Vietnam, spent seven years as a prisoner of war, and said he survived with Epictetus in his head.'))+
sec('family life',
p('Born a slave, he would have known no family in the usual sense. Later he lived in Nicopolis in a small house with almost nothing in it, a bed and a mat and a lamp. Late sources say that in his old age he took in a baby that a friend was going to abandon and raised him, with the help of a woman. That detail is reported rather than certain, but it fits the man who tells his students to remember, when they kiss a child, that they are kissing a mortal.'))+
sec('romantic life',
p('Nothing reliable survives about a love of his own. What we have is what he said about love: you can hold what you love completely and still know it is not yours to keep. He did not mean it as cold. He meant that the people you love are people, not possessions, and that grief hurts most when you secretly believed you were in charge. Read that in the first chapter below, and the one about the cup.'))+
sec('life until death',
p('Once free, he taught in Rome. Around 89 to 93 AD the emperor Domitian expelled the philosophers, and Epictetus moved to Nicopolis in Greece, where he opened a school. Students came from Athens and Rome, and some rich ones came to dodge their duties, and he did not let them. He taught until old age and died around 135 AD. Nothing about him was built to impress anyone; what is left is a small book you can read in an hour.'))+
sec('his works',
p('Everything here is from the Enchiridion in Thomas Wentworth Higginson&rsquo;s English translation, via Project Gutenberg. The numbers are the chapters.')+
ch('I')+ch('II')+ch('III')+ch('V')+ch('VII')+ch('VIII')+ch('IX')+ch('XVII')+ch('XX')+ch('XXVI')+ch('XLVIII'));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug`,
[102,'epictetus','Epictetus','the slave who taught freedom','c. 50 – c. 135 AD','oct 13, 2026','Born a slave and lame, he taught that nobody can take your freedom except you, and that most of what hurts us is how we see things.',body,'Men are disturbed not by things, but by the views which they take of things.','Enchiridion, V (trans. Higginson)']);
console.log(r);process.exit();

