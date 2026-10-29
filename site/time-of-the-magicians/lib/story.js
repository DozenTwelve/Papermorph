/* The story the map tells: the four, the places, and each year's cards. Our own words, after Eilenberger's
   Time of the Magicians, with what the book lacks checked elsewhere (books/time-of-the-magicians/analysis.md).
   A year's card for one man: route, the places he walks through that year after where the last year left him (the last
   is where he stands, `at`); place, the card's heading when it is not the place's name. */
'use strict';
const PEOPLE = {
  w: { name: 'Ludwig Wittgenstein', short: 'Wittgenstein', color: '#2c6e91', img: 'img/wittgenstein.webp', aspect: .383 },
  h: { name: 'Martin Heidegger', short: 'Heidegger', color: '#3f7d3a', img: 'img/heidegger.webp', aspect: .396 },
  b: { name: 'Walter Benjamin', short: 'Benjamin', color: '#c8281e', img: 'img/benjamin.webp', aspect: .392 },
  c: { name: 'Ernst Cassirer', short: 'Cassirer', color: '#b07a12', img: 'img/cassirer.webp', aspect: .408 },
};

// [label, lon, lat, label side: r, l, t, b]
const PLACES = {
  cassino: ['Cassino', 13.83, 41.49, 'r'], vienna: ['Vienna', 16.37, 48.21, 'r'], hague: ['The Hague', 4.30, 52.08, 'l'],
  klosterneuburg: ['Klosterneuburg', 16.33, 48.31, 't'], trattenbach: ['Trattenbach', 15.87, 47.60, 'l'],
  innsbruck: ['Innsbruck', 11.40, 47.27, 'b'], hassbach: ['Hassbach', 16.09, 47.57, 'r'], puchberg: ['Puchberg', 15.91, 47.79, 't'],
  otterthal: ['Otterthal', 15.94, 47.61, 'b'], hutteldorf: ['Hütteldorf', 16.26, 48.20, 'l'],
  cambridge: ['Cambridge', 0.12, 52.21, 'r'], nottingham: ['Nottingham', -1.15, 52.95, 'l'],
  freiburg: ['Freiburg', 7.85, 47.99, 'l'], konstanz: ['Konstanz', 9.17, 47.66, 'r'], messkirch: ['Messkirch', 9.11, 47.99, 'r'],
  todtnauberg: ['Todtnauberg', 7.95, 47.85, 'b'], heidelberg: ['Heidelberg', 8.69, 49.40, 'l'], marburg: ['Marburg', 8.77, 50.81, 'r'],
  frankfurt: ['Frankfurt', 8.68, 50.11, 'r'], konigstein: ['Königstein', 8.47, 50.18, 'l'], davos: ['Davos', 9.84, 46.80, 'r'],
  sils: ['Sils Maria', 9.76, 46.43, 'b'], bern: ['Bern', 7.45, 46.95, 'l'], brienz: ['Brienz', 8.04, 46.75, 'b'],
  klosters: ['Klosters', 9.88, 46.87, 'r'], lugano: ['Lugano', 8.95, 46.00, 'b'], breitenstein: ['Breitenstein', 15.83, 47.65, 'b'],
  berlin: ['Berlin', 13.40, 52.52, 'r'], munich: ['Munich', 11.58, 48.14, 'r'], capri: ['Capri', 14.24, 40.55, 'b'],
  naples: ['Naples', 14.27, 40.85, 'r'], rome: ['Rome', 12.50, 41.90, 'l'], riga: ['Riga', 24.11, 56.95, 'r'],
  paris: ['Paris', 2.35, 48.86, 'l'], marseille: ['Marseille', 5.37, 43.30, 'b'], moscow: ['Moscow', 37.62, 55.75, 'b'],
  hamburg: ['Hamburg', 9.99, 53.55, 'r'], kreuzlingen: ['Kreuzlingen', 9.17, 47.65, 'r'], london: ['London', -0.13, 51.51, 'b'],
};

// where the war left them at the start of 1919
const START = { w: 'cassino', h: 'freiburg', b: 'bern', c: 'berlin' };

