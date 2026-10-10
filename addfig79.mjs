import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const it=(lines)=>`<span style="font-style:italic">${lines.join('<br>')}</span>`;
const en=(lines)=>`<span style="opacity:0.82">${lines.join('<br>')}</span>`;

const body =
sec('childhood &amp; early life',
 p('<strong>William Wilkie Collins</strong> was born in London on 8 January 1824, the son of William Collins, a fashionable landscape painter and stern evangelical, and Harriet Geddes, a former governess with a sharp tongue and a gift for storytelling. He was named after his godfather, the painter Sir David Wilkie, but used his middle name all his life. From the start he was small, odd-looking, with a bulging forehead and a body that never fully cooperated with him.')+
 p('When Wilkie was twelve the family spent two years in Italy and France, and the boy who had been raised on strict Sunday sermons discovered colour, food, art and a wider, looser world. Back in England he was sent to a boarding school where, he later claimed, a dormitory bully forced him to tell a story every night before either of them could sleep. &ldquo;It was this brute,&rdquo; Collins said, &ldquo;who first awakened in me, his poor little victim, a power of which but for him I might never have been aware... When I left school I continued story telling for my own pleasure.&rdquo;'))+
sec('what he did &amp; why he is remembered',
 p('Collins is the writer who taught English fiction how to keep a secret. He was the master of the &ldquo;sensation novel&rdquo; and is widely called a father of English detective fiction. <em>The Woman in White</em> (1859–60) is a masterpiece of dread and mistaken identity; <em>The Moonstone</em> (1868) is often named the first great English detective novel, complete with a stolen jewel, a country-house crime, red herrings, and Sergeant Cuff, the melancholy professional detective every fictional investigator after him inherits something from.')+
 p('His method was pure suspense engineering. He told stories through stacked eyewitness testimonies, letters and diaries, so the reader assembles the truth like a juror, never sure who to trust. If you love a slow-burn mystery with a brilliant investigator and a plot that makes you wait, you are reading in a room Collins built. He put it plainly in his preface: &ldquo;the primary object of a work of fiction should be to tell a story.&rdquo;'))+
sec('family life',
 p('Collins never married, and never lived a life his painter father would have blessed. His younger brother Charles married Charles Dickens&rsquo;s daughter Kate, which knotted the two literary families together, but Wilkie kept his own household arrangements deliberately, defiantly irregular. He hated the machinery of respectable Victorian marriage and said so, both in his novels and in the way he lived.')+
 p('The great friendship of his life was with Dickens, whom he met in 1851. They wrote together, travelled together, and pushed each other; Dickens serialised Collins&rsquo;s biggest books in his magazines and treated the younger man as a collaborator and confidant. Collins learned pace and showmanship from Dickens; Dickens, arguably, learned plotting from Collins.'))+
sec('romantic life',
 p('Collins quietly kept two women and two homes for much of his adult life. Caroline Graves, a widow with a young daughter, lived with him as his companion for decades; legend, spun long after everyone was dead, said he first met her one moonlit night as she fled a house in white, the supposed seed of <em>The Woman in White</em>. When Caroline briefly left to marry another man, Collins did not chase respectability. He began a second family with Martha Rudd, a young woman from Norfolk, under the invented name &ldquo;Mr Dawson.&rdquo;')+
 p('With Martha he had three children, Marian, Harriet and William Charles. Caroline eventually returned, and Collins spent his last years maintaining both households at once, openly enough that his friends knew and discreetly enough that society could pretend not to. He refused marriage on principle and, unusually for his time, provided for both women and all the children in his will.'))+
sec('life until death',
 p('For most of his life Collins was in pain. He suffered from what was called &ldquo;rheumatic gout,&rdquo; including agonising inflammation of the eyes, and dosed himself with ever-larger quantities of laudanum, the opium tincture of the age. He grew so dependent that he was astonished, on finishing <em>The Moonstone</em>, to be told he had dictated long stretches of it he could not remember writing. He believed a &ldquo;second self&rdquo; sometimes sat with him as he worked, a ghost of his own drugged mind.')+
 p('His later novels turned toward social causes and lost some of the old magic, but he kept working and kept his readers. He died in London on 23 September 1889, aged sixty-five, after a stroke. He was buried at Kensal Green Cemetery; Caroline was later buried in the same grave. The epitaph he chose named only one book: &ldquo;Wilkie Collins, Author of <em>The Woman in White</em> and other works of fiction.&rdquo; He knew which door he had opened.'))+
