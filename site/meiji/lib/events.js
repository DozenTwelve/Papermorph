/* What happens on the map each year, in order. Dates are Western calendar. Sources: notes/sources.md.
   at: [place name, lon, lat], where the camera goes and the pin drops; glow: a province name to light, in kanji;
   pic: a picture path, or false for a card without one; state: the id of a map state (lib/states.js) the map changes to. */
'use strict';
const EVENTS = {
  1868: [
    { title: 'Toba and Fushimi', at: ['Fushimi', 135.76, 34.93], glow: '山城', pic: 'img/events/toba-fushimi.webp', caption: 'Shōkōsai Kunihiro, print of the battle, 1868', text: 'On 27 January, outside Kyoto, Satsuma and Chōshū meet a larger Tokugawa army. In four days it is over, and the last shogun leaves for Edo by sea.' },
    { title: 'The Charter Oath', at: ['Kyoto', 135.77, 35.01], glow: '山城', pic: 'img/events/charter-oath.webp', caption: 'A draft of the Oath by Yuri Kimimasa, with Fukuoka Takachika’s changes, 1868', text: 'On 6 April the emperor, fifteen years old, swears to assemblies, open debate, and knowledge sought throughout the world.' },
    { title: 'Edo Opens', at: ['Edo', 139.77, 35.68], glow: '武蔵', state: 'tokugawa-lands-1868', pic: false, text: 'In early April Saigō Takamori and Katsu Kaishū settle terms. On 3 May the castle opens without a battle. Tokugawa land starts passing to the new government.' },
    { title: 'Edo Becomes Tokyo', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: 'img/journey.jpg', text: 'On 3 September the city is renamed the eastern capital. In October the era becomes Meiji. In November the emperor arrives for the first time, then goes back to Kyoto.' },
    { title: 'Aizu Falls', at: ['Wakamatsu', 139.93, 37.49], glow: '岩代', pic: 'img/events/aizu-falls.webp', caption: 'Wakamatsu castle, 1868', text: 'On 6 November, after a month under siege, the castle at Wakamatsu surrenders. The north is finished.' },
  ],
  1869: [
    { title: 'The Emperor Stays', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'In May the emperor returns to Tokyo, and this time he stays. No decree ever says the capital has moved.' },
    { title: 'The Last Fortress', at: ['Hakodate', 140.76, 41.80], pic: 'img/events/last-fortress.webp', caption: 'The surrender, as printed by Hayakawa Shōzan in 1877', text: 'On 27 June Enomoto Takeaki surrenders the star fort at Hakodate. The Boshin War is over.' },
    { title: 'The Domains Hand Back', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'On 25 July the court accepts the return of the domains’ land and people. The lords stay on as governors. The map does not change. What it means does.' },
    { title: 'Ezo Becomes Hokkaidō', at: ['Sapporo', 141.35, 43.06], pic: 'img/events/ezo-hokkaido.webp', caption: 'Ainu men at Hakodate, Felice Beato, 1866–67', text: 'In September the Ainu homeland of Ezo is renamed Hokkaidō and divided into eleven provinces, for settlers who have mostly not arrived.' },
  ],
  1870: [
    { title: 'The Wire', at: ['Yokohama', 139.64, 35.44], glow: '武蔵', pic: 'img/events/the-wire.webp', caption: 'Yokohama, main street with telegraph poles, c. 1870–1900', text: 'On 26 January a public telegraph opens between Tokyo and Yokohama. News starts to outrun the domains.' },
    { title: 'Chōshū Turns on Its Soldiers', at: ['Yamaguchi', 131.47, 34.18], glow: '周防', pic: false, text: 'Chōshū cuts its volunteer units to fewer than half and dismisses the rest unrewarded. They rise. In March Kido Takayoshi comes home from Tokyo and crushes the men who won his war.' },
    { title: 'Everyone a Surname', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'On 13 October commoners are permitted surnames. Take-up is slow. Five years later it will be compulsory.' },
  ],
  1871: [
    { title: 'An Army for the Emperor', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'Satsuma, Chōshū and Tosa give the government a standing force from their own troops. The next step needs them.' },
    { title: 'The Domains End', at: ['Tokyo', 139.77, 35.68], state: 'prefectures-august-1871', pic: false, text: 'On 29 August, with one decree, every domain becomes a prefecture: 3 fu and 302 ken. There is no rising. But look at the map. The same scattered pieces are still there.' },
    { title: 'The Ship', at: ['Yokohama', 139.64, 35.44], glow: '武蔵', pic: 'img/events/the-ship.webp', caption: 'The five girls, 1871', text: 'On 23 December the Iwakura Mission sails for America to see what a modern state looks like. About a hundred people go, several of the government’s leaders among them.' },
    { title: 'The Map Redrawn', at: ['Tokyo', 139.77, 35.68], state: 'consolidated-1871', pic: false, text: 'From 10 December decrees go out, county by county, and the last comes after the ship has sailed. By 2 January the patchwork is gone: 3 fu and 72 ken. In twenty-three days, hundreds of prefectures become seventy-five.' },
  ],
  1872: [
    { title: 'The Railway', at: ['Yokohama', 139.64, 35.44], glow: '武蔵', pic: 'img/events/railway.webp', caption: 'Steam train at Shiodome, Utagawa Kuniteru, 1872', text: 'On 14 October the emperor opens the line from Shimbashi to Yokohama: twenty-nine kilometres, fifty-three minutes. A day’s walk has become an hour.' },
    { title: 'A Domain Called Ryukyu', at: ['Shuri', 127.72, 26.22], pic: false, text: 'On 16 October Japan declares the kingdom of Ryukyu, which sends tribute to China, a domain, a year after domains were abolished everywhere else. Its king is made a Japanese noble.' },
    { title: 'The Lost Month', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'With little warning the government adopts the Western calendar. The third day of the twelfth month becomes 1 January 1873. From here on, Japan’s dates and the West’s agree.' },
  ],
  1873: [
    { title: 'Every Man a Soldier', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'On 10 January conscription begins. Farmers’ sons will carry the rifles, and fighting is no longer what a samurai is for. In the villages, some people riot against it.' },
    { title: 'The Land Tax', at: ['Tokyo', 139.77, 35.68], pic: false, text: 'On 28 July the rice tax gives way to cash: three per cent of the land’s value, good harvest or bad. The new state can now count on its money.' },
    { title: 'The Government Splits', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'Those who stayed home want to send Saigō to Korea. Those who sailed, now back, say no. In October the plan is stopped, and five councillors walk out.' },
  ],
  1874: [
    { title: 'Saga', at: ['Saga', 130.30, 33.26], glow: '肥前', pic: 'img/events/saga.webp', caption: 'Etō under arrest, as printed by Utagawa Yoshiiku for a Tokyo newspaper, 1874', text: 'In February Etō Shimpei, a former minister, rises at Saga. Ōkubo goes to crush it himself. It is the first major samurai rising, and it fails within weeks.' },
    { title: 'Taiwan', at: ['Towards Taiwan', 124.16, 24.34], pic: false, text: 'In 1871 Ryukyuan sailors were killed in Taiwan. In 1874 Japan sends an expedition, and reads China’s settlement as backing its claim to the Ryukyuans. The map is being pushed south.' },
  ],
  1875: [
    { title: 'North for South', at: ['Hakodate', 140.73, 41.77], pic: false, text: 'On 7 May, at St Petersburg, Japan gives up its claims on Sakhalin and takes all the Kurils in return. The northern line is drawn, over the heads of the Ainu who live there.' },
    { title: 'Ganghwa', at: ['Tsushima', 129.33, 34.20], glow: '対馬', pic: false, text: 'In September a Japanese gunboat provokes a clash at Ganghwa Island in Korea. Japan uses gunboats to demand a treaty.' },
  ],
  1876: [
    { title: 'The Treaty with Korea', at: ['Tsushima', 129.33, 34.20], glow: '対馬', pic: false, text: 'In February Korea signs. Its ports open under an unequal treaty, while Japan is still trying to escape its own.' },
    { title: 'The End of the Sword', at: ['Tokyo', 139.77, 35.68], glow: '武蔵', pic: false, text: 'On 28 March almost no one but soldiers and police may wear a sword. On 5 August the stipends follow, turned into bonds. Within a few months the samurai have lost their mark and their pay.' },
    { title: 'The Map Again', at: ['Tokyo', 139.77, 35.68], state: 'consolidated-1876', pic: false, text: 'By 21 August another round of merging is done: 3 fu and 35 ken. In under five years, seventy-five prefectures have become thirty-eight. The map is starting to look like the one we know.' },
    { title: 'Three Risings', at: ['Kumamoto', 130.71, 32.80], glow: '肥後', pic: 'img/events/three-risings.webp', caption: 'The night attack at Kumamoto, as printed by Toyohara Chikanobu, 1876', text: 'In October, in the space of a week, samurai rise at Kumamoto, Akizuki and Hagi. All three are put down by conscripts.' },
  ],
  1877: [
    { title: 'Satsuma Marches', at: ['Kagoshima', 130.56, 31.60], glow: '薩摩', pic: 'img/events/satsuma-marches.webp', caption: 'The Kagoshima army sets out, as printed by Tsukioka Yoshitoshi', text: 'At the end of January students of Saigō’s schools seize government arms. In February his army marches north, the largest rebellion the state will ever face.' },
    { title: 'Kumamoto Holds', at: ['Kumamoto', 130.71, 32.80], glow: '肥後', pic: 'img/events/kumamoto-holds.webp', caption: 'Tabaruzaka, as printed by Kobayashi Eitaku in March 1877', text: 'The castle holds against the Satsuma army. In March, at Tabaruzaka, the government’s conscripts break through after seventeen days of fighting. Conscripts have beaten samurai.' },
    { title: 'Shiroyama', at: ['Kagoshima', 130.56, 31.60], glow: '薩摩', pic: 'img/events/shiroyama.webp', caption: 'Saigō’s last stand, as printed by Ukiyo Toshimitsu, 1877', text: 'On 24 September, on the hill above Kagoshima, it ends. Across the war, some fourteen thousand are dead. There will be no more samurai risings.' },
  ],
  1878: [
    { title: 'Kioizaka', at: ['Tokyo', 139.68, 35.68], glow: '武蔵', pic: 'img/events/kioizaka.webp', caption: 'Ōkubo, memorial portrait by Kobayashi Kiyochika, c. 1878', text: 'On 14 May, on his way to the palace, Ōkubo Toshimichi is cut down by six former samurai, five from Ishikawa and one from Shimane. Saigō died in September. Kido died in May of the year before. The three men who made the Restoration are gone in twelve months.' },
    { title: 'The Map Remains', at: ['Tokyo', 139.77, 35.68], pic: false, text: 'Ten years have passed. The 260 domains exist only in memory, and in the shapes people still call home. Everything since has been drawn on the map they left.' },
  ],
};