// [label, lon, lat, first year, last year]
const COUNTRIES = [
  ['Germany', 10.4, 51.1], ['France', 2.6, 46.7], ['Poland', 19.6, 52.1], ['Austria', 13.2, 47.15], ['Czechoslovakia', 15.6, 49.65],
  ['Hungary', 19.5, 47.05], ['Italy', 12.4, 43.2], ['Soviet Russia', 31.5, 53.4, 1919, 1922], ['USSR', 31.5, 53.4, 1923, 1929],
  ['Lithuania', 24.0, 55.35], ['Latvia', 26.4, 56.55], ['Estonia', 25.8, 58.75], ['Romania', 25.0, 45.9],
  ['Serbs, Croats, Slovenes', 19.2, 44.3, 1919, 1928], ['Yugoslavia', 19.2, 44.3, 1929, 1929], ['Bulgaria', 25.2, 42.7],
  ['Spain', -3.7, 40.6], ['Britain', -1.7, 54.6], ['Belgium', 4.6, 50.55], ['Netherlands', 5.7, 52.75], ['Denmark', 9.3, 56.0],
  ['Sweden', 15.0, 58.6], ['Switzerland', 8.3, 46.55], ['Free City of Danzig', 18.6, 54.0, 1920, 1929],
  ['Ottoman Empire', 33.5, 39.6, 1919, 1922], ['Turkey', 33.5, 39.6, 1923, 1929],
];
const SEAS = [
  ['North Sea', 3.6, 56.0], ['Baltic Sea', 18.2, 55.7], ['Adriatic', 15.6, 43.2], ['Mediterranean', 5.5, 40.2],
  ['Black Sea', 33.6, 43.4], ['Tyrrhenian Sea', 11.4, 40.2],
];

// the two times two of the four meet: one card for both, whichever is clicked (its clip audio/en/<year>-hc.mp3,
// books/time-of-the-magicians/voice/meetings); at, where the walk stops for it; line, the caption there; pic, the
// picture from img/cards
const MEETINGS = {
  1923: { who: ['h', 'c'], at: 'hamburg', pic: '1922-c', title: 'Heidegger meets Cassirer', place: 'Hamburg', line: 'Hamburg: Heidegger meets Cassirer',
    text: "Hamburg, December 1923. Cassirer, whose first volume of The Philosophy of Symbolic Forms has just come out, heads the city's Kant Society, and he invites the young Heidegger, made a professor at Marburg that summer, to lecture. The next day he shows him Aby Warburg's library, and they talk about myth. It is the first meeting of two future rivals." },
  1929: { who: ['h', 'c'], at: 'davos', pic: '1929-c', title: 'The Davos Debate', place: 'Davos', line: 'Davos: Cassirer meets Heidegger again',
    text: "Davos, March 1929. At the university courses in the Swiss resort the two spend two weeks in the same hotel, and on 26 March they debate before students from all over Europe, among them Carnap, Levinas and Norbert Elias. Cassirer, ill and courteous, speaks for reason and culture: through the forms it makes, the human mind reaches beyond its limits. Heidegger answers that we are finite, thrown into a world, and that philosophy must shake us out of our comforts. Many feel the younger man has won. That summer Heidegger takes up Husserl's chair in Freiburg, and Hamburg makes Cassirer its rector." },
};

