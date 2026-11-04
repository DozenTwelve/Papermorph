/* scene8.js — the grass (Gág's pages 20 and 21; storyboard scene8).
   Shots (beat clock = PRE8 + clip time): A (0 – .9) wide on page 20, the long furry hill, the old man tiny on it;
   B (.9 – 3.5) close-ups of hungry cats, "Mew, mew! Now we are hungry!"; C (3.5 – 11.3) wide again, the refrain's
   lines 3–5 in Gág's lettering over the sky, cats packing in on each word; D (11.36 – 15.8) page 21, the old man tiny
   at the foot of the hill ("There is much grass on the hills"); E (15.9 – 19.2) back on page 20, closer: each cat
   eats a mouthful and the grass goes in patches, on twos, with munching; F (19.24 – end) the bare hill, "not a blade
   was left!" */
'use strict';
const PRE8 = .5;
const s8_T = t => PRE8 + t;
const s8_B = s8_T(.5), s8_WIDE = s8_T(2.97), s8_REF = s8_T(10.81), s8_SAY = s8_T(10.86), s8_ATE = s8_T(13.52), s8_LEFT = s8_T(16.86);
const s8_kids = [['rf-hundreds', 'rf-of1', 'rf-cats4'], ['rf-thousands', 'rf-of2', 'rf-cats5'], ['rf-millions', 'rf-and2', 'rf-billions', 'rf-and3', 'rf-trillions', 'rf-of3', 'rf-cats6']];
const s8_RW = { 'rf-hundreds': 4.3, 'rf-of1': 4.68, 'rf-cats4': 4.94, 'rf-thousands': 5.73, 'rf-of2': 6.12, 'rf-cats5': 6.46,
  'rf-millions': 7.29, 'rf-and2': 7.6, 'rf-billions': 8.08, 'rf-and3': 8.46, 'rf-trillions': 8.9, 'rf-of3': 9.3, 'rf-cats6': 9.78 };
const s8_CATS = ['cat22a', 'cat22b', 'cat22c', 'cat22d', 'cat23a', 'cat23b', 'cat23c', 'cat23d', 'cat25a', 'cat25b', 'cat8a', 'cat8b', 'cat8c', 'cat8d'];
sfx('scene8', 0, 'meadow', .5, { loop: true });
sfx('scene8', .05, 'page', .8);
sfx('scene8', s8_T(.52), 'mew1', .5); sfx('scene8', s8_T(.78), 'mew2', .5); sfx('scene8', s8_T(1.04), 'mew3', .4);
sfx('scene8', s8_T(1.68), 'mew4', .55); sfx('scene8', s8_T(1.8), 'mews', .35);
sfx('scene8', s8_T(4.2), 'mews', .35); sfx('scene8', s8_T(7.2), 'mews', .3);
sfx('scene8', s8_ATE - .1, 'munch', .8); sfx('scene8', s8_ATE + 3.4, 'munch', .6);

