// The documentary kit's helpers that measure and place, run in Node on stand-ins for the engine (no browser):
//   node .github/scripts/check_film_kit.js        (check_site.py runs it)
// - closeups() on a picture narrower than the frame at its zoom stays centred and says so in the console, with the
//   zoom that would reach the point; { ground: true } goes to the point (Apollo 13: three names on one face);
// - dateChip()'s ground covers a long letter-spaced topic (Apollo 13: '17 April · South Pacific' ran off it).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const KIT = path.join(__dirname, '../../.claude/skills/papermorph/assets/templates/documentary/lib/film.js');

function load() {
  const warns = [], tweens = [], rects = [];
  const el = () => ({ setAttribute() {}, append() {}, style: {} });
  const ctx = { font: '', measureText: s => ({ width: s.length * 0.6 * parseFloat(ctx.font.match(/(\d+(\.\d+)?)px/)[1]) }) };
  const sb = {
    console: { warn: w => warns.push(w), log() {} }, Math, Set, isFinite,
    document: { createElement: () => ({ getContext: () => ctx }) },
    COL: { chalk: '#eee', dim: '#999', board: '#222' }, bookSetting: () => '', SH: 900, SW: 1600,
    G: (p, a) => ({ ...el(), ...a }), mk: (tag, a) => { if (tag === 'rect') rects.push(a); return el(); },
    T: el, path: el, isRTL: s => /[؀-ۿ]/.test(s), put: e => e, prog() {}, clockRun() {}, draw() {},
    tw: (g, to, t0) => tweens.push({ g, to, t0 }), show() {}, hide() {}, out: 0, io: 0, lin: 0, soft: 0,
    ART: { crew: [1512, 1244] },
  };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(KIT, 'utf8'), sb);
  return { sb, warns, tweens, rects };
}

{ // the Apollo 13 crew photo: drawn 640 high (778 wide), zoom 2: narrower than the frame, so no shot can be centred
  const { sb, warns, tweens } = load(), m = () => 1;
  const g = { _w: 1512 * 640 / 1244, _h: 640 };
  sb.closeups({}, g, 'crew', [['a', .19, .2, 'Jack Swigert', 2], ['b', .5, .5, 'Jim Lovell', 2]], m, 5);
  const xs = tweens.filter(t => t.g === g).map(t => t.to.x);
  assert.deepStrictEqual(xs, [800, 800], `a narrow picture stays centred, got x ${xs}`);
  assert.ok(warns.some(w => w.includes("'Jack Swigert'") && w.includes('ground: true')), `the clamp is said: ${warns}`);
  assert.ok(!warns.some(w => w.includes("'Jim Lovell'")), 'a point the view reaches is not warned about');
  tweens.length = 0; warns.length = 0;
  sb.closeups({}, g, 'crew', [['a', .19, .2, 'Jack Swigert', 2]], m, 5, null, { ground: true });
  const iw = (1512 - 112) * 640 / 1244, x = tweens.find(t => t.g === g).to.x;
  assert.ok(Math.abs(x - (800 - 2 * (.19 - .5) * iw)) < 1e-6, `ground: true goes to the point, got x ${x}`);
  assert.strictEqual(warns.length, 0, 'ground: true reaches every point, so nothing to say');
}
{ // a long topic in spaced capitals: the ground is as wide as the measured text plus the spacing
  const { sb, rects } = load(), topic = '17 April · South Pacific', size = 26;
  sb.dateChip({}, '1970', topic, 0, { ground: '#222' });
  const text = topic.length * .6 * size + topic.length * .28 * size;
  const right = rects[0].x + rects[0].width;   // the topic starts at x 3
  assert.ok(right >= 3 + text, `the chip's ground (to x ${right}) covers its topic (to x ${3 + text})`);
}
console.log('film kit: ok (closeups says where it cannot reach, ground: true reaches; dateChip covers a long topic)');
