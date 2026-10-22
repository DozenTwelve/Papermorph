// SCORM host for a Papermorph book. Runs in launch.html, the one page the LMS launches.
// It opens the LMS session once, keeps the book's progress, and reports it to the LMS.
// Book pages reach it as parent.PapermorphSCORM through scorm-bridge.js.
'use strict';
(function () {
  const CFG = window.PAPERMORPH_SCORM_CONFIG;
  const TOTAL = CFG.chapters.length;
  const NUMS = new Set(CFG.chapters.map(c => c.n));   // the book's chapter numbers (they need not start at 1)
  const known = n => Number.isInteger(n) && NUMS.has(n);

  /* ---------- finding and talking to the LMS ---------- */
  // SCORM 2004 exposes API_1484_11 and SCORM 1.2 exposes API, on a parent frame or the opener.
  function findAPI(name) {
    const look = w => {
      for (let i = 0; w && i < 12; i++) {
        try { if (w[name]) return w[name]; } catch { return null; }   // a cross-origin frame ends the search
        if (w.parent === w) break;
        w = w.parent;
      }
      return null;
    };
    return look(window) || (window.opener ? look(window.opener) : null) ||
      (window.top && window.top.opener ? look(window.top.opener) : null);
  }

  const v2004 = CFG.version === '2004';
  const raw = findAPI(v2004 ? 'API_1484_11' : 'API');
  const lms = raw && (v2004 ? {
    init: () => raw.Initialize(''), get: k => raw.GetValue(k), set: (k, v) => raw.SetValue(k, String(v)),
    commit: () => raw.Commit(''), finish: () => raw.Terminate(''), err: () => raw.GetLastError(),
  } : {
    init: () => raw.LMSInitialize(''), get: k => raw.LMSGetValue(k), set: (k, v) => raw.LMSSetValue(k, String(v)),
    commit: () => raw.LMSCommit(''), finish: () => raw.LMSFinish(''), err: () => raw.LMSGetLastError(),
  });
  let live = false;
  if (lms) live = String(lms.init()) === 'true';
  if (!live) console.warn(`[scorm] No SCORM ${CFG.version} API found; progress is kept for this visit only.`);
  const get = k => live ? String(lms.get(k) ?? '') : '';
  const set = (k, v) => {
    if (!live) return;
    if (String(lms.set(k, v)) !== 'true') console.warn(`[scorm] ${k} = ${v} refused (error ${lms.err()})`);
  };

  /* ---------- the learner's state ---------- */
  // Kept in suspend_data as {done: [chapter numbers], last: chapter number, s: {chapter: [right, total]}}.
  // s holds each chapter's best first-try score; it stays well under SCORM 1.2's 4096-character limit.
  let S = { done: [], last: 0, s: {} };
  try {
    const saved = JSON.parse(get('cmi.suspend_data') || 'null');
    if (saved && typeof saved === 'object') S = {
      done: Array.isArray(saved.done) ? saved.done.filter(known) : [],
      last: Number.isInteger(saved.last) ? saved.last : 0,
      s: saved.s && typeof saved.s === 'object' ? saved.s : {},
    };
  } catch { console.warn('[scorm] Unreadable suspend_data; starting fresh.'); }

  const pad = n => String(n).padStart(2, '0');
  function score() {
    let r = 0, t = 0;
    for (const [right, total] of Object.values(S.s)) { r += right; t += total; }
    return t ? Math.round(100 * r / t) : null;
  }

  function report() {
    const finished = S.done.length >= TOTAL;
    const pct = score();
    const passed = CFG.mastery == null || (pct ?? 0) >= CFG.mastery;
    set('cmi.suspend_data', JSON.stringify(S));
    if (S.last) set(v2004 ? 'cmi.location' : 'cmi.core.lesson_location', 'ch' + pad(S.last));
    if (pct != null) {
      const base = v2004 ? 'cmi.score.' : 'cmi.core.score.';
      set(base + 'min', 0); set(base + 'max', 100); set(base + 'raw', pct);
      if (v2004) set('cmi.score.scaled', (pct / 100).toFixed(4));
    }
    if (v2004) {
      set('cmi.progress_measure', (S.done.length / TOTAL).toFixed(4));
      set('cmi.completion_status', finished ? 'completed' : 'incomplete');
      if (CFG.mastery != null && finished) set('cmi.success_status', passed ? 'passed' : 'failed');
    } else {
      set('cmi.core.lesson_status', !finished ? 'incomplete' : CFG.mastery == null ? 'completed' : passed ? 'passed' : 'failed');
    }
    // One objective per chapter, so LMS reports can show which chapters a learner finished.
    CFG.chapters.forEach((ch, i) => {
      const o = `cmi.objectives.${i}.`, done = S.done.includes(ch.n), cs = S.s[ch.n];
      set(o + 'id', 'ch' + pad(ch.n));
      if (cs && cs[1]) {
        const p = Math.round(100 * cs[0] / cs[1]);
        set(o + 'score.min', 0); set(o + 'score.max', 100); set(o + 'score.raw', p);
        if (v2004) set(o + 'score.scaled', (p / 100).toFixed(4));
      }
      if (v2004) set(o + 'completion_status', done ? 'completed' : 'incomplete');
      else set(o + 'status', done ? 'completed' : 'incomplete');
    });
    if (live) lms.commit();
  }

  /* ---------- session start and end ---------- */
  const t0 = Date.now();
  if (live) {
    if (v2004) {
      if (get('cmi.completion_status') === 'not attempted' || get('cmi.completion_status') === 'unknown') set('cmi.completion_status', 'incomplete');
      set('cmi.exit', 'suspend');
    } else {
      if (get('cmi.core.lesson_status') === 'not attempted') set('cmi.core.lesson_status', 'incomplete');
      set('cmi.core.exit', 'suspend');
    }
    lms.commit();
  }

  function sessionTime() {
    const s = Math.max(0, Math.round((Date.now() - t0) / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor(s / 60) % 60, ss = s % 60;
    return v2004 ? `PT${hh}H${mm}M${ss}S` : `${String(hh).padStart(4, '0')}:${pad(mm)}:${pad(ss)}`;
  }
  let ended = false;
  function end() {
    if (!live || ended) return;
    ended = true;
    set(v2004 ? 'cmi.session_time' : 'cmi.core.session_time', sessionTime());
    // Always suspend, even when finished, so a learner who comes back to review still sees their checkmarks.
    set(v2004 ? 'cmi.exit' : 'cmi.core.exit', 'suspend');
    lms.commit();
    lms.finish();
  }
  addEventListener('pagehide', end);
  addEventListener('beforeunload', end);

  /* ---------- the interface book pages use ---------- */
  window.PapermorphSCORM = {
    live,
    progressKey: CFG.progressKey,   // the contents page's own key, when the book sets one
    // A copy of {done, last}, in the shape the book's own progress() works on.
    progress: () => ({ done: S.done.slice(), last: S.last }),
    // The book changed its progress (opened or finished a chapter).
    save(p) {
      S.done = [...new Set((p.done || []).filter(known))].sort((a, b) => a - b);
      if (Number.isInteger(p.last)) S.last = p.last;
      report();
    },
    // A chapter's finish card appeared; [right, total] are its first-try answers. Keep the best attempt.
    finished(n, right, total) {
      if (known(n) && !S.done.includes(n)) S.done = [...S.done, n].sort((a, b) => a - b);
      const old = S.s[n];
      if (total > 0 && (!old || right / total > old[0] / old[1])) S.s[n] = [right, total];
      report();
    },
    start(frame) {
      // Every launch opens on the cover; its Continue button uses the saved last chapter.
      frame.src = 'book/index.html';
    },
  };
})();
