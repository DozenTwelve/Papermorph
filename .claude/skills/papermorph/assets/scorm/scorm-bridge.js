// Connects a Papermorph book page to the SCORM host in launch.html. scripts/scorm.py adds it to every page:
// in the contents page's <head>, and in each chapter right after lib/engine.js (before the chapter calls boot()).
// Outside the package wrapper it does nothing, so the book still works as a plain web book.
'use strict';
(function () {
  let host = null;
  try { host = parent !== window && parent.PapermorphSCORM; } catch {}
  if (!host) return;

  // 1. Seed the book's own progress store from the LMS, so the contents page and the chapter
  //    see the learner's saved checkmarks. This file sits in the book folder, the same folder the default key names;
  //    in a chapter, the engine's own key (BOOK_PROGRESS_KEY, which honours lib/book.css --progress-key) wins;
  //    on the contents page, the progressKey the page passes to Contents.book(), which scorm.py reads at build time.
  const KEY = typeof BOOK_PROGRESS_KEY === 'string' ? BOOK_PROGRESS_KEY
    : host.progressKey || 'animebook:progress:' + new URL('.', document.currentScript.src).pathname;
  try { localStorage.setItem(KEY, JSON.stringify(host.progress())); } catch {}

  // 2. In a chapter, every progress change and every finish goes to the host as well.
  //    engine.js's top-level functions and constants are shared globals, so they can be wrapped here.
  if (typeof progress === 'function' && typeof finishCard === 'function') {
    const own = progress;
    progress = function (f) {
      const p = host.progress();
      f(p);
      host.save(p);
      own(f);                                  // keep the page's localStorage copy in step
    };
    const card = finishCard;
    finishCard = function () {
      card.apply(this, arguments);
      let right = 0, total = 0;
      for (const v of Object.values(typeof SCORE === 'object' ? SCORE : {})) { right += v.right; total += v.total; }
      host.finished(CHAPTER.number, right, total);
    };
  } else if (/\/ch\d\d\/[^/]*$/.test(location.pathname)) {
    console.error('[scorm] This chapter has no progress()/finishCard() to hook; the Papermorph engine may have changed. Completion will not reach the LMS.');
  }

  // 3. LMS file servers often don't serve a folder's index.html for a folder URL like "ch02/",
  //    so point every same-site folder link at its index.html.
  const fix = href => href.replace(/^([^?#:]*\/)(?=[?#]|$)/, '$1index.html');
  const sameSite = href => { try { return new URL(href, location.href).origin === location.origin; } catch { return false; } };
  const fixLink = a => {
    const href = a.getAttribute('href');
    if (href && sameSite(href)) { const f = fix(href); if (f !== href) a.setAttribute('href', f); }
  };
  document.addEventListener('click', e => { const a = e.target.closest?.('a[href]'); if (a) fixLink(a); }, true);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href]').forEach(fixLink);
    if (typeof CHAPTER === 'object' && CHAPTER?.next && sameSite(CHAPTER.next)) CHAPTER.next = fix(CHAPTER.next);
  });
})();
