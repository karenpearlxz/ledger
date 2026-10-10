import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const slug = 'ann-radcliffe';
const name = 'Ann Radcliffe';
const epithet = 'Ann Ward Radcliffe · London, 9 July 1764 – London, 7 February 1823 · the shy tradesman\u2019s daughter who never travelled to any of the wild countries she wrote about, invented the whole grammar of Gothic dread, became the highest-paid novelist in England, and then simply stopped \u2014 vanished from public life for twenty-six years while the rumour spread that her own books had driven her mad';
const lifespan = 'English Gothic novelist & poet · 1764\u20131823 · mother of the Female Gothic';
const quote = `"Terror and horror are so far opposite, that the first expands the soul, and awakens the faculties to a high degree of life; the other contracts, freezes, and nearly annihilates them."`;
const quoteSource = 'Ann Radcliffe, "On the Supernatural in Poetry," New Monthly Magazine (1826), published posthumously; public domain';

const body = `
<h4>Childhood &amp; Early Life</h4>
<p>She was born Ann Ward in Holborn, London, on 9 July 1764, the only child of a haberdasher and his wife \u2014 comfortable, respectable, trade people who lived in well-to-do gentility and had no idea they had produced the woman who would teach an entire century how to be afraid. She was quiet to the point of invisibility. Almost nothing survives of her early life, and that is itself the first thing to know about her: even her own contemporaries, at the height of her fame, could not tell you what she looked like, where she went, or what she thought. She had relatives who moved in intellectual circles \u2014 a great-uncle ran the famous Wedgwood pottery, and through that side she brushed against literary and scientific society \u2014 but Ann herself stayed at the edge of every room. She read enormously and travelled almost nowhere. This is the great paradox of her whole life and it is worth holding onto: the woman who filled her novels with the Alps and the Apennines, with Italian castles and French forests and the crags of the Pyrenees, had barely left England. She built those terrifying landscapes entirely out of paintings, poems, travel books, and her own extraordinary interior weather. The mountains she is famous for were inside her.</p>

<h4>What She Did &amp; Why She\u2019s Remembered</h4>
<p>Radcliffe did not, strictly, invent the Gothic novel \u2014 Horace Walpole got there first with <em>The Castle of Otranto</em> in 1764, the very year she was born. What she did was far more important: she made it work on the nerves. She took the clanking machinery of ghosts and haunted castles and discovered that the fear lives not in the monster but in the <em>waiting</em> for the monster \u2014 in the shadow, the half-heard sound, the door that might open, the thing behind the black veil that you are not shown for hundreds of pages. She is the mother of suspense as we now understand it. Between 1789 and 1797 she published five novels of steadily rising fame, and with <em>The Mysteries of Udolpho</em> (1794) and <em>The Italian</em> (1797) she became the most popular and one of the highest-paid novelists in all of England \u2014 a woman, writing terror, out-earning nearly every man in the trade. Her villains are the true innovation. Montoni in <em>Udolpho</em> and the monk Schedoni in <em>The Italian</em> are not gargoyles; they are psychological studies, magnetic and self-tormented, the direct ancestors of every brooding, dangerous, intelligent man in the two centuries of fiction since. And she made one distinction that literary criticism still runs on today: the difference between <em>terror</em>, which expands the soul, and <em>horror</em>, which freezes it. Everything Karen reaches for \u2014 the slow build, the dread before the reveal, the smart obsessive detective, the villain you can\u2019t look away from \u2014 runs straight back through Poe and the Bront\u00ebs and every psychological thriller on her shelf to this one reclusive Englishwoman.</p>

<h4>Family Life</h4>
<p>In 1787, at twenty-three, she married William Radcliffe, a young Oxford graduate who had given up law for journalism and would eventually manage a newspaper, the <em>English Chronicle</em>. It seems to have been, quietly, a good marriage \u2014 no scandal, no children, no drama that anyone recorded. And the shape of it is lovely and a little sad: William worked late most evenings, out at the paper, and Ann, alone in the house at night, began to write to fill the empty hours. That is the origin of the most frightening fiction of the age \u2014 a woman by candlelight, waiting for her husband to come home, turning the silence and the dark of the house into art. He read what she wrote, encouraged her, and never seems to have resented that his wife had become vastly more famous than he was. They had no children. They travelled together when she finally allowed herself to \u2014 a trip down the Rhine, tours of the English lakes and the south coast \u2014 and she kept detailed journals of the real landscapes, as if checking her imagination against the world at last. For the most part it was the two of them, quietly, and her books.</p>

<h4>Romantic Life</h4>
<p>There is, in the ordinary sense, no romantic story to tell \u2014 and with Radcliffe that absence is the story. She married once, stayed married, and poured all her romantic imagination onto the page instead of into gossip. What is fascinating is <em>where</em> that imagination went. Her heroines are besieged by dangerous, controlling men, and her novels are, underneath the ghosts, careful anatomies of what it is to be a woman with no power trapped inside a man\u2019s house \u2014 the locked door, the vanished protector, the fortune someone else controls, the marriage you are being forced toward. She wrote, again and again, about the sublime terror of being at the mercy of a compelling and frightening man, and about the heroine\u2019s stubborn refusal to be broken by it. She let her women be curious, self-possessed, and finally free \u2014 and she always, unlike her gorier male rivals, brought them out the other side alive and unbowed. It is not hard to see why the guarded, private, deeply feeling reader is drawn to her: she understood the pull toward intensity and the absolute necessity of keeping your own centre while you feel it.</p>

<h4>Life Until Death</h4>
<p>And then, at the very top \u2014 famous, rich, imitated everywhere, the queen of a genre \u2014 she simply walked away. After <em>The Italian</em> in 1797 she never published another novel in her lifetime. She was thirty-three. She lived the next twenty-six years in complete privacy, travelling with William, keeping her journals, writing poems and one last historical romance that she chose not to release. The public could not bear the silence, so it invented explanations, and every one of them is telling: that she had gone insane from writing about terror, that the horrors of her own imagination had unhinged her, that she was dead already. None of it was true. She was simply a private woman who had said what she came to say and refused to perform for anyone. In early 1823 she went to Ramsgate on the coast, caught a chest infection that turned into pneumonia, and died in London on 7 February 1823, aged fifty-eight. Even her death fed the legend \u2014 for years afterward people repeated the story that she had died mad. She had not. She had died the way she lived: quietly, on her own terms, unwilling to be looked at. Her essay defining terror and horror, and her final novel, were published only after she was gone.</p>

<h4>Their Works</h4>
<p>Start where all of it begins \u2014 with the sentence that founded modern suspense. In her essay <em>On the Supernatural in Poetry</em>, written near the end of her life and published in 1826 after her death, Radcliffe stages a conversation between two travellers and lets one of them say the thing every thriller writer since has lived by. This is the whole difference between a cheap scare and real dread, set down two hundred years ago:</p>
<blockquote>Terror and horror are so far opposite, that the first expands the soul, and awakens the faculties to a high degree of life; the other contracts, freezes, and nearly annihilates them. I apprehend, that neither Shakespeare nor Milton by their fictions, nor Mr. Burke by his reasoning, anywhere looked to positive horror as a source of the sublime, though they all agree that terror is a very high one; and where lies the great difference between horror and terror, but in the uncertainty and obscurity, that accompany the first, respecting the dreaded evil?<br><br><em>\u2014 "On the Supernatural in Poetry" (1826), public domain</em></blockquote>
<p>She was also, quietly, a real poet \u2014 she scattered verse all through her novels and collected it late in life. Here is <em>Night</em>, and you can feel in it the entire Gothic sensibility distilled into four stanzas: the love of the dark not as evil but as a state that wakes the soul up, the "pleasing dread," the "viewless spirit in the wind." This is a woman who found the terrifying beautiful and said so plainly:</p>
<blockquote>Now Ev\u2019ning fades! her pensive step retires,<br>
And Night leads on the dews, and shadowy hours:<br>
Her awful pomp of planetary fires,<br>
And all her train of visionary powers.<br><br>
These paint with fleeting shapes the dream of sleep,<br>
These swell the waking soul with pleasing dread;<br>
These through the glooms in forms terrific sweep,<br>
And rouse the thrilling horrors of the dead!<br><br>
Queen of the solemn thought \u2014 mysterious Night!<br>
Whose step is darkness, and whose voice is fear!<br>
Thy shades I welcome with severe delight,<br>
And hail thy hollow gales, that sigh so drear!<br><br>
When, wrapt in clouds, and riding in the blast,<br>
Thou roll\u2019st the storm along the sounding shore,<br>
I love to watch the whelming billows, cast<br>
On rocks below, and listen to the roar.<br><br>
Thy milder terrors, Night, I frequent woo,<br>
Thy silent lightnings, and thy meteor\u2019s glare,<br>
Thy northern fires, bright with ensanguine hue,<br>
That light in heaven\u2019s high vault the fervid air.<br><br>
But chief I love thee, when thy lucid car<br>
Sheds through the fleecy clouds a trembling gleam,<br>
And shews the misty mountain from afar,<br>
The nearer forest, and the valley\u2019s stream:<br><br>
And nameless objects in the vale below,<br>
That floating dimly to the musing eye,<br>
Assume, at Fancy\u2019s touch, fantastic shew,<br>
And raise her sweet romantic visions high.<br><br>
Then let me stand amidst thy glooms profound<br>
On some wild woody steep, and hear the breeze<br>
That swells in mournful melody around,<br>
And faintly dies upon the distant trees.<br><br>
What melancholy charm steals o\u2019er the mind!<br>
What hallow\u2019d tears the rising rapture greet!<br>
While many a viewless spirit in the wind<br>
Sighs to the lonely hour in accents sweet!<br><br>
Ah! who the dear illusions pleas\u2019d would yield,<br>
Which Fancy wakes from silence and from shades,<br>
For all the sober forms of Truth reveal\u2019d,<br>
For all the scenes that Day\u2019s bright eye pervades!<br><br><em>\u2014 "Night," from</em> The Poems of Mrs. Ann Radcliffe <em>(1816), public domain</em></blockquote>
<p>And here is <em>Song of a Spirit</em>, from <em>The Romance of the Forest</em> (1791) \u2014 the poem she puts in the mouth of an unseen presence, a voice from the air itself. Watch how it starts as pure lightness and wonder, a spirit skimming the seas and the stars, and then turns, in the last stanzas, into something that "wakes the dead." That pivot from beauty to dread, mid-song, is the entire Radcliffe machine in miniature:</p>
<blockquote>In the sightless air I dwell,<br>
On the sloping sun-beams play;<br>
Delve the cavern\u2019s inmost cell,<br>
Where never yet did daylight stray.<br><br>
Dive beneath the green sea waves,<br>
And gambol in the briny deeps;<br>
Skim every shore that Neptune laves,<br>
From Lapland\u2019s plains to India\u2019s steeps.<br><br>
Oft I mount with rapid force<br>
Above the wide earth\u2019s shadowy zone;<br>
Follow the day-star\u2019s flaming course<br>
Through realms of space to thought unknown:<br><br>
And listen oft celestial sounds<br>
That swell the air unheard of men,<br>
As I watch my nightly rounds<br>
O\u2019er woody steep and silent glen.<br><br>
Under the shade of waving trees,<br>
On the green bank of fountain clear,<br>
At pensive eve I sit at ease,<br>
While dying music murmurs near.<br><br>
And oft on point of airy clift,<br>
That hangs upon the western main,<br>
I watch the gay tints passing swift,<br>
And twilight veil the liquid plain.<br><br>
Then, when the breeze has sunk away,<br>
And ocean scarce is heard to lave,<br>
For me the sea-nymphs softly play<br>
Their dulcet shells beneath the wave.<br><br>
Their dulcet shells! I hear them now,<br>
Slow swells the strain upon mine ear;<br>
Now faintly falls \u2014 now warbles low,<br>
Till rapture melts into a tear.<br><br>
The wanderer owns my power<br>
In shadows dire that substance seem;<br>
In thrilling sounds that murmur woe,<br>
And pausing silence makes more dread;<br>
In music breathing from below<br>
Sad, solemn strains, that wake the dead.<br><br><em>\u2014 "Song of a Spirit," from</em> The Romance of the Forest <em>(1791), public domain</em></blockquote>
<p>If you want to read her at full length, <em>The Mysteries of Udolpho</em> (1794) is the one \u2014 the novel Jane Austen affectionately mocked in <em>Northanger Abbey</em> precisely because everyone she knew was devouring it, and the novel that gave us the black veil that the heroine lifts, faints at, and refuses to describe for hundreds of pages. That withheld image \u2014 the dread of the unseen thing \u2014 is Radcliffe\u2019s single greatest invention, and it is the reason every good scare you have ever had was built by a shy woman who wrote by candlelight while she waited for her husband to come home. All of her work is in the public domain and freely readable on Project Gutenberg.</p>`;

const existing = await one('select id from figures where slug = $1', [slug]);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, slug, name, epithet, lifespan, 'sep 18, 2026', epithet, body, quote, quoteSource],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
