import 'dotenv/config';
import fs from 'fs';
import { one } from './server/src/lib/db.js';

const p=(s)=>`<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${s}</p>`;
const sec=(title,content)=>`<div style="margin-bottom:28px"><h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${title}</h4>${content}</div>`;
const bq=(text)=>`<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${text}</blockquote>`;
const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/--/g,'&mdash;');
const poem=(f)=>bq(fs.readFileSync('/tmp/'+f,'utf8').trimEnd().split('\n').map(esc).join('<br>'));
const body =
sec('childhood &amp; early life',
 p('<strong>John Keats</strong> was born on 31 October 1795 in Moorfields, London, the eldest son of Thomas Keats, who ran a livery stable at an inn called the Swan and Hoop. He was small, maybe five feet tall as a grown man, and at school in Enfield he was known less for books than for fighting. He would take on anyone, bigger boys included.')+
 p('Then the losses started. When he was eight his father fell from a horse and died of a fractured skull. His mother remarried within weeks, the marriage fell apart, and she drifted away from the children for a few years. When she came back she was dying of tuberculosis. Keats, fourteen, nursed her himself &mdash; cooked for her, gave her medicine, sat up with her at night reading novels. She died in 1810. Around the same time something changed in him at school: the fighter started reading everything, winning prizes, translating the <em>Aeneid</em> for fun.')+
 p('His guardian, a tea merchant named Richard Abbey, pulled him out of school and apprenticed him to a surgeon-apothecary. He went on to train at Guy&rsquo;s Hospital and qualified in 1816. This was surgery before anaesthesia: he held down screaming patients. He was good at it, and he quit anyway, because he had decided he was a poet.')
)+
sec('what he did &amp; why he&rsquo;s remembered',
 p('His first two books flopped. <em>Endymion</em> (1818) was savaged by <em>Blackwood&rsquo;s</em>, which mocked him as a vulgar &ldquo;Cockney&rdquo; and told him to go back to the shop: &ldquo;back to plasters, pills, and ointment boxes.&rdquo; Legend later said the reviews killed him. They did not. He wrote in a letter that praise or blame had only a momentary effect on a man whose love of beauty made him a severe critic of his own work.')+
 p('What he did next is one of the strangest bursts in literary history. In roughly nine months of 1819, while broke, heartbroken and already sick, he wrote <em>The Eve of St. Agnes</em>, <em>La Belle Dame sans Merci</em>, <em>Lamia</em>, and the great odes &mdash; to a Nightingale, on a Grecian Urn, on Melancholy, to Autumn. Most English poets would give everything for one of those. He wrote them in a season, at twenty-three.')+
 p('He is also remembered for his letters, which read like a young psychologist thinking out loud. In one, he names the quality great writers share, <em>negative capability</em>: &ldquo;when man is capable of being in uncertainties, Mysteries, doubts, without any irritable reaching after fact &amp; reason.&rdquo; In another, he says the world is not a vale of tears but &ldquo;a vale of Soul-making&rdquo; &mdash; that pain is how an intelligence becomes a self.')
)+
sec('family life',
 p('His brothers were his whole world. George emigrated to America in 1818 with his new wife and lost most of his money there, sometimes to the detriment of John, who lent what little he had. Tom, the youngest, came down with the same tuberculosis that had killed their mother, and in the autumn of 1818 John nursed him exactly as he had nursed her, in cramped rooms in Hampstead, until Tom died that December at nineteen. His sister Fanny was kept away from him by Abbey, and he wrote her gentle letters for years.')+
 p('He had trained as a doctor. He knew exactly what he was watching when Tom coughed, and he almost certainly caught it from him.')
)+
sec('romantic life',
 p('After Tom died, Keats moved in with his friend Charles Brown at Wentworth Place in Hampstead. The other half of the house was rented by a widow, Mrs Brawne, and her eighteen-year-old daughter <strong>Fanny Brawne</strong> &mdash; fashionable, witty, fond of dancing and clothes, not remotely the melancholy muse his friends thought a poet should have. They disapproved of her. He fell completely.')+
 p('They were secretly engaged by the end of 1819, but he had no money and no prospects, so marriage kept receding. His letters to her are the least guarded writing he left: jealous, feverish, adoring. &ldquo;I have been astonished that Men could die Martyrs for religion &mdash; I have shudder&rsquo;d at it. I shudder no more &mdash; I could be martyr&rsquo;d for my Religion &mdash; Love is my religion &mdash; I could die for that.&rdquo; And later, when he was ill: &ldquo;I cannot exist without you &mdash; I am forgetful of every thing but seeing you again.&rdquo;')+
 p('The sonnet &ldquo;Bright star, would I were stedfast as thou art&rdquo; is usually connected to her. She kept his letters for the rest of her life, and eventually married someone else, twelve years after he died.')
)+
sec('life until death',
 p('One night in February 1820 he came home chilled, got into bed, coughed, and saw a drop of blood on the sheet. Brown heard him say, calmly: &ldquo;I know the colour of that blood; it is arterial blood. I cannot be deceived in that colour. That drop of blood is my death-warrant; I must die.&rdquo;')+
 p('Doctors ordered him south for the winter. In September 1820 he sailed for Italy with the painter Joseph Severn, knowing he would never see Fanny again; he could not even bring himself to open her letters. In Rome, in a small room beside the Spanish Steps, he was put on a starvation diet of an anchovy and a piece of bread a day and bled repeatedly. He begged for the laudanum he had bought, so he could end it; Severn would not give it to him. He asked Severn whether he had ever seen anyone die, and apologised for putting him through it.')+
 p('He died on 23 February 1821, aged twenty-five, telling Severn not to be frightened. He asked that his gravestone carry no name, only the line &ldquo;Here lies One Whose Name was writ in Water.&rdquo; It does. His name is not on it.')
)+
sec('his works',
 h('Ode to a Nightingale (1819) &mdash; written in a garden in Hampstead a few months after Tom died. Read stanza three with that in mind.')+poem('k_night.txt')+
 h('Ode on a Grecian Urn (1819) &mdash; lovers painted on a vase, frozen a breath before the kiss forever. Is that a blessing or a curse?')+poem('k_urn.txt')+
 h('La Belle Dame sans Merci (1819) &mdash; a knight, a faery woman with wild eyes, and a hillside full of pale men who loved her first. Pure gothic.')+poem('k_belle.txt')+
 h('To Autumn (1819) &mdash; his last great poem, written after a walk in Winchester. No despair, no argument, just the season dying beautifully.')+poem('k_aut.txt')+
 h('Bright Star (1819, revised 1820)')+bq('Bright star, would I were stedfast as thou art&mdash;<br>Not in lone splendour hung aloft the night<br>And watching, with eternal lids apart,<br>Like nature&rsquo;s patient, sleepless Eremite,<br>The moving waters at their priestlike task<br>Of pure ablution round earth&rsquo;s human shores,<br>Or gazing on the new soft-fallen mask<br>Of snow upon the mountains and the moors&mdash;<br>No&mdash;yet still stedfast, still unchangeable,<br>Pillow&rsquo;d upon my fair love&rsquo;s ripening breast,<br>To feel for ever its soft fall and swell,<br>Awake for ever in a sweet unrest,<br>Still, still to hear her tender-taken breath,<br>And so live ever&mdash;or else swoon to death.')+
 h('From his letters')+bq('&ldquo;I am certain of nothing but of the holiness of the Heart&rsquo;s affections and the truth of Imagination.&rdquo; &mdash; to Benjamin Bailey, 22 November 1817')+
 bq('&ldquo;Call the world if you Please &lsquo;The vale of Soul-making&rsquo;. Then you will find out the use of the world... Do you not see how necessary a World of Pains and troubles is to school an Intelligence and make it a soul?&rdquo; &mdash; to George and Georgiana Keats, April 1819')+
 bq('&ldquo;If I should die, I have left no immortal work behind me &mdash; nothing to make my friends proud of my memory &mdash; but I have lov&rsquo;d the principle of beauty in all things, and if I had had time I would have made myself remember&rsquo;d.&rdquo; &mdash; to Fanny Brawne, February 1820')
);
const ord=84, slug='john-keats', name='John Keats';
const epithet='London, 31 October 1795 \u2013 Rome, 23 February 1821 \u00b7 the apothecary\u2019s apprentice who wrote the greatest odes in English in one year, then died at twenty-five';
const lifespan='31 October 1795 \u2013 23 February 1821';
const quote='I am certain of nothing but of the holiness of the Heart&rsquo;s affections and the truth of Imagination.';
const quote_source='John Keats, letter to Benjamin Bailey (1817)';
const r=await one(`insert into figures (ordinal,slug,name,epithet,lifespan,chip_date,summary,body,quote,quote_source) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,ordinal`,[ord,slug,name,epithet,lifespan,'sep 25, 2026',epithet,body,quote,quote_source]);
console.log('inserted',r,'bodylen',body.length);
process.exit(0);
