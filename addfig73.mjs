import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const slug = 'rainer-maria-rilke';
const name = 'Rainer Maria Rilke';
const epithet = 'Rainer Maria Rilke · 4 December 1875, Prague – 29 December 1926, Valmont, Switzerland · dressed as a dead sister\'s replacement in earliest childhood, broken by a military boarding school, renamed "Rainer" by the older woman who loved him, apprenticed to a sculptor who taught him to look at things until they gave up their secret — a man who spent a lifetime alone on purpose so he could write the poems that tell you, still, to change your life';
const lifespan = 'Austrian (Bohemian) · poetry · 1875–1926';
const quote = `denn da ist keine Stelle,\ndie dich nicht sieht. Du mußt dein Leben ändern.\n\nfor here there is no place\nthat does not see you. You must change your life.`;
const quoteSource = 'Rainer Maria Rilke, "Archaïscher Torso Apollos" (1908); German public domain, literal English rendering';

const body = `
<h4>Childhood &amp; Early Life</h4>
<p>He was born in Prague on 4 December 1875 and christened René Karl Wilhelm Johann Josef Maria Rilke, a great deal of name for a fragile only child. Before him his mother Sophie had lost a baby daughter, and she never quite let that daughter go. For the first years of his life she dressed him in girl's clothes, let his hair grow long, called him by a girl's name, and let him keep dolls — mourning the child she had buried by pretending, part of the time, that this one was her. His father Josef was a failed army officer turned minor railway official, a disappointed man who wanted a son who could do the soldiering he never finished.</p>
<p>So at ten they sent him to military school — first the academy at Sankt Pölten, then a higher one — and it very nearly destroyed him. A dreamy, sickly, already-writing boy dropped into the noise and cruelty and cold of a cadet barracks; he later described those years as a kind of primer in horror, a fairy tale of fear he spent the rest of his life recovering from. Illness got him out. He drifted through a business academy, then private tutoring, then university in Prague and Munich, always reading, always writing, already certain of the one thing he would never doubt: that he was put on earth to make poems, and that everything else would have to arrange itself around that.</p>

<h4>What They Did &amp; Why They're Remembered</h4>
<p>Rilke is, by wide agreement, the greatest German-language lyric poet of the twentieth century, and one of the few poets anywhere whose lines have escaped poetry entirely and gone to live in ordinary speech. "You must change your life." "Love consists in this, that two solitudes protect and border and greet each other." "Live the questions now." People quote him who have never read a book of his, at weddings and funerals and in the middle of their worst nights, because he wrote about the things that do not date: solitude, love, fear, God, death, and the terrible difficulty of actually seeing another person or another thing.</p>
<p>He got there by a strange, disciplined route. Early on he wrote soft, feeling-drenched, rather vague verse. Then, working in Paris as secretary to the sculptor Auguste Rodin, he learned a lesson that changed everything: stop pouring your feelings onto things and instead <em>look</em> at the thing until it hands you its truth. From that came the <em>Neue Gedichte</em>, the "thing-poems," where a panther in a zoo or a torso of a broken statue becomes almost unbearably alive. And then, after ten nearly silent years of blockage and searching, came the two works that made him immortal, both finished in a single volcanic few weeks in 1922: the <em>Duineser Elegien</em> (Duino Elegies), his great meditation on angels and grief and being human, and the <em>Sonette an Orpheus</em> (Sonnets to Orpheus), fifty-five poems that arrived, he said, almost as dictation. We remember him because he made loneliness into a discipline and turned it into some of the most consoling words ever written.</p>

<h4>Family Life</h4>
<p>His own family gave him a wound and a warning. From the mother who half-erased him he kept a lifelong, uneasy distance; from the father, a sadness about disappointing men. When he made a family of his own, he could not stay inside it. In 1900 he went to the artists' colony at Worpswede and met two young women, the painter Paula Modersohn-Becker and the sculptor Clara Westhoff, a former pupil of Rodin's. He married Clara in the spring of 1901, and their daughter Ruth was born that December.</p>
<p>It lasted, as a shared household, less than a year. Rilke had decided that a real marriage should not be two people melting into one but two solitudes standing guard over each other's aloneness — a beautiful theory, and also, conveniently, a theory that let him leave. By 1902 he had gone to Paris for his work on Rodin, and he and Clara lived apart for the rest of his life, never divorcing, writing to each other with real tenderness across the distance. His daughter Ruth grew up mostly without him. He loved the <em>idea</em> of them, wrote to them movingly, and could not, or would not, live the daily ordinary life that a wife and a child require. He knew it about himself. It is the shadow across everything else.</p>

<h4>Romantic Life</h4>
<p>The great love of his life he met in Munich in 1897, when he was twenty-one and still calling himself René. Her name was Lou Andreas-Salomé — brilliant, fifteen years older, already famous for having refused Nietzsche — and she took him in hand completely. She became his lover, but more than that she remade him: she told him "René" was too soft, and renamed him <strong>Rainer</strong>; she corrected his handwriting; she taught him Russian and took him twice across Russia to meet Tolstoy and to fall in love with the vast, patient, God-soaked country he would write about for years. When she ended the affair as a love affair, she refused to end the friendship, and she was right to. She remained his fixed point for thirty years — confidante, first reader, and near the end, when he was collapsing, something close to his analyst. She is the one who understood him best and asked the least to own him.</p>
<p>After Lou there were many others: Clara, whom he married and left; the pianist Magda von Hattingberg, whom he called "Benvenuta"; the painter Baladine Klossowska, "Merline," who loved him through his last years; a long line of aristocratic women whose castles gave him the quiet and the money to write. His pattern almost never changed. He needed love the way he needed air, and he needed to be alone even more, and so he loved best at the distance of a letter — where he was, it must be said, one of the most extraordinary lovers who ever put pen to paper, and where no one could ask him to stay for breakfast.</p>

<h4>Life Until Death</h4>
<p>The First World War caught him and froze him; drafted into the Austrian army, he was mercifully assigned to desk work in Vienna, but the horror of it silenced his poetry for years. Afterward he drifted, homeless in the way he had always half-chosen to be, until benefactors installed him in a small stone tower called Muzot in the Swiss Valais. There, in February 1922, the dam broke. In a matter of weeks he completed the <em>Duino Elegies</em>, begun a decade earlier, and — as a wild, unexpected gift alongside them — wrote all fifty-five <em>Sonnets to Orpheus</em>, poems about the god who sang so beautifully that he charmed death itself and went down into the underworld to bring back the woman he loved. Rilke felt he had finally said the thing he was born to say.</p>
<p>He did not have long to enjoy it. He fell ill with what turned out to be leukemia, a diagnosis that was kept from him and that he may not fully have wanted to know. There is a legend that he died from pricking his hand on a rose thorn while cutting flowers for a beautiful visitor, and that the tiny wound would not heal; the truth is that his blood was already failing and the rose only makes the story unbearable in the way he would have liked. He died at a sanatorium at Valmont on 29 December 1926, aged fifty-one, and was buried at Raron in the Swiss mountains under an epitaph he wrote himself, about a rose.</p>

<h4>Their Works</h4>
<p>Start with the poem that ends with the most famous command in modern poetry. Rilke stood in the Louvre in front of a headless, limbless ancient statue of Apollo — no face, no eyes, no arms — and instead of seeing a ruin he felt the broken stone <em>seeing him</em>, catching him out, judging the smallness of his life. The whole poem tightens toward its last four words, and they land on you and not on the statue.</p>
<blockquote>Wir kannten nicht sein unerhörtes Haupt,<br>
darin die Augenäpfel reiften. Aber<br>
sein Torso glüht noch wie ein Kandelaber,<br>
in dem sein Schauen, nur zurückgeschraubt,<br><br>
sich hält und glänzt. Sonst könnte nicht der Bug<br>
der Brust dich blenden, und im leisen Drehen<br>
der Lenden könnte nicht ein Lächeln gehen<br>
zu jener Mitte, die die Zeugung trug.<br><br>
Sonst stünde dieser Stein entstellt und kurz<br>
unter der Schultern durchsichtigem Sturz<br>
und flimmerte nicht so wie Raubtierfelle;<br><br>
und bräche nicht aus allen seinen Rändern<br>
aus wie ein Stern: denn da ist keine Stelle,<br>
die dich nicht sieht. Du mußt dein Leben ändern.</blockquote>
<p><em>Literal rendering:</em> We never knew his unheard-of head, in which the eyes' apples ripened. But his torso still glows like a candelabrum, in which his gaze, only turned down low, still holds and shines. Or the curve of the breast could not blind you, and in the quiet turning of the loins a smile could not go toward that centre which carried procreation. Or this stone would stand disfigured and short beneath the shoulders' translucent plunge, and would not shimmer so like a predator's pelt; and would not burst out of all its edges like a star: for here there is no place that does not see you. You must change your life.</p>
<p>Then the panther, from his years learning to <em>look</em> under Rodin. A big cat pacing a cage in the Paris zoo becomes every trapped, deadened will — you, on the days the bars have won. Watch the last stanza, where an image from the outside world finally slips in through the eye, travels the length of the tensed body, and dies at the heart before it can mean anything.</p>
<blockquote>Sein Blick ist vom Vorübergehn der Stäbe<br>
so müd geworden, daß er nichts mehr hält.<br>
Ihm ist, als ob es tausend Stäbe gäbe<br>
und hinter tausend Stäben keine Welt.<br><br>
Der weiche Gang geschmeidig starker Schritte,<br>
der sich im allerkleinsten Kreise dreht,<br>
ist wie ein Tanz von Kraft um eine Mitte,<br>
in der betäubt ein großer Wille steht.<br><br>
Nur manchmal schiebt der Vorhang der Pupille<br>
sich lautlos auf –. Dann geht ein Bild hinein,<br>
geht durch der Glieder angespannte Stille –<br>
und hört im Herzen auf zu sein.</blockquote>
<p><em>Literal rendering:</em> His gaze has grown so tired from the passing of the bars that it holds nothing any more. To him it is as if there were a thousand bars, and behind a thousand bars no world. The soft walk of supple strong strides, turning in the very smallest circle, is like a dance of force around a centre in which a great will stands numbed. Only sometimes the curtain of the pupil lifts, without a sound. Then an image goes in, travels through the limbs' tensed stillness — and ceases to be, in the heart.</p>
<p>His prose is quoted as much as his verse, above all the little book called <em>Letters to a Young Poet</em>: ten letters he wrote between 1903 and 1908 to Franz Kappus, a nineteen-year-old cadet who had sent him some poems. Rilke barely read the poems. Instead he answered the boy's real question, which was how to live. Two passages have outlived everything around them. The first is his definition of love, which is really a defence of solitude:</p>
<blockquote>[…] jener Liebe, die darin besteht, daß zwei Einsamkeiten einander schützen, grenzen und grüßen.</blockquote>
<p><em>Literal rendering:</em> that love which consists in this, that two solitudes protect, border, and greet each other. He did not manage to live it with Clara — but he named the thing so exactly that people have quoted it at their weddings ever since.</p>
<p>And the second, the one Karen already half-lives by, written from Rome on 16 July 1903 to a young man who wanted answers Rilke could not give him:</p>
<blockquote>Ich möchte Sie […] bitten, Geduld zu haben gegen alles Ungelöste in Ihrem Herzen und zu versuchen, die Fragen selbst liebzuhaben wie verschlossene Stuben und wie Bücher, die in einer sehr fremden Sprache geschrieben sind. […] Und es handelt sich darum, alles zu leben. Leben Sie jetzt die Fragen. Vielleicht leben Sie dann allmählich, ohne es zu merken, eines fernen Tages in die Antwort hinein.</blockquote>
<p><em>Literal rendering:</em> I would ask you to have patience toward everything unresolved in your heart, and to try to love the questions themselves, like locked rooms and like books written in a very foreign language. […] The point is to live everything. Live the questions now. Perhaps then, gradually, without noticing it, you will live your way, some distant day, into the answer.</p>
<p>He chose his own epitaph, and it is the smallest thing he ever wrote and one of the most argued-over. It is about a rose — petals like closed eyelids, a flower that is no one's sleep — and it puns, in German, on <em>Lidern</em> (eyelids) and <em>Liedern</em> (songs), so that under all his many songs he is also saying: let me be no one's easy comfort, no one's oblivion.</p>
<blockquote>Rose, oh reiner Widerspruch, Lust,<br>
Niemandes Schlaf zu sein unter soviel<br>
Lidern.</blockquote>
<p><em>Literal rendering:</em> Rose, oh pure contradiction, joy of being no one's sleep under so many lids.</p>
<p><em>All German texts here are public domain. "Archaïscher Torso Apollos" (1908) and "Der Panther" (1902–3) confirmed against the</em> Neue Gedichte <em>(Insel Verlag). The two prose passages are from</em> Briefe an einen jungen Dichter <em>(letters of 16 July 1903 and 14 May 1904). The epitaph is from Rilke's own will, 27 October 1925. English renderings are literal cribs, not verse translations.</em>`;

const existing = await one('select id from figures where slug = $1', [slug]);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, slug, name, epithet, lifespan, 'sep 14, 2026', epithet, body, quote, quoteSource],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