const YEARS = {
  1919: {
    europe: [
      'January: the Spartacist rising in Berlin is crushed; Rosa Luxemburg and Karl Liebknecht are murdered.',
      'June: Germany signs the Treaty of Versailles, losing land, colonies and most of its army.',
      'August: the Weimar Constitution makes Germany a democratic republic.',
      'September: the Treaty of Saint-Germain leaves Austria small, and forbids it to join Germany.',
    ],
    w: { route: ['vienna', 'hague', 'vienna'], at: 'vienna', place: 'Vienna and The Hague',
      text: 'Released from a prisoner-of-war camp in Italy, he reaches Vienna in August and gives his whole fortune to his brother and sisters. He starts training as a village schoolteacher. No publisher will take his book, so in December he spends four days in The Hague explaining it to Russell.' },
    h: { route: ['konstanz', 'freiburg'], at: 'freiburg',
      text: 'Home from the war, he breaks with the Catholic Church he grew up in and lectures in Freiburg as Husserl\'s assistant. His first son is born in January. In September, writing alone in a farmhouse near Konstanz, he learns that his wife Elfride loves another man.' },
    b: { route: ['brienz', 'klosters', 'lugano', 'breitenstein'], at: 'breitenstein', place: 'Bern to Breitenstein',
      text: 'He takes his doctorate in Bern with the highest grade, then has no job and no money. His parents turn up at the family\'s holiday pension and tell him to earn a living. By November he is in Austria, at a rest home run by his wife Dora\'s aunt.' },
    c: { route: ['hamburg'], at: 'hamburg', place: 'Berlin to Hamburg',
      text: 'After fourteen years as a junior lecturer in Berlin, teaching through the January street fighting, he is offered the chair of philosophy at the new University of Hamburg. In October he moves there with his wife Toni and their three children, and starts reading everything about language.' },
  },
  1920: {
    europe: [
      'January: the League of Nations is founded, without Germany or Soviet Russia.',
      'March: the Kapp Putsch tries to seize Berlin; a general strike defeats it within days.',
      'June: the Treaty of Trianon fixes the borders of a much smaller Hungary.',
      'August: Poland stops the Red Army outside Warsaw. November: Danzig becomes a Free City.',
    ],
    w: { route: ['klosterneuburg', 'trattenbach'], at: 'trattenbach',
      text: 'He finishes his teacher training and spends the summer as a gardener\'s help at the monastery of Klosterneuburg. In the autumn he starts teaching in Trattenbach, a remote village of a few hundred people south of Vienna. He is lonely and often thinks of ending his life.' },
    h: { route: ['messkirch', 'freiburg'], at: 'freiburg', place: 'Messkirch and Freiburg',
      text: 'In August and September he works long days in his home village of Messkirch and plays cards with his brother and father in the evenings, while Freiburg goes hungry. His second son, Hermann, is born in Freiburg; decades later it came out that another man was the father.' },
    b: { route: ['berlin'], at: 'berlin',
      text: 'With his wife and son he moves back into his parents\' villa in Berlin, then leaves after rows about money, taking an advance on his inheritance. By winter he is ill and low. He reads Heidegger\'s first book and thinks very little of it.' },
    c: { route: [], at: 'hamburg',
      text: 'He settles in Hamburg and reads hundreds of books on language for a great work: a philosophy of symbolic forms, of all the ways people give shape to their world. In the winter he is shown round Aby Warburg\'s private library, and is overwhelmed.' },
  },
  1921: {
    europe: [
      'March: Upper Silesia votes between Germany and Poland; the land is later split. The Treaty of Riga ends the Polish–Soviet war.',
      'March: sailors rise at Kronstadt; Lenin\'s New Economic Policy lets small trade back.',
      'May: the Allies fix Germany\'s reparations at 132 billion gold marks. August: the former finance minister Matthias Erzberger is murdered.',
      'December: the Anglo-Irish Treaty is signed in London.',
    ],
    w: { route: [], at: 'trattenbach',
      text: 'Still teaching in Trattenbach, he writes to Russell that the villagers are mean and petty. His book finally appears, in a German journal of natural philosophy. He dislikes the printing so much that he later calls it a pirated edition.' },
    h: { route: [], at: 'freiburg',
      text: 'Husserl\'s assistant in Freiburg, father of two small sons, he has published nothing since his book on Duns Scotus, and needs a new one to become a professor. He starts writing to the philosopher Karl Jaspers in Heidelberg, an ally against the old-style professors.' },
    b: { route: ['munich', 'heidelberg', 'berlin'], at: 'berlin', place: 'Munich, Heidelberg and Berlin',
      text: 'In the spring he buys Paul Klee\'s small picture of an angel, Angelus Novus, and plans a journal named after it. He spends weeks in Heidelberg, in love with the sculptor Jula Cohn, while his wife Dora loves another man. His essay on violence is published.' },
    c: { route: [], at: 'hamburg',
      text: 'Albert Einstein lectures on relativity in the Cassirers\' house in Hamburg. Cassirer publishes a short book on Einstein\'s theory, asking what the new physics does to our ideas of space and time. The first volume of his own great work, on language, is taking shape.' },
  },
  1922: {
    europe: [
      'April: at Rapallo, Germany and Soviet Russia make peace and open relations.',
      'June: foreign minister Walther Rathenau is shot dead in Berlin by nationalist assassins.',
      'October: Mussolini\'s Blackshirts march on Rome; the king makes him prime minister.',
      'December: the Irish Free State is founded, and the Soviet republics join as the USSR. In Germany the mark is falling fast.',
    ],
    w: { route: ['innsbruck', 'hassbach', 'puchberg'], at: 'puchberg', place: 'Innsbruck, Hassbach and Puchberg',
      text: 'In August he meets Russell in Innsbruck, and they part on bad terms. He tries a school in Hassbach, hates it, and moves to Puchberg am Schneeberg. In November the first copies of his book in German and English reach him: the Tractatus.' },
    h: { route: ['todtnauberg', 'heidelberg', 'freiburg'], at: 'freiburg', place: 'Todtnauberg, Heidelberg and Freiburg',
      text: 'Elfride buys land at Todtnauberg in the Black Forest and has a hut built, and the family moves in in August. He spends a week with Jaspers in Heidelberg. His report on Aristotle, where the word Dasein first appears, catches Marburg\'s eye.' },
    b: { route: ['heidelberg'], at: 'heidelberg', place: 'Berlin and Heidelberg',
      text: 'He earns nothing all year. He hunts for rare books in Berlin, Frankfurt and Heidelberg to sell them on, and finishes a long essay on Goethe\'s novel Elective Affinities. He spends Christmas alone in a rented room in Heidelberg.' },
    c: { route: [], at: 'hamburg',
      text: 'In June a neighbour yells at the family that they belong in Palestine, and Cassirer protests in writing. Working with the Warburg Library\'s books, he finishes the first volume of his Philosophy of Symbolic Forms, on language, and turns to myth.' },
  },
  1923: {
    europe: [
      'January: French and Belgian troops occupy the Ruhr to make Germany pay. Lithuania seizes the Memel territory.',
      'November: the mark collapses; a dollar costs 4.2 trillion marks.',
      '8–9 November: Hitler\'s putsch in Munich fails. A week later the Rentenmark ends the inflation.',
      'October: Turkey becomes a republic.',
    ],
    w: { route: [], at: 'puchberg',
      text: 'In September a brilliant young Cambridge mathematician, Frank Ramsey, comes to Puchberg. For two weeks, every afternoon after school, they go through the Tractatus line by line. Friends in England, Keynes among them, begin to send letters and offers of help.' },
    h: { route: ['marburg', 'hamburg', 'marburg'], at: 'marburg', place: 'Marburg and Hamburg',
      text: 'In June he is made a professor at Marburg. Flats are scarce, so in the autumn he goes alone. In December he lectures in Hamburg and meets Cassirer for the first time; Cassirer shows him the Warburg Library, and they talk about myth.' },
    b: { route: ['frankfurt', 'berlin'], at: 'berlin', place: 'Frankfurt and Berlin',
      text: 'Frankfurt University will not take his Goethe essay as a qualification to teach, and suggests he write on baroque tragic drama instead. In Berlin the inflation eats everything, and the family moves in with his parents again. His friend Scholem leaves for Palestine.' },
    c: { route: [], at: 'hamburg',
      text: 'The first volume of his Philosophy of Symbolic Forms comes out. As head of Hamburg\'s Kant Society he invites the young Heidegger to lecture in December, and the next day shows him Warburg\'s library. It is the first meeting of two future rivals.' },
  },
  1924: {
    europe: [
      'January: Lenin dies. Britain gets its first Labour government.',
      'June: in Rome, fascists murder the socialist leader Giacomo Matteotti.',
      'August: the Dawes Plan eases Germany\'s reparation payments.',
      'November: Thomas Mann publishes The Magic Mountain, set in a sanatorium at Davos. Hitler, in prison, is writing Mein Kampf.',
    ],
    w: { route: ['otterthal'], at: 'otterthal', place: 'Puchberg to Otterthal',
      text: 'Keynes invites him to England and offers him money; he says no. In September he moves to another village school, at Otterthal. For his pupils he begins a spelling dictionary of the words they really use.' },
    h: { route: [], at: 'marburg',
      text: 'His family joins him in Marburg, and students crowd into his lectures on anxiety and death. His father dies. In the autumn a young student, Hannah Arendt, comes to see him in his office; early the next year they become lovers, in secret.' },
    b: { route: ['capri', 'naples', 'capri', 'rome', 'berlin'], at: 'berlin', place: 'Capri, Naples and Berlin',
      text: 'In April he goes to Capri, cheap and sunny, to write his book on baroque drama. There he meets the Latvian theatre director Asja Lācis, falls in love, and through her turns towards communism. He leaves in October, by way of Rome, for Berlin.' },
    c: { route: ['kreuzlingen', 'hamburg'], at: 'hamburg', place: 'Kreuzlingen and Hamburg',
      text: 'In April he visits Aby Warburg at a clinic in Kreuzlingen on Lake Constance, where the scholar has been treated for years for mental illness. Their talk gives Warburg new heart; in August he is released and goes home to Hamburg.' },
  },
  1925: {
    europe: [
      'February: President Ebert dies. April: Field Marshal Hindenburg is elected president.',
      'April: the Hebrew University opens in Jerusalem.',
      'Hitler publishes the first volume of Mein Kampf. In August the last French and Belgian troops leave the Ruhr.',
      'October: at Locarno, Germany accepts its western borders with France and Belgium.',
    ],
    w: { route: [], at: 'otterthal',
      text: 'He goes on teaching at Otterthal, demanding and at times violent with his pupils. The villagers think him very strange. His spelling dictionary for primary schools goes to a Vienna publisher.' },
    h: { route: ['todtnauberg', 'marburg'], at: 'marburg', place: 'Marburg and Todtnauberg',
      text: 'His secret affair with Hannah Arendt fills the spring. Marburg will promote him only if he publishes a book, so in August he shuts himself in the hut at Todtnauberg and writes, at speed, what will become Being and Time.' },
    b: { route: ['frankfurt', 'naples', 'berlin', 'riga'], at: 'riga', place: 'Frankfurt, Naples and Riga',
      text: 'His book on baroque tragic drama is meant to make him a professor. The Frankfurt examiners find it unreadable, and he withdraws it. He spends the summer around Naples, and in November goes to Riga to see Asja Lācis.' },
    c: { route: [], at: 'hamburg',
      text: 'The second volume of his Philosophy of Symbolic Forms, on mythical thought, comes out, with a short book on language and myth. Asked who should fill a chair at Marburg, Heidegger tells Jaspers that Cassirer would be the best choice.' },
  },
  1926: {
    europe: [
      'May: a general strike stops Britain for nine days. In Poland, Piłsudski takes power in a coup.',
      'September: Germany joins the League of Nations.',
      'In Moscow, Stalin has Trotsky thrown out of the Politburo.',
    ],
    w: { route: ['vienna', 'hutteldorf', 'vienna'], at: 'vienna', place: 'Otterthal to Vienna',
      text: 'In April he strikes a pupil who collapses, and leaves Otterthal the same day; his teaching is over. He works as a monastery gardener at Hütteldorf, where he hears that his mother has died. In the autumn he starts designing a house in Vienna for his sister.' },
    h: { route: ['todtnauberg', 'marburg'], at: 'marburg', place: 'Todtnauberg and Marburg',
      text: 'The printing of Being and Time begins in April, while his sons lie ill with scarlet fever at the hut. The first sheets go to the ministry in Berlin to win him the chair. Hannah Arendt leaves Marburg to study with Jaspers in Heidelberg.' },
    b: { route: ['berlin', 'paris', 'marseille', 'berlin', 'moscow'], at: 'moscow', place: 'Paris, Marseille and Moscow',
      text: 'He goes back and forth between Berlin and Paris, translating Proust. His father dies in the summer. In September, in Marseille, he is close to despair. In December he travels to Moscow, where Asja Lācis lies ill in a sanatorium, and stays two months.' },
    c: { route: [], at: 'hamburg',
      text: 'On 1 May the Warburg Library opens in its new building in Hamburg, and Cassirer speaks at the celebration. His book on the individual and the cosmos in Renaissance philosophy is dedicated to Warburg for his sixtieth birthday.' },
  },
  1927: {
    europe: [
      'January: Fritz Lang\'s Metropolis has its premiere in Berlin.',
      'May: Charles Lindbergh flies alone from New York to Paris.',
      'July: in Vienna, police fire on a crowd that has set the Palace of Justice on fire; 89 protesters die.',
      'November: Trotsky is expelled from the Soviet Communist Party.',
    ],
    w: { route: [], at: 'vienna',
      text: 'He builds his sister Margarete\'s house in Vienna, minding every detail. Through her he meets Moritz Schlick and then the Vienna Circle, philosophers who revere the Tractatus. At one meeting he turns his back on them and reads poems by Tagore.' },
    h: { route: ['messkirch', 'marburg'], at: 'marburg', place: 'Marburg and Messkirch',
      text: 'Being and Time is published in April and makes his name. In May he lays a copy on his dying mother\'s bed in Messkirch. In October, staying there to settle her affairs, he hears that Berlin has given him the Marburg chair at last.' },
    b: { route: ['berlin', 'paris', 'berlin'], at: 'berlin', place: 'Moscow, Paris and Berlin',
      text: 'He leaves wintry Moscow at the end of January without joining the Communist Party. In Paris he starts notes on the city\'s glass-roofed shopping arcades, a project that will occupy him for the rest of his life. In the autumn he lies ill in Berlin.' },
    c: { route: ['london', 'hamburg'], at: 'hamburg', place: 'Hamburg and London',
      text: 'His wife Toni is hit by a car in September. He finishes a draft of the third volume of his Philosophy of Symbolic Forms, then sails from Hamburg for two weeks alone in England and the Netherlands, pleased at how well he gets by in English.' },
  },
  1928: {
    europe: [
      'May: in the Reichstag election the Social Democrats gain; the Nazis win 2.6 per cent.',
      'August: The Threepenny Opera opens in Berlin. In Paris fifteen states sign the Kellogg–Briand Pact against war.',
      'In London, Alexander Fleming discovers penicillin.',
      'Stalin sends Trotsky into exile in Alma-Ata.',
    ],
    w: { route: [], at: 'vienna',
      text: 'The house is finished in November; he has the ceiling of one room raised by three centimetres. In March a lecture in Vienna by the Dutch mathematician L. E. J. Brouwer stirs him, and he begins to think of going back to philosophy.' },
    h: { route: ['freiburg', 'todtnauberg', 'freiburg'], at: 'freiburg', place: 'Marburg to Freiburg',
      text: 'He is chosen to succeed his old teacher Husserl in Freiburg. Elfride designs a new family house there while he spends the summer at the hut. In December he is invited to lecture the next spring at Davos, in the Swiss Alps.' },
    b: { route: [], at: 'berlin',
      text: 'Two of his books come out at last: One-Way Street and The Origin of German Tragic Drama. He experiments with hashish, writes for newspapers, and meets Bertolt Brecht. Asja Lācis comes to Berlin, and for a while they live together.' },
    c: { route: ['sils', 'hamburg'], at: 'hamburg', place: 'Hamburg and the Engadin',
      text: 'Frankfurt tries to lure him away; Warburg campaigns in the press to keep him, and he stays. In August he speaks at Hamburg\'s city hall in defence of the republic and its constitution, then takes the night train to the Swiss Alps.' },
  },
  1929: {
    europe: [
      'February: the Lateran Treaty settles the Pope\'s place in Italy.',
      'May: in Berlin, May Day street fighting with the police leaves over thirty dead.',
      'June: the Young Plan replaces the Dawes Plan for Germany\'s reparations.',
      'October: Stresemann, Germany\'s foreign minister, dies. Three weeks later Wall Street crashes.',
    ],
    w: { route: ['cambridge', 'nottingham', 'cambridge'], at: 'cambridge', place: 'Vienna to Cambridge',
      text: 'In January he returns to Cambridge to do philosophy again. In June the Tractatus earns him a doctorate, with Russell and Moore as examiners. In July he gives his only conference talk, in Nottingham, and in November a lecture on ethics.' },
    h: { route: ['davos'], at: 'davos', place: 'Davos',
      text: 'In March, at the university courses in Davos, he skis, lectures on Kant, and debates Cassirer before students from all over Europe. Many feel the younger man has won. In July he gives his first lecture as Freiburg\'s professor: What is Metaphysics?' },
    b: { route: ['konigstein', 'berlin', 'paris'], at: 'paris', place: 'Berlin, Königstein and Paris',
      text: 'He is not invited to Davos. In Berlin his affair with Asja Lācis ends, and he sues his wife Dora for divorce. In the autumn he talks with Adorno and Horkheimer near Frankfurt, then breaks down. He spends New Year\'s Eve alone in Paris.' },
    c: { route: ['davos'], at: 'davos', place: 'Davos',
      text: 'Ill for much of his stay at Davos, he still meets Heidegger in debate on 26 March: Cassirer speaks for reason and culture, Heidegger for human finitude. In July Hamburg elects him rector of its university, one of the first Jews to lead a German university.' },
  },
};
