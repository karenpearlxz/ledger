import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';
const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(l=>esc(l).replace(/^ +/,m=>'&nbsp;'.repeat(m.length))).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;

const d=JSON.parse(fs.readFileSync('/tmp/sn.json','utf8'));
const q=(s)=>bq(esc(s.replace(/_/g,'')).replace(/\u201c/g,'&ldquo;').replace(/\u201d/g,'&rdquo;').replace(/\u2019/g,'&rsquo;'));
const body=sec('childhood &amp; early life',
p('Seneca was born in Cordoba, in Spain, a few years before the turn of the era, into a wealthy family of the equestrian class. His father, Seneca the Elder, was a famous teacher of rhetoric, and the family moved to Rome while Lucius was still a baby. He grew up with two brothers, Novatus and Mela; Mela would become the father of the poet Lucan. His mother was Helvia, a woman of excellent qualities, as the old biography puts it.')+
p('His father pushed him toward rhetoric and the law. His own temperament pulled him toward philosophy, and he sat at the feet of teachers like Attalus, Sotion, and Papirius Fabianus, and admired the Cynic Demetrius so much that they sometimes travelled together. He was sickly as a young man, and he later said that philosophy kept him from ending his own life, because he could not bear to leave his father with that grief.')+
p('He did the law anyway. He became a quaestor, a senator, a man people noticed.'))+
sec('what he did &amp; why he\'s remembered',
p('Seneca is the Stoic who lived in the middle of power. Epictetus was a slave and Marcus Aurelius an emperor, but Seneca was a rich adviser who spent his whole career trying to stay decent next to a monster. He wrote moral letters, essays on anger and on the shortness of life, and tragedies that later fed Shakespeare. Among Romans he was a stylist; among later readers he is the one who writes like a friend giving you a straight answer.')+
p('He was also a hypocrite and knew it. Critics then and now point out that a man who wrote in praise of poverty held an enormous fortune, villas, and estates, much of it a gift from Nero, and that he lent money at ruinous interest in Britain. He answers the charge in his own work, saying he is not wise, only trying to be better than he was yesterday. I like him more for that than I would for a spotless saint.'))+
sec('family life',
p('His family tied him to the court. His nephew Lucan became a poet at Nero&rsquo;s side and later died in the same conspiracy that took Seneca. His brother Novatus was adopted and became Junius Gallio, and Seneca dedicated his work on anger to him. The brother was also the proconsul of Achaia who dismissed the charges against St. Paul in the Book of Acts.')+
p('He had a son, Marcus, from his first marriage, and the boy died young. Seneca&rsquo;s letter to his mother Helvia, written from exile, is partly about grief, and the letter to his friend Polybius, who lost a brother, is one of the odder consolations you will ever read. He knew loss before most of the people he consoled.'))+
sec('romantic life',
p('His first wife is not named in the old accounts. His second, Pompeia Paulina, is the one he speaks of &ldquo;with great passion,&rdquo; in the words of the Lestrange biography. She was much younger than he was, and he wrote that her comfort and his had become so wrapped together that taking care of her was how he took care of himself. When he said that he asked her to take less care of him, he meant it, and he also wrote that she prevailed on him to take more care of himself. It is some of the warmest writing in Stoicism.'))+
sec('life until death',
p('In 41 AD, the emperor Claudius exiled him to Corsica after Messalina accused him of an affair with Julia, the daughter of Germanicus. He spent about eight years there, writing consolations and probably brooding. Agrippina brought him back in 49 to tutor her son, a boy named Nero, who became emperor at sixteen.')+
p('For the first five years or so, Seneca and the soldier Burrus more or less ran the empire, and it went reasonably well. Tacitus says they steered the young prince toward virtue by allowing him lawful pleasures. It did not last. Nero murdered his brother and his mother, and Seneca wrote the senate the justification for the matricide, which is the stain on him that never washes out. He tried to retire and give back his wealth, and Nero would not take it.')+
p('In 65, a conspiracy against Nero came to light, led by Piso. Nothing proves Seneca joined it, but Nero had wanted him dead for a while. A tribune arrived at his villa while he was eating supper with Paulina and two friends and told him he was condemned. Seneca asked for his will, was refused, and told his friends that since he could not repay them, he would leave them the one thing he still had, the pattern of his life. Paulina insisted on dying with him. They opened their veins together. He was old and thin from his diet, so the blood came slowly; he cut his legs, drank hemlock that did not work, and was finally carried into a hot bath where he suffocated in the steam. As he went in, he sprinkled water on the servants beside him and said it was an offering to Jupiter the Liberator. Nero ordered Paulina&rsquo;s wounds bound, and she lived some years more, so pale that everyone could see how much she had lost.'))+
sec('his works',
p('Everything below is from the seventeenth-century English translation by Sir Roger L&rsquo;Estrange, on Project Gutenberg. It is a loose and lively version, closer to a paraphrase than a literal rendering, and it keeps Seneca&rsquo;s ideas but is sometimes more cheerful than the Latin. I have kept the passages as printed.')+
h('Of a Happy Life, on how we waste time')+q(d.time[0])+
h('Of a Happy Life, on fear')+q(d.fear[0])+
h('Of a Happy Life, on friendship')+q(d.friend[0])+q(d.friend[1])+
q('Paulina\u2019s good and mine (says our author) were so wrapped up together, that in consulting her comfort I provided for my own; and when I could not prevail upon her to take less care for me, she prevailed upon me to take more care for myself.')+
h('Of a Happy Life, on death')+q(d.death[0])+q(d.death[1])+
h('On the nightly review of the day, as reported in his life')+q(d.candle));
const r=await one(`insert into ledger.figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning slug`,
[103,'seneca','Seneca','the Stoic who lived next to a tyrant','c. 4 BC – 65 AD','oct 14, 2026','A rich Roman adviser who tried to stay decent beside Nero, wrote some of the most readable philosophy ever, and was ordered to die by the boy he had taught.',body,'We have rather made our life short than found it so.','Of a Happy Life, trans. L\u2019Estrange']);
console.log(r);process.exit();
