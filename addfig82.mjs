import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const en=(lines)=>`<span style="opacity:0.82">${lines.join('<br>')}</span>`;

const body =
sec('childhood &amp; early life',
 p('<strong>Edith Newbold Jones</strong> was born on 24 January 1862 into old, moneyed New York &mdash; the tight little world of brownstones and calling cards that she would later dissect more precisely than anyone. Her family was so socially established that the phrase &ldquo;keeping up with the Joneses&rdquo; is often traced, half-jokingly, to her relations. She spent much of her childhood in Europe, absorbing languages and cathedrals and the shapes of old cities, and came home to a society that expected a girl of her class to marry well and think little.')+
 p('She refused the second half of that bargain. She was a compulsive reader who was more or less forbidden the run of her father&rsquo;s library &mdash; novels were considered dangerous for young ladies &mdash; and she wrote in secret from the time she was a child. At sixteen her family quietly printed a small book of her poems, <em>Verses</em>, in 1878. She was a woman being raised for the drawing room who kept smuggling herself into the study.'))+
sec('what she did &amp; why she is remembered',
 p('Wharton became the great anatomist of the American upper class &mdash; the writer who understood that the cruelest violence in a polished society is done with manners, silence, and the slow closing of doors. Her people are not destroyed by monsters. They are destroyed by what is expected of them, by the things everyone agrees not to say. She wrote about women trapped by money and reputation with a cold, exact sympathy that never tips into sentiment.')+
 p('In 1921 she won the Pulitzer Prize for Fiction for <em>The Age of Innocence</em> &mdash; the first woman ever to win it. She was also a serious designer and gardener; her first real book was <em>The Decoration of Houses</em> (1897), and her Massachusetts estate, The Mount, she built and shaped herself. During the First World War she threw herself into relief work in France, running hostels and workrooms for refugees, and was made a Chevalier of the Legion of Honour for it. She wrote more than forty books. She never stopped.'))+
sec('family life',
 p('Her family gave her security and a cage in equal measure. The Joneses were correct, wealthy, and profoundly conventional, and Edith &mdash; clever, restless, bookish &mdash; did not fit the mould they had for a daughter. She was closest, in a way, to the Europe of her early childhood and to the world of ideas she built for herself later. Her deepest chosen family became her friends: above all the novelist Henry James, with whom she shared one of the great literary friendships, a correspondence of enormous wit and affection.')+
 p('She never had children. The domestic center of her adult life was the house and garden she made, the dogs she adored, and the circle of writers and thinkers she gathered around her on two continents.'))+
sec('romantic life',
 p('In 1885 she married <strong>Edward &ldquo;Teddy&rdquo; Robbins Wharton</strong>, a genial Boston man of her own class who shared almost none of her intellectual life. The marriage was, for years, a quiet mismatch &mdash; and then a painful one, as Teddy&rsquo;s mental health collapsed and he mismanaged and embezzled from her money. They divorced in 1913, a serious thing for a woman of her standing to do.')+
 p('In her late forties she fell into the one consuming love affair of her life, with the American journalist <strong>Morton Fullerton</strong> &mdash; charming, evasive, and unfaithful. It cracked her open. The controlled woman who wrote about people dying of repression finally wrote, privately, about desire in her own voice. Much of the ache in her poems of that period is his.'))+
sec('life until death',
 p('She spent her last decades in France, in two beloved homes &mdash; a villa outside Paris and an old convent in the south &mdash; writing, gardening, and holding court over a devoted circle. She kept working to the end. On 11 August 1937 she died of a stroke at Pavillon Colombe, her house north of Paris. She was buried at the Cimeti&egrave;re des Gonards in Versailles, near the ashes of her close friend Walter Berry &mdash; wanting, even in death, to lie beside someone she had chosen rather than someone she had been assigned.'))+
