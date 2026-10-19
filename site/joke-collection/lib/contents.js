/* The book's cover and contents (index.html): interface text, the chapter list with reading progress, the guide,
   and the cover ↔ contents ↔ lesson motion. Load it in <head>; after the markup, the page calls
   Contents.book({ units, start, hues }) with its chapter list. */
'use strict';
// Observe aborted incoming transitions before the first rendering opportunity.
addEventListener('pagereveal', e => e.viewTransition?.ready.catch(() => {}));

const Contents = (() => {
  // Interface text in the page's <html lang>, as in the lessons; missing keys fall back to English.
  // A value is a string or plural forms { one, few, many, other } chosen by vars.n.
  const TRANSLATIONS = {
    en: {
      open: 'Open the book', toCover: 'Back to the cover', resume: 'Continue · Chapter {n}', unit: 'Unit {n}', minutes: '{n} min',
      meta: '{chapters}{samples} · {units} · with sound', metaChapters: { one: '{n} chapter', other: '{n} chapters' },
      metaUnits: { one: '{n} unit', other: '{n} units' }, metaSamples: { one: ' + {n} sample', other: ' + {n} samples' }, samples: 'Sample chapters, another look',
      chapterCount: { one: '{n} chapter', other: '{n} chapters' }, finished: '{done} of {n} finished',
      doneMark: '✓ Finished · ', lastMark: ' · Last opened',
    },
    ru: {
      open: 'Открыть книгу', toCover: 'К обложке', resume: 'Продолжить · Глава {n}', unit: 'Раздел {n}', minutes: '{n} мин',
      meta: '{chapters}{samples} · {units} · со звуком',
      metaChapters: { one: '{n} глава', few: '{n} главы', many: '{n} глав', other: '{n} главы' },
      metaUnits: { one: '{n} раздел', few: '{n} раздела', many: '{n} разделов', other: '{n} раздела' },
      metaSamples: { one: ' + {n} пробная', few: ' + {n} пробные', many: ' + {n} пробных', other: ' + {n} пробной' },
      samples: 'Пробные главы в другом стиле',
      chapterCount: { one: '{n} глава', few: '{n} главы', many: '{n} глав', other: '{n} главы' }, finished: 'Пройдено {done} из {n}',
      doneMark: '✓ Пройдено · ', lastMark: ' · Открыта последней',
    },
    zh: {
      open: '打开这本书', toCover: '返回封面', resume: '继续 · 第 {n} 章', unit: '第 {n} 单元', minutes: '{n} 分钟',
      meta: '{chapters}{samples} · {units} · 有配音', metaChapters: '{n} 章', metaUnits: '{n} 个单元',
      metaSamples: ' + {n} 个示例章', samples: '示例章，另一种风格',
      chapterCount: '{n} 章', finished: '已完成 {done} / {n}',
      doneMark: '✓ 已完成 · ', lastMark: ' · 上次打开',
    },
    ja: {
      open: '本を開く', toCover: '表紙に戻る', resume: '続きから · 第{n}章', unit: '単元 {n}', minutes: '{n}分',
      meta: '{chapters}{samples} · {units} · 音声つき', metaChapters: '{n}章', metaUnits: '{n}単元',
      metaSamples: ' + サンプル{n}章', samples: 'サンプル章（別のスタイル）',
      chapterCount: '{n}章', finished: '{n}章中 {done}章 完了',
      doneMark: '✓ 完了 · ', lastMark: ' · 最後に開いた章',
    },
  };
  const LANGUAGE = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  function translate(key, vars = {}) {
    const language = TRANSLATIONS[LANGUAGE]?.[key] !== undefined ? LANGUAGE : 'en';
    let text = TRANSLATIONS[language][key] ?? key;
    if (typeof text === 'object') {
      let rules;
      try { rules = new Intl.PluralRules(language); } catch { rules = new Intl.PluralRules('en'); }
      text = text[rules.select(vars.n)] ?? text.other;
    }
    return text.replace(/\{(\w+)\}/g, (placeholder, name) => name in vars ? vars[name] : placeholder);
  }
  const $ = id => document.getElementById(id);
  const id = n => 'ch' + String(n).padStart(2, '0');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const HUES = ['#f4a48c', '#86c9e8', '#f3c95c', '#e8a0c8', '#8fd6b0', '#bba8ee', '#f0b45a'];

  // Fixed interface text: data-t replaces an element's first text, data-t-label its aria-label.
  function translatePage() {
    for (const element of document.querySelectorAll('[data-t]')) element.firstChild.nodeValue = translate(element.dataset.t);
    for (const element of document.querySelectorAll('[data-t-label]')) element.setAttribute('aria-label', translate(element.dataset.tLabel));
    document.documentElement.style.setProperty('--done', JSON.stringify(translate('doneMark')));
    document.documentElement.style.setProperty('--last', JSON.stringify(translate('lastMark')));
  }

  // Reading progress { done: [chapter numbers], last }, written by the lessons. The engine and this page derive the
  // same key from the book's folder; a book that predates that passes its own key.
  function progress(key) {
    let P = {};
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) P = saved;
    } catch {}
    return { last: P.last, done: new Set(Array.isArray(P.done) ? P.done.filter(n => Number.isInteger(n) && n > 0) : []) };
  }

  // The chapter cards, unit by unit, with progress, the header count, the cover's meta line and its resume button.
  // A unit's optional third entry { unit, chapter, sample, href } numbers it from elsewhere in the book; a sample chapter,
  // made to show another look, is not counted with the book's chapters, and a unit of samples has no unit number.
  // With href, the sample lives in another book folder (its own progress): its card links there and leaves this book's
  // numbering and progress alone. A chapter's own third entry { href, chapter } does the same for that chapter alone;
  // without href, its chapter is only the number shown on the card.
  // start.label is the number shown for start.chapter (folders keep the book's numbers; lessons set CHAPTER.label).
  function contents(units, start, hues, P) {
    let n = start.chapter - 1, total = 0, i = 0, away = 0;   // i staggers the entrance, in reading order
    const samples = new Set(), shown = k => k - start.chapter + (start.label ?? start.chapter);
    $('units').innerHTML = units.map(([name, chs, o = {}], u) => {
      if (o.chapter && !o.href) n = o.chapter - 1;
      return `<section class="unit" style="--c:${hues[u % hues.length]};--i:${i++}">${Units.header(u, o.sample ? translate('samples') : translate('unit', { n: o.unit ?? u + start.unit }), name)}<div class="grid">` +
        chs.map(([t, min, c = {}], k) => {
          const href = c.href ?? o.href;
          if (href) { away++; return `<a class="ch" href="${href}" style="--i:${i++}"><b>${c.chapter ?? (o.chapter ?? 1) + k}</b><span>${esc(t)}</span><small>${translate('minutes', { n: min })}</small></a>`; }
          n++; if (o.sample) samples.add(n); else total++;
          const cls = 'ch' + (P.done.has(n) ? ' done' : '') + (P.last === n ? ' last' : '');
          return `<a class="${cls}" id="${id(n)}" href="${id(n)}/" style="--i:${i++}"><b>${c.chapter ?? shown(n)}</b><span>${esc(t)}</span><small>${translate('minutes', { n: min })}</small></a>`;
        }).join('') + '</div></section>';
    }).join('');
    // A unit's sketch draws itself the first time the unit scrolls into view.
    Units.watch();
    const finished = [...P.done].filter(k => k >= start.chapter && k <= n && !samples.has(k)).length;
    $('prog').innerHTML = finished ? translate('finished', { done: `<b>${finished}</b>`, n: total }) : translate('chapterCount', { n: total });
    $('meta').textContent = translate('meta', {
      chapters: translate('metaChapters', { n: total }),
      samples: samples.size + away ? translate('metaSamples', { n: samples.size + away }) : '',
      units: translate('metaUnits', { n: units.filter(x => !x[2]?.sample).length }) });
    const last = Number.isInteger(P.last) && $(id(P.last));
    if (last) {
      const r = $('resume');
      r.hidden = false;
      r.href = last.getAttribute('href');
      r.textContent = translate('resume', { n: last.querySelector('b').textContent });
    }
  }

  // The guide, drawn the same way as in the lessons, in the page's chalk (ink) colour.
  function lemniscate(cx, cy, a, k) {
    let d = '';
    for (let i = 0; i <= 96; i++) {
      const t = i / 96 * 2 * Math.PI, sn = Math.sin(t), q = 1 + sn * sn;
      d += (i ? 'L' : 'M') + (cx + a * Math.cos(t) / q).toFixed(1) + ' ' + (cy + k * a * sn * Math.cos(t) / q).toFixed(1);
    }
    return d + 'Z';
  }
  function guides(ink) {
    for (const svg of document.querySelectorAll('svg.mascot')) {
      svg.setAttribute('viewBox', '0 0 120 84');
      svg.setAttribute('aria-hidden', 'true');
      const ln = `fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"`;
      svg.innerHTML = `<g class="mbody"><path class="loop" pathLength="1" d="${lemniscate(60, 40, 52, 1.5)}" ${ln} stroke-width="6"/><g class="face">` +
        [33, 87].map(x => `<circle class="pupil" cx="${x}" cy="40" r="6.5" fill="${ink}"/><path class="joy" d="M${x - 7} 43Q${x} 32 ${x + 7} 43" ${ln} stroke-width="4"/>`).join('') +
        `<path d="M55 62Q60 67 65 62" ${ln} stroke-width="3.5"/></g></g>`;
    }
  }

  // The cover and the contents share this page: no hash or #book shows the cover, #contents or #chNN the contents.
  // Lessons link back with #chNN, so the reader lands on the chapter they just left.
  function views() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(animate) {
      const open = location.hash.length > 1 && location.hash !== '#book';
      const apply = () => {
        document.body.classList.toggle('open', open);
        document.body.classList.toggle('stagger', animate && open);
        const here = open ? $(location.hash.slice(1)) : null;
        document.querySelectorAll('.here').forEach(e => e.classList.remove('here'));
        if (here?.classList.contains('ch')) { here.scrollIntoView({ block: 'center' }); here.classList.add('here'); }
        else scrollTo(0, 0);
        if (animate) {
          const heading = document.querySelector(open ? '#contents .home' : '#cover h1');
          heading?.setAttribute('tabindex', '-1');
          heading?.focus({ preventScroll: true });
        }
      };
      if (animate && document.startViewTransition && !reduced && !CSS.supports('-moz-orient', 'inline')) {
        const transition = document.startViewTransition(apply);
        // Navigation can interrupt either promise; the new view is already applied.
        transition.ready.catch(() => {});
        transition.finished.catch(() => {});
      } else apply();
    }
    addEventListener('hashchange', () => show(true));
    show(false);

    // Between pages, the chosen card grows into the lesson frame and the frame shrinks back into its card.
    let named = null;
    const name = el => {
      if (named) named.style.viewTransitionName = '';
      named = el;
      if (el) el.style.viewTransitionName = 'lesson';
    };
    document.addEventListener('click', e => { const a = e.target.closest('a[href^="ch"]'); if (a) name(a); });
    addEventListener('pagereveal', e => {
      const target = (location.hash.length > 1 && $(location.hash.slice(1))?.closest('.ch')) || (named?.offsetParent && named);
      name(e.viewTransition && target ? target : null);
      e.viewTransition?.finished.then(() => name(null), () => name(null));
    });
  }

  // units: [[unit title, [[chapter title, minutes], ...], { unit, chapter, sample, href }?], ...]. Chapters are numbered in
  // order from start (a book whose scope starts mid-way keeps the original numbers in its folders, and may show them
  // from start.label). hues: one colour per unit, cycling.
  function book({ units, start = { unit: 1, chapter: 1 }, hues = HUES, progressKey, ink } = {}) {
    translatePage();
    contents(units, start, hues, progress(progressKey ?? 'animebook:progress:' + new URL('.', location.href).pathname));
    guides(ink || getComputedStyle(document.documentElement).getPropertyValue('--chalk').trim() || '#ece8dc');
    views();
  }

  return { book, translate };
})();
