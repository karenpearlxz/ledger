import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const en=(lines)=>`<span style="opacity:0.82">${lines.join('<br>')}</span>`;

const body =
sec('origins &amp; early life',
 p('<strong>Lilith</strong> has no childhood, because she was never born \u2014 she was <em>made</em>, and that is the whole of her story. She is one of the oldest surviving figures in this collection, older than most of the gods and poets, and she comes to us not as a person but as a rumour that refused to die. Her oldest roots run back nearly four thousand years into Mesopotamia, to the <em>lilitu</em> and <em>lil\u012btu</em> of Sumerian and Akkadian belief: wind spirits, night spirits, restless female demons of the dark air who were said to prey on the sleeping, on lovers, on women in childbirth and on newborns. Her name is bound up with the words for <em>night</em> and <em>wind</em>, and she has kept that association ever since \u2014 she is what moves in the dark while you sleep.')+
 p('She surfaces once, and only once, in the Hebrew Bible, buried in a prophecy of desolation in the Book of Isaiah, standing among the wild animals of a ruined land. Most old English Bibles could not decide what she was and translated her name as \u201cthe screech owl\u201d or \u201cthe night creature.\u201d That single haunted line is the seed from which everything else grew.'))+
sec('what she is &amp; why she is remembered',
 p('Lilith is remembered for one act of refusal that has echoed for a thousand years. According to a medieval Jewish text, <em>The Alphabet of Ben Sira</em> (written somewhere between the 8th and 10th centuries), she was not created after Adam and from his rib the way Eve was. She was his <em>first</em> wife, made at the same moment and from the same earth. And because she was made from the same dust, she would not accept being beneath him \u2014 in bed or anywhere else. \u201cWe are equal,\u201d she is said to have argued, \u201cfor we are both from the earth.\u201d When Adam would not yield, she spoke the secret name of God aloud, grew wings, and flew away \u2014 out of Eden entirely, to make her home by the Red Sea. She chose exile over submission. That is the whole scandal, and the whole of her power.')+
 p('For most of history she was written down as a monster \u2014 a seducer of men in their sleep, a stealer of infants, a night-demon whose name mothers hung over cradles to ward off. In the Kabbalah she became a queen of demons, consort of Samael, the dark mirror of the divine. But in the last century she has been reclaimed and turned inside out: the woman who would not lie beneath, the first to say <em>no</em> and pay for it, has become a symbol of refusal, independence, and the dangerous freedom of a woman who will not be owned. She is remembered because she is the oldest surviving argument that <em>equal</em> was a thing a woman might demand \u2014 and be exiled for.'))+
sec('family life',
 p('Her family is a broken and terrible one, which is the point. She was made to be Adam\u2019s wife and walked out of that marriage before it began. In her place God made Eve \u2014 quieter, made from the man himself, made to belong \u2014 and the whole later quarrel about Lilith is really a quarrel about those two possibilities for a woman: the one who fits, and the one who leaves.')+
 p('After Eden, the legend gives her a monstrous fertility. By the Red Sea she is said to have birthed a hundred demon children a day. When three angels \u2014 Senoy, Sansenoy, and Semangelof \u2014 were sent to command her back, she refused, and was cursed: a hundred of her children would die each day for her defiance. Her answer to that grief was the darkest turn in her story \u2014 she swore vengeance on human infants, the children of the woman who had replaced her, unless they were protected by an amulet bearing the three angels\u2019 names. In the later mysticism she is paired with Samael as a kind of anti-Eve, the bride of the shadow. It is a family tree made entirely of loss, exile, and revenge \u2014 the shape grief takes when it is never allowed to heal.'))+
sec('romantic life',
 p('Lilith is desire itself, and desire\u2019s danger. In the folklore she is the shape that comes to men alone in the night \u2014 beautiful, wingless-seeming, her hair her chief weapon \u2014 and the warnings about her are always warnings about being <em>caught</em>. The Victorian poet Dante Gabriel Rossetti painted and wrote her as a woman \u201cyoung while the earth is old,\u201d combing her golden hair before a mirror, drawing men into a web \u201ctill heart and body and life are in its hold.\u201d Goethe put her into the witches\u2019 sabbath of <em>Faust</em>, with Mephistopheles murmuring a warning about the lovely young man never freed once her hair has snared him.')+
 p('But strip away the fear and what is underneath is simply a woman who insisted that love not cost her herself. Her refusal in Eden was, at its heart, a refusal in the bedroom \u2014 she would not be under him. Everything monstrous the tradition piled on top of her afterward is arguably just the fear of what she originally asked for: to be an equal, or to be gone. She is the patron, if you like, of everyone who has decided they would rather be alone than be less.'))+
sec('afterlife &amp; endurance',
 p('Lilith never dies, because she was never quite alive in the ordinary way \u2014 she persists instead, which is far harder to kill. She survived being written out of Genesis, being cursed into a demon, being carved onto protective amulets over three thousand years of cradles, being made the villain of men\u2019s bad dreams. She survived by being useful as a warning, and then, in our own age, she turned the warning into a banner. Modern writers, feminists, painters, and songwriters have brought her back not as the thing that steals your baby but as the woman who would not stay.')+
 p('That is the strange arc of her endurance: the figure invented to frighten people into obedience became, in the end, one of the great emblems of disobedience. She began as the dark that moves while you sleep, and she remains exactly that \u2014 but now the dark has a case to make. She is proof that a story told to keep a woman in her place can, given enough centuries, become the story of why she left it.'))+
