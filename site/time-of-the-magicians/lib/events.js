/* Each year's events, played on the map when the year changes: a pin where it happened and a card with a period
   picture (img/events/<id>.webp, credits in index.html). text is word for word the year's Europe narration, which
   audio/en/<year>-e<n>.mp3 cuts into one clip per event (books/time-of-the-magicians/split_europe.py; e0 is
   "Europe in <year>."). at: [place name, lon, lat]; a place off the map's data (New York) shows the card alone.
   glow: a state in BORDERS lit while the card is up. pic: false, no picture found (books/.../events/SOURCES.tsv). */
'use strict';
const EVENTS = {
  1919: [
    { title: 'The Spartacist Rising', at: ['Berlin', 13.40, 52.52], text: 'January: the Spartacist rising in Berlin is crushed; Rosa Luxemburg and Karl Liebknecht are murdered.' },
    { title: 'The Treaty of Versailles', at: ['Versailles', 2.13, 48.80], glow: 'Germany (Prussia)', text: 'June: Germany signs the Treaty of Versailles, losing land, colonies and most of its army.' },
    { title: 'A Republic at Weimar', at: ['Weimar', 11.33, 50.98], glow: 'Germany (Prussia)', text: 'August: the Weimar Constitution makes Germany a democratic republic.' },
    { title: 'The Treaty of Saint-Germain', at: ['Saint-Germain', 2.09, 48.90], glow: 'Austria', text: 'September: the Treaty of Saint-Germain leaves Austria small, and forbids it to join Germany.' },
  ],
  1920: [
    { title: 'The League of Nations', at: ['Geneva', 6.14, 46.20], text: 'January: the League of Nations is founded, without Germany or Soviet Russia.' },
    { title: 'The Kapp Putsch', at: ['Berlin', 13.40, 52.52], text: 'March: the Kapp Putsch tries to seize Berlin; a general strike defeats it within days.' },
    { title: 'The Treaty of Trianon', at: ['Trianon', 2.11, 48.82], glow: 'Hungary', text: 'June: the Treaty of Trianon fixes the borders of a much smaller Hungary.' },
    { title: 'The Miracle on the Vistula', at: ['Warsaw', 21.01, 52.23], glow: 'Poland', text: 'August: Poland stops the Red Army outside Warsaw.' },
    { title: 'The Free City of Danzig', at: ['Danzig', 18.65, 54.35], glow: 'Danzig', text: 'November: Danzig becomes a Free City.' },
  ],
  1921: [
    { title: 'The Upper Silesia Plebiscite', at: ['Upper Silesia', 18.70, 50.30], text: 'March: Upper Silesia votes between Germany and Poland; the land is later split.' },
    { title: 'The Peace of Riga', at: ['Riga', 24.11, 56.95], text: 'The Treaty of Riga ends the Polish–Soviet war.' },
    { title: 'Kronstadt and the New Economic Policy', at: ['Kronstadt', 29.77, 59.99], text: 'March: sailors rise at Kronstadt; Lenin\'s New Economic Policy lets small trade back.' },
    { title: 'The Bill for the War', at: ['London', -0.13, 51.51], glow: 'Germany (Prussia)', text: 'May: the Allies fix Germany\'s reparations at 132 billion gold marks.' },
    { title: 'Erzberger Murdered', at: ['Bad Griesbach', 8.25, 48.43], text: 'August: the former finance minister Matthias Erzberger is murdered.' },
    { title: 'The Anglo-Irish Treaty', at: ['London', -0.13, 51.51], text: 'December: the Anglo-Irish Treaty is signed in London.' },
  ],
  1922: [
    { title: 'The Treaty of Rapallo', at: ['Rapallo', 9.23, 44.35], text: 'April: at Rapallo, Germany and Soviet Russia make peace and open relations.' },
    { title: 'Rathenau Assassinated', at: ['Berlin', 13.40, 52.52], text: 'June: foreign minister Walther Rathenau is shot dead in Berlin by nationalist assassins.' },
    { title: 'The March on Rome', at: ['Rome', 12.50, 41.90], glow: 'Italy/Sardinia', text: 'October: Mussolini\'s Blackshirts march on Rome; the king makes him prime minister.' },
    { title: 'A Free State and a Union', at: ['Dublin', -6.26, 53.35], also: ['Moscow', 37.62, 55.75], text: 'December: the Irish Free State is founded, and the Soviet republics join as the USSR.' },
    { title: 'The Falling Mark', at: ['Berlin', 13.40, 52.52], text: 'In Germany the mark is falling fast.' },
  ],
  1923: [
    { title: 'The Occupation of the Ruhr', at: ['Essen', 7.01, 51.46], text: 'January: French and Belgian troops occupy the Ruhr to make Germany pay.' },
    { title: 'Memel Seized', at: ['Memel', 21.13, 55.70], glow: 'Lithuania', text: 'Lithuania seizes the Memel territory.' },
    { title: 'The Great Inflation', at: ['Berlin', 13.40, 52.52], text: 'November: the mark collapses; a dollar costs 4.2 trillion marks.' },
    { title: 'The Beer Hall Putsch', at: ['Munich', 11.58, 48.14], text: '8–9 November: Hitler\'s putsch in Munich fails.' },
    { title: 'The Rentenmark', at: ['Berlin', 13.40, 52.52], text: 'A week later the Rentenmark ends the inflation.' },
    { title: 'The Republic of Turkey', at: ['Ankara', 32.85, 39.93], glow: 'Turkey (Ottoman Empire)', text: 'October: Turkey becomes a republic.' },
  ],
  1924: [
    { title: 'Lenin Is Dead', at: ['Moscow', 37.62, 55.75], text: 'January: Lenin dies.' },
    { title: 'Labour in Power', at: ['London', -0.13, 51.51], text: 'Britain gets its first Labour government.' },
    { title: 'The Matteotti Murder', at: ['Rome', 12.50, 41.90], text: 'June: in Rome, fascists murder the socialist leader Giacomo Matteotti.' },
    { title: 'The Dawes Plan', at: ['London', -0.13, 51.51], text: 'August: the Dawes Plan eases Germany\'s reparation payments.' },
    { title: 'The Magic Mountain', at: ['Davos', 9.84, 46.80], text: 'November: Thomas Mann publishes The Magic Mountain, set in a sanatorium at Davos.' },
    { title: 'A Prisoner at Landsberg', at: ['Landsberg', 10.87, 48.05], text: 'Hitler, in prison, is writing Mein Kampf.' },
  ],
  1925: [
    { title: 'A Field Marshal for President', at: ['Berlin', 13.40, 52.52], text: 'February: President Ebert dies. April: Field Marshal Hindenburg is elected president.' },
    { title: 'The Hebrew University', at: ['Jerusalem', 35.24, 31.79], text: 'April: the Hebrew University opens in Jerusalem.' },
    { title: 'Mein Kampf', at: ['Munich', 11.58, 48.14], text: 'Hitler publishes the first volume of Mein Kampf.' },
    { title: 'The Ruhr Evacuated', pic: false, at: ['Essen', 7.01, 51.46], text: 'In August the last French and Belgian troops leave the Ruhr.' },
    { title: 'The Spirit of Locarno', at: ['Locarno', 8.79, 46.17], text: 'October: at Locarno, Germany accepts its western borders with France and Belgium.' },
  ],
  1926: [
    { title: 'The General Strike', at: ['London', -0.13, 51.51], text: 'May: a general strike stops Britain for nine days.' },
    { title: 'The May Coup', at: ['Warsaw', 21.01, 52.23], glow: 'Poland', text: 'In Poland, Piłsudski takes power in a coup.' },
    { title: 'Germany in the League', at: ['Geneva', 6.14, 46.20], text: 'September: Germany joins the League of Nations.' },
    { title: 'Trotsky Pushed Out', at: ['Moscow', 37.62, 55.75], text: 'In Moscow, Stalin has Trotsky thrown out of the Politburo.' },
  ],
  1927: [
    { title: 'Metropolis', at: ['Berlin', 13.40, 52.52], text: 'January: Fritz Lang\'s Metropolis has its premiere in Berlin.' },
    { title: 'Lindbergh Lands in Paris', at: ['Paris', 2.44, 48.97], text: 'May: Charles Lindbergh flies alone from New York to Paris.' },
    { title: 'The Palace of Justice Burns', at: ['Vienna', 16.37, 48.21], text: 'July: in Vienna, police fire on a crowd that has set the Palace of Justice on fire; 89 protesters die.' },
    { title: 'Trotsky Expelled', at: ['Moscow', 37.62, 55.75], text: 'November: Trotsky is expelled from the Soviet Communist Party.' },
  ],
  1928: [
    { title: 'The Reichstag Election', at: ['Berlin', 13.40, 52.52], text: 'May: in the Reichstag election the Social Democrats gain; the Nazis win 2.6 per cent.' },
    { title: 'The Threepenny Opera', at: ['Berlin', 13.40, 52.52], text: 'August: The Threepenny Opera opens in Berlin.' },
    { title: 'The Pact Against War', at: ['Paris', 2.35, 48.86], text: 'In Paris fifteen states sign the Kellogg–Briand Pact against war.' },
    { title: 'Penicillin', at: ['London', -0.13, 51.51], text: 'In London, Alexander Fleming discovers penicillin.' },
    { title: 'Trotsky in Exile', at: ['Moscow', 37.62, 55.75], text: 'Stalin sends Trotsky into exile in Alma-Ata.' },
  ],
  1929: [
    { title: 'The Lateran Treaty', at: ['Rome', 12.45, 41.90], text: 'February: the Lateran Treaty settles the Pope\'s place in Italy.' },
    { title: 'Bloody May', at: ['Berlin', 13.40, 52.52], text: 'May: in Berlin, May Day street fighting with the police leaves over thirty dead.' },
    { title: 'The Young Plan', at: ['Paris', 2.35, 48.86], text: 'June: the Young Plan replaces the Dawes Plan for Germany\'s reparations.' },
    { title: 'Stresemann Is Dead', at: ['Berlin', 13.40, 52.52], text: 'October: Stresemann, Germany\'s foreign minister, dies.' },
    { title: 'The Crash', at: ['New York', -74.01, 40.71], text: 'Three weeks later Wall Street crashes.' },
  ],
};
