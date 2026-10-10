import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const en=(lines)=>`<span style="opacity:0.82">${lines.join('<br>')}</span>`;

const body =
sec('childhood &amp; early life',
 p('<strong>Joseph Thomas Sheridan Le Fanu</strong> was born on 28 August 1814 in Lower Dominick Street, Dublin, into an old Huguenot family that had fled France generations before and never stopped being proud of its (supposedly aristocratic) roots. His father was a Church of Ireland clergyman; on his mother&rsquo;s side he was related to the playwright Richard Brinsley Sheridan, so words and stagecraft were in the blood. When he was small the family moved to the Royal Hibernian Military School in Phoenix Park, where his father became chaplain, and the boy grew up in a green, half-empty, faintly haunted corner of Dublin that he would later pour into his fiction.')+
 p('He was a bookish, dreamy child who taught himself far more than his tutors did, raiding his father&rsquo;s library and drawing well enough to have considered art. He went up to Trinity College Dublin, was called to the Irish bar in 1839, and then quietly did the thing so many writers do: he abandoned the safe profession almost the moment he had it. Journalism, not law, was what he wanted, and by the end of that same year he owned a newspaper.'))+
sec('what he did &amp; why he is remembered',
 p('Le Fanu is the man who taught horror how to whisper. Before him the Gothic screamed: crumbling castles, clanking chains, villains twirling their moustaches. Le Fanu turned the volume down and turned the dread inward. His ghosts arrive in ordinary drawing rooms, in the corner of the eye, inside a nervous man&rsquo;s own head, and you are never quite sure whether the haunting is supernatural or a mind coming apart. M. R. James, the master who came after, called him &ldquo;absolutely in the first rank as a writer of ghost stories.&rdquo;')+
 p('He wrote fourteen novels and dozens of tales, owning and editing the <em>Dublin University Magazine</em> so he could serialise his own work. <em>Uncle Silas</em> (1864) is his great novel of a young heiress trapped in a decaying house with a sinister guardian; <em>In a Glass Darkly</em> (1872), five stories framed as the case files of an occult doctor, is his masterpiece. And buried in it is <em>Carmilla</em> &mdash; the story of a beautiful female vampire who preys on lonely young women through love rather than terror. It arrived in 1872, a full <strong>twenty-five years before</strong> Bram Stoker&rsquo;s <em>Dracula</em>, which it directly shaped. If you have ever read a thriller where the danger is seductive, intimate, and comes to you as tenderness, you are reading downstream of Le Fanu.'))+
sec('family life',
 p('On 18 December 1843 he married Susanna Bennett, daughter of a leading Dublin barrister. They had four children, two sons and two daughters, and for a while lived the respectable life of a professional writer with a growing household. But money was always tight, and after her father died in 1851 the couple moved into the Bennett family home at 18 Merrion Square, the address that would become his whole world.')+
 p('The marriage darkened. Susanna suffered from intense depression, anxiety and a crisis of religious faith; she was tormented by doubt and dreamed that her dead father&rsquo;s ghost was calling her to join him in the family burial vault. On 28 April 1858 she died suddenly, aged only thirty-four, after some kind of hysterical attack. Le Fanu was shattered and, by every account, blamed himself. Critics have long noticed that his later books swarm with motherless girls, frightened young women, and wives experiencing a kind of living death; the guilt of Susanna&rsquo;s life and death seems written all through them.'))+
sec('romantic life',
 p('There was, really, only ever Susanna. Their courtship had been passionate; his letters to her are ardent, and losing her broke something in him that never mended. He did not remarry, did not move on, did not fill the house at Merrion Square with anyone new. He simply stayed there with his grief and his work.')+
 p('It is one of the quiet ironies of literature that a man so devoted, so undone by the death of one woman, became the writer who best understood dangerous, obsessive, consuming love &mdash; the love that is really appetite. <em>Carmilla</em>&rsquo;s vampire does not hate her victims; she adores them, and the adoration is what kills them. Le Fanu knew, better than most, how thin the line is between loving someone and needing to devour them.'))+