// Where a bite may show: the grass's silhouette grown by 4 px (no rim of fur is left at a bite's edge), less the dark wedge
// at the hill's foot, which stays; traced once from img/sets/p20/grass.webp (world px; tools/millions-of-cats/sil8.py).
// A mask from the image, or a live feMorphology, made Firefox redraw it whenever a bite grew (200 ms frames).
const S8_SIL = 'M305.9,278.6 305.9,303.6 306.9,304.6 309.9,315.6 311.9,318.6 313.9,326.6 317.9,330.7 317.9,333.7 320.9,335.7 320.9,346.7 321.9,347.7 323.9,355.7 325.9,358.7 325.9,360.7 326.9,361.7 330.9,375.7 332.9,378.7 334.9,386.7 337.9,391.7 337.9,393.7 340.9,398.7 340.9,400.7 344.9,407.7 346.9,414.7 357.9,437.7 357.9,439.7 360.9,444.7 360.9,446.7 363.9,451.7 363.9,453.7 366.9,458.7 366.9,460.7 370.9,467.7 370.9,469.7 373.9,474.7 373.9,476.7 377.9,483.7 379.9,490.7 383.9,497.7 388.9,502.7 397.0,502.7 402.0,500.7 406.0,500.7 411.0,498.7 415.0,498.7 416.0,497.7 424.0,496.7 425.0,495.7 428.0,495.7 433.0,493.7 437.0,493.7 438.0,492.7 442.0,492.7 447.0,490.7 459.0,489.7 460.0,488.7 467.0,488.7 468.0,487.7 474.0,487.7 475.0,486.7 482.0,486.7 483.0,485.7 495.0,484.7 496.0,483.7 571.0,483.7 572.0,484.7 585.1,484.7 586.1,485.7 595.1,485.7 596.1,486.7 609.1,486.7 610.1,487.7 636.1,488.7 637.1,489.7 643.1,489.7 644.1,490.7 649.1,490.7 650.1,491.7 656.1,491.7 657.1,492.7 663.1,492.7 664.1,493.7 677.1,494.7 678.1,495.7 683.1,495.7 684.1,496.7 690.1,496.7 691.1,497.7 697.1,497.7 698.1,498.7 710.1,499.7 711.1,500.7 715.1,500.7 716.1,501.7 720.1,501.7 721.1,502.7 725.1,502.7 726.1,503.7 730.1,503.7 731.1,504.7 735.1,504.7 736.1,505.7 740.1,505.7 741.1,506.7 746.1,506.7 747.1,507.7 751.1,507.7 752.1,508.8 756.2,508.8 757.2,509.8 762.2,509.8 763.2,510.8 771.2,511.8 772.2,512.8 777.2,512.8 778.2,513.8 782.2,513.8 783.2,514.8 787.2,514.8 788.2,515.8 792.2,515.8 793.2,516.8 797.2,516.8 798.2,517.8 802.2,517.8 803.2,518.8 808.2,518.8 809.2,519.8 813.2,519.8 814.2,520.8 818.2,520.8 819.2,521.8 823.2,521.8 824.2,522.8 828.2,522.8 829.2,523.8 834.2,523.8 835.2,524.8 839.2,524.8 844.2,526.8 849.2,526.8 850.2,527.8 854.2,527.8 855.2,528.8 859.2,528.8 860.2,529.8 864.2,529.8 865.2,530.8 870.2,530.8 871.2,531.8 875.2,531.8 876.2,532.8 880.2,532.8 881.2,533.8 885.2,533.8 886.2,534.8 890.2,534.8 891.2,535.8 895.2,535.8 896.2,536.8 900.2,536.8 901.2,537.8 906.2,537.8 907.2,538.8 911.2,538.8 912.2,539.8 916.2,539.8 917.2,540.8 921.2,540.8 922.2,541.8 926.2,541.8 927.2,542.8 932.2,542.8 933.2,543.8 937.3,543.8 938.3,544.8 942.3,544.8 943.3,545.8 947.3,545.8 948.3,546.8 952.3,546.8 953.3,547.8 958.3,547.8 959.3,548.8 964.3,548.8 965.3,549.8 970.3,549.8 971.3,550.8 976.3,550.8 977.3,551.8 983.3,551.8 984.3,552.8 990.3,552.8 992.3,553.8 967.3,530.8 966.3,530.8 959.3,523.8 958.3,523.8 942.3,509.8 941.3,504.7 940.3,503.7 940.3,499.7 939.3,498.7 938.3,490.7 936.3,488.7 936.3,484.7 935.3,483.7 936.3,479.7 935.3,478.7 935.3,474.7 934.2,473.7 934.2,469.7 933.2,468.7 932.2,460.7 930.2,456.7 930.2,449.7 929.2,448.7 929.2,444.7 928.2,443.7 928.2,439.7 927.2,438.7 927.2,434.7 926.2,433.7 926.2,429.7 925.2,428.7 926.2,426.7 929.2,428.7 936.3,430.7 941.3,433.7 943.3,433.7 946.3,435.7 948.3,435.7 951.3,437.7 953.3,437.7 956.3,439.7 958.3,439.7 961.3,441.7 963.3,441.7 966.3,443.7 968.3,443.7 973.3,446.7 975.3,446.7 986.3,451.7 989.3,451.7 994.3,453.7 998.3,453.7 999.3,454.7 1002.3,454.7 1007.3,456.7 1011.3,456.7 1012.3,457.7 1015.3,457.7 1016.3,458.7 1019.3,458.7 1024.3,460.7 1028.3,460.7 1029.3,461.7 1032.3,461.7 1037.3,463.7 1041.3,463.7 1042.3,464.7 1045.3,464.7 1050.3,466.7 1054.3,466.7 1055.3,467.7 1058.3,467.7 1059.3,468.7 1062.3,468.7 1067.3,470.7 1071.3,470.7 1072.3,471.7 1075.3,471.7 1080.3,473.7 1084.3,473.7 1085.3,474.7 1088.3,474.7 1093.3,476.7 1097.3,476.7 1098.3,477.7 1101.3,477.7 1102.3,478.7 1105.3,478.7 1110.3,480.7 1114.3,480.7 1119.4,482.7 1123.4,482.7 1124.4,483.7 1127.4,483.7 1132.4,485.7 1136.4,485.7 1137.4,486.7 1140.4,486.7 1145.4,488.7 1149.4,488.7 1154.4,490.7 1158.4,490.7 1159.4,491.7 1162.4,491.7 1167.4,493.7 1171.4,493.7 1172.4,494.7 1175.4,494.7 1180.4,496.7 1184.4,496.7 1185.4,497.7 1193.4,498.7 1194.4,499.7 1197.4,499.7 1202.4,501.7 1206.4,501.7 1207.4,502.7 1210.4,502.7 1215.4,504.7 1219.4,504.7 1220.4,505.7 1228.4,506.7 1229.4,507.7 1232.4,507.7 1237.4,509.8 1241.4,509.8 1242.4,510.8 1245.4,510.8 1250.4,512.8 1254.4,512.8 1255.4,513.8 1263.4,514.8 1264.4,515.8 1267.4,515.8 1272.4,517.8 1276.4,517.8 1277.4,518.8 1284.4,519.8 1288.4,521.8 1291.4,521.8 1292.4,522.8 1295.5,522.8 1296.5,523.8 1299.5,523.8 1300.5,524.8 1303.5,524.8 1304.5,525.8 1307.5,525.8 1308.5,526.8 1311.5,526.8 1312.5,527.8 1327.5,530.8 1331.5,532.8 1334.5,532.8 1335.5,533.8 1338.5,533.8 1339.5,534.8 1342.5,534.8 1343.5,535.8 1346.5,535.8 1347.5,536.8 1362.5,539.8 1368.5,550.8 1370.5,549.8 1373.5,543.8 1383.5,528.8 1383.5,472.7 1382.5,471.7 1381.5,466.7 1378.5,461.7 1378.5,459.7 1375.5,454.7 1373.5,447.7 1370.5,442.7 1370.5,440.7 1367.5,435.7 1367.5,433.7 1364.5,428.7 1364.5,426.7 1361.5,421.7 1361.5,419.7 1358.5,414.7 1358.5,412.7 1335.5,392.7 1328.5,387.7 1322.5,381.7 1321.5,381.7 1315.5,375.7 1314.5,375.7 1308.5,369.7 1228.4,317.6 1225.4,317.6 1224.4,316.6 1222.4,316.6 1218.4,314.6 1215.4,314.6 1208.4,311.6 1198.4,309.6 1191.4,306.6 1188.4,306.6 1178.4,302.6 1175.4,302.6 1174.4,301.6 1172.4,301.6 1168.4,299.6 1165.4,299.6 1158.4,296.6 1155.4,296.6 1151.4,294.6 1147.4,294.6 1146.4,293.6 1143.4,293.6 1142.4,292.6 1139.4,292.6 1134.4,290.6 1130.4,290.6 1129.4,289.6 1126.4,289.6 1125.4,288.6 1122.4,288.6 1117.4,286.6 1113.3,286.6 1112.3,285.6 1109.3,285.6 1108.3,284.6 1105.3,284.6 1100.3,282.6 1096.3,282.6 1091.3,280.6 1087.3,280.6 1083.3,278.6 1079.3,278.6 1078.3,277.6 1075.3,277.6 1070.3,275.6 1057.3,275.6 1056.3,274.6 1045.3,274.6 1044.3,273.6 1042.3,273.6 1041.3,274.6 1040.3,273.6 1014.3,272.6 1013.3,271.6 998.3,271.6 997.3,270.6 982.3,270.6 981.3,269.6 955.3,268.6 954.3,267.6 933.2,267.6 932.2,268.6 921.2,268.6 920.2,269.6 911.2,269.6 910.2,270.6 898.2,270.6 897.2,271.6 886.2,271.6 885.2,272.6 873.2,272.6 872.2,273.6 863.2,273.6 862.2,274.6 860.2,273.6 859.2,274.6 851.2,274.6 850.2,275.6 842.2,276.6 831.2,280.6 824.2,281.6 820.2,283.6 817.2,283.6 816.2,284.6 810.2,285.6 806.2,287.6 803.2,287.6 799.2,289.6 796.2,289.6 795.2,290.6 792.2,290.6 781.2,294.6 778.2,294.6 745.1,311.6 741.1,308.6 729.1,302.6 727.1,300.6 722.1,298.6 720.1,296.6 715.1,294.6 713.1,292.6 699.1,285.6 697.1,283.6 687.1,278.6 680.1,276.6 673.1,272.6 671.1,272.6 666.1,269.6 664.1,269.6 647.1,261.6 645.1,261.6 640.1,258.6 638.1,258.6 631.1,255.6 628.1,255.6 624.1,253.6 621.1,253.6 617.1,251.6 610.1,250.6 606.1,248.6 603.1,248.6 599.1,246.6 596.1,246.6 592.1,244.6 589.1,244.6 585.1,242.6 582.1,242.6 581.1,241.6 556.0,240.6 555.0,239.6 406.0,239.6 405.0,240.6 402.0,240.6 397.0,242.6 392.9,242.6 387.9,244.6 383.9,244.6 382.9,245.6 379.9,245.6 378.9,246.6 375.9,246.6 370.9,248.6 366.9,248.6 365.9,249.6 362.9,249.6 361.9,250.6 358.9,250.6 353.9,252.6 349.9,252.6 348.9,253.6 341.9,254.6ZM924.2,465.7 925.2,466.7 925.2,468.7 923.2,469.7 922.2,467.7Z';

