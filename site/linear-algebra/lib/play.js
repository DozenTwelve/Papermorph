// A playground beat: no question, no score. The chapter's linked picture is handed over whole (every number, line,
// plane and arrow the component lets the reader move), with a pen to draw on the board, a reset and a way on.
// Use it as a beat's ask:  ['play', 'Playground', m => { … build S.sys … }, { ask: playAsk(() => S.sys, { tip }) }]
// Works with any component that has .live(on), .v and .set(values) (linsys, lin3, vecs, grid2).
const PLAY_INK = [COL.chalk, COL.task, COL.whole, COL.nat];
let playKeys = null;
// A beat opened with ?beat=N is not started until the reader plays, and until then the engine keeps every key but Space
// and Enter for the cover. The playground's keys work at once, as its buttons do: the first one starts the lesson.
document.addEventListener('keydown', e => {
  if (P.started || !playKeys || P.keys !== playKeys || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (e.target.matches?.('input') || e.target.closest?.('button') || !$('help').hidden) return;
  if (playKeys(e)) { e.preventDefault(); e.stopImmediatePropagation(); hideCover(); }
}, true);

function playAsk(getSys, { pos = { x: 40, y: 430, w: 720, cls: 'side' }, tip = 'Change anything you like and watch what moves with it.', live } = {}) {
  return done => {
    const gen = P.gen, sys = getSys(), start = { ...sys.v };
    sys.live(true, live);   // live: the component's own options, e.g. vecs' { move: true }
    // the ink sits over the picture; in draw mode a sheet over the whole stage takes the pointer
    const L = qlayer(), ink = G(L, {}), sheet = mk('rect', { width: SW, height: SH, fill: 'transparent' }, L);
    Object.assign(sheet.style, { display: 'none', cursor: 'crosshair', touchAction: 'none' });
    const svg = $('stage'), at = e => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(svg.getScreenCTM().inverse()); };
    let drawing = false, colour = 0, line = null, d = '';
    sheet.addEventListener('pointerdown', e => {
      if (P.gen !== gen) return;
      e.preventDefault();
      const p = at(e);
      d = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      line = mk('path', { d, fill: 'none', stroke: PLAY_INK[colour], 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ink);
      sheet.setPointerCapture(e.pointerId);
    });
    sheet.addEventListener('pointermove', e => {
      if (!line) return;
      const p = at(e);
      d += `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      line.setAttribute('d', d);
    });
    const lift = () => { line = null; };
    sheet.addEventListener('pointerup', lift);
    sheet.addEventListener('lostpointercapture', lift);

    const c = card(pos, 'quiz play');
    const bDraw = h('button', 'btn quiet', ['Draw', kbd('D')]), bInk = h('button', 'btn quiet', ['Colour', kbd('K')]);
    const bClear = h('button', 'btn quiet', ['Clear drawing', kbd('X')]), bReset = h('button', 'btn quiet', ['Reset numbers', kbd('R')]);
    const bOn = h('button', 'btn go', [translate('continue'), kbd('Enter')]);
    const swatch = h('span', 'swatch');
    Object.assign(swatch.style, { display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', marginLeft: '8px', verticalAlign: '-1px' });
    bInk.append(swatch);
    const paint = () => {
      swatch.style.background = PLAY_INK[colour];
      bDraw.firstChild.textContent = drawing ? 'Stop drawing' : 'Draw';
      bDraw.className = 'btn ' + (drawing ? 'go' : 'quiet');
      sheet.style.display = drawing ? '' : 'none';
    };
    bDraw.onclick = () => { drawing = !drawing; paint(); };
    bInk.onclick = () => { colour = (colour + 1) % PLAY_INK.length; paint(); };
    bClear.onclick = () => ink.replaceChildren();
    bReset.onclick = () => sys.set(start);
    bOn.onclick = () => { if (P.gen !== gen) return; drawing = false; paint(); sys.live(false); done(); };
    const acts = h('div', 'acts', [bDraw, bInk, bClear, bReset, bOn]);
    acts.style.flexWrap = 'wrap';
    c.replaceChildren(h('div', 'head', [h('p', 'kicker', 'Playground · no score'), h('p', 'prompt', [rich([tip], 24)]),
      h('p', 'keys', ['Drag numbers sideways or use ', kbd('Tab'), kbd('↑'), kbd('↓'), '; drag lines and arrows; ', kbd('D'), ' to draw on the board.'])]), acts);
    paint();
    P.keys = playKeys = e => {
      if (P.gen !== gen) return false;
      if (e.key === 'Enter') { bOn.click(); return true; }
      if (isShortcut(e, 'd')) { bDraw.click(); return true; }
      if (isShortcut(e, 'k')) { bInk.click(); return true; }
      if (isShortcut(e, 'x')) { bClear.click(); return true; }
      if (isShortcut(e, 'r')) { bReset.click(); return true; }
      return false;
    };
  };
}
