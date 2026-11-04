/* The story the map tells: the four, the places they pass, and each year's card for each of them.
   Our own words. Dates are Western calendar; Japan kept the lunar calendar until the start of 1873. Sources: notes/sources.md.
   A year's card for one person: route, the places walked through that year after where the last year left them (the
   last is where they stand: `at`); place, the card's heading; text, the card's words. */
'use strict';
const INTRO = {
  title: 'The Map Redrawn', sub: 'Japan 1868–1878',
  text: 'On the eve of 1868, Japan is a patchwork: more than 260 domains, Tokugawa land, and thousands of scattered holdings. Each year the map plays what happened; then Fukuzawa, Itō, Saigō and Tsuda walk to where that year took them. Click one to read their year.',
};

const PEOPLE = {
  fukuzawa: { name: 'Fukuzawa Yukichi', jp: '福澤諭吉', short: 'Fukuzawa', color: '#b3892f', img: 'img/fukuzawa.jpg' },
  ito: { name: 'Itō Hirobumi', jp: '伊藤博文', short: 'Itō', color: '#3d5a80', img: 'img/ito.jpg' },
  saigo: { name: 'Saigō Takamori', jp: '西郷隆盛', short: 'Saigō', color: '#587a3e', img: 'img/saigo.jpg' },
  tsuda: { name: 'Tsuda Umeko', jp: '津田梅子', short: 'Tsuda', color: '#b23a2e', img: 'img/tsuda.png' },
};

// [label, lon, lat, label side: r, l, t, b]
const PLACES = {
  edo: ['Edo', 139.77, 35.68, 'r'], tokyo: ['Tokyo', 139.77, 35.68, 'r'], yokohama: ['Yokohama', 139.64, 35.44, 'r'],
  kyoto: ['Kyoto', 135.77, 35.01, 't'], kobe: ['Kobe', 135.18, 34.69, 'b'], hagi: ['Hagi', 131.40, 34.41, 't'],
  yamaguchi: ['Yamaguchi', 131.47, 34.18, 'b'], kagoshima: ['Kagoshima', 130.56, 31.60, 'l'],
  kashiwazaki: ['Kashiwazaki', 138.56, 37.37, 'l'], tsuruoka: ['Tsuruoka', 139.83, 38.73, 'r'],
  hakodate: ['Hakodate', 140.73, 41.77, 'r'], osaka: ['Osaka', 135.50, 34.69, 'b'], kumamoto: ['Kumamoto', 130.71, 32.80, 'l'],
  hitoyoshi: ['Hitoyoshi', 130.76, 32.21, 'l'], nobeoka: ['Nobeoka', 131.66, 32.58, 'r'],
  // off the map: a marker in the Pacific for anyone gone overseas
  abroad: ['America', 145.2, 33.6, 'b'],
};

// where each of the four stands before the first year
const START = { fukuzawa: 'edo', ito: 'hagi', saigo: 'kagoshima', tsuda: 'edo' };