sec('their works',
 p('Collins&rsquo;s major novels are public domain. Start with <em>The Woman in White</em> for pure dread, then <em>The Moonstone</em> for the birth of the detective story. Here is where his voice lives.')+
 p('<strong>The Woman in White (1859–60).</strong> The opening lines, and the mission statement of his whole art.')+
 bq(en(['&ldquo;This is the story of what a Woman&rsquo;s patience can endure, and what a Man&rsquo;s resolution can achieve.&rdquo;','','&ldquo;I have always held the old-fashioned opinion that the primary object of a work of fiction should be to tell a story.&rdquo;','','— <em>The Woman in White</em>, opening &amp; preface']))+
 p('<strong>Count Fosco.</strong> His great villain, fat, charming, terrifying, and one of the first truly seductive antagonists in English crime fiction. He fears only one person in the book: the clever, plain heroine Marian Halcombe.')+
 bq(en(['&ldquo;With that woman for my enemy, I, with all my brains and experience&mdash;I, Fosco, cunning as the devil himself, as you have told me a hundred times&mdash;I walk, in your English phrase, upon egg-shells!&rdquo;','','&ldquo;At sixty, I worshipped her with the volcanic ardour of eighteen.&rdquo;','','— Count Fosco, <em>The Woman in White</em>']))+
 p('<strong>The Moonstone (1868).</strong> The old servant Gabriel Betteredge, who treats <em>Robinson Crusoe</em> as bible, oracle and best friend. It is funny, and it is Collins quietly arguing that we all read our own lives through the stories we love.')+
 bq(en(['&ldquo;Such a book as <span style="font-variant:small-caps">Robinson Crusoe</span> never was written, and never will be written again. I have tried that book for years&mdash;generally in combination with a pipe of tobacco&mdash;and I have found it my friend in need in all the necessities of this mortal life. When my spirits are bad&mdash;<span style="font-variant:small-caps">Robinson Crusoe</span>. When I want advice&mdash;<span style="font-variant:small-caps">Robinson Crusoe</span>... I have worn out six stout <span style="font-variant:small-caps">Robinson Crusoes</span> with hard work in my service.&rdquo;','','— Gabriel Betteredge, <em>The Moonstone</em>']))+
 p('<strong>His maxim.</strong> The credo of the sensation novel, the thing every cliffhanger owes a debt to, is usually attached to Collins (though it is sometimes credited to his contemporary Charles Reade):')+
 bq(en(['&ldquo;Make &rsquo;em laugh, make &rsquo;em cry, make &rsquo;em wait.&rdquo;']))+
 p('<em>Novel texts public domain via Project Gutenberg: <strong>The Woman in White</strong> and <strong>The Moonstone</strong>. Biographical details checked against Catherine Peters&rsquo; biography</em> The King of Inventors <em>and standard references; the &ldquo;woman in white&rdquo; meeting story and the &ldquo;make &rsquo;em wait&rdquo; attribution are both traditional and disputed, and are flagged as such above.</em>'));

const slug='wilkie-collins';
const existing=await one('select id from figures where slug=$1',[slug]);
if(existing){console.log('already there',existing.id);process.exit(0)}
const max=await one('select coalesce(max(ordinal),0) m from figures');
const ord=Number(max.m)+1;
const name='Wilkie Collins';
const epithet='Wilkie Collins · London, 8 January 1824 – London, 23 September 1889 · the opium-haunted father of English detective and suspense fiction, who kept two secret families and taught the novel how to hold a secret';
const lifespan='8 January 1824 \u2013 23 September 1889';
const quote='This is the story of what a Woman\u2019s patience can endure, and what a Man\u2019s resolution can achieve.';
const quote_source='Wilkie Collins, The Woman in White (1859\u201360)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 20, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
