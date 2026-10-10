import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const slug = 'lou-andreas-salome';
const name = 'Lou Andreas-Salomé';
const epithet = 'Lou Andreas-Salomé · 12 February 1861, St Petersburg – 5 February 1937, Göttingen · a Russian general\'s daughter who talked her way into a university when women were barely allowed, refused to be owned by any of the brilliant men who wanted her — turned down Nietzsche\'s proposals, kept Rilke as a lover but never a possession, sat as the only woman Freud let attend his lectures — proposed a celibate marriage and kept it for decades, and at seventy became one of the first women to practise psychoanalysis, writing a farewell to life at nineteen that she never once took back';
const lifespan = 'Russian-German · philosophy & psychoanalysis · 1861–1937';
const quote = `Gewiß, so liebt ein Freund den Freund\nWie ich dich liebe, Rätselleben --\n\nSurely, a friend loves a friend\nthe way I love you, riddle-life --`;
const quoteSource = 'Lou Andreas-Salomé, "Lebensgebet" (1881); German public domain, literal English rendering';

const body = `
<h4>Childhood &amp; Early Life</h4>
<p>She was born in St Petersburg on 12 February 1861, the only daughter of a Russian general of Huguenot and north-German descent, the youngest child after five brothers. A girl surrounded by men from the first day, doted on, protected, and never quite taken as seriously as she wanted to be. She grew up in an apartment overlooking the Winter Palace, spoke German at home and Russian in the street, and had the kind of restless, questioning mind that made governesses despair. Very early she stopped believing in the God she had been given, and the loss of that faith seems to have set the pattern of her whole life: she would spend it looking for something large enough to give herself to.</p>
<p>At seventeen she attached herself to Hendrik Gillot, a Dutch pastor in the city, and studied with him ferociously — theology, philosophy, comparative religion, French and German literature — until he fell in love with her and proposed, ready to divorce his wife. She was horrified. She had wanted a teacher, not a husband, and the discovery that a mind she admired could be reduced to wanting her body was one she never forgot. Her health broke down. To recover, and to study, she and her mother left Russia in 1880 for Zurich, one of the only universities in Europe that would let a woman through the door, where she read philosophy and theology and began, quietly, to build a life no respectable woman was supposed to want.</p>

<h4>What They Did &amp; Why They're Remembered</h4>
<p>She is remembered, unfairly at first and then rightly, for two different things. The unfair fame is that she stood at the centre of the intellectual life of her age and was loved by three of its giants — Friedrich Nietzsche, Rainer Maria Rilke, and Sigmund Freud — so that for a long time she was written about only as the woman those men wanted. The fair fame, the one that has grown as hers has been rediscovered, is that she was a formidable thinker in her own right: a novelist, an essayist on religion, sexuality, and the psychology of women, and finally one of the first female psychoanalysts in Europe.</p>
<p>In 1894 she published <em>Friedrich Nietzsche in seinen Werken</em>, the first serious book about Nietzsche's philosophy, written by someone who had argued with him face to face. Anna Freud later said the book was, in effect, psychoanalysis before the word existed. Salomé wrote around ten novels and more than fifty essays, on the erotic, on the divine, on what she called the difference between the way women and men come to selfhood. In 1911, at fifty, she met Freud and threw herself into psychoanalysis with the hunger of a much younger woman; he let her attend his Vienna lectures, the only woman he did, and came to treat her as a genuine colleague and friend. She practised as an analyst into her seventies. We remember her because she insisted, at real cost, that a woman could be a mind and not merely a muse — and then spent her life proving it.</p>

<h4>Family Life</h4>
<p>Her family of origin was that houseful of adoring brothers and a beloved, difficult father whose death when she was young left a hole she chased through older men for years. The family she made for herself was stranger and more deliberate. In 1887 she married Friedrich Carl Andreas, an orientalist scholar in Berlin, a passionate and volatile man who loved her fiercely. She agreed to marry him only after he stabbed himself in the chest in front of her during one of their quarrels — a wound he survived — and she agreed on one astonishing condition: the marriage would never be consummated. It never was. They stayed married for forty-three years, until his death, in a union that was intellectual and domestic and, on her side, resolutely chaste, whatever she did outside it.</p>
<p>She had no children. She kept, instead, a household of ideas and correspondents, a garden in Göttingen, and a long roster of the century's most interesting people passing through her rooms. It was an odd family by any measure, built entirely to her own specification, which was rather the point. She had watched what ordinary marriage did to clever women and simply declined to be done to.</p>

<h4>Romantic Life</h4>
<p>This is the part the world could never leave alone. In the spring of 1882, in Rome, she met the thirty-seven-year-old Nietzsche through their mutual friend Paul Rée. Nietzsche was electrified. Within days, some say at their second meeting, he asked her to marry him — twice, through Rée and then himself — and twice she refused. What she wanted was not a husband but a mind to think beside; she proposed instead that the three of them live and study together, a "holy trinity" of the intellect. There is a famous, notorious photograph she staged: Rée and Nietzsche harnessed to a little cart, and Lou kneeling in it holding a whip. The experiment collapsed in jealousy, Nietzsche's sister Elisabeth poisoned it with slander, and Nietzsche went off wounded to write <em>Thus Spoke Zarathustra</em>. He never entirely got over her.</p>
<p>Then came Rilke. In 1897 she met the young poet — she was thirty-six, he twenty-one and still calling himself René — and they became lovers. She renamed him Rainer, corrected his handwriting, taught him Russian, took him twice to Russia to meet Tolstoy, and shaped the sensibility that produced his greatest work. When she ended the affair she did not end the bond; she remained his confidante and, when he was breaking down, something close to his analyst, until his death in 1926. Only after her long marriage was underway did she seem to allow herself physical passion at all, and then with a series of younger men. She loved on her own terms, refused to be possessed, and paid for it in reputation — femme fatale, man-eater, opportunist — the words a threatened world reaches for when a woman will not be owned.</p>

<h4>Life Until Death</h4>
<p>Her last decades were her most settled and, in a way, her happiest. Rooted in Göttingen, deep in her work with Freud, she analysed patients, wrote her essays on psychoanalysis and religion, and toward the very end set down <em>Lebensrückblick</em> ("Looking Back"), the memoir of a woman who had lived exactly as she chose and regretted almost none of it. Her husband died in 1930; Rilke was already gone; Freud stayed a faithful correspondent to the last.</p>
<p>She died in her sleep in Göttingen on 5 February 1937, a week short of seventy-six, of kidney failure and heart trouble. There is a final cruelty to the timing: shortly before her death the Gestapo came and confiscated her library, and after she died the Nazis denounced her work as "Jewish" — she had been Freud's friend and a practitioner of that "Jewish science," psychoanalysis. The books she had spent a lifetime gathering were taken from her at the end. But the thing itself, the fierce unowned self she had built, they could not confiscate. She had told life, at nineteen, that she would love it whole, joy and harm together, and she had meant it all the way down.</p>

<h4>Their Works</h4>
<p>Her one piece of writing that everyone can hold is a poem she wrote around 1881, at nineteen or twenty, a Zurich student who had just lost her God and decided to love life anyway, without conditions and without the promise of reward. She called it <strong>Lebensgebet</strong> — "Life-Prayer," or "Prayer to Life." When Nietzsche read it in 1882 he loved it so much he set it to music; his choral <em>Hymnus an das Leben</em> is her words. He wanted, he said, a song that might "seduce people to my philosophy" — the philosophy of saying yes to existence exactly as it comes. That whole idea, the great <em>amor fati</em> he built his life around, is already here, written by a teenage girl before they ever met.</p>
<p>Here is the poem in her German, which is public domain, with a plain literal rendering underneath. Read the last two lines slowly. A grieving God-less nineteen-year-old telling life that even if it has no happiness left to give her, that is all right — it still has its pain to offer, and she will take that too.</p>
<blockquote>Gewiß, so liebt ein Freund den Freund<br>
Wie ich dich liebe, Rätselleben --<br>
Ob ich in Dir gejauchzt, geweint,<br>
Ob du mir Glück, ob Schmerz gegeben.<br><br>
Ich liebe Dich samt deinem Harme,<br>
Und wenn du mich vernichten mußt,<br>
Entreiße ich mich Deinem Arme,<br>
Wie Freund sich reißt von Freundesbrust.<br><br>
Mit ganzer Kraft umfaß ich Dich!<br>
Laß Deine Flammen mich entzünden,<br>
Laß noch in Glut des Kampfes mich<br>
Dein Rätsel tiefer nur ergründen.<br><br>
Jahrtausende zu sein! zu denken!<br>
Schließ mich in beide Arme ein:<br>
Hast Du kein Glück mehr mir zu schenken --<br>
Wohlan -- noch hast Du Deine Pein.</blockquote>
<p><em>Literal rendering:</em> Surely, a friend loves a friend the way I love you, riddle-life — whether I have shouted for joy in you or wept, whether you gave me happiness or pain. I love you together with your grief, and if you must destroy me, I tear myself from your arms the way a friend tears himself from a friend's breast. With all my strength I embrace you! Let your flames set me alight, let me, still in the white heat of the struggle, fathom your riddle only deeper. To be for thousands of years! to think! Close me in both your arms: if you have no more happiness to give me — very well — you still have your pain.</p>
<p>And one line of her prose, on why she never held back from experience, from the letters and essays gathered after her death: she wrote that whoever reaches into a rosebush may seize only a handful of flowers, and no matter how many one holds it is only a small part of the whole — but a handful is enough to know the nature of the roses. The refusal was never to reach in at all. She reached in her whole life.</p>
<p><em>"Lebensgebet" (c. 1881), German text public domain, confirmed against</em> Lebensrückblick <em>(Severus Verlag ed., p. 47). English is a literal crib, not a verse translation. The rose passage is paraphrased from her essays.</em>`;

const existing = await one('select id from figures where slug = $1', [slug]);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, slug, name, epithet, lifespan, 'sep 13, 2026', epithet, body, quote, quoteSource],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
