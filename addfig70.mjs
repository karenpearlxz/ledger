import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const slug = 'anne-bradstreet';
const name = 'Anne Bradstreet';
const epithet = 'Anne Bradstreet \u00b7 c. 1612, Northamptonshire, England \u2013 16 September 1672, Andover, Massachusetts \u00b7 the first poet, man or woman, to publish a book of English verse written in the New World; a Puritan mother of eight who wrote love poems hot enough to embarrass her century, buried three grandchildren in four years, watched her house and eight hundred books burn to ash, privately confessed to her children that she sometimes doubted whether God was there at all, and kept writing anyway';
const lifespan = 'Colonial New England \u00b7 Massachusetts Bay Colony \u00b7 1612\u20131672';
const quote = `If ever two were one, then surely we.\nIf ever man were loved by wife, then thee.`;
const quoteSource = 'Anne Bradstreet, "To My Dear and Loving Husband," published 1678, public domain';

const body = `
<h4>Childhood &amp; Early Life</h4>
<p>She was born Anne Dudley around 1612 in Northamptonshire, England, into a household that gave her the one thing almost no girl of her century got: books. Her father, Thomas Dudley, was the steward who ran the vast estate of the Earl of Lincoln, and that position meant the family lived in cultured, comfortable circumstances and, crucially, had access to the Earl's enormous library. Dudley believed his daughter should be educated, and she was, unusually and thoroughly, tutored in history, literature, and several languages, reading Virgil and Plutarch and Sir Philip Sidney and the Bible with equal appetite. She grew up clever, devout, and quietly ambitious in a world that had no category for an ambitious woman.</p>
<p>Her body tested her early. As a girl she caught smallpox, the disease that killed and disfigured so many, and survived it, one of several serious illnesses that would stalk her whole life. At sixteen she married Simon Bradstreet, a young Cambridge graduate who also worked for the Earl and who had, in effect, grown up alongside her. It was, by every sign in her later poems, a real love match and not merely an arrangement. Two years later the entire world she knew ended. Her father, her husband, and she herself were devout Puritans, and in 1630 they joined John Winthrop's great migration, sailing on the flagship <em>Arbella</em> across the Atlantic to build a godly commonwealth in the Massachusetts wilderness. She was eighteen, and she was leaving England forever.</p>

<h4>What They Did &amp; Why They're Remembered</h4>
<p>She became the first published poet of the Americas, and she did it almost by accident, or at least without asking. In 1650 her brother-in-law, a minister named John Woodbridge, carried a manuscript of her poems back to London and had it printed under the title <em>The Tenth Muse Lately Sprung Up in America</em>, "by a Gentlewoman of those Parts." Overnight, a Puritan housewife on the edge of a colonial wilderness was a published author in London, the first woman to be published as a poet in both England and the New World. The prefaces are full of nervous male voices swearing the poems really were written by a woman, and that she had not neglected her housework to write them, which tells you exactly how impossible her achievement was supposed to be.</p>
<p>The irony is that the poems that made her famous in 1650, long, learned, formal sequences on the four elements, the four humours, the ages of man, the seasons, and the rise and fall of monarchies, are not the ones we love her for now. Her greatness is in the private poems she never sent to any press, the ones published only after her death in 1678: the love poems to Simon, the trembling verses written before childbirth, the lines on her house burning down, the elegies for her dead grandchildren. In those she stopped imitating the great male poets and simply told the truth about her own life, a woman's life, its loves and pregnancies and losses and doubts, in plain strong English. She is remembered because she was the first person in her tradition to make poetry out of exactly that, and because two and a half centuries later she was claimed, rightly, as the mother of American literature.</p>

<h4>Family Life</h4>
<p>Family was the whole substance of her life and most of her subject matter. She and Simon eventually had eight children, Samuel, Dorothy, Sarah, Simon, Hannah, Mercy, Dudley, and John, though children came slowly at first and she wrote with real anguish about the years she feared she was barren. Once they arrived she raised all eight to adulthood, which in the seventeenth century was close to a miracle, in a drafty frontier house, through fevers and hard winters, while her husband rose to become a colonial magistrate and eventually governor and was often away on public business. She ran the household, taught the children, and wrote at the edges of exhausted days.</p>
<p>The deaths came for the next generation. Between 1665 and 1669 she lost three grandchildren, tiny Elizabeth at a year and a half, another grandchild, and the infant Simon at just over a month old, along with her daughter-in-law Mercy. For a woman whose faith insisted that every death was God's just will, this was almost unbearable, and the elegies she wrote reveal the strain in the very meter: she says the correct pious thing, "yet is He good," but you can hear her nearly choking on it. She loved these children fiercely and she was not able, quite, to pretend the losses did not enrage her. That honesty is what keeps the poems alive.</p>

<h4>Romantic Life</h4>
<p>Here is where she quietly scandalises the stereotype of the cold Puritan. Anne Bradstreet was openly, physically, unashamedly in love with her husband, and she wrote it down. "If ever two were one, then surely we. / If ever man were loved by wife, then thee," she begins one poem, and she means it as fact, not flattery. When Simon was away on colony business she wrote him letters in verse that ache with longing, calling herself a deer with no joy in the pasture until her mate returns, comparing him to the sun gone so far south in its zodiac that she is left in permanent winter, begging the heavens to bring him home. There is nothing chilly or dutiful in it. It is one of the frankest records of married desire in early English poetry, and it comes from a woman the schoolbooks paint as grim.</p>
<p>What makes it more moving is that she knew how fragile it all was. Every pregnancy could kill her, childbirth being the leading killer of women of her age, and so before at least one delivery she wrote Simon a farewell poem in case she died on the bed, asking him to remember her virtues, forget her faults, keep loving her when she was gone, and above all protect their children from the cruelty of a stepmother. She was writing love and grief at the same instant, in the same breath, which is perhaps the truest thing anyone can say about loving another person: that the loss is folded inside the love from the very beginning.</p>

<h4>Life Until Death</h4>
<p>Her later years were a slow accumulation of losses borne on a failing body. She was chronically ill, writing poems with titles like "For Deliverance from a Fever" and "From Another Sore Fit," her lungs and strength gradually giving way. Then, on the night of 10 July 1666, she woke to screams of "fire" and stood in the yard and watched her house burn to the ground, everything in it gone, including the library of some eight hundred books that had been the great treasure of her life. The poem she wrote about it is a masterpiece of a soul arguing with itself: she reaches, again, for the pious answer, "It was his own, it was not mine," but she cannot stop her eyes from wandering to the ashes, "Here stood that trunk, and there that chest," grieving the specific vanished things, the table where guests once sat, the corner where she lay.</p>
<p>The most remarkable document of her inner life is a letter she wrote in prose "To My Dear Children," meant to be read after she died. In it, this pillar of the Puritan establishment confesses that faith did not come easily, that "many times hath Satan troubled me concerning the verity of the Scriptures," that she had wrestled with whether there was any God at all, and had to fight her way back to belief again and again. It is astonishingly honest, a woman refusing to lie about her own doubt even to comfort her children. She died on 16 September 1672, at about sixty, worn out by consumption, tuberculosis, with Simon beside her. He remarried four years later. Her best poems would not be printed until six years after her death, and her real fame took two more centuries to arrive.</p>

<h4>Their Works</h4>
<p>Everything below is in the public domain. Read the personal poems, the ones she never tried to publish, because that is where she is most alive: a mother, a wife, a griever, a doubter, writing in plain seventeenth-century English that still lands like a hand on the shoulder.</p>

<p><strong>To My Dear and Loving Husband.</strong> The most famous love poem in early American literature, and deservedly. Twelve lines, no wasted word.</p>
<blockquote>If ever two were one, then surely we.<br>
If ever man were loved by wife, then thee.<br>
If ever wife was happy in a man,<br>
Compare with me, ye women, if you can.<br>
I prize thy love more than whole mines of gold,<br>
Or all the riches that the East doth hold.<br>
My love is such that rivers cannot quench,<br>
Nor ought but love from thee give recompense.<br>
Thy love is such I can no way repay;<br>
The heavens reward thee manifold, I pray.<br>
Then while we live, in love let's so persever,<br>
That when we live no more, we may live ever.</blockquote>

<p><strong>Before the Birth of One of Her Children.</strong> A farewell letter in verse, written in case she died giving birth, holding love and terror in the same hand. The line about being loved after death is one of the great endings in the language.</p>
<blockquote>All things within this fading world hath end,<br>
Adversity doth still our joyes attend;<br>
No ties so strong, no friends so dear and sweet,<br>
But with death's parting blow is sure to meet.<br>
The sentence past is most irrevocable,<br>
A common thing, yet oh inevitable.<br>
How soon, my Dear, death may my steps attend,<br>
How soon't may be thy Lot to lose thy friend,<br>
We are both ignorant, yet love bids me<br>
These farewell lines to recommend to thee,<br>
That when that knot's untied that made us one,<br>
I may seem thine, who in effect am none.<br>
And if I see not half my dayes that's due,<br>
What nature would, God grant to yours and you;<br>
The many faults that well you know I have<br>
Let be interr'd in my oblivious grave;<br>
If any worth or virtue were in me,<br>
Let that live freshly in thy memory<br>
And when thou feel'st no grief, as I no harms,<br>
Yet love thy dead, who long lay in thine arms.<br>
And when thy loss shall be repaid with gains<br>
Look to my little babes, my dear remains.<br>
And if thou love thyself, or loved'st me,<br>
These o protect from step Dames injury.<br>
And if chance to thine eyes shall bring this verse,<br>
With some sad sighs honour my absent Herse;<br>
And kiss this paper for thy loves dear sake,<br>
Who with salt tears this last Farewel did take.</blockquote>

<p><strong>Here Follows Some Verses upon the Burning of Our House, July 10th, 1666.</strong> Watch her fight with herself in real time: the grief that keeps naming the lost things, and the faith trying to talk her out of the grief.</p>
<blockquote>In silent night when rest I took,<br>
For sorrow near I did not look,<br>
I wakened was with thund'ring noise<br>
And piteous shrieks of dreadful voice.<br>
That fearful sound of "fire" and "fire,"<br>
Let no man know is my Desire.<br>
I, starting up, the light did spy,<br>
And to my God my heart did cry<br>
To straighten me in my Distress<br>
And not to leave me succourless.<br>
Then, coming out, behold a space<br>
The flame consume my dwelling place.<br>
And when I could no longer look,<br>
I blest His name that gave and took,<br>
That laid my goods now in the dust.<br>
Yea, so it was, and so 'twas just.<br>
It was his own, it was not mine,<br>
Far be it that I should repine;<br>
&hellip;<br>
When by the ruins oft I past<br>
My sorrowing eyes aside did cast<br>
And here and there the places spy<br>
Where oft I sate and long did lie.<br>
Here stood that trunk, and there that chest,<br>
There lay that store I counted best.<br>
My pleasant things in ashes lie<br>
And them behold no more shall I.<br>
Under thy roof no guest shall sit,<br>
Nor at thy Table eat a bit.<br>
&hellip;<br>
Then straight I 'gin my heart to chide,<br>
And did thy wealth on earth abide?<br>
Didst fix thy hope on mould'ring dust?<br>
The arm of flesh didst make thy trust?<br>
&hellip;<br>
The world no longer let me love,<br>
My hope and treasure lies above.</blockquote>

<p><strong>In Memory of My Dear Grandchild Elizabeth Bradstreet, who deceased August, 1665, being a year and a half old.</strong> The grief of a grandmother, dressed in the consolation of nature and not quite consoled by it.</p>
<blockquote>Farewell, dear babe, my heart's too much content!<br>
Farewell, sweet babe, the pleasure of mine eye!<br>
Farewell, fair flower that for a space was lent,<br>
Then taken away unto eternity!<br>
Blest babe, why should I once bewail thy fate,<br>
Or sigh the days so soon were terminate,<br>
Since thou art settled in an everlasting state?<br><br>
By nature trees do rot when they are grown,<br>
And plums and apples throughly ripe do fall,<br>
And corn and grass are in their season mown,<br>
And time brings down what is both strong and tall.<br>
But plants new set to be eradicate,<br>
And buds new blown to have so short a date,<br>
Is by His hand alone that guides nature and fate.</blockquote>

<p><strong>On My Dear Grandchild Simon Bradstreet, who died on 16 November, 1669, being but a month and one day old.</strong> Four lines. The last three words are the whole struggle of her faith.</p>
<blockquote>No sooner came, but gone, and fall'n asleep,<br>
Acquaintance short, yet parting caused us weep;<br>
Three flowers, two scarcely blown, the last i' th' bud,<br>
Cropt by th' Almighty's hand; yet is He good.</blockquote>

<p><strong>The Author to Her Book.</strong> On seeing her poems in print without her consent, she scolds the book like an unruly, ill-dressed child she cannot help loving. It is also, quietly, the first great poem about being a woman writer.</p>
<blockquote>Thou ill-formed offspring of my feeble brain,<br>
Who after birth didst by my side remain,<br>
Till snatched from thence by friends, less wise than true,<br>
Who thee abroad, exposed to public view,<br>
Made thee in rags, halting, to the press to trudge,<br>
Where errors were not lessened, all may judge.<br>
At thy return my blushing was not small,<br>
My rambling brat (in print) should mother call.<br>
I cast thee by as one unfit for light,<br>
Thy visage was so irksome in my sight;<br>
Yet being mine own, at length affection would<br>
Thy blemishes amend, if so I could.<br>
I washed thy face, but more defects I saw,<br>
And rubbing off a spot still made a flaw.</blockquote>

<p><em>Poems from</em> The Tenth Muse Lately Sprung Up in America <em>(London, 1650) and</em> Several Poems Compiled with Great Variety of Wit and Learning <em>(Boston, 1678); text follows John Harvard Ellis's edition of</em> The Works of Anne Bradstreet in Prose and Verse <em>(1867). Public domain. Longer poems trimmed at marked ellipses; the shorter poems are given whole.</em></p>`;

const existing = await one('select id from figures where slug = $1', [slug]);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, slug, name, epithet, lifespan, 'sep 11, 2026', epithet, body, quote, quoteSource],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