sec('their works',
 p('Wharton is best known now for her novels &mdash; but before the novels came the poems, and they are where you hear her most nakedly. Here are her own words.')+
 p('<strong>&ldquo;The One Grief.&rdquo;</strong> A sonnet about learning to live so long beside sorrow that it becomes a companion &mdash; even an interpreter. If you have ever carried a grief until it stopped being a stranger, this is that feeling, exactly.')+
 bq(en([
  '&ldquo;One grief there is, the helpmeet of my heart,',
  'That shall not from me till my days be sped,',
  'That walks beside me in sunshine and in shade,',
  'And hath in all my fortunes equal part.',
  'At first I feared it, and would often start',
  'Aghast to find it bending o&rsquo;er my bed,',
  'Till usage slowly dulled the edge of dread,',
  'And one cold night I cried: <em>How warm thou art!</em>',
  '',
  'Since then we two have travelled hand in hand,',
  'And, lo, my grief has been interpreter',
  'For me in many a fierce and alien land',
  'Whose speech young Joy had failed to understand,',
  'Plucking me tribute of red gold and myrrh',
  'From desolate whirlings of the desert sand.&rdquo;',
  '',
  '&mdash; <em>Artemis to Actaeon, and Other Verses</em> (1909)'
 ]))+
 p('<strong>&ldquo;Survival.&rdquo;</strong> Short, and quietly devastating &mdash; the idea that the people we love become part of everything after they&rsquo;re gone, and might be looking back at us from a page or a grey evening.')+
 bq(en([
  '&ldquo;When you and I, like all things kind or cruel,',
  'The garnered days and light evasive hours,',
  'Are gone again to be a part of flowers',
  'And tears and tides, in life&rsquo;s divine renewal,',
  '',
  'If some grey eve to certain eyes should wear',
  'A deeper radiance than mere light can give,',
  'Some silent page abruptly flush and live,',
  'May it not be that you and I are there?&rdquo;',
  '',
  '&mdash; <em>Artemis to Actaeon, and Other Verses</em> (1909)'
 ]))+
 p('<strong>From &ldquo;All Souls.&rdquo;</strong> For your gothic side. A poem for the night the dead can walk &mdash; where the shudder of wind and the drip of a branch are the touch of hands that grope. This is the opening.')+
 bq(en([
  '&ldquo;A thin moon faints in the sky o&rsquo;erhead,',
  'And dumb in the churchyard lie the dead.',
  'Walk we not, Sweet, by garden ways,',
  'Where the late rose hangs and the phlox delays,',
  'But forth of the gate and down the road,',
  'Past the church and the yews, to their dim abode.',
  'For it&rsquo;s turn of the year and All Souls&rsquo; night,',
  'When the dead can hear and the dead have sight.&hellip;',
  '',
  'Fear not that sound like wind in the trees:',
  'It is only their call that comes on the breeze;',
  'Fear not the shudder that seems to pass:',
  'It is only the tread of their feet on the grass;',
  'Fear not the drip of the bough as you stoop:',
  'It is only the touch of their hands that grope&rdquo;',
  '',
  '&mdash; <em>Artemis to Actaeon, and Other Verses</em> (1909)'
 ]))+
 p('<strong>From &ldquo;The Mortal Lease.&rdquo;</strong> A sequence of sonnets written in the grip of her one great love affair. The famous stanza &mdash; the one people quote &mdash; is about seizing a single mortal moment fully, even knowing it will end. It is the most alive she ever sounds.')+
 bq(en([
  '&ldquo;Yet for one rounded moment I will be',
  'No more to you than what my lips may give,',
  'And in the circle of your kisses live',
  'As in some island of a storm-blown sea,',
  'Where the cold surges of infinity',
  'Upon the outward reefs unheeded grieve,',
  'And the loud murmur of our blood shall weave',
  'Primeval silences round you and me.&rdquo;',
  '',
  '&mdash; from &lsquo;The Mortal Lease,&rsquo; <em>Artemis to Actaeon</em> (1909)'
 ]))+
 p('<strong>And the fiction.</strong> This is the opening of <em>Ethan Frome</em> (1911) &mdash; her bleak, perfect novella of a man frozen by duty into a life he never chose. The first line is a whole method: the truth is never one clean story.')+
 bq('&ldquo;I had the story, bit by bit, from various people, and, as generally happens in such cases, each time it was a different story.&rdquo;<br><br>&mdash; <em>Ethan Frome</em> (1911)')+
 p('And the closing image of Ethan himself &mdash; a man described not as evil or weak, but simply as someone who stayed too long in a cold place until the cold got inside him:')+
 bq('&ldquo;He seemed a part of the mute melancholy landscape, an incarnation of its frozen woe, with all that was warm and sentient in him fast bound below the surface&hellip; I simply felt that he lived in a depth of moral isolation too remote for casual access.&rdquo;<br><br>&mdash; <em>Ethan Frome</em> (1911)')+
 p('<em>All poems quoted verbatim from</em> Artemis to Actaeon, and Other Verses <em>(1909), Project Gutenberg eBook #4549.</em> Ethan Frome <em>excerpts from Project Gutenberg eBook #4517. Biographical details checked against the Edith Wharton Society, Britannica, and the Pulitzer Prize record (first woman awarded the Pulitzer Prize for Fiction, 1921, for</em> The Age of Innocence<em>).</em>'));

const slug='edith-wharton';
const existing=await one('select id from figures where slug=$1',[slug]);
if(existing){console.log('already there',existing.id);process.exit(0)}
const max=await one('select coalesce(max(ordinal),0) m from figures');
const ord=Number(max.m)+1;
const name='Edith Wharton';
const epithet='Edith Wharton \u00b7 New York, 24 January 1862 \u2013 Saint-Brice-sous-For\u00eat, 11 August 1937 \u00b7 the great anatomist of old New York, first woman to win the Pulitzer Prize for Fiction';
const lifespan='24 January 1862 \u2013 11 August 1937';
const quote='If you make up your mind not to be happy there&rsquo;s no reason why you shouldn&rsquo;t have a fairly good time.';
const quote_source='Edith Wharton, The Last Asset (1904)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 23, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
