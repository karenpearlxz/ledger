import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const slug = 'joan-of-arc';
const body = `
<h4>Childhood &amp; Early Life</h4>
<p>Joan was born around 1412 in Domrémy, a small farming village on the disputed eastern edge of France, in a country that had been bleeding through the Hundred Years' War for generations. Her father, Jacques d'Arc, was a modestly prosperous peasant farmer; her mother, Isabelle Romée, was devout and taught her daughter her prayers. Joan never learned to read or write. She spun and sewed, helped with the animals, and, by her own later account, feared no woman in Rouen at needlework. In her own village they called her Jeannette.</p>
<p>She grew up in a war zone. The English and their Burgundian allies held much of northern France; the rightful heir, the Dauphin Charles, was uncrowned and irresolute, and the country half believed it was finished. Domrémy itself was raided. Joan remembered the village children of the French side coming home from skirmishes wounded and bleeding, and remembered a lone Burgundian sympathiser in her town whose head, she later said with startling bluntness, she would happily have seen cut off, God willing.</p>
<p>She was about thirteen when it began. Standing in her father's garden at midday in summer, she heard a voice, accompanied by a great light, coming from the direction of the church. She was terrified. Over time the voices resolved into figures she named as Saint Michael, Saint Catherine, and Saint Margaret, and they told her something impossible: that she, an illiterate teenage girl, was to go into France, raise the siege of Orléans, and see the Dauphin crowned king.</p>

<h4>What They Did &amp; Why They're Remembered</h4>
<p>Joan of Arc is remembered because she did the impossible thing and then paid for it. At around seventeen she talked her way past the local captain, Robert de Baudricourt, cut her hair, put on men's clothing for safety on the roads, and rode across enemy-held territory to reach the Dauphin at Chinon in 1429. She picked him out of a crowd though she had never seen him. She was examined for weeks by theologians at Poitiers, who found nothing but good in her, and then she was given troops.</p>
<p>What followed was one of the most astonishing reversals in military history. Within days of her arrival at Orléans in May 1429, the months-long English siege was broken. She carried a banner, not a weapon she liked to use, and said afterward she had never killed anyone. She was wounded by an arrow through the neck at the Bridge fortress and kept going. The Loire campaign and the victory at Patay followed, and in July 1429 she stood beside Charles as he was finally crowned king at Reims, exactly as her voices had promised. She had turned the war.</p>
<p>She is remembered too for what came after: capture, a rigged heresy trial, and death by fire at nineteen. And she is remembered for how she spoke. The transcript of her trial survives, and in it a teenage peasant with no education runs verbal circles around the most learned churchmen in the land, refusing their traps, keeping her nerve, and giving answers so quick and clear that they still read like sparks. Nearly five centuries later, in 1920, the Church that burned her made her a saint.</p>

<h4>Family Life</h4>
<p>Joan left her father's house against his wishes, and by her own testimony without telling him she was going, which for a girl of her time and place was close to an act of war within the family. Yet the bond held. Her brothers Jean and Pierre joined her in the field and fought alongside her. When asked at trial about her possessions, she mentioned almost offhandedly that her brothers held her goods, her horses, her sword. She never married and had no children of her own, but she stood as godmother to babies in the towns she passed through, giving the boys the name Charles in honour of her king and the girls her own name, Jeanne.</p>
<p>There is a small, tender detail in the trial record about a ring her father or mother had given her, engraved with the names Jesus and Mary, which the Burgundians had taken from her. She asked her judges, more than once, to give it back. It was one of the few personal things this soldier-saint seems to have simply wanted for herself.</p>

<h4>Romantic Life</h4>
<p>Joan called herself <em>la Pucelle</em>, the Maid, and she meant it literally. She had taken a vow of virginity, telling her voices she would keep her body pure for as long as it pleased God. Twice she was physically examined by noblewomen and found to be a virgin, a fact that mattered enormously to a movement staking everything on the idea that she was sent by heaven and not the devil.</p>
<p>The one romantic episode in her life is really a story about her refusing romance. Before she left home, a young man of the district claimed she had promised to marry him and hauled her before a church court at Toul to enforce the betrothal. Joan flatly denied ever making any such promise, defended herself in person, and won. It is a revealing early glimpse: a girl not yet famous, refusing to be bound by a man's version of what she owed him, and prevailing in front of a court. She would spend the rest of her short life doing versions of the same thing.</p>

<h4>Life Until Death</h4>
<p>After the coronation her luck turned. An assault on Paris failed and she was wounded again. On 23 May 1430 she was captured at Compiègne by Burgundian forces, pulled from her horse. The French king she had crowned did nothing to ransom her. The Burgundians sold her to the English, who wanted her destroyed not as a soldier but as a witch and a heretic, because if she was a fraud then the king she had made was a fraud too.</p>
<p>Her trial at Rouen in 1431, run by the pro-English bishop Pierre Cauchon, was a stacked deck, and everyone in the room knew it. Alone, without counsel, sometimes chained, she faced dozens of trained interrogators. She refused to swear to answer everything, protecting the secrets she said belonged to her king and to God. She would not renounce her voices. Worn down, threatened with immediate burning, she briefly signed an abjuration and agreed to wear women's clothing; days later she put the men's clothes back on, said her voices had reproached her for the denial, and took it all back. That relapse was what they needed. On 30 May 1431 she was burned at the stake in the marketplace of Rouen. She was about nineteen. Witnesses said she asked for a cross, and died calling on the name of Jesus.</p>
<p>Twenty-five years later, a second trial ordered by the Church examined the first, found it corrupt and unjust, and annulled the verdict. Her mother Isabelle, by then old, lived to hear her daughter declared innocent. In 1920 Joan of Arc was canonised. The men who condemned her are footnotes now; the girl they burned is a saint and the patroness of France.</p>

<h4>Their Works</h4>
<p>Joan could not write, but her words survive better than almost anyone's of her century, because her enemies wrote them down to convict her, and because she dictated letters that were copied and kept. What follows is from the trial record and from her most famous letter, in T. Douglas Murray's 1902 public-domain translation of the original documents.</p>

<p><strong>The Letter to the English (22 March 1429).</strong> Before she had fought a single battle, this unknown farm girl dictated a letter to the English commanders besieging Orléans, ordering them out of France. It is pure nerve.</p>
<blockquote>King of England, and you, Duke of Bedford, who call yourself Regent of the Kingdom of France... give satisfaction to the King of Heaven: give up to the King the keys of all the good towns in France which you have taken and broken into. She is come here by the order of God to reclaim the Blood Royal. She is quite ready to make peace, if you are willing to give her satisfaction...<br><br>I am a Chieftain of war, and, wheresoever I find your followers in France, I will make them leave, willingly or unwillingly; if they will not obey, I will have them put to death. I am sent here by God, the King of Heaven, body for body, to drive them all out of the whole of France...<br><br>And believe surely that the King of Heaven will send greater power to the Maid, to her and her good men-at-arms, than you can bring to the attack; and, when it comes to blows, we shall see who has the better right from the God of Heaven.</blockquote>

<p><strong>The trap about grace (Third Examination, 24 February 1431).</strong> The judges asked whether she knew if she was in God's grace. It was a snare: to say yes was the sin of presumption, to say no was to confess herself damned. Her answer is the single most famous line of the trial, and it silenced them.</p>
<blockquote>If I am not, may God place me there; if I am, may God so keep me. I should be the saddest in all the world if I knew that I were not in the grace of God.</blockquote>

<p><strong>The garden, and the first voice.</strong> Asked about the voices that had brought her to this room, she described the beginning without flinching.</p>
<blockquote>I was thirteen when I had a Voice from God for my help and guidance. The first time that I heard this Voice, I was very much frightened; it was mid-day, in the summer, in my father's garden... rarely do I hear it without its being accompanied also by a light... It instructed me to be good and to go often to Church; it told me it was necessary for me to come into France.</blockquote>

<p><strong>On wanting to be free.</strong> Forbidden to try to escape her prison, she refused to promise any such thing, and put it as plainly as anyone ever has.</p>
<blockquote>It is true I wished to escape, and so I wish still; is not this lawful for all prisoners?</blockquote>

<p><strong>On her banner and her sword.</strong> She carried the standard herself into the fighting, and cared for it more than for any weapon, because she went to war to lead, not to kill.</p>
<blockquote>Better, forty times better, my banner than my sword!... It was I, myself, who bore this banner when I attacked the enemy, to save killing any one, for I have never killed any one.</blockquote>

<p><strong>On obedience to God over men.</strong> Pressed again and again about wearing men's clothing and about acting without the Church's leave, she would not bend.</p>
<blockquote>I would rather have been torn asunder by four horses than have come into France without God's leave.</blockquote>

<p><strong>The prophecy (Fifth Examination, 1 March 1431).</strong> In the middle of her own doomed trial, she calmly predicted a total English defeat, and she was right; within decades the English were driven from almost all of France.</p>
<blockquote>Before seven years are passed, the English will lose a greater wager than they have already done at Orleans; they will lose everything in France... I know it by revelation, as clearly as I know that you are before me at this moment.</blockquote>

<p><strong>The leap, and her fear of the English.</strong> Recalling how she had thrown herself from the tower at Beaurevoir rather than be handed over, she said what she feared most, and it was not death.</p>
<blockquote>I said I would rather give up my soul to God than be in the hands of the English.</blockquote>

<p><strong>What the voices told her at the end.</strong> Even as the trial closed in, the counsel she reported hearing was not despair but steadiness.</p>
<blockquote>They have told me that I shall be delivered, but I know neither the day nor the hour... They said to me: "Be of good courage and keep a cheerful countenance."</blockquote>

<p><em>All passages from The Trial of Jeanne d'Arc, translated by T. Douglas Murray (1902), from the original Latin and French documents, public domain.</em></p>`;

const existing = await one('select id from figures where slug=$1', [slug]);
if (existing) { console.log('already exists', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ordinal = Number(max.m) + 1;
const epithet = 'Joan of Arc · Domrémy, c. 1412 – Rouen, 30 May 1431 · an illiterate teenage peasant who heard voices, turned a losing war, crowned a king, and then out-argued a room full of theologians before they burned her at nineteen';
const quote = 'If I am not, may God place me there; if I am, may God so keep me. I should be the saddest in all the world if I knew that I were not in the grace of God.';
const result = await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal,slug`, [ordinal,slug,'Joan of Arc',epithet,'c. 1412–1431','sep 7, 2026',epithet,body,quote,'Trial of Jeanne d\u2019Arc, Third Examination (24 Feb 1431), trans. T. Douglas Murray (1902)']);
console.log('inserted', result, 'body length', body.length);
process.exit(0);