function scene8(p, D) {
  const k01 = (q, a, d) => Math.min(1, Math.max(0, (q - a) / d));
  const defs = mk('defs', {}, p);
  // the grass goes patch by patch as the cats eat (the layer's box is 305..1384 × 239..571). Each bite is a patch of the
  // bare paper drawn over the grass, inside its silhouette: a mask on the grass image itself made Firefox redraw the whole
  // 2157 px image in software every frame (50–70 ms a frame, 120 ms in the close-ups), even before the first bite
  const BX = 305.4, BY = 239.1, BW = 1078.6, BH = 331.5, COLS = 9, ROWS = 4, NP = COLS * ROWS;
  // one patch to a cell of a jittered grid (so the whole hill is covered in the end), eaten in a shuffled order
  const order = Array.from({ length: NP }, (_, i) => i).sort((a, b) => rnd(a * 7 + 3) - rnd(b * 7 + 3));
  const patches = Array.from({ length: NP }, (_, i) => ({ x: BX + (i % COLS + .2 + rnd(i * 5 + 1) * .6) * BW / COLS, y: BY + (Math.floor(i / COLS) + .2 + rnd(i * 5 + 2) * .6) * BH / ROWS,
    r: 62 + rnd(i * 5 + 3) * 22, t: order.indexOf(i) / NP }));
  // each bite is a rounded, ragged blob (a ring of 16 points, a few nicked in), drawn at unit size and scaled by transform
  const blob = i => Array.from({ length: 16 }, (_, k) => { const a = k / 16 * 6.2832, r = (k % 5 === 2 ? .66 : 1) * (.86 + .3 * rnd(i * 31 + k)); return `${(Math.cos(a) * r * 1.2).toFixed(2)},${(Math.sin(a) * r * 1.2).toFixed(2)}`; }).join(' ');
  // s8_cover: where a bite may show, S8_SIL (above); s8_bitesClip: the open bites, which the stubble keeps to
  defs.innerHTML = `<clipPath id="s8_cover"><path id="s8_silp" clip-rule="evenodd" d="${S8_SIL}"/></clipPath>
    <clipPath id="s8_bitesClip">${patches.map((a, i) => `<use href="#s8_b${i}"/>`).join('')}</clipPath>`;
  // the first bites are above the eaters and open first, once "Each cat ate a mouthful" is said; the grass stays whole until then
  [[430, 410], [620, 405], [740, 415], [830, 425], [1060, 420], [1200, 440]].forEach(([x, y], k) => Object.assign(patches[k], { x, y, t: k * .05, r: 60 }));

  // P: page 20, the hill and its grass; puppets stand in front of the grass layer
  const P = paperCam(p, 'p20', { x: 800, y: 380, z: 1.3 }, { after: 'grass' });
  P.move('grass', q => `translate(0 571) skewX(${(1.2 * Math.sin(q * 1.9)).toFixed(2)}) translate(0 -571)`);   // the fur of grass sways from its foot
  // the bare hill under the grass is plain paper (the page's #eee8d6); a few short ticks of Gág's ink stay as stubble.
  // The bites lie just above the grass layer, not in its group (there a clipped child made Firefox redraw the grass image
  // in software every frame); their clip stays put and its path, the bites and the stubble take the layer's sway (a
  // transform on the clipped group itself made Firefox redraw the clip each time: 180 ms frames).
  const tk = [];
  for (let i = 0; i < 9; i++) { const cx = BX + rnd(i * 7 + 1) * BW, cy = BY + rnd(i * 7 + 2) * BH;   // little tufts of three or four strokes
    for (let k = 0; k < 3 + (i % 2); k++) { const x = cx + (rnd(i * 17 + k * 3) - .5) * 40, y = cy + (rnd(i * 17 + k * 3 + 1) - .5) * 22, l = 5 + rnd(i * 17 + k) * 12, a = (rnd(i * 17 + k * 5 + 2) - .5) * 1.4;
      tk.push(`M${x.toFixed(0)},${y.toFixed(0)} l${(Math.sin(a) * l).toFixed(0)},${(-Math.cos(a) * l).toFixed(0)}`); } }
  const cover = mk('g', { 'clip-path': 'url(#s8_cover)' }); P.layer('grass').after(cover);
  cover.innerHTML = `<g fill="#eee8d6">${patches.map((a, i) => `<polygon id="s8_b${i}" points="${blob(i)}" transform="translate(${a.x.toFixed(0)} ${a.y.toFixed(0)}) scale(0)"/>`).join('')}</g>
    <path clip-path="url(#s8_bitesClip)" d="${tk.join(' ')}" fill="none" stroke="#1e1a16" stroke-width="2" stroke-linecap="round" opacity=".75"/>`;
  const bites = patches.map((a, i) => cover.querySelector('#s8_b' + i)), coverSway = [cover.querySelector('g'), cover.querySelector('path'), defs.querySelector('#s8_silp')];
  const at20 = pagePos('p20', 'man20'), man = cutPuppet(P.stage, 'man20');
  P.to({ x: 800, y: 380, z: 1.3 }, 0, s8_B)
   .cut({ x: 480, y: 400, z: 2 }, s8_B).cut({ x: 500, y: 400, z: 2 }, s8_T(1.55))
   .cut({ x: 800, y: 425, z: 1 }, s8_WIDE).to({ x: 800, y: 420, z: .98 }, s8_WIDE, s8_REF - s8_WIDE)
   .cut({ x: 800, y: 400, z: 1.5 }, s8_ATE - .3).to({ x: 900, y: 400, z: 1.7 }, s8_ATE - .3, 3.8)
   .cut({ x: 850, y: 390, z: 1.15 }, s8_LEFT + .5).to({ x: 850, y: 400, z: 1.3 }, s8_LEFT + .5, 2.4);
  const L = lettering(P.stage, s8_kids.flat(), { x: 800, y: 770, s: 1.15 });
  const hillC = catCrowd(P.stage, { names: s8_CATS, n: 18, box: [380, 440, 1250, 505], seed: 8, s: [.85, .55] });
  const bigA = [['cat8a', 340, 490, 1.3, false, 0], ['cat8c', 460, 495, 1.5, false, 1], ['cat23b', 580, 495, 1.4, false, 2]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  const bigB = [['cat23a', 380, 495, 1.4, false, 3], ['cat8c', 500, 495, 1.6, true, 4], ['cat8d', 620, 495, 1.3, false, 5]].map(([n, x, y, s, flip, i]) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  const eaters = [['cat8a', 420, 480, 1.15, false], ['cat22c', 620, 495, 1.0, false], ['cat23d', 820, 500, 1.0, false], ['cat8b', 1060, 505, 1.15, true], ['cat25a', 1200, 505, 1.0, true], ['cat22d', 740, 510, .95, false]]
    .map(([n, x, y, s, flip], i) => ({ p: cutPuppet(P.stage, n), x, y, s, flip, i }));
  P.soft(s8_B - .01, true).soft(s8_WIDE - .01, false).soft(s8_ATE - .31, true).soft(s8_LEFT + .49, false);

  // Q: page 21, the tiny old man at the foot of the hill
  const Q = paperCam(p, 'p21', { x: 1100, y: 640, z: 1.6 });
  const at21 = pagePos('p21', 'man21'), man21 = cutPuppet(Q.stage, 'man21');
  Q.cut({ x: at21.x + 10, y: at21.y - 30, z: 2.9 }, s8_SAY).to({ x: at21.x + 10, y: at21.y - 30, z: 3.3 }, s8_SAY, 4.4);

  const turnOut = pageTurn(p, 0, .45, 'out'), turnIn = pageTurn(p, D - .1, .45, 'in');
  stopClock(D, (q, f) => {
    const inQ = q >= s8_SAY && q < s8_ATE - .3;
    vis(P.root, !inQ); vis(Q.root, inQ);
    P.apply(q, f); Q.apply(q, f);
    { const t = P.layer('grass').getAttribute('transform'); for (const e of coverSway) tf(e, t); }   // the bites, their stubble and their clip sway with the grass
    const closeA = q >= s8_B && q < s8_T(1.55), closeB = q >= s8_T(1.55) && q < s8_WIDE, wide = !closeA && !closeB && !inQ;
    vis(man.g, !closeA && !closeB && !inQ);
    man.pose({ x: at20.x, y: at20.y, s: at20.s, sq: 1 + .025 * Math.sin(q * 2.2), rot: Math.sin(q * 1.5) * 2.2, bob: 1.5 * Math.abs(Math.sin(q * 1.6)),
      parts: { head: Math.sin(q * 1.2) * 12 + (q > s8_ATE ? Math.sin(q * 5) * 8 : 0), bundle: Math.sin(q * 2.4) * 4 } }, f);
    hillC.pose(q, f, { from: .6, every: i => i < 8 ? i * .2 : s8_T(4.3) - .6 + (i - 8) * .55, walk: { v: 12, t0: s8_WIDE }, seethe: .3 });
    vis(hillC.g, wide && q < s8_ATE - .3);
    const times = {}; for (const n in s8_RW) times[n] = s8_T(s8_RW[n]);
    vis(L.g, q >= s8_WIDE && q < s8_SAY); L.show(q, times, f, { hideAt: s8_SAY });
    const mewT = [s8_T(.52), s8_T(.78), s8_T(1.04), s8_T(1.22), s8_T(1.56), s8_T(1.68)];
    const bob = (c, ts) => { let b = 0; for (const t of ts) { const u = q - t - c.i * .04; if (u >= 0 && u < .3) b = Math.max(b, Math.sin(u / .3 * Math.PI)); } return b; };
    for (const [arr, on] of [[bigA, closeA], [bigB, closeB]]) arr.forEach(c => { const L = catLife(q, c.i, { head: 7 }); L.parts.head += 14 * bob(c, mewT); vis(c.p.g, on); c.p.pose({ parts: L.parts, x: c.x, y: c.y, s: c.s * (1 + .02 * bob(c, mewT)), flip: c.flip, sq: 1 + .012 * Math.sin(q * 2.3 + c.i) + .05 * bob(c, mewT), rot: Math.sin(q * 1.6 + c.i) - bob(c, mewT) * 2 }, f + c.i); });
    // the bites: each patch opens in a few steps on twos as its moment comes, so the grass goes patch by patch
    const span8 = s8_LEFT + .3 - s8_ATE;
    patches.forEach((a, i) => { const u = k01(q, a.early ?? s8_ATE + a.t * span8 * .85, .45), st = Math.floor(u * 4) / 4; const r = a.r * (.7 + .8 * st) * (1 + .5 * k01(q, s8_LEFT - .7, 1.2)) * (st ? 1 : 0); tf(bites[i], `translate(${a.x.toFixed(0)} ${a.y.toFixed(0)}) scale(${r.toFixed(1)} ${(r * .85).toFixed(1)})`); });   // tf writes only a change: an unchanged mask stays cached
    // the eaters: heads down, munching (a quick small dip) while there is grass; sitting up after
    const eatOn = q >= s8_T(3.4) && !inQ && !closeA && !closeB;
    for (const c of eaters) {
      vis(c.p.g, eatOn);
      const eat = q > s8_ATE && q < s8_LEFT + .2, m = Math.max(0, Math.sin(q * (eat ? 6 : 2.6) + c.i * 1.9)) * (eat ? 1 : .35);   // before the mouthful: sniffing and stalking, not eating
      const LL = catLife(q, c.i); LL.parts.head += 40 * m; c.p.pose({ parts: LL.parts, x: c.x, y: c.y, s: c.s, flip: c.flip, rot: (c.flip ? -1 : 1) * m * 6 + Math.sin(q * 1.5 + c.i), sq: 1 + .012 * Math.sin(q * 2 + c.i) - m * .05 }, f + c.i);
    }
    // page 21: the tiny old man speaks (a small bob with the voice)
    vis(man21.g, inQ);
    const say = lips(q, 'scene8', PRE8, 'm07') !== 'X';
    // (he stays over the page's own hole: a big sway would show its soft fill either side)
    man21.pose({ x: at21.x, y: at21.y, s: at21.s, sq: 1 + .025 * Math.sin(q * 2.2) + (say ? .012 * Math.sin(q * 30) : 0), rot: Math.sin(q * 1.5) * 2, bob: 2 * Math.abs(Math.sin(q * 1.6)),
      parts: { head: Math.sin(q * 1.3) * 16 + (say ? Math.sin(q * 7) * 12 : 0), legF: 10 * Math.sin(q * 3.1) } }, f);
    turnOut(q); turnIn(q);
  });
}
