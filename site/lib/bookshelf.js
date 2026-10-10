/* Website-only book navigation. The picture, links and hotspot positions live in index.html/bookshelf.css. */
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
  const about = document.getElementById('shelf-about');
  document.getElementById('shelf-about-button').addEventListener('click', () => about.showModal());
  const books = [
    { id: 'elementary-algebra', key: 'progress', chapterBase: 'elementary-algebra/', chapters: 68 },
    { id: 'math-notebook', key: 'animebook:progress:' + new URL('math-notebook/', location.href).pathname,
      chapterBase: 'math-notebook/', chapters: 22 },
    { id: 'science', key: 'animebook:progress:' + new URL('science/', location.href).pathname,
      chapterBase: 'science/', chapters: 11 },
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
    resume.style.left = { 'elementary-algebra': '11%', 'math-notebook': '40.8%', science: '67.7%' }[book.id];
    resume.style.top = '5.7%';
    document.getElementById('shelf-books').append(resume);
  }
})();
