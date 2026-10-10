import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const slug = 'federico-garcia-lorca';
const name = 'Federico García Lorca';
const epithet = 'Federico García Lorca · 5 June 1898, Fuente Vaqueros, Granada – shot before dawn on or about 18 August 1936, near Víznar · a piano-playing, sun-drenched, endlessly beloved boy from an Andalusian farm who grew into the most famous poet and playwright Spain had produced in three hundred years, wrote the darkest, most death-haunted verse of his century, said that no true art arrives without the possibility of death near it, and was then dragged out and murdered by fascist gunmen at thirty-eight, his body thrown into an unmarked pit that has never been found';
const lifespan = 'Spanish · poetry & drama · 1898–1936';
const quote = `El duende no llega si no ve posibilidad de muerte, si no sabe que ha de rondar su casa, si no tiene seguridad de que ha de mecer esas ramas que todos llevamos, que no tienen, que no tendrán consuelo.

The duende does not come unless it sees the possibility of death, unless it knows it will haunt death's house, unless it is certain it will rock those branches we all carry — branches that do not have, and will never have, any consolation.`;
const quoteSource = 'Federico García Lorca, "Juego y teoría del duende" (lecture, Buenos Aires, 1933); Spanish public domain, literal English rendering';

const body = `
<h4>Childhood &amp; Early Life</h4>
<p>He was born on 5 June 1898 in Fuente Vaqueros, a green village on the flat fertile plain west of Granada, the first surviving child of a well-off farmer, Federico García Rodríguez, and his second wife, Vicenta Lorca, a schoolteacher. It mattered enormously that his mother taught: she gave him books and music before he could really read, and it was from the farmhands and washerwomen and the wet-nurse of that valley that he soaked up the thing he never lost — the old ballads, the lullabies, the cante jondo of the Gypsies, the folk songs that he would later spend his life turning into the highest art.</p>
<p>He was a slow, dreamy, physically clumsy boy who did not walk until nearly four and who preferred, always, to make little theatres, to say Mass to an audience of servants, to sit at the piano. Music, not poetry, was his first vocation; he trained seriously and might have been a composer if a beloved teacher had not died. The family moved into the city of Granada when he was eleven, and there, at the university, this cheerful, magnetic, not-very-diligent student began to gather around him the friends and the sound of a life in art. Everyone who met him said the same impossible thing: that a room changed temperature when he entered it, that he seemed to be made of light and music and generosity — and that underneath it ran a vein of something very dark.</p>

<h4>What They Did &amp; Why They're Remembered</h4>
<p>Lorca is the most widely read, most loved, most translated Spanish poet since the Golden Age, and at the same time one of the greatest playwrights of the twentieth century — a rare double. In 1919 he moved to the Residencia de Estudiantes in Madrid, the brilliant liberal college where he lived for years alongside the painter Salvador Dalí and the filmmaker Luis Buñuel; the three of them, for a while, were the future of Spanish art in one building. In 1928 his <em>Romancero gitano</em> (Gypsy Ballads) made him nationally famous overnight — gorgeous, violent, moon-soaked ballads about Andalusian Gypsies that everyone could recite and that he grew to resent for boxing him in as a folkloric charmer.</p>
<p>To escape the fame and a painful heartbreak he went to New York in 1929–30, and the crash and the loneliness and the vast indifferent city broke something open in him: out came <em>Poeta en Nueva York</em>, a howling surrealist book about capitalism, cruelty, and Black suffering in Harlem, utterly unlike anything he'd written. Home again, under the Republic, he ran a travelling student theatre company called <strong>La Barraca</strong>, taking the classic plays out to peasants in villages that had never seen a stage. And in his last five years he wrote the tragedies that made him immortal on the stage — <em>Bodas de sangre</em> (Blood Wedding), <em>Yerma</em>, and <em>La casa de Bernarda Alba</em> (The House of Bernarda Alba) — plays about women crushed by honour, repression, barrenness, and desire, dark rural dramas that are still performed everywhere on earth. We remember him because he fused the folk soul of a people with the most sophisticated modern art, and because he understood, better than almost anyone, that beauty and death are the same subject.</p>

<h4>Family Life</h4>
<p>His family was the warm ground he stood on his whole life. He never really left them — even famous, even grown, he came home to the family houses in Granada and at the Huerta de San Vicente every summer to write, surrounded by parents and siblings who adored him and never once made him feel he had to be anyone but himself. His younger brother Francisco became a diplomat and, later, his brother's careful memoirist; his sister Isabel outlived them all. His father's money quietly bankrolled his freedom to be an artist and never demanded he take a real job. There is something almost unbearable, given the ending, in how loved and sheltered he was at home: the boy the whole family protected was the one who could not be protected.</p>

<h4>Romantic Life</h4>
<p>Lorca was homosexual, in a Catholic, macho, conservative Spain where that was dangerous and unspeakable, and the tension between the desire he felt and the world that forbade it is the pressure under nearly everything he wrote. He hid it in public and lived it in private, and it cost him. The great wound of his twenties was the sculptor Emilio Aladrén, whose turn toward a woman helped send Lorca fleeing to New York. His deepest love was probably Rafael Rodríguez Rapún, the passionate, athletic secretary of La Barraca, who was with him in his final years and who was himself killed in the war not long after. Only near the very end did he dare to write it almost openly, in the <em>Sonetos del amor oscuro</em> — the Sonnets of Dark Love — which his family kept private for half a century. He wrote about frustrated desire, sterility, and forbidden longing with such force precisely because he knew them from the inside, in a body he was never allowed to live in freely.</p>

<h4>Life Until Death</h4>
<p>In July 1936 the generals rose against the Spanish Republic and the Civil War began. Lorca — famous, left-leaning, openly friendly with the Republic, and homosexual — was exactly the kind of man the fascist side wanted dead, though he was not really political in any party sense; he was a poet who loved the poor. He left Madrid for what he thought was the safety of home in Granada, one of the worst possible choices, because Granada fell almost at once to the Nationalists and became a slaughterhouse. He took shelter in the house of a friend's family, but he was denounced, arrested, and on or about 18 August 1936, in the grey hours before dawn, driven out to the countryside near the villages of Víznar and Alfacar and shot along with a schoolteacher and two anarchist bullfighters. He was thirty-eight. His body was thrown into an unmarked common grave. Despite excavations and searches that continue to this day, it has never been found. The greatest Spanish poet of the century has no tomb.</p>

<h4>Their Works</h4>
<p>Begin where his whole vision lives in sixteen lines. This is the "Rider's Song," from <em>Canciones</em> — a man rides through the night toward a city he will never reach, because death is watching him from its towers. It is Lorca entire: the black horse, the big moon, death waiting patiently at the end of a road you keep travelling anyway.</p>
<blockquote>Córdoba.<br>
Lejana y sola.<br><br>
Jaca negra, luna grande,<br>
y aceitunas en mi alforja.<br>
Aunque sepa los caminos<br>
yo nunca llegaré a Córdoba.<br><br>
Por el llano, por el viento,<br>
jaca negra, luna roja.<br>
La muerte me está mirando<br>
desde las torres de Córdoba.<br><br>
¡Ay qué camino tan largo!<br>
¡Ay mi jaca valerosa!<br>
¡Ay, que la muerte me espera,<br>
antes de llegar a Córdoba!<br><br>
Córdoba.<br>
Lejana y sola.</blockquote>
<p><em>Literal rendering:</em> Córdoba. Distant and alone. Black mare, big moon, and olives in my saddlebag. Though I know the roads, I will never reach Córdoba. Across the plain, through the wind, black mare, red moon. Death is watching me from the towers of Córdoba. Oh, what a long road! Oh, my brave mare! Oh, death is waiting for me before I reach Córdoba! Córdoba. Distant and alone.</p>
<p>Then the opening of the poem that made him famous, "Romance de la luna, luna," from the <em>Romancero gitano</em>. The moon comes down to the Gypsies' forge as a pale woman in a bustle of white flowers and dances for a little boy who is left alone with her — and the reader knows, the way you know in a nightmare, that she is death and that she is going to take him. Notice how tenderness and dread are the same gesture here.</p>
<blockquote>La luna vino a la fragua<br>
con su polisón de nardos.<br>
El niño la mira, mira.<br>
El niño la está mirando.<br><br>
En el aire conmovido<br>
mueve la luna sus brazos<br>
y enseña, lúbrica y pura,<br>
sus senos de duro estaño.<br><br>
Huye luna, luna, luna.<br>
Si vinieran los gitanos,<br>
harían con tu corazón<br>
collares y anillos blancos.</blockquote>
<p><em>Literal rendering:</em> The moon came to the forge with her bustle of white spikenards. The child looks at her, looks. The child is watching her. In the stirred air the moon moves her arms and shows, lewd and pure, her breasts of hard tin. Flee, moon, moon, moon. If the Gypsies came, they would make of your heart white necklaces and rings.</p>
<p>Now the most famous elegy in the Spanish language. When his friend the great bullfighter Ignacio Sánchez Mejías was gored to death in the ring in 1934, Lorca wrote the <em>Llanto por Ignacio Sánchez Mejías</em>, whose first movement hammers a single line — "at five in the afternoon" — like a funeral bell that will not stop, until the exact hour of a death becomes the whole world.</p>
<blockquote>A las cinco de la tarde.<br>
Eran las cinco en punto de la tarde.<br>
Un niño trajo la blanca sábana<br>
a las cinco de la tarde.<br>
Una espuerta de cal ya prevenida<br>
a las cinco de la tarde.<br>
Lo demás era muerte y sólo muerte<br>
a las cinco de la tarde.</blockquote>
<p><em>Literal rendering:</em> At five in the afternoon. It was exactly five in the afternoon. A boy brought the white sheet at five in the afternoon. A basket of lime already prepared at five in the afternoon. The rest was death and only death at five in the afternoon.</p>
<p>And finally his own idea of where art comes from, which reads now like a prophecy of his death. In a 1933 lecture, "Juego y teoría del duende," Lorca tried to name the mysterious dark power — the <em>duende</em> — that separates merely skilled performance from the kind that wounds you. It is not a muse or an angel that visits from outside and above; it climbs up "from the soles of the feet," from the blood, and it only comes where death is close.</p>
<blockquote>Todo lo que tiene sonidos negros tiene duende. Y no hay verdad más grande. Estos sonidos negros son el misterio, las raíces que se clavan en el limo que todos conocemos, que todos ignoramos, pero de donde nos llega lo que es sustancial en el arte.</blockquote>
<p><em>Literal rendering:</em> Everything that has black sounds has duende. And there is no greater truth. These black sounds are the mystery, the roots that fasten into the mire that we all know, that we all ignore, but from which comes to us what is substantial in art. He also said, in the same lecture, that the duende never arrives unless it sees the possibility of death — which is the line at the very top of this page, and which he wrote three years before the gunmen came for him in the dark.</p>
<p><em>All Spanish texts here are in the public domain. "Canción de jinete" is from</em> Canciones <em>(1921–1924); "Romance de la luna, luna" from</em> Romancero gitano <em>(1928); the</em> Llanto por Ignacio Sánchez Mejías <em>from 1935; the duende passages from the lecture</em> Juego y teoría del duende <em>(1933). English renderings are literal cribs, not verse translations.</em>`;

const existing = await one('select id from figures where slug = $1', [slug]);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, slug, name, epithet, lifespan, 'sep 15, 2026', epithet, body, quote, quoteSource],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
