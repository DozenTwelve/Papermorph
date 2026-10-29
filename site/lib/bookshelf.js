/* Website-only bookshelf behaviour: old root links, the About note, and a "Continue" note on books the reader has started. */
'use strict';
(() => {
  // Old root hashes referred to the first book before each book had its own folder.
  const legacyBook = () => {
    if (/^#(?:book|contents|ch\d{2})$/.test(location.hash)) {
      const target = new URL('elementary-algebra/', location.href);
      target.search = location.search;
      target.hash = location.hash;
      location.replace(target.href);
    }
  };
  legacyBook();
  addEventListener('hashchange', legacyBook);
  const books = [
    { id: 'elementary-algebra', key: 'progress', chapterBase: 'elementary-algebra/', chapters: 68 },
    { id: 'math-notebook', key: 'animebook:progress:' + new URL('math-notebook/', location.href).pathname,
      chapterBase: 'math-notebook/', chapters: 23 },
    { id: 'science', key: 'animebook:progress:' + new URL('science/', location.href).pathname,
      chapterBase: 'science/', chapters: 19 },
    { id: 'linear-algebra', key: 'animebook:progress:' + new URL('linear-algebra/', location.href).pathname,
      chapterBase: 'linear-algebra/', chapters: 40 },
  ];
  for (const book of books) {
    const cover = document.querySelector(`[data-book="${book.id}"]`);
    if (!cover) continue;
    let saved;
    try { saved = JSON.parse(localStorage.getItem(book.key) || '{}'); } catch { continue; }
    if (!saved || !Number.isInteger(saved.last) || saved.last < 1 || saved.last > book.chapters) continue;
    const resume = document.createElement('a');
    resume.className = 'resume-label';
    resume.textContent = `Continue · Chapter ${saved.last} →`;
    resume.href = `${book.chapterBase}ch${String(saved.last).padStart(2, '0')}/`;
    const slot = document.createElement('div');   // a link can't hold a link: the note sits beside the cover, over it
    slot.className = 'book-slot';
    cover.replaceWith(slot);
    slot.append(cover, resume);
  }
})();
