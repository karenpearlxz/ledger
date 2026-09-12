import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const slug = 'alfonsina-storni';
const name = 'Alfonsina Storni';
const epithet = 'Alfonsina Storni · 22 May 1892, Sala Capriasca, Switzerland – 25 October 1938, Mar del Plata, Argentina · an unwed schoolteacher who had a child alone at nineteen, wrote some of the first openly erotic poetry in the Spanish language, made her living with her own hands in a city that judged her for existing, told men to their faces that she was a caged bird and they were too small to understand her, and, dying of cancer and worn out by the world, mailed a farewell poem to the newspaper and walked into the sea';
const lifespan = 'Argentine Modernismo · Buenos Aires · 1892–1938';
const quote = `Hombre pequeñito, hombre pequeñito,\nsuelta a tu canario que quiere volar…\nYo soy el canario, hombre pequeñito,\ndéjame saltar.\n\nLittle man, little man,\nrelease your canary that wants to fly…\nI am the canary, little man,\nlet me leap free.`;
const quoteSource = 'Alfonsina Storni, "Hombre pequeñito" (Irremediablemente, 1919), public domain; literal English rendering';

const body = `
<h4>Childhood &amp; Early Life</h4>
<p>She was born on 22 May 1892 in Sala Capriasca, a small village in the Italian-speaking corner of Switzerland, though her family were Argentines who had gone back to the old country for a while on a doctor's advice. She lived there until she was four, then the Stornis returned to San Juan in Argentina, where her father and his brothers ran a brewery. The family was respectable and reasonably comfortable at first, but her father slid into alcoholism and depression, the business faltered, and the money drained away. Her mother, an educated woman, opened a little private school and held the household together as best she could.</p>
<p>Alfonsina grew up working. Her father died when she was thirteen, and she went into a hat factory to help feed the family. She was clever and hungry and refused to be finished off by poverty, so she scraped her way through a teacher-training school in Coronda, earned her diploma as a rural schoolteacher, and took her first post in Rosario. Even then there was a restlessness in her that scandalised people: she once travelled with a theatre troupe, and when word got out that a future schoolmistress had sung on a stage, the shame of it nearly broke her. She was a girl who kept doing the unforgivable thing of wanting a larger life than she was allowed.</p>

<h4>What They Did &amp; Why They're Remembered</h4>
<p>She became one of the great voices of Latin American poetry, and, more than that, one of the first women writing in Spanish to put female desire and female anger on the page without apology. The Poetry Foundation credits her work as one of the earliest influential examples of female eroticism in the language. Her early books, <em>La inquietud del rosal</em> (1916) and especially <em>El dulce daño</em> (1918, "The Sweet Injury"), made her famous in Buenos Aires, and she followed them with <em>Irremediablemente</em> (1919), <em>Languidez</em> (1920), and <em>Ocre</em> (1925), which many critics call her best.</p>
<p>What makes her matter is not only that she wrote beautifully, but what she dared to say. In an age that demanded women be pure, silent, and decorative, she wrote poems that turned and pointed straight at the men doing the demanding. In "Tú me quieres blanca" she tells a man who wants her chaste and snow-white to go clean himself up first, since he has lived exactly as he pleases. In "Hombre pequeñito" she calls a man too small to understand her and asks him to open the cage. In "Peso ancestral" she names the whole inheritance of women taught to swallow pain while men are praised for feeling nothing. She was a working single mother lecturing on feminism and equal rights while raising a boy alone, and she paid for that boldness in reputation her whole life. We remember her because she refused to be the closed blossom the world ordered her to be.</p>

<h4>Family Life</h4>
<p>Her family, in the ordinary sense, was small and hard-won: her mother, her siblings, and above all her son. In Rosario, during her first year of full-time teaching, she became pregnant by a man of standing in the community, a married man, and she chose to have the child and keep him rather than hide or surrender him. In 1912, at nineteen or twenty, she gave birth to her son Alejandro and, unmarried and unprotected, fled to the anonymity of Buenos Aires so that no one would know her story. There followed years of grinding work: cashier in a pharmacy, shop clerk, typist, teacher, anything that would keep the two of them fed while she wrote at night.</p>
<p>She never married and never named the father, and she raised Alejandro herself, which in 1913 was close to social suicide. That is the quiet heroism under all the famous poems: they were written by a woman who was also cooking dinner, correcting schoolwork, and stretching a small wage across two lives. Her feminism was not a pose adopted in a salon; it was the shape of her actual days, a woman doing alone what society insisted required a man, and doing it while the same society sneered.</p>

<h4>Romantic Life</h4>
<p>Her love life is mostly a set of locked doors, which is fitting for a poet so guarded and so proud. The father of her child she never publicly named. The great documented attachment of her later years was to the writer Horacio Quiroga, the master of the Latin American short story, a dark and doomed man obsessed with death. They were close friends, and Storni felt for him something deeper than friendship, though how far it went nobody knows for certain. There is a famous, telling anecdote from a party: a game where he held out his pocket-watch for them each to kiss from opposite sides, and at the last instant he moved it so their lips met instead, to the fury of Storni's watching mother.</p>
<p>But Quiroga did not love her back in the way she wanted. At one point she followed the arrangement of his life at a distance, wrote to him, and got no reply. Their bond stayed a friendship shadowed by her unanswered feeling. When Quiroga, ruined and ill, killed himself in 1937, she wrote a poem for him, and it is hard not to read it as a woman saying goodbye to a love that was never allowed to be one. Her poetry is full of men who ask too much and give too little, and one senses she wrote from life. She wanted to be understood without having to beg for it, and the men around her mostly failed the test.</p>

<h4>Life Until Death</h4>
<p>By the 1930s she was famous, respected, a public figure who lectured and taught and travelled, but her body and spirit were failing together. She had a mastectomy for breast cancer in 1935, and the disease and her fear of it never truly left her. Her last two books, <em>Mundo de siete pozos</em> (1934) and the posthumous <em>Mascarilla y trébol</em> (1938), turned inward and difficult, full of despair and a strange new stripped-down verse form she called the "anti-sonnet." The suicide of Quiroga in 1937, and of his daughter afterward, pressed down on her. She was worn out, in pain, and, she believed, incurably ill.</p>
<p>In October 1938 she went to Mar del Plata and took a room in a modest boarding house by the sea. On the night of 25 October, around one in the morning, she left her room and walked to the beach at La Perla. She had already mailed her final poem, "Voy a dormir" ("I Am Going to Sleep"), to the newspaper <em>La Nación</em>. In it she asks an imaginary nurse to tuck her into earthy sheets under a chosen star, and closes with a message for a man: if he telephones again, tell him not to insist, that she has gone out. She walked into the water and drowned. She was forty-six. The singer Mercedes Sosa would later make her immortal all over again with the song "Alfonsina y el mar," and in Argentina she has been an icon ever since, the poet who was told to be white and small and silent, and refused all three.</p>

<h4>Their Works</h4>
<p>Everything below is in the public domain. Storni wrote in Spanish, so each poem is given in her own words with a plain literal English rendering underneath, so you can hear the shape of the original and still follow the meaning. Read "Tú me quieres blanca" and "Peso ancestral" first, because they say out loud what a hundred years of women were told to keep quiet.</p>

<p><strong>Tú me quieres blanca</strong> (from <em>El dulce daño</em>, 1918). A woman answers a man who demands she be pure as dawn, snow, and seafoam, while he himself has drunk from every cup. Her answer: fix yourself first, then come and ask.</p>
<blockquote>Tú me quieres alba,<br>
me quieres de espumas,<br>
me quieres de nácar.<br>
Que sea azucena<br>
sobre todas, casta.<br>
De perfume tenue.<br>
Corola cerrada.<br>
&hellip;<br>
Tú que hubiste todas<br>
las copas a mano,<br>
de frutos y mieles<br>
los labios morados.<br>
&hellip;<br>
Tú que el esqueleto<br>
conservas intacto<br>
no sé todavía<br>
por cuáles milagros,<br>
me pretendes blanca<br>
(Dios te lo perdone),<br>
me pretendes casta<br>
(Dios te lo perdone),<br>
¡me pretendes alba!<br>
&hellip;<br>
Huye hacia los bosques,<br>
vete a la montaña;<br>
límpiate la boca;<br>
&hellip;<br>
y cuando hayas puesto<br>
en ellas el alma<br>
que por las alcobas<br>
se quedó enredada,<br>
entonces, buen hombre,<br>
preténdeme blanca,<br>
preténdeme nívea,<br>
preténdeme casta.</blockquote>
<p><em>Literal rendering:</em> You want me pale, made of seafoam, made of mother-of-pearl; a lily, chaste above all others, faint of perfume, a closed blossom&hellip; You, who had every cup within reach, your lips stained purple with fruit and honey&hellip; You, who somehow keep your skeleton intact, by what miracles I still don't know, you expect me to be white (God forgive you), you expect me chaste (God forgive you), you expect me to be the dawn! Run off to the forests, go to the mountain, wash out your mouth&hellip; and when you have put back into your flesh the soul you left tangled in the bedrooms, then, good man, expect me white, expect me snow, expect me chaste.</p>

<p><strong>Hombre pequeñito</strong> (from <em>Irremediablemente</em>, 1919). Eight lines. She is the canary, he is the small man who caged her and cannot understand her. She loved him half an hour; don't ask for more.</p>
<blockquote>Hombre pequeñito, hombre pequeñito,<br>
suelta a tu canario que quiere volar…<br>
Yo soy el canario, hombre pequeñito,<br>
déjame saltar.<br><br>
Estuve en tu jaula, hombre pequeñito,<br>
hombre pequeñito que jaula me das.<br>
Digo pequeñito porque no me entiendes,<br>
ni me entenderás.<br><br>
Tampoco te entiendo, pero mientras tanto<br>
ábreme la jaula que quiero escapar;<br>
hombre pequeñito, te amé media hora,<br>
no me pidas más.</blockquote>
<p><em>Literal rendering:</em> Little man, little man, release your canary that wants to fly… I am the canary, little man, let me leap free. I was in your cage, little man, little man who gives me a cage. I say little because you don't understand me, and never will. I don't understand you either, but meanwhile open the cage, for I want to escape; little man, I loved you half an hour, don't ask me for more.</p>

<p><strong>Peso ancestral</strong> (from <em>Irremediablemente</em>, 1919). The whole inheritance of women in eleven lines: the men taught not to weep, the single tear that finally falls, and how heavy centuries of that swallowed pain are to carry.</p>
<blockquote>Tú me dijiste: no lloró mi padre;<br>
tú me dijiste: no lloró mi abuelo;<br>
no han llorado los hombres de mi raza,<br>
eran de acero.<br><br>
Así diciendo te brotó una lágrima<br>
y me cayó en la boca… más veneno<br>
yo no he bebido nunca en otro vaso<br>
así pequeño.<br><br>
Débil mujer, pobre mujer que entiende,<br>
dolor de siglos conocí al beberlo:<br>
¡Oh, el alma mía soportar no puede<br>
todo su peso!</blockquote>
<p><em>Literal rendering:</em> You told me: my father never cried; you told me: my grandfather never cried; the men of my line have never cried, they were made of steel. As you said it, a tear welled up in you and fell into my mouth… more venom I have never drunk from a cup so small. Weak woman, poor woman who understands, I tasted the pain of centuries as I drank it: oh, my soul cannot bear all its weight!</p>

<p><strong>Cuadrados y ángulos</strong> (from <em>El dulce daño</em>, 1918). A tiny, modern, almost angry little poem about conformity, houses in rows, souls gone square, even her own tears squared off.</p>
<blockquote>Casas enfiladas, casas enfiladas,<br>
casas enfiladas.<br>
Cuadrados, cuadrados, cuadrados.<br>
Casas enfiladas.<br>
Las gentes ya tienen el alma cuadrada,<br>
ideas en fila<br>
y ángulo en la espalda.<br>
Yo misma he vertido ayer una lágrima,<br>
Dios mío, cuadrada.</blockquote>
<p><em>Literal rendering:</em> Houses in a row, houses in a row, houses in a row. Squares, squares, squares. Houses in a row. People now have square souls, ideas lined up and an angle in the back. I myself shed a tear yesterday, my God, a square one.</p>

<p><strong>Voy a dormir</strong> (1938). Her last poem, mailed to the newspaper hours before she walked into the sea. She asks nature, as a gentle nurse, to put her to bed under a star, and leaves one final instruction about a man who might call.</p>
<blockquote>Dientes de flores, cofia de rocío,<br>
manos de hierbas, tú, nodriza fina,<br>
tenme prestas las sábanas terrosas<br>
y el edredón de musgos escardados.<br><br>
Voy a dormir, nodriza mía, acuéstame.<br>
Ponme una lámpara a la cabecera;<br>
una constelación; la que te guste;<br>
todas son buenas; bájala un poquito.<br><br>
Déjame sola: oyes romper los brotes…<br>
te acuna un pie celeste desde arriba<br>
y un pájaro te traza unos compases<br><br>
para que olvides… Gracias. Ah, un encargo:<br>
si él llama nuevamente por teléfono<br>
le dices que no insista, que he salido…</blockquote>
<p><em>Literal rendering:</em> Teeth of flowers, a bonnet of dew, hands of grasses, you, fine nurse, have the earthen sheets ready for me and the quilt of weeded moss. I am going to sleep, my nurse, lay me down. Put a lamp at my headboard; a constellation; whichever you like; they are all good; lower it a little. Leave me alone: you can hear the buds breaking open… a heavenly foot rocks you from above and a bird traces out a few bars of music for you so that you forget… Thank you. Oh, one errand: if he telephones again, tell him not to insist, that I have gone out…</p>

<p><em>Poems from</em> El dulce daño <em>(1918) and</em> Irremediablemente <em>(1919), with "Voy a dormir" first published in</em> La Nación <em>(1938). Spanish texts are public domain; longer poem trimmed at marked ellipses, shorter poems given whole. English renderings are literal, meant as a crib to the Spanish rather than as verse translations.</em></p>`;

const existing = await one('select id from figures where slug = $1', [slug]);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, slug, name, epithet, lifespan, 'sep 12, 2026', epithet, body, quote, quoteSource],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