sec('life until death',
 p('After Susanna died he withdrew from the world almost completely. Dubliners nicknamed him &ldquo;the Invisible Prince,&rdquo; because he was so rarely seen; he worked at night, slept by day, and would only venture out after dark or send a servant to the bookshops for the old ghost stories and demonology he loved. Shut inside Merrion Square, he entered the most productive stretch of his life, writing his greatest books in the years when he had lost the most.')+
 p('He suffered from a recurring nightmare of a vast, crumbling house about to collapse and bury him. According to the story his doctor told, when Le Fanu died the physician looked at his terrified face and said, &ldquo;the house fell at last.&rdquo; He died of a heart attack (some say bronchitis) at 18 Merrion Square on 7 February 1873, aged fifty-eight, and was buried beside Susanna at Mount Jerome Cemetery. His work faded for decades until Elizabeth Bowen and M. R. James dragged it back into the light, where it has stayed.'))+
sec('his works',
 p('<em>Carmilla</em> (1872) is public domain via Project Gutenberg, and it is the best way to hear him. The narrator, Laura, is a lonely girl in a remote schloss; a mysterious guest named Carmilla is left in her family&rsquo;s care, and the two become inseparable. Here is how Carmilla loves her.')+
 p('<strong>The declaration.</strong> This is the beating heart of the vampire myth as we now know it &mdash; love and death folded into the same sentence.')+
 bq(en(['&ldquo;Dearest, your little heart is wounded; think me not cruel because I obey the irresistible law of my strength and weakness&hellip; In the rapture of my enormous humiliation I live in your warm life, and you shall die&mdash;die, sweetly die&mdash;into mine. I cannot help it; as I draw near to you, you, in your turn, will draw near to others, and learn the rapture of that cruelty, which yet is love.&rdquo;','','&mdash; Carmilla, <em>Carmilla</em>']))+
 p('<strong>You and I are one.</strong> Laura is repelled and spellbound at once. Le Fanu writes desire as something closer to drowning.')+
 bq(en(['&ldquo;It was like the ardor of a lover; it embarrassed me; it was hateful and yet over-powering; and with gloating eyes she drew me to her, and her hot lips traveled along my cheek in kisses; and she would whisper, almost in sobs, &lsquo;You are mine, you <em>shall</em> be mine, you and I are one for ever.&rsquo;&rdquo;','','&mdash; <em>Carmilla</em>']))+
 p('<strong>Love will have its sacrifices.</strong> Carmilla hints, always, at the wound she carries and the wound she will make.')+
 bq(en(['&ldquo;Yes, very&mdash;a cruel love&mdash;strange love, that would have taken my life. Love will have its sacrifices. No sacrifice without blood.&rdquo;','','&mdash; Carmilla, <em>Carmilla</em>']))+
 p('<strong>The paradox.</strong> And Laura&rsquo;s own confusion is the psychological genius of the whole tale &mdash; a horror that lives inside contradictory feeling rather than outside in a monster.')+
 bq(en(['&ldquo;I was conscious of a love growing into adoration, and also of abhorrence. This I know is paradox, but I can make no other attempt to explain the feeling.&rdquo;','','&mdash; Laura, <em>Carmilla</em>']))+
 p('<em>Text of</em> Carmilla <em>public domain via Project Gutenberg (eBook #10007). Biographical details checked against Britannica, the Dictionary of Irish Biography, Wikipedia and the Irish Times; the &ldquo;the house fell at last&rdquo; deathbed line is a widely repeated anecdote attributed to his physician and is offered as such.</em>'));

const slug='joseph-sheridan-le-fanu';
const existing=await one('select id from figures where slug=$1',[slug]);
if(existing){console.log('already there',existing.id);process.exit(0)}
const max=await one('select coalesce(max(ordinal),0) m from figures');
const ord=Number(max.m)+1;
const name='Joseph Sheridan Le Fanu';
const epithet='Joseph Sheridan Le Fanu \u00b7 Dublin, 28 August 1814 \u2013 Dublin, 7 February 1873 \u00b7 the reclusive "Invisible Prince" of Victorian Dublin who wrote Carmilla and taught horror how to whisper';
const lifespan='28 August 1814 \u2013 7 February 1873';
const quote='Love will have its sacrifices. No sacrifice without blood.';
const quote_source='Joseph Sheridan Le Fanu, Carmilla (1872)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 22, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
