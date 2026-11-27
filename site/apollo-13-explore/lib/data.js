// Apollo 13, the way home: the words and numbers of the page. Times are mission elapsed time (MET) from range zero,
// 11 April 1970 19:13:00 UTC (NASA Mission Report, MSC-02680, §2). Every number on a card names its source.

window.LAUNCH_UTC = Date.UTC(1970, 3, 11, 19, 13, 0);
window.END_MET = '142:54:41';   // splashdown, MR Table 3-I

// The eight stops the reader can open. `met` places the stop on the clock and on the path.
window.EVENTS = [
  {
    id: 'accident', short: 'The tank fails', title: 'A bang, and a problem', met: '055:54:53',
    pics: [{ src: 'img/oxygen-tank-diagram.jpg', w: 626, h: 582, alt: 'Cut-away drawing of a round tank with a tube down its middle holding a heater, fans and a thermostat.',
      cap: 'NASA’s drawing of oxygen tank 2: the fans, heater and wires inside it.' }],
    text: [
      'Almost 56 hours into the trip, Houston asked the crew to switch on the fans that stir the oxygen tanks. It was a routine job. Inside tank 2, a wire with damaged covering caught fire, and the tank burst.',
      'Oxygen leaked out into space. The service module needed that oxygen to make electricity, so its power began to fail. The landing on the Moon was off. Now the job was to bring three people home.',
    ],
    facts: 'Jack Swigert called “Okay, Houston, we’ve had a problem here” at 055:55:19. Jim Lovell repeated it at 055:55:35. (Wikipedia gives 55:55:42 for Lovell; that is when Houston answered.)',
    source: 'Time: NASA Mission Report MSC-02680, Table 3-I. Calls: NASA air-to-ground transcript p. 160, speakers as corrected by the Apollo Flight Journal.',
    audio: true,
  },
  {
    id: 'lifeboat', short: 'Into the lander', title: 'The Moon lander becomes a lifeboat', met: '057:41:38',
    pics: [{ src: 'img/lm-aquarius.jpg', w: 960, h: 956, alt: 'The lunar module Aquarius floating in black space, gold foil and a round hatch facing the camera.',
      cap: 'Aquarius, the Moon lander, photographed from Odyssey at the very end of the trip.' }],
    text: [
      'Odyssey, the capsule that would carry them home, now had only its own batteries, and it would need them to land. So Mission Control told the crew to switch on Aquarius, the Moon lander, and live in it.',
      'Aquarius was built to keep two people going for two days on the Moon. Now it had to look after three people for four days. Swigert switched Odyssey off, one step at a time, to save its batteries for the end.',
    ],
    facts: 'At 057:41:38 Swigert told Houston that Lovell and Haise were in the lander. Odyssey was fully shut down by 058:40.',
    source: 'Apollo Flight Journal, day 3 “lifeboat”, 057:41:31–47; NASA Mission Report §7.1.6.',
  },
  {
    id: 'free-return', short: 'The 34-second push', title: 'Back onto a path home', met: '061:29:43.5',
    pics: [{ src: 'img/mission-profile.jpg', w: 960, h: 516, alt: 'NASA diagram: Earth on the left, the Moon on the right, a red and a green line looping between them with numbered events.',
      cap: 'NASA’s own drawing of the whole Apollo 13 trip, from the 1970 Mission Report.' }],
    text: [
      'To reach their landing place, Fra Mauro, they had left their first, safe path on day two. On that landing path they would not come back to Earth by themselves.',
      'Now they fired Aquarius’s engine for 34 seconds. The push put them back on a free return: a path that swings around the Moon, lets the Moon’s pull turn it, and falls back towards Earth. Small pushes later would still keep it on course.',
    ],
    facts: 'Burn 34.2 s; change in speed 37.8 feet per second (about 11.5 m/s). NASA measured them 188,371 nautical miles above Earth at the burn: about 349,000 km.',
    source: 'NASA Mission Report, Tables 4-II and 4-III. (Wikipedia’s 61:29:43.49 and 34.23 s come from a later book.)',
  },
  {
    id: 'flyby', short: 'Behind the Moon', title: 'Around the far side', met: '077:20:57',
    pics: [{ src: 'img/moon-far-side.jpg', w: 960, h: 954, alt: 'Grey cratered surface of the Moon with a large dark smooth patch, the edge of the Moon curving against black space.',
      cap: 'Mare Moscoviense on the Moon’s far side, photographed by the Apollo 13 crew.' }],
    text: [
      'They swung around the far side of the Moon, the side we never see from Earth. For about 25 minutes the Moon was between them and Earth, so the radio was silent.',
      'The Moon was nearly as far from Earth as it ever gets, and their path went wide around it. So the three of them went farther from Earth than any people had been before.',
    ],
    facts: 'Closest to the Moon: about 250 km above it (136.3 nautical miles, NASA’s figure). Farthest from Earth: Wikipedia gives 400,171 km; a 2009 study, measuring a different way, gives 400,046 km. Both are about 400,000 km. Radio lost 77:08:35, back 77:33:10 (times read up before the pass).',
    source: 'NASA Mission Report Table 4-III; Wikipedia “Apollo 13” and its note; Apollo Flight Journal day 4, 076:43:18.',
  },
  {
    id: 'pc2', short: 'PC+2: a faster way', title: 'A push to get home sooner', met: '079:27:39',
    pics: [{ src: 'img/earth-journey-home.jpg', w: 960, h: 960, alt: 'Earth half lit against black space, white clouds swirling over blue ocean and brown land.',
      cap: 'Earth, photographed by the crew on the way home.' }],
    text: [
      'The free return would have brought them down in the Indian Ocean, far from the rescue ships. So two hours after passing closest to the Moon, they fired Aquarius’s engine again, this time for more than four minutes.',
      'The push sped them up, so they would get home sooner and come down in the Pacific Ocean, where the ships were waiting. Its name says when: PC+2, two hours after pericynthion, the closest point to the Moon.',
    ],
    facts: 'Burn 263.8 s; change in speed 860.5 feet per second (about 262 m/s). Time saved depends on what you compare: NASA’s report says about 9 hours (152 h became 142:54); Wikipedia says 12.',
    source: 'NASA Mission Report, Tables 4-II and 4-III and §4.',
  },
  {
    id: 'scrubber', short: 'Fixing the air', title: 'A square filter for a round hole', met: '090:22:50',
    pics: [
      { src: 'img/scrubber-ground-prototype.jpg', w: 960, h: 626, alt: 'Men in shirts and ties around a desk in Mission Control; one holds up a box made of hoses and tape.',
        cap: 'On the ground: Deke Slayton (checked jacket) shows the adapter in Mission Control.' },
      { src: 'img/scrubber-in-aquarius.jpg', w: 960, h: 960, alt: 'Inside the cramped lander: a box of tape and plastic connected to white hoses; Jack Swigert on the right.',
        cap: 'In space: the adapter and its hoses in Aquarius, with Jack Swigert on the right.' },
    ],
    text: [
      'Every breath we let out has carbon dioxide in it. Filters soak it up, but Aquarius had filters for only two people. Odyssey had plenty, but they were a different shape and did not fit.',
      'Engineers on the ground built an adapter from plastic covers, hoses and tape, tested it, and read the steps to the crew over the radio. Swigert and Haise built it in about an hour, and the carbon dioxide began to drop. (It cleaned the air; it did not make oxygen. Aquarius had enough oxygen.)',
    ],
    facts: 'Instructions began 090:22:50; the first adapter was finished at 091:12:28; the full setup was switched on at 094:00:13.',
    source: 'Apollo Flight Journal day 4 “mailbox”, 090:22:50–094:00:16; NASA Mission Report §6.7.',
  },
  {
    id: 'power-up', short: 'Waking Odyssey', title: 'Waking the capsule', met: '140:09:56',
    pics: [{ src: 'img/damaged-service-module.jpg', w: 960, h: 1636, alt: 'The cylinder-shaped service module in black space, one side torn open with parts showing inside.',
      cap: 'The service module after the crew let it go: one whole side panel is missing.' }],
    text: [
      'For more than three days Odyssey had been cold and switched off. It was never meant to be started up again in flight. Flight controllers, astronaut Ken Mattingly and engineers wrote a new list of steps that used as little power as they could.',
      'First the crew let go of the damaged service module and saw, for the first time, a whole panel blown away. Then they woke Odyssey up, one switch at a time.',
    ],
    facts: 'Aquarius powered up to warm the cabin at 133:22:08. Service module let go at 138:01:48. Odyssey’s start-up began at 140:09:56.',
    source: 'Apollo Flight Journal day 6, 133:22:08 and 140:09:52–56; NASA Mission Report Table 4-II.',
  },
  {
    id: 'splashdown', short: 'Splashdown', title: 'Home', met: '142:54:41',
    pics: [{ src: 'img/splashdown.jpg', w: 960, h: 624, alt: 'Grey ocean; three red and white striped parachutes settle onto the water beside the small capsule.',
      cap: 'Odyssey in the South Pacific, its three parachutes coming down beside it.' }],
    text: [
      'About an hour and a half before landing, the crew said goodbye to Aquarius. Odyssey hit the air very fast, and its heat shield kept them safe. The radio went quiet for six minutes, longer than anyone expected, and everyone waited.',
      'Then the parachutes opened, and Odyssey splashed down in the South Pacific, 6.5 km from the ship USS Iwo Jima. All three astronauts were home.',
    ],
    facts: 'Aquarius let go 141:30:00; Odyssey entered the air at 142:40:46; splashdown 142:54:41 at 21°38′24″ S, 165°21′42″ W.',
    source: 'NASA Mission Report §1, Tables 3-I and 4-II; Wikipedia for the radio silence and the ship’s distance.',
  },
];

