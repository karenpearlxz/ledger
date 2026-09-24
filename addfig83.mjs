import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(esc).join('<br>'));
const h=(t)=>`<p style="margin-top:22px;font-style:italic;color:var(--teal)">${t}</p>`;

const body =
sec('childhood &amp; early life',
 p('<strong>Robert Browning</strong> was born on 7 May 1812 in Camberwell, then a leafy village just south of London. His father was a clerk at the Bank of England who had quietly spent his money on books &mdash; somewhere around six thousand of them &mdash; and the boy was let loose in that library with almost no supervision. He read the whole of a biographical dictionary for fun. He learned Latin, Greek, French and Italian mostly at home, because formal school bored him and he left the University of London after a single term.')+
 p('What he took from that childhood was a strange appetite: not for heroes, but for the odd corners of history, the minor painters, the forgotten monks, the obscure dukes. He wanted to know what went on inside people who were <em>not</em> the main character. That curiosity would become the whole of his art.')
)+
sec('what he did &amp; why he&rsquo;s remembered',
 p('Browning perfected the <strong>dramatic monologue</strong>: a poem spoken entirely by one character, usually to a silent listener, in which the speaker reveals far more than he means to. You are never told what to think. You simply listen to a man talk, and slowly realise &mdash; line by line, the way you realise it in a good thriller &mdash; that he is a murderer, or a hypocrite, or quite mad.')+
 p('His early work was a disaster. His first long poem, <em>Pauline</em> (1833), sold not one copy. <em>Sordello</em> (1840) was so famously impenetrable that Tennyson said he understood only the first and last lines, and both were lies. For decades Browning was known mostly as &ldquo;Mrs Browning&rsquo;s husband.&rdquo; It was only with <em>Men and Women</em> (1855), <em>Dramatis Personae</em> (1864) and above all <em>The Ring and the Book</em> (1868&ndash;69) &mdash; a twenty-one-thousand-line retelling of a real 1698 Roman murder trial, told ten times over by ten different witnesses &mdash; that he became a giant. Browning Societies sprang up to decode him while he was still alive.')+
 p('Every unreliable narrator you have ever loved in a Freida McFadden or Riley Sager novel owes him something. He was doing it in 1836, in rhyme.')
)+
sec('family life',
 p('He lived with his parents and his younger sister Sarianna well into his thirties, writing at home and drawing an allowance &mdash; the family fully believed in him long before anyone else did. His mother, a devout, gentle woman, was the emotional centre of his life; when she died in 1849 he was so broken he could barely function.')+
 p('He and Elizabeth had one child, Robert Wiedeman Barrett Browning, born in Florence in 1849 and called &ldquo;Pen.&rdquo; Elizabeth dressed him in velvet and curls far too long; after her death Browning cut the curls, brought him to England and tried, not very successfully, to push him through Oxford. Pen became a painter instead, and his father loyally bought and promoted his pictures.')
)+
sec('romantic life',
 p('In January 1845 Browning read a volume of poems by <strong>Elizabeth Barrett</strong> &mdash; already in the Ledger &mdash; and wrote her a letter that began: &ldquo;I love your verses with all my heart, dear Miss Barrett.&rdquo; A few lines later: &ldquo;and I love you too.&rdquo; She was thirty-nine, six years older, an invalid confined to a darkened room on Wimpole Street, and the prisoner of a father who had forbidden every one of his children to marry.')+
 p('They exchanged 573 letters in twenty months. He visited her 91 times, always in secret. On 12 September 1846 they married quietly at St Marylebone Church; she went home afterwards and pretended nothing had happened for a week, then slipped out of the house with her maid and her dog Flush and fled with him to Italy. Her father never spoke to her again and returned her letters unopened. In Italy, astonishingly, she got well. They had fifteen years together in Florence, and she wrote <em>Sonnets from the Portuguese</em> for him.')+
 p('She died in his arms on 29 June 1861. He never remarried, although in 1869 he did propose, clumsily, to Lady Louisa Ashburton, and was refused. He wore Elizabeth&rsquo;s ring on his watch-chain for the rest of his life.')
)+
sec('life until death',
 p('After Florence he could not bear to return to Italy for years. He settled in London with Pen, became &mdash; to everyone&rsquo;s surprise &mdash; a sociable, dinner-party fixture, loud and cheerful and nothing like his dark poems. Henry James thought there were two Brownings: the bland man at the table and the genius who stayed home writing.')+
 p('In his last years he returned to Italy after all, spending time in Asolo and at Pen&rsquo;s palazzo in Venice, the Ca&rsquo; Rezzonico. He died there on 12 December 1889, on the very day his final book, <em>Asolando</em>, was published; news reached him that it was selling well, and he said, &ldquo;How gratifying.&rdquo; He is buried in Poets&rsquo; Corner, Westminster Abbey. Elizabeth lies alone in Florence.')
)+
sec('his works',
 p('Start with the two poems that made the dramatic monologue a genre. Read them slowly, and read them as confessions. Texts from Project Gutenberg.')+
 h('Porphyria&rsquo;s Lover (1836)')+
 p('First published as one of two &ldquo;Madhouse Cells.&rdquo; A storm, a cottage, a woman who loves him more than her pride allows. Notice the tense shift near the end, and the last line.')+
 poem('porph.txt')+
 h('My Last Duchess (1842)')+
 p('Ferrara, the Renaissance. A duke shows an envoy a portrait of his late wife, while negotiating to marry the envoy&rsquo;s master&rsquo;s daughter. He never says what happened to her. He says &ldquo;I gave commands; then all smiles stopped together.&rdquo; That is all you get, and it is enough.')+
 poem('duchess.txt')+
 h('Meeting at Night &amp; Parting at Morning (1845)')+
 p('The other Browning: written the year he was secretly courting Elizabeth. Twelve lines of pure arrival, then four of leaving.')+
 poem('meet.txt')+poem('part.txt')+
 h('Andrea del Sarto (1855) &mdash; the lines everyone quotes')+
 bq('Ah, but a man&rsquo;s reach should exceed his grasp,<br>Or what&rsquo;s a heaven for?')+
 h('Rabbi Ben Ezra (1864) &mdash; opening')+
 bq('Grow old along with me!<br>The best is yet to be,<br>The last of life, for which the first was made:<br>Our times are in His hand<br>Who saith &ldquo;A whole I planned,<br>Youth shows but half; trust God: see all, nor be afraid!&rdquo;')
);

const ord=83, slug='robert-browning', name='Robert Browning';
const epithet='Camberwell, 7 May 1812 \u2013 Venice, 12 December 1889 \u00b7 inventor of the unreliable narrator in verse, who let murderers speak for themselves';
const lifespan='7 May 1812 \u2013 12 December 1889';
const quote='Ah, but a man&rsquo;s reach should exceed his grasp, or what&rsquo;s a heaven for?';
const quote_source='Robert Browning, Andrea del Sarto (1855)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 24, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