const YEARS = {
  1868: {
    fukuzawa: { route: [], at: 'edo', place: 'Edo', text: 'He names his school Keiō Gijuku, after the era. On 4 July, with the guns of the battle at Ueno audible across the city, he keeps teaching Wayland’s economics. He turns down posts in the new government.' },
    ito: { route: ['kobe'], at: 'kobe', place: 'Kobe', text: 'One of the few men in the new government who has seen London. He handles foreign affairs at the treaty port, and in July, aged twenty-six, becomes governor of Hyōgo.' },
    saigo: { route: ['kyoto', 'edo', 'kashiwazaki', 'tsuruoka', 'edo', 'kyoto', 'kagoshima'], at: 'kagoshima', place: 'Edo to the north, and home', text: 'He talks Edo into surrender, then goes north with the war. His brother Kichijirō dies of wounds in Echigo. When Shōnai gives up he asks for mild terms, and by December he is home, soaking in a hot spring.' },
    tsuda: { route: [], at: 'edo', place: 'Edo', text: 'Three years old, in Ushigome. Her father Sen interpreted for the shogunate’s foreign office. That employer no longer exists.' },
  },
  1869: {
    fukuzawa: { route: ['tokyo'], at: 'tokyo', place: 'Tokyo', text: 'While the government redraws Japan, he draws the world. He publishes Sekai Kunizukushi, the countries of the earth set out in verse.' },
    ito: { route: ['tokyo'], at: 'tokyo', place: 'Kobe to Tokyo', text: 'From Hyōgo he sends the court a plan for ruling the country from one centre. In the spring he leaves for Tokyo and the finance ministry, to work on the currency.' },
    saigo: { route: ['hakodate', 'kagoshima'], at: 'kagoshima', place: 'Hakodate, and home', text: 'His lord rides out to the hot spring to fetch him back to run the domain. In summer he sails the length of Japan to fight at Hakodate, and lands a week after the surrender. He goes home.' },
    tsuda: { route: ['tokyo'], at: 'tokyo', place: 'Tokyo', text: 'Four years old. The city she was born in has a new name. Her father, out of government service, turns to growing Western vegetables.' },
  },
  1870: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Tokyo', text: 'The school has outgrown Shinsenza. He sells the site and bargains with the city for a former Shimabara domain estate on the hill at Mita. Iwakura Tomomi helps him get it.' },
    ito: { route: ['yokohama'], at: 'yokohama', place: 'Yokohama', text: 'At the end of the year he sails for America to study money and banks. A country that is still counted in domains is about to need one currency.' },
    saigo: { route: ['yamaguchi', 'kagoshima'], at: 'kagoshima', place: 'Yamaguchi, and home', text: 'In March he crosses to Chōshū to see the mutiny for himself. Help is not what he offers. Back in Kagoshima he is running a domain that is meant to be finished, and its soldiers carry weight.' },
    tsuda: { route: [], at: 'tokyo', place: 'Tokyo', text: 'Five years old. Nothing in the records marks this year for her.' },
  },
  1871: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'This spring the school moves to Mita, and he moves with it. Keiō is still there. In the summer the domains that made him a low-ranking samurai of Nakatsu are abolished.' },
    ito: { route: ['tokyo', 'yokohama'], at: 'yokohama', place: 'Yokohama, bound for America', text: 'Back from America, he sees the New Currency Act give Japan the yen. On 23 December he sails from Yokohama as a vice-ambassador of the Iwakura Mission.' },
    saigo: { route: ['tokyo'], at: 'tokyo', place: 'Tokyo', text: 'The government comes to Kagoshima to ask him back. He leads Satsuma’s troops to Tokyo and in the summer becomes a councillor. When the domains are ended, his soldiers give the decree force.' },
    tsuda: { route: ['yokohama'], at: 'yokohama', place: 'Yokohama, bound for America', text: 'The government wants girls educated in America. Her sister refuses, so her father offers her. On 23 December she boards the America at Yokohama, aged six, the youngest of five girls. She will not see Japan again for almost eleven years.' },
  },
  1872: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'This year the first part of An Encouragement of Learning appears: heaven, it says, makes no one above or below anyone else. Rank is what study gives you. It sells on a scale no Japanese book has known.' },
    ito: { route: ['abroad'], at: 'abroad', place: 'America and Europe', text: 'In San Francisco he speaks of the rising sun on Japan’s flag. Then he goes back to Tokyo and returns again, because the mission has no proper credentials to negotiate. The treaties do not move. The education of the travellers does.' },
    saigo: { route: [], at: 'tokyo', place: 'Tokyo', text: 'The others have sailed, and he is left to mind the government. The caretaker government pushes ahead with reforms the travellers asked it to leave alone.' },
    tsuda: { route: ['abroad'], at: 'abroad', place: 'Georgetown, Washington', text: 'She reaches Washington on 29 February, seven years old, and goes to live with Charles and Adeline Lanman. English comes quickly. Japanese starts to go.' },
  },
  1873: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'With Mori Arinori and others he helps form the Meiji Six Society, writers arguing in public about what Japan should become. He still will not take a government post.' },
    ito: { route: ['tokyo'], at: 'tokyo', place: 'Tokyo', text: 'He comes home to a crisis and takes Ōkubo’s side against sending Saigō to Korea. On 25 October, the day after it ends, he becomes a councillor and minister of public works. He is thirty-two.' },
    saigo: { route: ['kagoshima'], at: 'kagoshima', place: 'Kagoshima', text: 'He wants to go to Korea as envoy, and he is overruled. On 23 October he resigns and goes home. Hundreds of Satsuma officers follow him out of Tokyo.' },
    tsuda: { route: [], at: 'abroad', place: 'Georgetown, Washington', text: 'In spring she asks for baptism. In July, aged eight, she is baptised at an independent church near Philadelphia. The Lanmans did not ask it of her.' },
  },
  1874: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'The Encouragement of Learning keeps coming, part after part, and his students begin to practise public speaking, a skill with few words yet in Japanese. He starts a longer book.' },
    ito: { route: [], at: 'tokyo', place: 'Tokyo', text: 'Ōkubo is the government now, and he is Ōkubo’s man. When Ōkubo leaves for China in August, he holds the home ministry for a few months.' },
    saigo: { route: [], at: 'kagoshima', place: 'Kagoshima', text: 'In June his followers open schools in Kagoshima, in the old castle stables: infantry and artillery, with branches across the prefecture. He is told it will keep the young men from doing something rash.' },
    tsuda: { route: [], at: 'abroad', place: 'Georgetown, Washington', text: 'Nine, and at school in Georgetown. Of the five girls who sailed, two have already gone home.' },
  },
  1875: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'In August he publishes An Outline of a Theory of Civilization. Independence for a nation, it says, is the goal, and civilisation the means. On the same campus, a hall is going up for speaking in public.' },
    ito: { route: ['osaka', 'tokyo'], at: 'tokyo', place: 'Osaka and Tokyo', text: 'He helps bring Ōkubo, Kido and Itagaki together at Osaka to mend the government. Kido and Itagaki come back. It is the first time he is the man who makes the others talk.' },
    saigo: { route: [], at: 'kagoshima', place: 'Kagoshima', text: 'He farms, hunts with his dogs, and stays out of Tokyo. In Kagoshima the prefecture increasingly runs on his men.' },
    tsuda: { route: [], at: 'abroad', place: 'Georgetown, Washington', text: 'Ten. She has now spent more than a third of her life in America, and her Japanese is fading.' },
  },
  1876: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'In November the last part of the Encouragement of Learning appears. It is one of the most widely read books in Japan. He is forty-one and still holds no office.' },
    ito: { route: [], at: 'tokyo', place: 'Tokyo', text: 'Public works, railways, telegraphs: the wires and lines are his department. The swords and the stipends are not, but the state he serves is ending both.' },
    saigo: { route: [], at: 'kagoshima', place: 'Kagoshima', text: 'Kumamoto, Akizuki, Hagi: one after another the old samurai rise and are put down. Many look to Kagoshima. He stays where he is.' },
    tsuda: { route: [], at: 'abroad', place: 'Georgetown, Washington', text: 'Eleven. In Philadelphia the Centennial Exhibition opens, with a Japanese pavilion. It has been more than four years since she left.' },
  },
  1877: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'While the government calls Saigō a traitor, he writes an essay defending him: a government that crushes every spirit of resistance, he argues, loses something it needs. He does not publish it. It will appear in 1901, the year he dies.' },
    ito: { route: ['kyoto', 'tokyo'], at: 'tokyo', place: 'Kyoto and Tokyo', text: 'Kido, his old patron, dies in May while the war goes on. He is one of the men left to run a government at war with the man who helped make it.' },
    saigo: { route: ['kumamoto', 'hitoyoshi', 'nobeoka', 'kagoshima'], at: 'kagoshima', place: 'Kumamoto to Shiroyama', text: 'He marches north with his schools behind him, and Kumamoto castle does not fall. After months of fighting and retreat he returns to Kagoshima with a few hundred men. He dies on the hill of Shiroyama on 24 September. He is forty-nine.' },
    tsuda: { route: [], at: 'abroad', place: 'Georgetown, Washington', text: 'Twelve. A war she could not picture is fought in a country she can no longer quite speak to.' },
  },
  1878: {
    fukuzawa: { route: [], at: 'tokyo', place: 'Mita, Tokyo', text: 'The men who ran the country a decade ago are nearly all gone. He is still at Mita, still teaching, still outside it. The school will outlast the government he would not join.' },
    ito: { route: [], at: 'tokyo', place: 'Tokyo', text: 'On 15 May, the day after Ōkubo is killed, he takes Ōkubo’s place as home minister. At thirty-six he is at the centre of the government. In seven years he will be its first prime minister.' },
    saigo: { route: [], at: 'kagoshima', gone: true, place: 'Shiroyama, Kagoshima', text: 'Dead, and officially a rebel. In 1889 the emperor will pardon him. There is a statue of him now in Ueno, in the city whose surrender he took.' },
    tsuda: { route: [], at: 'abroad', place: 'Washington', text: 'She finishes school and goes on to the Archer Institute. She is thirteen, and four years remain. When she comes home she will have to relearn Japanese, and then she will found a college for women.' },
  },
};