sec('their works',
 p('Lilith wrote nothing \u2014 she is a figure made entirely of other people\u2019s words, which is its own kind of immortality. What follows is the record of her in public-domain literature and scripture: the one biblical verse that names her, the medieval story of her refusal, and the great poems that made her a legend. Read them as the case file of a woman assembled from every age\u2019s fear and longing.')+
 p('<strong>The single Bible verse.</strong> Isaiah\u2019s vision of a land fallen to ruin, where the wild things gather. The King James translators rendered her name \u201cscreech owl\u201d; the Hebrew is <em>lilith</em>.')+
 bq(en(['\u201cThe wild beasts of the desert shall also meet with the wild beasts of the island, and the satyr shall cry to his fellow; the screech owl [<em>lilith</em>] also shall rest there, and find for herself a place of rest.\u201d'])+'<br><br>'+en(['\u2014 <em>Isaiah</em> 34:14, King James Version (1611, public domain)']))+
 p('<strong>The refusal.</strong> The heart of her legend, from the medieval <em>Alphabet of Ben Sira</em> \u2014 the moment she argues that being made from the same earth makes her Adam\u2019s equal, and, refused, chooses exile over submission:')+
 bq(en(['She said to him: \u201cI will not lie below you, but only on top, for you are fit only to be in the bottom position, while I am to be in the superior one.\u201d Adam said: \u201cWe are equal to each other inasmuch as we were both created from the earth.\u201d But they would not listen to one another. When Lilith saw this, she pronounced the Ineffable Name and flew away into the air.'])+'<br><br>'+en(['\u2014 paraphrase of <em>The Alphabet of Ben Sira</em> (c. 8th\u201310th c.), the earliest telling of Lilith as Adam\u2019s first wife']))+
 p('<strong>Rossetti\u2019s sonnet.</strong> \u201cBody\u2019s Beauty\u201d (1868), the great Victorian portrait of Lilith \u2014 young while the earth is old, weaving men into her golden hair. This one is public domain in full.')+
 bq(en(['\u201cOf Adam\u2019s first wife, Lilith, it is told',
   '(The witch he loved before the gift of Eve,)',
   'That, ere the snake\u2019s, her sweet tongue could deceive,',
   'And her enchanted hair was the first gold.',
   'And still she sits, young while the earth is old,',
   'And, subtly of herself contemplative,',
   'Draws men to watch the bright web she can weave,',
   'Till heart and body and life are in its hold.',
   '&nbsp;',
   'The rose and poppy are her flowers; for where',
   'Is he not found, O Lilith, whom shed scent',
   'And soft-shed kisses and soft sleep shall snare?',
   'Lo! as that youth\u2019s eyes burned at thine, so went',
   'Thy spell through him, and left his straight neck bent',
   'And round his heart one strangling golden hair.\u201d'])+'<br><br>'+en(['\u2014 Dante Gabriel Rossetti, \u201cBody\u2019s Beauty\u201d (<em>Lilith</em>), 1868 (public domain)']))+
 p('<strong>Goethe\u2019s warning.</strong> From the Walpurgis Night of <em>Faust</em> \u2014 Mephistopheles pointing her out among the witches, and warning what her hair can do:')+
 bq(en(['FAUST: Who\u2019s that there?',
   'MEPHISTOPHELES: Note her well. \u2019Tis Lilith.',
   'FAUST: Who?',
   'MEPHISTOPHELES: Adam\u2019s first wife is she.',
   'Beware the lure within her lovely tresses,',
   'The splendid sole adornment of her hair;',
   'When she succeeds therewith a youth to snare,',
   'Not soon again she frees him from her jesses.\u201d'])+'<br><br>'+en(['\u2014 Goethe, <em>Faust</em>, Part I, \u201cWalpurgis Night,\u201d trans. Bayard Taylor (1870\u201371, public domain)']))+
 p('<em>Texts public domain: <strong>Isaiah</strong> 34:14 (King James Version, 1611); Dante Gabriel Rossetti\u2019s sonnet <strong>\u201cBody\u2019s Beauty\u201d</strong> (1868); and Bayard Taylor\u2019s translation of Goethe\u2019s <strong>Faust</strong> (1870\u201371). The refusal is paraphrased from <strong>The Alphabet of Ben Sira</strong>. Background on the Mesopotamian <em>lilitu</em>, the Isaiah reference, and the Kabbalistic tradition checked against the Encyclopaedia Britannica and the Jewish Encyclopedia.</em>'));

const slug='lilith';
const existing=await one('select id from figures where slug=$1',[slug]);
if(existing){console.log('already there',existing.id);process.exit(0)}
const max=await one('select coalesce(max(ordinal),0) m from figures');
const ord=Number(max.m)+1;
const epithet='Lilith \u00b7 Mesopotamia &amp; the Hebrew night, c. 2000 BCE \u2013 present \u00b7 Adam\u2019s first wife, made from the same earth and refusing to lie beneath him \u2014 the woman who chose exile over submission and became the oldest legend of a female no';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,'Lilith',epithet,'c. 2000 BCE \u2013 present','sep 4, 2026',epithet,body,'We are equal to each other, inasmuch as we were both created from the earth.','Lilith, from The Alphabet of Ben Sira']);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
