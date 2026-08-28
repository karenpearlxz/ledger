import 'dotenv/config';
import { one } from './server/src/lib/db.js';

const P = (t) => `<p style="line-height:1.85;color:var(--ink);font-size:0.95rem;margin-top:14px">${t}</p>`;
const P1 = (t) => `<p style="line-height:1.85;color:var(--ink);font-size:0.95rem">${t}</p>`;
const H = (t) => `<h4 style="font-family:var(--mono);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--teal);margin-bottom:12px">${t}</h4>`;
const Q = (t) => `<blockquote style="border-left:3px solid var(--ember);padding-left:18px;color:var(--ink);line-height:1.8;font-size:0.95rem;margin:16px 0">${t}</blockquote>`;
const SEC = (h, inner) => `<div style="margin-bottom:28px">${H(h)}${inner}</div>`;

const body = [

SEC('childhood &amp; early life', [
  P1('She was born into a curse and knew it. <strong>Antigone</strong> is a daughter of <strong>Oedipus</strong>, king of Thebes, and here is the thing everyone knows and she has to carry: Oedipus was also her half-brother, because the woman who bore her, Jocasta, was Oedipus&rsquo; own mother. She is the fruit of a marriage that the gods themselves called an abomination, and she grows up hearing that word attached to her name before she has done anything at all.'),
  P('The house is the house of <strong>Labdacus</strong>, and it has been paying for something for three generations. Her grandfather Laius was warned by an oracle not to have a son; he had one anyway, exposed the baby on a mountain with its ankles pinned, and that baby grew up to kill him at a crossroads without knowing who he was. That baby was Oedipus. When the truth came out &mdash; that the king had murdered his father and married his mother &mdash; Jocasta hanged herself with her own girdle, and Oedipus put out his own eyes with the pins of her brooches. Antigone was a child in that palace when it happened.'),
  P('She has a sister, <strong>Ismene</strong>, softer than she is, and two brothers, <strong>Eteocles</strong> and <strong>Polyneices</strong>. When their blinded father was driven out of Thebes to wander as a beggar, it was Antigone &mdash; a girl &mdash; who walked out with him and was his eyes on the roads for years, all the way to a grove at Colonus near Athens where he finally died. She goes home to Thebes an orphan, having already buried everyone she came from except a sister and two brothers. And then the two brothers kill each other.'),
].join('')),

SEC('what she did &amp; why she is remembered', [
  P1('Her brothers quarrelled over the throne. Eteocles held Thebes; Polyneices marched an Argive army against it &mdash; the war the Greeks called the <em>Seven Against Thebes</em> &mdash; and the two of them met at the gate and ran each other through, each dying by the other&rsquo;s hand on the same day. Their uncle <strong>Creon</strong> took the crown, and his first act as king was an edict: Eteocles, who died defending the city, gets a hero&rsquo;s burial. Polyneices, who attacked it, gets nothing. His body is to be left in the open for the dogs and the crows, and any hand that so much as scatters dust on him will be stoned to death.'),
  P('Antigone buries him anyway.'),
  P('That is the whole act, and it is one of the most consequential gestures in Western literature. A young woman decides that a law written by a man this morning does not outrank a law that was never written down and has no birthday &mdash; the obligation of the living to bury their dead, of a sister to a brother. She is caught, brought before the king, and instead of pleading or lying she tells him to his face that his edict meant nothing to her. She is remembered because she is the first character in our tradition to say, calmly, that the State can be wrong, and that a single conscience can be right against it. Every act of civil disobedience since has her fingerprints on it, whether it knows her name or not.'),
  P('Sophocles put her on the Athenian stage around 441 BC. He gave her almost nothing to gain and everything to lose, and he let her win the argument even as she loses her life.'),
].join('')),

SEC('family life', [
  P1('Family is the only thing she has and the thing that destroys her, and she cannot separate the two. Her defence of Polyneices is not political &mdash; she does not care which brother was right about the throne. It is about blood, and about the dead being owed something the living cannot un-owe.'),
  P('The scene that opens the play is a conversation between two surviving sisters, and it is unbearably honest about how differently two people can be shaped by the same catastrophe. Antigone asks Ismene to help her lift the body. Ismene, terrified, reminds her of the body count already in their family and begs her to be reasonable &mdash; they are only women, she says, not made to fight men. Antigone does not argue. She simply cuts her loose.'),
  Q('I urge no more; nay, wert thou willing still, / I would not welcome such a fellowship. / Go thine own way; myself will bury him. / How sweet to die in such employ, to rest, &mdash; / Sister and brother linked in love&rsquo;s embrace &mdash; / A sinless sinner, banned awhile on earth, / But by the dead commended.'),
  P('Later, when the deed is done and Ismene &mdash; ashamed of her cowardice &mdash; tries to claim a share of the guilt so she can share the death, Antigone will not let her have it. She is fierce even in this: you would not stand with me in the doing, she says, so you do not get to stand with me in the dying. It reads as cruelty. It is really her refusing to let a lie, even a loving one, into the record of what happened.'),
].join('')),

SEC('romantic life', [
  P1('She is engaged to be married. Her betrothed is <strong>Haemon</strong>, and Haemon is Creon&rsquo;s son &mdash; the son of the very man who condemns her. This is the detail that turns the tragedy from an argument into a bloodbath, and Sophocles handles it strangely: Antigone herself, in the whole play, never once speaks Haemon&rsquo;s name. Her grief is all for the marriage she will not live to have, the children she will not bear, the bridal songs no one will sing &mdash; but the specific man is almost absent from her mind. Her heart is turned toward the dead, not the living.'),
  P('Haemon&rsquo;s heart is not. He goes to his father and tries, carefully, respectfully, to talk him down &mdash; the whole city pities the girl, he says; there is no shame in a king changing his mind. Creon hears only insolence and mocks him for being a woman&rsquo;s slave. The argument ends with Haemon walking out and Creon never seeing him again alive.'),
  P('When the king finally relents and hurries to the tomb, he finds Antigone already dead by her own hand and Haemon with his arms around her body. Haemon draws his sword, spits at his father, and drives it into his own side, falling so that his blood runs onto her cheek. They are married in the tomb, which is the only wedding either of them was ever going to get.'),
].join('')),

SEC('life until death', [
  P1('Creon does not execute her outright &mdash; he is too careful for that. He has her walled up alive in a rock-cut chamber with a little food, so that the city&rsquo;s hands stay technically clean: <em>only on earth no lodging shall she find.</em> He calls it leaving her fate to the gods. It is a coward&rsquo;s murder dressed as piety, and she names it as she is led away.'),
  P('The blind prophet <strong>Teiresias</strong> comes and tells Creon the truth: the gods are disgusted, the altars are fouled with the flesh of the unburied Polyneices, and the king has confused the living and the dead &mdash; he has buried a girl who should be walking around and left a corpse above the ground. Creon panics, finally, and runs to undo it all. He buries Polyneices and races to the tomb. He is minutes too late. Antigone has hanged herself with a noose of fine linen &mdash; the same death her grandmother Jocasta chose &mdash; rather than wait to starve in the dark.'),
  P('The cascade after that is total. Haemon kills himself over her body. Word reaches the palace and Creon&rsquo;s wife, <strong>Eurydice</strong>, walks to the household altar and stabs herself through the heart, cursing her husband with her last breath as the killer of her son. Creon ends the play alive and wishing he were not, holding one dead son, learning of one dead wife, a king who won his argument and lost every single person in his house. The chorus gives the verdict, and it is aimed at him, not at her.'),
  Q('Of happiness the chiefest part / Is a wise heart: / And to defraud the gods in aught / With peril&rsquo;s fraught. / Swelling words of high-flown might / Mightily the gods do smite. / Chastisement for errors past / Wisdom brings to age at last.'),
].join('')),

SEC('their works', [
  P1('Antigone left no writings &mdash; she is a figure of myth and of one great play. But the words Sophocles gave her have been quoted for two and a half thousand years, and they still say the thing more plainly than most people manage. Everything below is Francis Storr&rsquo;s 1912 verse translation (Loeb), public domain, on Project Gutenberg. Read her defence and notice how little she raises her voice.'),

  P('<strong>1. THE UNWRITTEN LAWS</strong> &nbsp;<span style="opacity:.6">Creon asks if she dared to break the edict. This is the answer &mdash; the founding statement of conscience against the State.</span>'),
  Q('Yea, for these laws were not ordained of Zeus, / And she who sits enthroned with gods below, / Justice, enacted not these human laws. / Nor did I deem that thou, a mortal man, / Could&rsquo;st by a breath annul and override / The immutable unwritten laws of Heaven. / They were not born today nor yesterday; / They die not; and none knoweth whence they sprang.'),
  Q('I knew that I must die, / E&rsquo;en hadst thou not proclaimed it; and if death / Is thereby hastened, I shall count it gain. / For death is gain to him whose life, like mine, / Is full of misery.'),

  P('<strong>2. &ldquo;MY NATURE IS FOR MUTUAL LOVE, NOT HATE&rdquo;</strong> &nbsp;<span style="opacity:.6">the exchange that most people quote, and the two lines that end it</span>'),
  Q('CREON: Not even death can make a foe a friend.<br>ANTIGONE: My nature is for mutual love, not hate.<br>CREON: Die then, and love the dead if thou must; / No woman shall be the master while I live.'),
  P('Note what the fight is actually about by the last line. He has stopped arguing about the burial. He is arguing about a woman refusing to obey him, and he says so out loud.'),

  P('<strong>3. NO SECOND BROTHER CAN BE BORN</strong> &nbsp;<span style="opacity:.6">from her last speech, walking to the tomb. The strange, cold, exact logic of why a brother is irreplaceable in a way a husband or a child is not.</span>'),
  Q('For even had it been some child of mine, / Or husband mouldering in death&rsquo;s decay, / I had not wrought this deed despite the State. / What is the law I call in aid? &rsquo;Tis thus / I argue. Had it been a husband dead / I might have wed another, and have borne / Another child, to take the dead child&rsquo;s place. / But, now my sire and mother both are dead, / No second brother can be born for me.'),

  P('<strong>4. THE BRIDE OF DEATH</strong> &nbsp;<span style="opacity:.6">her farewell to the sunlight. She grieves the wedding she will never have; Death is the bridegroom.</span>'),
  Q('Friends, countrymen, my last farewell I make; / My journey&rsquo;s done. / One last fond, lingering, longing look I take / At the bright sun. / For Death who puts to sleep both young and old / Hales my young life, / And beckons me to Acheron&rsquo;s dark fold, / An unwed wife. / No youths have sung the marriage song for me, / My bridal bed / No maids have strewn with flowers from the lea, / &rsquo;Tis Death I wed.'),

  P('<strong>5. THE LIVING TOMB</strong>'),
  Q('O grave, O bridal bower, O prison house / Hewn from the rock, my everlasting home, / Whither I go to join the mighty host / Of kinsfolk, Persephassa&rsquo;s guests long dead, / The last of all, of all more miserable, / I pass, my destined span of years cut short.'),
  Q('Unwept, unwed, unfriended, hence I go, / No longer may I see the day&rsquo;s bright eye; / Not one friend left to share my bitter woe, / And o&rsquo;er my ashes heave one passing sigh.'),

  P('<strong>6. THE ODE TO MAN</strong> &nbsp;<span style="opacity:.6">not spoken by Antigone, but the most famous chorus in Greek drama, sung right after her crime is discovered. Everything humans can master &mdash; the sea, the earth, the beasts, language, even disease &mdash; and the one thing they cannot.</span>'),
  Q('Many wonders there be, but naught more wondrous than man; / Over the surging sea, with a whitening south wind wan, / Through the foam of the firth, man makes his perilous way ...'),
  Q('Speech and the wind-swift speed of counsel and civic wit, / He hath learnt for himself all these; and the arrowy rain to fly / And the nipping airs that freeze, &rsquo;neath the open winter sky. / He hath provision for all: fell plague he hath learnt to endure; / Safe whate&rsquo;er may befall: yet for death he hath found no cure.'),

  P('<strong>7. THE VERDICT</strong> &nbsp;<span style="opacity:.6">the chorus&rsquo; final words of the play, spoken over a king who has lost everyone. It is about pride, and it is about him.</span>'),
  Q('Of happiness the chiefest part / Is a wise heart: / And to defraud the gods in aught / With peril&rsquo;s fraught. / Swelling words of high-flown might / Mightily the gods do smite. / Chastisement for errors past / Wisdom brings to age at last.'),
  P('She is nineteen or so, motherless, fatherless, both brothers dead, engaged to the son of the man killing her, and she does not blink. That is why she has never left the stage.'),
].join('')),

].join('\n\n      ');

const epithet = 'Antigone \u00b7 Thebes, in myth \u00b7 daughter of Oedipus, who buried her disgraced brother against the king\u2019s edict and died for it \u2014 the first voice in Western literature to say that an unjust law is no law at all, and the oldest patron saint of conscience against the State';
const quote = 'My nature is for mutual love, not hate.';

const existing = await one('select id from figures where slug = $1', ['antigone']);
if (existing) { console.log('already there', existing.id); process.exit(0); }
const max = await one('select coalesce(max(ordinal),0) m from figures');
const ord = Number(max.m) + 1;
const r = await one(
  `insert into figures (ordinal, slug, name, epithet, lifespan, chip_date, summary, body, quote, quote_source)
   values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, ordinal`,
  [ord, 'antigone', 'Antigone', epithet, '', 'aug 28, 2026', epithet, body, quote,
   'Sophocles, Antigone (c. 441 BC), tr. Francis Storr, 1912'],
);
console.log('inserted', r, 'bodylen', body.length);
process.exit(0);