// The three ways around the Moon the reader compares.
window.ROUTES = {
  flown: { name: 'What flew', text: 'What happened: around the Moon on the free return, then the PC+2 push to get home sooner. Splashdown in the Pacific at 142:54:41.' },
  free: { name: 'Free return only', text: 'The path after the 34-second push, if there had been no PC+2. NASA’s Mission Report: landing at about 152 hours, in the Indian Ocean south of Mauritius.' },
  planned: { name: 'The plan', text: 'The plan: into orbit around the Moon, so Lovell and Haise could land near Fra Mauro. After the accident this could not happen. (The planned trip home, days later, is not drawn.)' },
};

// What the clock is showing, between the stops.
window.PHASES = [
  [0, 'Circling Earth'], [2.6, 'On the way to the Moon'], [55.915, 'Just after the accident'], [57.69, 'Living in Aquarius'],
  [77.143, 'Behind the Moon'], [77.553, 'Leaving the Moon'], [79.6, 'Heading home'], [142.68, 'Falling through the air'], [142.91, 'Home'],
];

// The two recordings: NASA air-to-ground audio (public domain), from Wikimedia Commons. The words are NASA's
// air-to-ground transcript, speakers as corrected by the Apollo Flight Journal; the long recording skips some stretches, and fillers such as “uh” are left out.
window.CLIPS = [
  { src: 'audio/problem-short.mp3', name: 'The call', len: '9 s', lines: [
    ['055:55:19', 'Swigert', 'Okay, Houston, we’ve had a problem here.'],
    ['055:55:28', 'Houston (Lousma)', 'This is Houston. Say again, please.'],
    ['055:55:35', 'Lovell', 'Houston, we’ve had a problem.'],
  ] },
  { src: 'audio/problem-radio-loop.mp3', name: 'The first 15 minutes, shortened', len: '3 min', lines: [
    ['055:55:19', 'Swigert', 'Okay, Houston, we’ve had a problem here.'],
    ['055:55:28', 'Houston (Lousma)', 'This is Houston. Say again, please.'],
    ['055:55:35', 'Lovell', 'Houston, we’ve had a problem. We’ve had a Main B Bus Undervolt.'],
    ['055:55:42', 'Houston', 'Roger. Main B Undervolt.'],
    ['055:55:58', 'Houston', 'Okay, stand by, 13. We’re looking at it.'],
    ['055:56:10', 'Haise', 'Okay. Right now, Houston, the voltage is – is looking good. And we had a pretty large bang associated with the Caution and Warning there. And as I recall, Main B was the one that had had an amp spike on it once before.'],
    ['055:56:40', 'Houston', 'Roger, Fred.'],
    ['055:56:54', 'Haise', 'In the interim here, we’re starting to go ahead and button up the tunnel again.'],
    ['055:57:01', 'Houston', 'Roger.'],
    ['055:57:04', 'Haise', 'Yeah. That jolt must have rocked the sensor on – see now – on O2 Quantity 2. It was oscillating down around 20 to 60 percent. Now it’s full-scale high again.'],
    ['055:57:22', 'Houston', 'Roger.'],
    ['055:57:30', 'Lovell', 'And, Houston, we had a Restart on our computer and we had a PGNCS light and the Restart Reset.'],
    ['055:57:37', 'Houston', 'Roger. Restart and a PGNCS light.'],
    ['055:57:44', 'Lovell', 'Okay. And we’re looking at our Service Module RCS Helium 1. We have – B is barber poled and D is barber poled; Helium 2, D is barber pole, and Secondary Propellants, I have A and C barber pole.'],
    ['055:58:07', 'Haise', 'Okay, AC 2 is showing zip. I’m going to try to reconfigure on that, Jack.'],
    ['055:58:13', 'Houston', 'Roger.'],
    ['055:58:25', 'Haise', 'Yeah. We got a Main Bus A Undervolt now, too, showing.'],
    ['055:58:29', 'Houston', 'Main A Undervolt.'],
    ['055:58:33', 'Haise', 'It’s reading about 25½. Main B is reading zip right now.'],
    ['055:59:38', 'Houston', 'Stand by one, Jim.'],
    ['056:00:35', 'Houston', '13, Houston. We’d like you to attempt to reconnect fuel cell 1 to Main A and fuel cell 3 to Main B. Verify that quad Delta is open.'],
    ['056:00:53', 'Haise', 'Okay, Houston. I’m showing – I tried to reset and fuel cell 1 and 3 are both showing gray flags, but they’re both showing zip on the flows.'],
    ['056:01:08', 'Houston', 'We copy.'],
    ['056:08:47', 'Houston', '13, Houston. We’d like you to open circuit fuel cell 1; leave 2 and 3 as is.'],
    ['056:08:55', 'Haise', 'Okay. I’ll get to work on that.'],
    ['056:09:07', 'Lovell', '… it looks to me, looking out the hatch, that we are venting something. We are – We are venting something out into the – into space.'],
    ['056:09:22', 'Houston', 'Roger. We copy your venting.'],
    ['056:09:29', 'Lovell', 'It’s a gas of some sort.'],
  ] },
];
window.CLIP_NOTE = 'A “bus” is one of the spacecraft’s main power lines; “undervolt” means it was low on electricity. Houston is Jack Lousma, the astronaut who talked to the crew from Mission Control.';
