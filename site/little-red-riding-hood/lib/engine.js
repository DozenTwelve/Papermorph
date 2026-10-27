// Papermorph lesson engine: stage, drawing, timeline, questions, player.
// A chapter page loads this file, defines CHAPTER and BEATS, then calls boot().
'use strict';
// A fast follow-up navigation can abort the incoming page transition.
addEventListener('pagereveal', e => e.viewTransition?.ready.catch(() => {}));

// The engine's state and helpers live in one closure. Only the names declared at the end of this file are global (the
// API that chapters, math.js, book libraries and the scripts use), so a chapter may name its own helpers anything else
// (clock, fit, frame, last, ui, …).
let seeking = false;   // true while seek() replays the beats before its target
let captions = false;   // the reader's captions setting (C)
const ENGINE = (() => {

/* ---------- interface language ---------- */
// The page's <html lang> picks the interface text; CHAPTER.language picks the audio folder. Set both alike.
// A value is a string or plural forms { one, few, many, other } chosen by vars.n. Missing keys fall back to English.
const TRANSLATIONS = {
  en: {
    decimalSign: '.', stageLabel: 'Lesson animation', stageLabelTitled: 'Lesson animation: {title}',
    shortcuts: 'Keyboard shortcuts', lesson: 'Lesson', questions: 'Questions',
    helpPlay: 'Play or pause', helpStep: 'Previous or next step', helpStepInQuestion: 'Change step during a question', helpRestart: 'Start over',
    helpCaptions: 'Captions on or off', helpSpeed: 'Slower or faster', helpFullScreen: 'Full screen', helpList: 'Show this list',
    helpChoose: 'Choose an answer or a ring', helpTrueFalse: 'True or false', helpRows: 'Move between rows',
    helpNumberLine: 'Move along the number line, or pick a number to sort', helpEnter: 'Check, then continue',
    helpShowAnswer: 'Show the answer', helpLeaveBox: 'Leave an answer box', helpClose: 'Press {key} to close.',
    paused: 'Paused. Press space or click to continue.',
    soundFailed: 'Sound could not play. The lesson continues with the on-screen text.',
    startLesson: 'Start lesson', startFilm: 'Play', aboutMinutesFilm: 'About {n} minutes, with sound.', coverKeys: 'Press {space} to start, {help} for shortcuts.', spaceKey: 'Space',
    chapterNumber: 'Chapter {n}', aboutMinutes: 'About {n} minutes, with sound and quick checks.',
    allChapters: 'All chapters', playLabel: 'Play or pause (space)', backLabel: 'Previous step (left arrow)', restartLabel: 'Restart lesson',
    checksInLesson: 'Quick checks and practice are in the interactive lesson.',
    volumeLabel: 'Adjust volume', volumeTitle: 'Volume (0 = muted)', volumeSlider: 'Volume',
    helpLabel: 'Keyboard shortcuts (?)', speedLabel: 'Playback speed (< and >)', captionsLabel: 'Captions (C)', fullScreenLabel: 'Full screen', goToStep: 'Go to step {n}: {title}',
    quickCheck: 'Quick check', countOf: 'question {k} of {n}', check: 'Check', showAnswer: 'Show answer', nextQuestion: 'Next question', continue: 'Continue',
    correct: 'Correct. ', notQuite: 'Not quite. ', answerPrefix: 'Answer: ', keysPrefix: 'Keys: ',
    hintMove: ' move, ', hintChoose: ' choose', hintChooseOrClickGrid: ' choose, or click the grid', hintMoveAlongLine: ' move along the line, ',
    hintChooseOrClick: ' choose, or click', hintRow: ' row, ', hintTypeFraction: 'type numbers like 3/4 or −2 1/4, ', hintTypeNumber: 'type the number, ',
    hintTypeDecimal: 'type the number, ', hintNextBox: ' next box, ', hintCheck: ' check, ', hintLeaveBox: ' leave the box',
    hintPickNumber: ' pick a number, ', hintPickRing: ' choose its ring',
    rowsRight: '{r} of {n} right. Fix the rows marked ✗ and check again.',
    choicesShown: 'the correct choices are now selected.', numbersShown: 'the correct numbers are filled in.',
    notPlacedYet: '{x} is not placed yet.',
    realRingIsEmpty: '{x}: every real number is rational or irrational, so that space has no numbers of its own.',
    ringsRight: '{r} of {n} in the right ring.', ringsShown: 'every number is now in its smallest ring.',
    chipPlaced: '{x}, placed in {ring}', chipNotPlaced: '{x}, not placed', pointLabel: 'The point {v}', answerBox: 'Answer',
    stepsLeftOfZero: '{n} steps left of 0',
    natural: 'Natural', whole: 'Whole', integers: 'Integers', rational: 'Rational', irrational: 'Irrational', real: 'Real', integerColumn: 'Integer',
    trueLabel: 'True', falseLabel: 'False',
    chapterComplete: 'Chapter {n} complete', quickChecks: 'Quick checks', chapterPractice: 'Chapter practice', sources: 'Sources in this chapter', opensSource: '{label}, opens the source in a new tab',
    firstTryScore: '{name}: {r} of {t} right on the first try.', notAttempted: '{name}: not attempted.',
    watchAgain: 'Watch again', nextChapter: 'Next chapter',
  },
  ru: {
    decimalSign: ',', stageLabel: 'Анимация урока', stageLabelTitled: 'Анимация урока: {title}',
    shortcuts: 'Горячие клавиши', lesson: 'Урок', questions: 'Вопросы',
    helpPlay: 'Пуск или пауза', helpStep: 'Предыдущий или следующий шаг', helpStepInQuestion: 'Сменить шаг во время вопроса', helpRestart: 'Начать сначала',
    helpCaptions: 'Субтитры вкл. или выкл.', helpSpeed: 'Медленнее или быстрее', helpFullScreen: 'Полноэкранный режим', helpList: 'Показать этот список',
    helpChoose: 'Выбрать ответ или круг', helpTrueFalse: 'Верно или неверно', helpRows: 'Перейти между строками',
    helpNumberLine: 'Двигаться по числовой прямой или выбрать число для сортировки', helpEnter: 'Проверить, затем продолжить',
    helpShowAnswer: 'Показать ответ', helpLeaveBox: 'Выйти из поля ответа', helpClose: 'Нажмите {key}, чтобы закрыть.',
    paused: 'Пауза. Нажмите пробел или щёлкните, чтобы продолжить.',
    soundFailed: 'Звук не воспроизводится. Урок продолжится с текстом на экране.',
    startLesson: 'Начать урок', startFilm: 'Смотреть', aboutMinutesFilm: { one: 'Около {n} минуты, со звуком.', few: 'Около {n} минут, со звуком.', many: 'Около {n} минут, со звуком.', other: 'Около {n} минуты, со звуком.' }, coverKeys: '{space} — начать, {help} — горячие клавиши.', spaceKey: 'Пробел',
    chapterNumber: 'Глава {n}',
    aboutMinutes: { one: 'Около {n} минуты, со звуком и проверками.', few: 'Около {n} минут, со звуком и проверками.',
      many: 'Около {n} минут, со звуком и проверками.', other: 'Около {n} минуты, со звуком и проверками.' },
    allChapters: 'Все главы', playLabel: 'Пуск или пауза (пробел)', backLabel: 'Предыдущий шаг (стрелка влево)', restartLabel: 'Начать урок заново',
    checksInLesson: 'Проверочные вопросы и практика — в интерактивном уроке.',
    volumeLabel: 'Настроить громкость', volumeTitle: 'Громкость (0 — без звука)', volumeSlider: 'Громкость',
    helpLabel: 'Горячие клавиши (?)', speedLabel: 'Скорость воспроизведения (< и >)', captionsLabel: 'Субтитры (C)', fullScreenLabel: 'Полный экран', goToStep: 'Перейти к шагу {n}: {title}',
    quickCheck: 'Проверь себя', countOf: 'вопрос {k} из {n}', check: 'Проверить', showAnswer: 'Показать ответ', nextQuestion: 'Следующий вопрос', continue: 'Продолжить',
    correct: 'Верно. ', notQuite: 'Не совсем. ', answerPrefix: 'Ответ: ', keysPrefix: 'Клавиши: ',
    hintMove: ' двигаться, ', hintChoose: ' выбрать', hintChooseOrClickGrid: ' выбрать или щёлкнуть по сетке', hintMoveAlongLine: ' двигаться по прямой, ',
    hintChooseOrClick: ' выбрать или щёлкнуть', hintRow: ' строка, ', hintTypeFraction: 'вводите числа вида 3/4 или −2 1/4, ', hintTypeNumber: 'введите число, ',
    hintTypeDecimal: 'вводите числа вида 0,75, ', hintNextBox: ' следующее поле, ', hintCheck: ' проверить, ', hintLeaveBox: ' выйти из поля',
    hintPickNumber: ' выбрать число, ', hintPickRing: ' выбрать его круг',
    rowsRight: 'Верно {r} из {n}. Исправьте строки с ✗ и проверьте снова.',
    choicesShown: 'правильные варианты отмечены.', numbersShown: 'правильные числа вписаны.',
    notPlacedYet: '{x}: ещё не размещено.',
    realRingIsEmpty: '{x}: каждое действительное число рационально или иррационально, поэтому своих чисел у этой области нет.',
    ringsRight: 'В нужном круге: {r} из {n}.', ringsShown: 'каждое число теперь в своём наименьшем круге.',
    chipPlaced: '{x}, в круге «{ring}»', chipNotPlaced: '{x}, не размещено', pointLabel: 'Точка {v}', answerBox: 'Ответ',
    stepsLeftOfZero: { one: '{n} шаг влево от 0', few: '{n} шага влево от 0', many: '{n} шагов влево от 0', other: '{n} шага влево от 0' },
    natural: 'Натуральные', whole: 'Целые неотрицательные', integers: 'Целые', rational: 'Рациональные', irrational: 'Иррациональные', real: 'Действительные', integerColumn: 'Целые',
    trueLabel: 'Верно', falseLabel: 'Неверно',
    chapterComplete: 'Глава {n} пройдена', quickChecks: 'Проверь себя', chapterPractice: 'Практика по главе', sources: 'Источники этой главы', opensSource: '{label}, источник откроется в новой вкладке',
    firstTryScore: '{name}: {r} из {t} верно с первой попытки.', notAttempted: '{name}: не выполнялось.',
    watchAgain: 'Смотреть снова', nextChapter: 'Следующая глава',
  },
  zh: {
    decimalSign: '.', stageLabel: '课程动画', stageLabelTitled: '课程动画：{title}',
    shortcuts: '键盘快捷键', lesson: '课程', questions: '题目',
    helpPlay: '播放或暂停', helpStep: '上一步或下一步', helpStepInQuestion: '答题时切换步骤', helpRestart: '从头开始',
    helpCaptions: '打开或关闭字幕', helpSpeed: '减速或加速', helpFullScreen: '全屏', helpList: '显示此列表',
    helpChoose: '选择答案或圆环', helpTrueFalse: '对或错', helpRows: '在各行之间移动',
    helpNumberLine: '在数轴上移动，或选一个数来分类', helpEnter: '检查，然后继续',
    helpShowAnswer: '显示答案', helpLeaveBox: '离开答题框', helpClose: '按 {key} 关闭。',
    paused: '已暂停。按空格键或点击继续。',
    soundFailed: '声音无法播放。课程将借助屏幕上的文字继续。',
    startLesson: '开始上课', startFilm: '播放', aboutMinutesFilm: '约 {n} 分钟，有配音。', coverKeys: '按 {space} 开始，按 {help} 查看快捷键。', spaceKey: '空格',
    chapterNumber: '第 {n} 章', aboutMinutes: '约 {n} 分钟，含配音和随堂小测。',
    allChapters: '全部章节', playLabel: '播放或暂停（空格）', backLabel: '上一步（左方向键）', restartLabel: '重新开始本课',
    checksInLesson: '小测验和练习在互动课程里。',
    volumeLabel: '调节音量', volumeTitle: '音量（0 为静音）', volumeSlider: '音量',
    helpLabel: '键盘快捷键（?）', speedLabel: '播放速度（< 和 >）', captionsLabel: '字幕（C）', fullScreenLabel: '全屏', goToStep: '跳到第 {n} 步：{title}',
    quickCheck: '小测', countOf: '第 {k}/{n} 题', check: '检查', showAnswer: '显示答案', nextQuestion: '下一题', continue: '继续',
    correct: '正确。', notQuite: '还不对。', answerPrefix: '答案：', keysPrefix: '按键：',
    hintMove: ' 移动，', hintChoose: ' 选择', hintChooseOrClickGrid: ' 选择，或点击网格', hintMoveAlongLine: ' 沿数轴移动，',
    hintChooseOrClick: ' 选择，或点击', hintRow: ' 换行，', hintTypeFraction: '可输入 3/4 或 −2 1/4 这样的数，', hintTypeNumber: '输入数字，',
    hintTypeDecimal: '输入数字，', hintNextBox: ' 下一个框，', hintCheck: ' 检查，', hintLeaveBox: ' 离开答题框',
    hintPickNumber: ' 选一个数，', hintPickRing: ' 选它所在的圆环',
    rowsRight: '{n} 行中对了 {r} 行。改正标 ✗ 的行，再检查一次。',
    choicesShown: '正确选项已经选上。', numbersShown: '正确的数已经填上。',
    notPlacedYet: '{x} 还没有放好。',
    realRingIsEmpty: '{x}：每个实数不是有理数就是无理数，所以这一块没有只属于它的数。',
    ringsRight: '{n} 个中有 {r} 个放在了正确的圆环里。', ringsShown: '每个数现在都在它所属的最小圆环里。',
    chipPlaced: '{x}，放在「{ring}」', chipNotPlaced: '{x}，未放置', pointLabel: '点 {v}', answerBox: '答案',
    stepsLeftOfZero: '0 左边 {n} 步',
    natural: '正整数', whole: '非负整数', integers: '整数', rational: '有理数', irrational: '无理数', real: '实数', integerColumn: '整数',
    trueLabel: '对', falseLabel: '错',
    chapterComplete: '第 {n} 章完成', quickChecks: '小测', chapterPractice: '本章练习', sources: '本章引用的文献', opensSource: '{label}，在新标签页中打开来源',
    firstTryScore: '{name}：第一次就答对 {r} / {t}。', notAttempted: '{name}：未作答。',
    watchAgain: '再看一遍', nextChapter: '下一章',
  },
  ja: {
    decimalSign: '.', stageLabel: '授業アニメーション', stageLabelTitled: '授業アニメーション：{title}',
    shortcuts: 'キーボードショートカット', lesson: '授業', questions: '問題',
    helpPlay: '再生／一時停止', helpStep: '前または次のステップ', helpStepInQuestion: '問題の途中でステップを移動', helpRestart: '最初から',
    helpCaptions: '字幕のオン／オフ', helpSpeed: '遅く／速く', helpFullScreen: '全画面', helpList: 'この一覧を表示',
    helpChoose: '答えまたは輪を選ぶ', helpTrueFalse: '正しい／誤り', helpRows: '行を移動',
    helpNumberLine: '数直線上を移動、または分類する数を選ぶ', helpEnter: '答え合わせ、そして次へ',
    helpShowAnswer: '答えを表示', helpLeaveBox: '解答欄から出る', helpClose: '{key} で閉じる。',
    paused: '一時停止中。スペースキーかクリックで再開します。',
    soundFailed: '音声を再生できません。画面の文字で授業を続けます。',
    startLesson: '授業を始める', startFilm: '再生', aboutMinutesFilm: '約{n}分、音声つき。', coverKeys: '{space} で開始、{help} でショートカット一覧。', spaceKey: 'スペース',
    chapterNumber: '第{n}章', aboutMinutes: '約{n}分、音声と確認問題つき。',
    allChapters: 'すべての章', playLabel: '再生／一時停止（スペース）', backLabel: '前のステップ（左矢印）', restartLabel: '授業を最初から',
    checksInLesson: '確認問題と練習はインタラクティブな授業の中にあります。',
    volumeLabel: '音量を調整', volumeTitle: '音量（0 でミュート）', volumeSlider: '音量',
    helpLabel: 'キーボードショートカット（?）', speedLabel: '再生速度（< と >）', captionsLabel: '字幕（C）', fullScreenLabel: '全画面', goToStep: 'ステップ {n}：{title} へ移動',
    quickCheck: '確認問題', countOf: '問 {k}/{n}', check: '答え合わせ', showAnswer: '答えを見る', nextQuestion: '次の問題', continue: '続ける',
    correct: '正解。', notQuite: 'おしい。', answerPrefix: '答え：', keysPrefix: 'キー：',
    hintMove: ' 移動、', hintChoose: ' 選ぶ', hintChooseOrClickGrid: ' 選ぶ、またはマス目をクリック', hintMoveAlongLine: ' 数直線上を移動、',
    hintChooseOrClick: ' 選ぶ、またはクリック', hintRow: ' 行、', hintTypeFraction: '3/4 や −2 1/4 のように入力、', hintTypeNumber: '数を入力、',
    hintTypeDecimal: '数を入力、', hintNextBox: ' 次の欄、', hintCheck: ' 答え合わせ、', hintLeaveBox: ' 欄から出る',
    hintPickNumber: ' 数を選ぶ、', hintPickRing: ' その輪を選ぶ',
    rowsRight: '{n} 行中 {r} 行正解。✗ の行を直して、もう一度答え合わせ。',
    choicesShown: '正しい選択肢を選びました。', numbersShown: '正しい数を入れました。',
    notPlacedYet: '{x} はまだ置かれていません。',
    realRingIsEmpty: '{x}：実数はどれも有理数か無理数なので、この部分だけに入る数はありません。',
    ringsRight: '{n} 個中 {r} 個が正しい輪に入っています。', ringsShown: 'どの数も、入るいちばん小さい輪に移しました。',
    chipPlaced: '{x}、「{ring}」に配置', chipNotPlaced: '{x}、未配置', pointLabel: '点 {v}', answerBox: '答え',
    stepsLeftOfZero: '0 から左へ {n}',
    natural: '自然数', whole: '0 以上の整数', integers: '整数', rational: '有理数', irrational: '無理数', real: '実数', integerColumn: '整数',
    trueLabel: '正しい', falseLabel: '誤り',
    chapterComplete: '第{n}章 完了', quickChecks: '確認問題', chapterPractice: '章末練習', sources: 'この章の出典', opensSource: '{label}（出典を新しいタブで開く）',
    firstTryScore: '{name}：1 回目で {t} 問中 {r} 問正解。', notAttempted: '{name}：未挑戦。',
    watchAgain: 'もう一度見る', nextChapter: '次の章へ',
  },
};
// <html data-stage="portrait"> turns the stage upright: 900 wide, 1600 tall. Landscape (1600×900) otherwise.
const PORTRAIT = document.documentElement.dataset.stage === 'portrait';
const SW = PORTRAIT ? 900 : 1600, SH = PORTRAIT ? 1600 : 900;
document.documentElement.style.setProperty('--sw', SW + 'px');
document.documentElement.style.setProperty('--sh', SH + 'px');
const LANGUAGE = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
const pluralRules = {};
// Interface text in LANGUAGE: translate('chapterNumber', { n: 3 }) → 'Chapter 3'. Chapters may use it too, e.g. for practice labels.
// contents.js has its own copy for the contents page: keep the two in step.
function translate(key, vars = {}) {
  const language = TRANSLATIONS[LANGUAGE]?.[key] !== undefined ? LANGUAGE : 'en';
  let text = TRANSLATIONS[language][key] ?? key;
  if (typeof text === 'object') {
    try { pluralRules[language] ??= new Intl.PluralRules(language); } catch { pluralRules[language] = new Intl.PluralRules('en'); }
    text = text[pluralRules[language].select(vars.n)] ?? text.other;
  }
  return text.replace(/\{(\w+)\}/g, (placeholder, name) => name in vars ? vars[name] : placeholder);
}
const DECIMAL_SIGN = translate('decimalSign');   // shown by num() and accepted by answer boxes
const isLatinLetter = key => /^[a-z]$/i.test(key);
// A letter shortcut on any keyboard layout: the typed letter, or the same physical key when the layout types a non-Latin letter.
const isShortcut = (event, letter) => event.key.toLowerCase() === letter.toLowerCase()
  || (isLatinLetter(letter) && !isLatinLetter(event.key) && event.code === 'Key' + letter.toUpperCase());
// A punctuation shortcut (code 'Comma', 'Period') on a layout that types a non-Latin letter on that key.
const isShortcutCode = (event, code) => /^\p{L}$/u.test(event.key) && !isLatinLetter(event.key) && event.code === code;

document.body.insertAdjacentHTML('afterbegin', `<div id="frame">
  <svg id="stage" viewBox="0 0 ${SW} ${SH}" role="img" aria-label="${translate('stageLabel')}">
    <g id="scene"></g>
  </svg>
  <div id="ui"></div>
  <div class="paused-mark"><div>${translate('paused')}</div></div>
  <div class="caption" id="caption" hidden></div>
  <div class="help" id="help" hidden role="dialog" aria-label="${translate('shortcuts')}">
    <div class="help-box">
      <h2>${translate('shortcuts')}</h2>
      <div class="help-cols">
        <div><h3>${translate('lesson')}</h3><dl>
          <dt><kbd>${translate('spaceKey')}</kbd></dt><dd>${translate('helpPlay')}</dd>
          <dt><kbd>←</kbd><kbd>→</kbd></dt><dd>${translate('helpStep')}</dd>
          <dt><kbd>Shift</kbd><kbd>←</kbd><kbd>→</kbd></dt><dd>${translate('helpStepInQuestion')}</dd>
          <dt><kbd>Home</kbd></dt><dd>${translate('helpRestart')}</dd>
          <dt><kbd>C</kbd></dt><dd>${translate('helpCaptions')}</dd>
          <dt><kbd>&lt;</kbd><kbd>&gt;</kbd></dt><dd>${translate('helpSpeed')}</dd>
          <dt><kbd>F</kbd></dt><dd>${translate('helpFullScreen')}</dd>
          <dt><kbd>?</kbd></dt><dd>${translate('helpList')}</dd>
        </dl></div>
        <div><h3>${translate('questions')}</h3><dl>
          <dt><kbd>1</kbd>–<kbd>6</kbd></dt><dd>${translate('helpChoose')}</dd>
          <dt><kbd>T</kbd><kbd>F</kbd></dt><dd>${translate('helpTrueFalse')}</dd>
          <dt><kbd>↑</kbd><kbd>↓</kbd></dt><dd>${translate('helpRows')}</dd>
          <dt><kbd>←</kbd><kbd>→</kbd></dt><dd>${translate('helpNumberLine')}</dd>
          <dt><kbd>Enter</kbd></dt><dd>${translate('helpEnter')}</dd>
          <dt><kbd>S</kbd></dt><dd>${translate('helpShowAnswer')}</dd>
          <dt><kbd>Esc</kbd></dt><dd>${translate('helpLeaveBox')}</dd>
        </dl></div>
      </div>
      <p class="help-close">${translate('helpClose', { key: '<kbd>Esc</kbd>' })}</p>
    </div>
  </div>
  <p class="sound-note" id="soundNote" hidden>${translate('soundFailed')}</p>
  <button class="cover" id="cover"><div>
    <p class="cover-k" id="coverK"></p>
    <h1 class="cover-t" id="coverT"></h1>
    <span class="go"><svg width="24" height="24" viewBox="0 0 18 18"><path d="M3 1.5v15l13-7.5z" fill="currentColor"/></svg><span id="coverGo">${translate('startLesson')}</span></span>
    <small><span id="coverMeta"></span> ${translate('coverKeys', { space: `<kbd>${translate('spaceKey')}</kbd>`, help: '<kbd>?</kbd>' })}</small>
  </div></button>
  <div id="bar">
    <a class="icon" id="bHome" href="../" aria-label="${translate('allChapters')}" title="${translate('allChapters')}">
      <svg viewBox="0 0 18 18"><path d="M2 2h6v6H2zM10 2h6v6h-6zM2 10h6v6H2zM10 10h6v6h-6z"/></svg>
    </a>
    <button class="icon" id="bPlay" aria-label="${translate('playLabel')}">
      <svg class="i-play" viewBox="0 0 18 18"><path d="M4 2v14l12-7z"/></svg>
      <svg class="i-pause" viewBox="0 0 18 18"><path d="M3.5 2h4v14h-4zM10.5 2h4v14h-4z"/></svg>
    </button>
    <button class="icon" id="bBack" aria-label="${translate('backLabel')}">
      <svg viewBox="0 0 18 18"><path d="M3 2h2.5v14H3zM16 2v14L6.5 9z"/></svg>
    </button>
    <button class="icon" id="bRestart" aria-label="${translate('restartLabel')}">
      <svg viewBox="0 0 18 18"><path d="M9 2.5a6.5 6.5 0 1 1-6.3 8.1l2-.5A4.5 4.5 0 1 0 9 4.5V7L4.5 3.5 9 0z"/></svg>
    </button>
    <div class="segs" id="segs"></div>
    <div class="step" id="stepName"></div>
    <button class="icon txt" id="bHelp" aria-label="${translate('helpLabel')}" title="${translate('helpLabel')}">?</button>
    <button class="icon txt speed" id="bSpeed" aria-label="${translate('speedLabel')}" title="${translate('speedLabel')}">1×</button>
    <button class="icon cc" id="bCC" aria-pressed="false" aria-label="${translate('captionsLabel')}" title="${translate('captionsLabel')}">CC</button>
    <button class="icon" id="bFull" aria-label="${translate('fullScreenLabel')}">
      <svg viewBox="0 0 18 18"><path d="M1 1h6v2H3v4H1zM11 1h6v6h-2V3h-4zM1 11h2v4h4v2H1zM15 11h2v6h-6v-2h4z"/></svg>
    </button>
  </div>
</div>`);

// Board colour, grain and vignette are a static CSS background of #stage (engine.css). The grain is a small noise
// texture made once here: an SVG turbulence filter behind animated content is recomputed on every frame in Firefox.
{
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), d = x.createImageData(256, 256);
  for (let i = 0, s = 7; i < d.data.length; i += 4) { s = s * 16807 % 2147483647; d.data.set([235, 242, 230, 4 + s % 12], i); }
  x.putImageData(d, 0, 0);
  document.getElementById('stage').style.setProperty('--grain', `url(${c.toDataURL()})`);
}

/* ---------- drawing helpers ---------- */
const NS = 'http://www.w3.org/2000/svg';
const UI = '"Avenir Next","Segoe UI","Helvetica Neue",Arial,sans-serif';
// Book settings (lib/book.css, next to engine.css and imported by it): --math-font for numbers and formulas,
// --progress-key for the localStorage key the cover and chapters share.
const BOOK = getComputedStyle(document.documentElement);
const bookSetting = name => BOOK.getPropertyValue(name).trim().replace(/^(["'])([^"']*)\1$/, '$2');   // unquote a lone string only
// The board and ink colours come from the palette in engine.css, which lib/book.css may redefine (a light board):
// the picture, the cards and the player bar then agree. The six hues are the chapters' meanings, set in JS.
const COL = { nat: '#f4a48c', whole: '#86c9e8', int: '#f3c95c', rat: '#e8a0c8', irr: '#8fd6b0', real: '#bba8ee',
  chalk: '#ece8dc', dim: '#9aaba3', faint: '#5d7068', task: '#f0b45a', good: '#8fd6b0', bad: '#f08c7a', board: '#1d2b27' };
{ // a canvas reads any CSS colour back as #rrggbb, the form colour tweens mix; a missing or bad one keeps the default
  const c = document.createElement('canvas').getContext('2d');
  for (const k of ['chalk', 'dim', 'faint', 'task', 'good', 'bad', 'board']) { c.fillStyle = COL[k]; c.fillStyle = bookSetting('--' + k) || COL[k]; COL[k] = c.fillStyle; }
}
const MATH = bookSetting('--math-font') || '"STIX Two Text","Cambria Math","Iowan Old Style",Palatino,Georgia,serif';
const NAME = { nat: translate('natural'), whole: translate('whole'), int: translate('integers'), rat: translate('rational'), irr: translate('irrational'), real: translate('real') };
// Card positions inside the picture. BAND and the screens follow the stage; RIGHT and TOPR are placed for the wide
// stage's number line and map and have no upright layout yet.
const BAND = { x: 96 * SW / 1600, y: SH - 214, w: SW - 192 * SW / 1600, cls: 'band' };   // bottom band (moves up when taller than the space left)
const RIGHT = { x: 1258, y: 546, w: 330, cls: 'side', maxH: 346 };    // right of the number map
const TOPR = { x: 960, y: 70, w: 624, cls: 'side', maxH: 470 };   // top right, above the number line
const SCREEN = { x: 0, y: 0, w: SW, cls: 'screen' };
const SORT_SCREEN = { x: 0, y: 0, w: SW, cls: 'screen sort' };
const $m = (...parts) => ({ m: parts });

function mk(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
// Every animated element keeps a small state object; render() writes it to the DOM.
// Keys: x y s r o (transform/opacity), d (0..1 stroke drawn), a_<attr> numeric attr, c_<attr> hex colour.
function st(e) { return e._st || (e._st = { x: 0, y: 0, s: 1, r: 0, o: 1 }); }
function put(e, o) { Object.assign(st(e), o); render(e); return e; }
// Unchanged transform/opacity are not rewritten: per-frame updates of still elements cost repaints (notably in Firefox).
function render(e) {
  const s = e._st, tf = s.x || s.y || s.s !== 1 || s.r ? `translate(${s.x},${s.y}) rotate(${s.r}) scale(${s.s})` : null;
  // _tf starts unset: an element never moved keeps a transform attribute it was made with
  if (tf !== (e._tf ?? null)) { if (tf) e.setAttribute('transform', tf); else e.removeAttribute('transform'); e._tf = tf; }
  if (s.o !== e._o) { e.setAttribute('opacity', s.o); e._o = s.o; }
  if (s.d !== undefined) {
    e.setAttribute('stroke-dashoffset', 1 - s.d);
    e.style.visibility = s.d < .002 ? 'hidden' : '';
  }
  for (const k in s) {
    if (k.startsWith('a_')) e.setAttribute(k.slice(2), s[k]);
    else if (k.startsWith('c_')) e.setAttribute(k.slice(2), s[k]);
  }
}
function G(parent, o = {}) { return put(mk('g', {}, parent), o); }
function path(parent, d, attrs = {}, o = {}) {
  const p = mk('path', { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, parent);
  if (o.d !== undefined) { p.setAttribute('pathLength', 1); p.setAttribute('stroke-dasharray', '1 1'); }
  return put(p, o);
}
function T(parent, str, { x = 0, y = 0, size = 30, fill = COL.chalk, font = UI, weight = 500, anchor = 'start', o = 1 } = {}) {
  const t = mk('text', { 'font-size': size, fill, 'font-family': font, 'font-weight': weight, 'text-anchor': anchor }, parent);
  t.textContent = str;
  t.style.whiteSpace = 'pre';
  return put(t, { x, y, o });
}
// A citation drawn in the picture that opens its source (REFS from ../refs.js, built by scripts/refs.py) in a new tab.
// cite(p, key, opts) takes T's options; str overrides the label (default REFS[key].cite). Returns the <a>; animate it like T.
const CITED = new Set();
function cite(parent, key, { str, ...opts } = {}) {
  const r = (typeof REFS === 'object' && REFS) ? REFS[key] : null;
  if (!r) throw new Error(`cite: no reference "${key}" in refs.js`);
  CITED.add(key);
  if (!r.url) return T(parent, str || r.cite, opts);
  linkStage();
  const a = mk('a', { class: 'cite', href: r.url, target: '_blank', rel: 'noopener', 'aria-label': translate('opensSource', { label: r.cite }) }, parent);
  const { o = 1, x = 0, y = 0, ...rest } = opts;
  T(a, str || r.cite, { ...rest, fill: rest.fill || COL.chalk });
  return put(a, { x, y, o });
}
// Any text in the picture or a card that equals a reference's cite label or one of its match strings (case-insensitive)
// becomes a link to the source, so chapters write citations as plain text. Watched by citeObs (set up after the player).
let CITE_RE = null, CITE_KEY = null;
function citeIndex() {
  if (CITE_RE !== null) return CITE_RE;
  CITE_KEY = new Map();
  for (const [k, r] of Object.entries(typeof REFS === 'object' && REFS ? REFS : {}))
    for (const s of [r.cite, ...(r.match || [])]) if (s) CITE_KEY.set(s.toLowerCase(), k);
  const alts = [...CITE_KEY.keys()].sort((a, b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return (CITE_RE = alts.length ? new RegExp(alts.join('|'), 'gi') : false);
}
function autoCite(root) {
  const re = citeIndex();
  if (!re) return;
  const nodes = [];
  if (root.nodeType === 3) nodes.push(root);
  else if (root.nodeType === 1) for (let w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; (n = w.nextNode());) nodes.push(n);
  for (const n of nodes) {
    const host = n.parentElement;
    if (!host || host.closest('a, button, input, script, style, kbd')) continue;   // no links inside controls
    const ms = [...n.data.matchAll(re)];
    if (!ms.length) continue;
    const svg = host.namespaceURI === NS, frag = document.createDocumentFragment();
    let i = 0, made = 0;
    for (const m of ms) {
      const k = CITE_KEY.get(m[0].toLowerCase()), r = REFS[k];
      CITED.add(k);
      if (!r.url) continue;   // a work with no reliable online record stays plain text but is still listed
      frag.append(n.data.slice(i, m.index));
      const a = svg ? mk('a', { href: r.url }) : document.createElement('a');
      if (!svg) a.href = r.url;
      a.setAttribute('class', 'cite');
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      a.setAttribute('aria-label', translate('opensSource', { label: m[0] }));
      if (svg) mk('tspan', {}, a).textContent = m[0]; else a.textContent = m[0];
      frag.append(a);
      i = m.index + m[0].length;
      made++;
    }
    if (!made) continue;   // replacing the node unchanged would re-trigger the observer
    if (svg) linkStage();
    frag.append(n.data.slice(i));
    n.replaceWith(frag);
  }
}
// The stage is announced as one image; once it holds a link it becomes a group, so the link stays reachable.
function linkStage() { document.getElementById('stage').setAttribute('role', 'group'); }
// Links that have faded out (or sit in a faded group) must not take clicks or Tab focus.
function syncLinks() {
  for (const a of scene.querySelectorAll('a.cite')) {
    let o = 1;
    for (let e = a; e && e !== scene; e = e.parentNode) o *= +(e.getAttribute('opacity') ?? 1);
    const on = o > .5;
    if (on === a._on) continue;
    a._on = on;
    a.style.pointerEvents = on ? '' : 'none';
    if (on) { a.removeAttribute('tabindex'); a.removeAttribute('aria-hidden'); }
    else { a.setAttribute('tabindex', '-1'); a.setAttribute('aria-hidden', 'true'); }
  }
}
const ctx2d = document.createElement('canvas').getContext('2d');
function textW(str, size, italic = false) { ctx2d.font = `${italic ? 'italic ' : ''}${size}px ${MATH}`; return ctx2d.measureText(str).width; }
const VAR = /(?<![A-Za-z°])(?:(?!(?:of|in|is|to|or|at|on|by|as|an|if|it|be|no|so|up|we|my)(?![A-Za-z]))[a-z]{1,2}|(?!(?:If|In|It|Is|On|At|No|So|Or|An|As|To|By|Up)(?![A-Za-z]))[a-z]?[A-Z]{1,3}[a-z]?)(?![A-Za-z])/g;   // capitals: A, PV, nRT   // short lowercase runs are variables (a, x, ab), except short English words
const F = (n, d) => ({ f: [String(n), String(d)] });   // fraction
const R = (x, i) => ({ r: x && x.f ? x : String(x), i: i && String(i) });   // root of a number or of F(n, d); i = index, e.g. 3 for a cube root
const E = x => ({ sup: String(x) });                    // exponent, raised after the part before it
const TX = tex => ({ tex: String(tex) });               // LaTeX, drawn by MathJax; the book loads lib/mathjax.js right after this file
const $tex = tex => $m(TX(tex));                        // LaTeX inline in HTML text
// MathJax takes this object as its configuration when lib/mathjax.js loads after the engine.
window.MathJax ??= {
  startup: { typeset: false },                                   // no page scan; formulas are converted on demand
  svg: { fontCache: 'none', mtextInheritFont: true },            // self-contained paths; \text{} in the book's math font
  tex: { packages: { '[-]': ['noerrors', 'noundefined'] },       // a typo stops the page, like a misspelt mark
         formatError: (_, error) => { throw error; } },
  options: { enableMenu: false },
};
const TEX_CACHE = new Map();   // TeX source -> { graphic, viewBox }; seek() redraws every earlier beat
// A copy of the formula's MathJax drawing: units of 1/1000 em, baseline at y = 0; viewBox is [x, y, width, height].
function texGraphic(tex) {
  let drawn = TEX_CACHE.get(tex);
  if (!drawn) {
    if (!window.MathJax?.tex2svg) throw new Error(`TX('${tex}') needs lib/mathjax.js: load ../lib/mathjax.js right after engine.js`);
    if (!document.getElementById('MJX-SVG-styles')) document.head.append(MathJax.svgStylesheet());   // draws table rules and frames
    let svg;
    try { svg = MathJax.tex2svg(tex, { display: false, family: MATH }).querySelector('svg'); }   // family: \text{} is measured in the font it is drawn in
    catch (error) { throw new Error(`TX('${tex}'): ${error.message}`); }
    const graphic = mk('g');
    graphic.append(...svg.childNodes);
    drawn = { graphic, viewBox: svg.getAttribute('viewBox').split(' ').map(Number) };
    TEX_CACHE.set(tex, drawn);
  }
  return { graphic: drawn.graphic.cloneNode(true), viewBox: drawn.viewBox };
}
// The part of a TeX formula marked \class{name}{...}, ready for tw/fx on c_color and o.
// MathJax places the part with its own transform, so the tweens act on a group inside it.
function texPart(el, name) {
  const part = el.querySelector(`g.${CSS.escape(name)}`);
  if (!part) throw new Error(`texPart: no \\class{${name}}{…} in this formula`);
  if (!part._tweenGroup) {
    const group = mk('g');
    group.append(...part.childNodes);
    part.append(group);
    const color = part.closest('[color]')?.getAttribute('color');   // the formula's fill
    put(group, /^#[\da-f]{6}$/i.test(color) ? { c_color: color } : {});
    part._tweenGroup = group;
  }
  return part._tweenGroup;
}
const OV = x => ({ ov: String(x) });                    // digits under a repeat bar: ['0.', OV('3')] is 0.333…
// Math expression from parts: 'text' | F(n,d) | R(x) | E(exp) | OV(digits) | TX(tex). Baseline at y; anchor start/middle/end.
// _ascent and _descent are the TeX parts' height above and below the baseline (0 without TX).
function M(parent, parts, { x = 0, y = 0, size = 36, fill = COL.chalk, anchor = 'middle', o = 1, s = 1 } = {}) {
  const g = G(parent, { x, y, o, s });
  const inner = mk('g', {}, g);
  const lw = size * .05;
  const text = (str, tx, ty, sz) => {
    const t = mk('text', { x: tx, y: ty, 'font-size': sz, 'font-family': MATH, fill }, inner);
    t.style.whiteSpace = 'pre';
    let w = 0, last = 0;
    const run = (piece, italic) => {
      if (!piece) return;
      mk('tspan', italic ? { 'font-style': 'italic' } : {}, t).textContent = piece;
      w += textW(piece, sz, italic);
    };
    for (const m of str.matchAll(VAR)) { run(str.slice(last, m.index), false); run(m[0], true); last = m.index + m[0].length; }
    run(str.slice(last), false);
    return w;
  };
  const rule = (x1, x2, yy) => mk('path', { d: `M${x1} ${yy}H${x2}`, stroke: fill, 'stroke-width': lw, 'stroke-linecap': 'round' }, inner);
  let cx = 0, ascent = 0, descent = 0;
  for (const p of parts) {
    if (typeof p === 'string') cx += text(p, cx, 0, size);
    else if (p.tex !== undefined) {
      const { graphic, viewBox: [, top, w, h] } = texGraphic(p.tex), k = size / 1000;   // 1000 units = 1 em = size
      graphic.setAttribute('transform', `translate(${cx},0) scale(${k})`);
      graphic.setAttribute('color', fill);   // MathJax paints with currentColor
      inner.append(graphic);
      ascent = Math.max(ascent, -top * k);
      descent = Math.max(descent, (top + h) * k);
      cx += w * k;
    } else if (p.f) {
      const fs = size * .72, [n, d] = p.f, wn = textW(n, fs), wd = textW(d, fs);
      const w = Math.max(wn, wd) + size * .2, bar = -size * .3;
      text(n, cx + (w - wn) / 2, bar - size * .12, fs);
      text(d, cx + (w - wd) / 2, bar + size * .62, fs);
      rule(cx + size * .04, cx + w - size * .04, bar);
      cx += w + size * .04;
    } else if (p.r) {
      const fr = typeof p.r === 'object', mid = fr ? -size * .12 : -size * .3, bot = fr ? size * .45 : size * .06, top = fr ? -size * 1.12 : -size * .82;
      let x0 = cx + size * .04;
      if (p.i) { const iw = textW(p.i, size * .42); text(p.i, x0, mid - size * .14, size * .42); x0 += Math.max(0, iw - size * .12); }   // index in the radical's crook
      let w;
      if (fr) {   // a fraction under the radical, laid out like F()
        const fs = size * .72, [n, d] = p.r.f, wn = textW(n, fs), wd = textW(d, fs), bx = x0 + size * .56, bar = -size * .3;
        w = Math.max(wn, wd) + size * .2;
        text(n, bx + (w - wn) / 2, bar - size * .12, fs);
        text(d, bx + (w - wd) / 2, bar + size * .62, fs);
        mk('path', { d: `M${bx + size * .04} ${bar}H${bx + w - size * .04}`, stroke: fill, 'stroke-width': lw, 'stroke-linecap': 'round' }, inner);
      } else { w = textW(p.r, size); text(p.r, x0 + size * .56, 0, size); }
      mk('path', { d: `M${x0} ${mid}L${x0 + size * .1} ${mid - size * .06}L${x0 + size * .27} ${bot}L${x0 + size * .45} ${top}H${x0 + size * .56 + w + size * .06}`,
        fill: 'none', stroke: fill, 'stroke-width': lw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, inner);
      cx = x0 + size * .56 + w + size * .1;
    } else if (p.sup !== undefined) {
      cx += text(p.sup, cx + size * .03, -size * .45, size * .62) + size * .06;
    } else if (p.ov !== undefined) {
      const w = text(p.ov, cx, 0, size);
      rule(cx + size * .04, cx + w - size * .02, -size * .8);
      cx += w;
    }
  }
  const dx = anchor === 'middle' ? -cx / 2 : anchor === 'end' ? -cx : 0;
  inner.setAttribute('transform', `translate(${dx},0)`);
  g._w = cx;
  g._ascent = ascent;
  g._descent = descent;
  return g;
}
// Pill-shaped number token, centred on (x, y).
function chip(parent, parts, color, { x = 0, y = 0, o = 1, s = 1, size = 34 } = {}) {
  const g = G(parent, { x, y, o, s });
  const rect = mk('rect', {}, g);
  const m = M(g, parts, { size, y: size * .3 });
  const w = Math.max(m._w + 36, 64);
  let h = size * (parts.some(p => p.f) ? 1.75 : 1.45);
  if (m._ascent) {   // a TeX formula: centre it and grow the pill to fit
    const above = Math.max(size * 1.05, m._ascent), below = Math.max(size * .45, m._descent);
    put(m, { y: (above - below) / 2 });
    h = Math.max(h, m._ascent + m._descent + size * .4);
  }
  for (const [k, v] of Object.entries({ x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: COL.board, stroke: color, 'stroke-width': 2.5 })) rect.setAttribute(k, v);
  g._rect = rect;
  return g;
}
// A row of math tokens laid out left to right. Items: string | parts array | { t, fill }.
// Each token is centred on its own x, so it can move alone (swaps, sliding parentheses). Spacing comes from the strings.
function tokens(parent, items, { x = 0, y = 0, size = 44, fill = COL.chalk, anchor = 'start', o = 1 } = {}) {
  const els = items.map(it => {
    const spec = it && it.t !== undefined ? it : { t: it };
    return M(parent, [].concat(spec.t), { size, fill: spec.fill || fill, o });
  });
  return layRow(els, { x, y, size, anchor }, e => put(e, { x: e._px, y }));
}
// Place a row's tokens side by side. Each token keeps its planned centre in _px, so later steps
// can be planned before earlier tweens have run.
function layRow(els, { x, y, size, anchor }, move) {
  const total = els.reduce((a, e) => a + e._w, 0);
  let cx = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;
  for (const e of els) { e._px = cx + e._w / 2; move(e); cx += e._w; }
  return Object.assign(els, { w: total, x, y, size, anchor });
}
// One simplification step: box tokens i..j, shrink them into a single result token, then close the gap.
// Returns the new row. live = true runs on the question clock (inside ask) instead of the lesson clock.
function collapse(row, i, j, parts, t0, { color = COL.task, fill = COL.chalk, live = false } = {}) {
  const run = live ? fx : tw, p = row[0].parentNode, { size, y } = row;
  const left = row[i]._px - row[i]._w / 2, right = row[j]._px + row[j]._w / 2;
  let above = size * .95, height = size * 1.3;
  const tall = row.slice(i, j + 1).filter(e => e._ascent);   // TeX tokens may reach higher and lower than text
  if (tall.length) {
    above = Math.max(above, ...tall.map(e => e._ascent + 8));
    height = above + Math.max(size * .35, ...tall.map(e => e._descent + 8));
  }
  const box = put(mk('rect', { rx: 10, fill: 'none', stroke: color, 'stroke-width': 3 }, p),
    { o: 0, a_x: left - 8, a_y: y - above, a_width: right - left + 16, a_height: height });
  run(box, { o: 1 }, t0, .3);
  run(box, { o: 0 }, t0 + 1.2, .3);
  const res = M(p, parts, { size, fill, o: 0, x: (left + right) / 2, y });
  for (let k = i; k <= j; k++) run(row[k], { o: 0, s: .6 }, t0 + .8, .35);
  run(res, { o: 1 }, t0 + .95, .35);
  const next = [...row.slice(0, i), res, ...row.slice(j + 1)];
  return layRow(next, row, e => run(e, { x: e._px }, t0 + 1.3, .5));
}
// The maths helpers (number lines, tiles, fractions, planes, the number map, sorter) are in math.js.
// Inline math for HTML text.
function mathEl(parts, size = 22) {
  const svg = mk('svg', { class: 'm', 'font-weight': 400 });   // widths are measured at normal weight, so a bold prompt must not thicken the math
  const m = M(svg, parts, { size, anchor: 'start', fill: 'currentColor' });
  let top = size * 1.05, bottom = size * .45, h = size * 1.5;
  if (m._ascent) {   // a TeX formula may reach higher and lower than text
    top = Math.max(top, m._ascent + size * .1);
    bottom = Math.max(bottom, m._descent + size * .1);
    h = top + bottom;
  }
  svg.setAttribute('viewBox', `0 ${-top} ${m._w + 2} ${h}`);
  svg.setAttribute('width', m._w + 2);
  svg.setAttribute('height', h);
  svg.style.verticalAlign = `${-bottom}px`;  // line up the math baseline with the text baseline
  return svg;
}


/* ---------- timeline ---------- */
let TW = [];
const io = p => p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
const out = p => 1 - (1 - p) ** 3;
const back = p => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;
const lin = p => p;
function tw(e, to, t0, dur = .6, ease = io) { TW.push({ e, to, t0, dur, ease }); }
function prog(pf, t0, dur, ease = io) { TW.push({ pf, t0, dur, ease }); }
const show = (e, t0, dur = .5, ease) => tw(e, { o: 1 }, t0, dur, ease);
const hide = (e, t0, dur = .5, ease) => tw(e, { o: 0 }, t0, dur, ease);
const draw = (e, t0, dur = .9, ease) => tw(e, { d: 1 }, t0, dur, ease);
const pop = (e, t0) => tw(e, { s: 1, o: 1 }, t0, .45, back);
function pulse(e, t0, k = 1.7) { tw(e, { s: k }, t0, .22, out); tw(e, { s: 1 }, t0 + .22, .4); }
function stream(t, str, t0, dur) { prog(q => { t.textContent = str.slice(0, Math.round(q * str.length)); }, t0, dur, lin); }
function mix(a, b, q) {
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * q).toString(16).padStart(2, '0')).join('');
}
// A colour or attribute tween with no starting value in the state starts from the element's attribute.
const fromAttr = (e, k) => k.startsWith('c_') ? e.getAttribute(k.slice(2)) : k.startsWith('a_') ? parseFloat(e.getAttribute(k.slice(2))) : undefined;
function evalTo(t, list = TW) {
  for (const w of list) {
    if (w.done || t < w.t0) continue;
    if (!w.go) { w.go = 1; if (w.e) { const s = st(w.e); w.from = {}; for (const k in w.to) w.from[k] = s[k] ?? fromAttr(w.e, k); } }
    const p = w.dur ? Math.min(1, (t - w.t0) / w.dur) : 1, q = w.ease(p);
    if (w.e) {
      const s = st(w.e);
      for (const k in w.to) s[k] = k.startsWith('c_') ? mix(w.from[k], w.to[k], q) : w.from[k] + (w.to[k] - w.from[k]) * q;
      render(w.e);
    } else w.pf(q);
    if (p >= 1) w.done = 1;
  }
}

/* ---------- world clock and camera ---------- */
const soft = p => (1 - Math.cos(Math.PI * p)) / 2;   // gentle in-out, for camera moves
// Continuous motion: f(t) runs on every frame of the beat with t in seconds from its start (0..D).
// Keep f a pure function of t, so pause, seek and ?beat=N&t=S show the same frame. A beat holds its picture for HOLD s
// after its narration and last tween; with { tail: true } f keeps running through that hold (t up to the beat's end)
// instead of freezing at D, for motion that never stops, as in a film. A camera runs through the hold too when anything
// in its beat does (its tail is 'follow'), so a follow shot keeps up with a tailed subject. f also gets the run's end
// (for a tail, the beat's real end), so a move can land on it, as a whip at the end of a beat does. Under music that
// end is where the beat really leaves, up to HOLD early (P.back, see frameStep), so the move is still seen landing.
// A tail's own D does not lengthen the beat: it runs to the end whatever it is (so D + HOLD adds no second hold).
const clockRun = (f, D, { tail = false } = {}) => { const w = { t0: 0, dur: D, ease: lin, tail }; f(0, D); w.pf = q => f(q * w.dur, w.tail ? w.dur - P.back : w.dur); TW.push(w); };
// A camera looks at a world group through the stage (or a box, for split screen and picture-in-picture).
// The view {x, y, z, r} is the world point at the centre, the zoom (screen px per world px) and the roll in degrees.
// Moves are keyed on the beat clock: to(view, t0, dur, ease) blends each given key from its value at t0; a key may be a
// function of t (follow). Unspecified keys keep following the earlier moves. dur 0 is a hard cut.
let camN = 0;
function camera(p, D, { box, x = SW / 2, y = SH / 2, z, r = 0, bg = COL.board } = {}) {
  const [bx, by, bw, bh] = box || [0, 0, SW, SH];
  const el = G(p, { x: bx + bw / 2, y: by + bh / 2 });
  let hold = el;
  if (box) {
    const id = 'cam' + (++camN);
    mk('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: 18 }, mk('clipPath', { id }, mk('defs', {}, el)));
    hold = G(el); hold.setAttribute('clip-path', `url(#${id})`);
    mk('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, fill: bg }, hold);
  }
  const view = mk('g', {}, hold), world = G(view);
  if (box) mk('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: 18, fill: 'none', stroke: COL.faint, 'stroke-width': 2 }, el);
  const v0 = { x, y, z: z ?? (box ? Math.min(bw / SW, bh / SH) : 1), r };
  const ops = [], shakes = [], layers = [];
  const val = (v, t) => typeof v === 'function' ? v(t) : v;
  // The view at time t after the first n moves; each move remembers the view it starts from.
  function at(t, n = ops.length) {
    const s = { ...v0 };
    for (let i = 0; i < n && ops[i].t0 <= t; i++) {
      const o = ops[i], a = o.from || (o.from = at(o.t0, i));
      const q = o.dur ? o.ease(Math.min(1, (t - o.t0) / o.dur)) : 1, b = {};
      for (const k in o.v) b[k] = val(o.v[k], t);
      if ('z' in b) s.z = a.z * (b.z / a.z) ** q;   // even zoom speed
      // While zooming, x/y move so that one world point stays put on screen (when start and end allow it).
      const u = 'z' in b && Math.abs(b.z - a.z) > 1e-6 * a.z ? (1 / s.z - 1 / a.z) / (1 / b.z - 1 / a.z) : q;
      for (const k of ['x', 'y']) if (k in b) s[k] = a[k] + (b[k] - a[k]) * u;
      if ('r' in b) s.r = a.r + (b.r - a.r) * q;
    }
    return s;
  }
  function apply(t) {
    const s = at(t);
    let sx = 0, sy = 0;
    for (const k of shakes) if (t > k.t0 && t < k.t0 + k.dur) {
      const e = k.amp * Math.min(1, (t - k.t0) / .3, (k.t0 + k.dur - t) / .3), w = 2 * Math.PI * k.hz * t;
      sx += e * (Math.sin(w) + .5 * Math.sin(2.3 * w + 1)) / 1.5; sy += e * (Math.sin(1.7 * w + 2) + .5 * Math.sin(3.1 * w)) / 1.5;
    }
    const tf = `translate(${sx} ${sy}) rotate(${-s.r}) scale(${s.z}) translate(${-s.x} ${-s.y})`;
    if (tf !== view._tf) view.setAttribute('transform', view._tf = tf);
    const dx = s.x - v0.x, dy = s.y - v0.y;
    for (const L of layers) put(L.g, { x: L.wrap ? dx - ((L.k * dx) % L.wrap + L.wrap) % L.wrap : (1 - L.k) * dx, y: (1 - L.k) * dy });
  }
  const cam = { el, world, at,
    to(v, t0, dur = 1, ease = soft) { ops.push({ v, t0, dur, ease }); ops.sort((a, b) => a.t0 - b.t0); ops.forEach(o => delete o.from); return cam; },
    cut: (v, t0) => cam.to(v, t0, 0),
    shake(amp, t0, dur, hz = 7) { shakes.push({ amp, t0, dur, hz }); return cam; },
    // Parallax layer: k < 1 is far (moves slower than the camera), k > 1 near. With wrap = W the layer's content
    // repeats every W world px: draw one period plus the widest view, and the layer never runs out.
    layer(k = 1, wrap) { const g = G(world); layers.push({ g, k, wrap }); return g; },
    // Screen position of a world point at time t (k = 1 layers, no shake): for labels that track an object.
    screen(wx, wy, t) {
      const s = at(t), a = -s.r * Math.PI / 180, ux = (wx - s.x) * s.z, uy = (wy - s.y) * s.z;
      return [bx + bw / 2 + ux * Math.cos(a) - uy * Math.sin(a), by + bh / 2 + ux * Math.sin(a) + uy * Math.cos(a)];
    },
    // Put a screen-space label (text, anchor middle, outside the camera) over world point (wx, wy) at time t, kept
    // inside the frame or box by margin m; it fades out once the point itself leaves. Fade it in with a wrapper group.
    track(el, wx, wy, t, m = 24) {
      const [sx, sy] = cam.screen(wx, wy, t), str = el.textContent;
      if (el._tw?.[0] !== str) el._tw = [str, el.getComputedTextLength() / 2];
      const h = el._tw[1], away = Math.max(bx - sx, sx - bx - bw, 0);
      put(el, { x: Math.min(bx + bw - m - h, Math.max(bx + m + h, sx)), y: sy, o: Math.max(0, 1 - away / 80) });
    },
  };
  clockRun(apply, D, { tail: 'follow' });
  return cam;
}

/* ---------- scene ---------- */
const scene = document.getElementById('scene');
const S = {};
const AXIS = { o: SW / 2, u: 120 };             // number line: x of 0, pixels per unit; a chapter may change it
const X = v => AXIS.o + AXIS.u * v, Y0 = 610;
const num = v => (v < 0 ? '−' : '') + String(Math.abs(v)).replace('.', DECIMAL_SIGN);
function reset() {
  scene.replaceChildren();
  for (const k in S) delete S[k];
  Object.assign(S, { dots: {}, tick: {}, rows: [], chips: [], samples: [], list: G(scene), line: G(scene), venn: G(scene) });
}
function tick(v) {
  const g = G(S.line, { o: 0 });
  path(g, `M${X(v)} ${Y0 - 11}V${Y0 + 11}`, { stroke: COL.dim, 'stroke-width': 2.5 });
  T(g, num(v), { x: X(v), y: Y0 + 50, size: 30, fill: COL.dim, font: MATH, anchor: 'middle' });
  return (S.tick[v] = g);
}
function dot(key, v, r = 9, name = v) {
  const g = G(S.line, { x: X(v), y: Y0, s: 0, o: 0 });
  mk('circle', { r, fill: COL[key], stroke: COL.board, 'stroke-width': 2 }, g);
  return (S.dots[name] = g);
}
const arrow = (x, dir) => `M${x - 15 * dir} ${Y0 - 10}L${x} ${Y0}L${x - 15 * dir} ${Y0 + 10}`;
function panel(t0) {
  if (t0 < .5) S.cleared = true;   // the old panel fades, or this is the first panel after the title
  const old = S.panel;
  if (old && t0 < .5) retire(old);
  else if (old) {   // a panel change later in the beat stays on the beat clock
    hide(old, t0, .4);
    prog(q => { if (q === 1) old.style.display = 'none'; }, t0 + .4, 0, lin);
  }
  return (S.panel = G(scene));
}
// Take a beat's old picture away on wall time: a 150 ms fade, then out of rendering. On the beat clock the fade would
// wait for the new clip's audio to start (a few hundred ms in Firefox) with the old, frozen scene still showing.
// While seeking, the pictures passed on the way were never seen: they go at once.
// It then leaves the page: a long film otherwise keeps every earlier beat's picture (a documentary's maps: megabytes).
function retire(e) {
  if (seeking) { e.remove(); return; }
  e.style.transition = 'opacity .15s linear';
  e.style.opacity = '0';
  setTimeout(() => e.remove(), 160);
}
function header(p, str, t0, x = 1000, y = 170) {
  const h = T(p, str, { x, y, size: 30, fill: COL.dim, weight: 600, o: 0 });
  show(h, t0);
  return h;
}

/* ---------- question effects: run on wall time, independent of the lesson clock ---------- */
let FX = [], clock = 0;
function fx(e, to, delay = 0, dur = .5, ease = io) { FX.push({ e, to, t0: clock + delay, dur, ease }); }
function fxp(pf, delay, dur, ease = io) { FX.push({ pf, t0: clock + delay, dur, ease }); }
function finishFx() { FX.sort((a, b) => a.t0 - b.t0); evalTo(Infinity, FX); FX = []; }
const pulseFx = (e, k = 1.8) => { if (!e) return; fx(e, { s: k }, 0, .22, out); fx(e, { s: 1 }, .22, .45); };
const shakeFx = e => { if (!e) return; const x0 = st(e).x; fxp(q => put(e, { x: x0 + Math.sin(q * Math.PI * 6) * (1 - q) * 12 }), 0, .55, lin); };
function floatText(str, x, y, colr) {
  const t = T(S.q || qlayer(), str, { x, y: y + 14, size: 24, fill: colr, anchor: 'middle', weight: 600, o: 0 });
  fx(t, { o: 1, y }, 0, .5, out);
}

/* ---------- shared answer columns ---------- */
const TF = [['t', translate('trueLabel'), null, 'T'], ['f', translate('falseLabel'), null, 'F']];
function finishCard() {
  const c = card(SCREEN, 'fin');
  const sum = pre => Object.entries(SCORE).filter(([k]) => k.startsWith(pre)).reduce((a, [, v]) => [a[0] + v.right, a[1] + v.total], [0, 0]);
  const line = (name, [r, t]) => h('p', 'fb', t ? translate('firstTryScore', { name, r, t }) : translate('notAttempted', { name }));
  progress(p => { p.done = [...new Set([...(p.done || []), CHAPTER.number])]; });
  const home = h('a', 'btn quiet', translate('allChapters'));
  home.href = $('bHome').href;
  const again = h('button', 'btn' + (CHAPTER.next ? ' quiet' : ' go'), [translate('watchAgain'), kbd(CHAPTER.next ? 'R' : 'Enter')]);
  again.onclick = restart;
  const next = CHAPTER.next && h('button', 'btn go', [translate('nextChapter'), kbd('Enter')]);
  if (next) next.onclick = () => { location.href = CHAPTER.next; };
  P.keys = e => e.key === 'Enter' ? ((next ? next.onclick() : restart()), true)
    : isShortcut(e, 'r') ? (restart(), true) : false;
  const guide = mascotEl(240);
  c.append(h('div', 'finwrap', [guide, h('p', 'kicker', translate('chapterComplete', { n: CHAPTER.label ?? CHAPTER.number })), h('p', 'prompt', CHAPTER.title),
    line(translate('quickChecks'), sum('c-')), line(translate('chapterPractice'), sum('p-')), h('div', 'acts', next ? [home, again, next] : [home, again]), sources()].filter(Boolean)));
  setTimeout(() => mood(guide, 'happy'), 400);
}

/* ---------- in-picture cards ---------- */
const $ = id => document.getElementById(id);
// The volume control (volume.js, volume.css) lives in its own files next to this one, the same in every book.
document.head.append(Object.assign(document.createElement('script'), { src: new URL('volume.js', document.currentScript.src) }));
const kbd = s => h('kbd', '', s);
// The chapter's sources: every key passed to cite() plus CHAPTER.refs, as full references that link to the source.
function sources() {
  for (const m of citeObs.takeRecords()) for (const n of m.addedNodes) autoCite(n);   // link text added just now (a seek to the end)
  const keys = [...new Set([...(CHAPTER.refs || []), ...CITED])].filter(k => typeof REFS === 'object' && REFS?.[k]);
  if (!keys.length) return null;
  const items = keys.map(k => REFS[k]).sort((a, b) => a.ref.localeCompare(b.ref)).map(r => {
    if (!r.url) return h('li', '', r.ref);
    const a = h('a', '', r.url.replace(/^https?:\/\//, ''));
    Object.assign(a, { href: r.url, target: '_blank', rel: 'noopener' });
    return h('li', '', [r.ref + ' ', a]);
  });
  return h('section', 'srcs', [h('h2', '', translate('sources')), h('ol', '', items)]);
}
const uiW = (str, size) => { ctx2d.font = `600 ${size}px ${UI}`; return ctx2d.measureText(str).width; };
const SCORE = {};                                          // question id -> first-attempt {right, total}

function h(tag, cls, kids = []) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of [].concat(kids)) e.append(k);
  return e;
}
// Rich text: strings, DOM nodes, or $m(...) inline math.
function rich(parts, size = 28) {
  const s = document.createElement('span');
  for (const p of [].concat(parts)) s.append(typeof p === 'string' || p instanceof Node ? p : mathEl(p.m, size));
  return s;
}
// A card at pos; a band card keeps its bottom on the stage: when its content grows (a long question, feedback),
// it moves up rather than running under the player bar.
function card(pos, cls) {
  const c = h('div', `card ${pos.cls} ${cls}`);
  Object.assign(c.style, { left: pos.x + 'px', top: pos.y + 'px', width: pos.w + 'px' });
  if (pos.maxH) c.style.maxHeight = pos.maxH + 'px';
  $('ui').append(c);
  if (pos.cls === 'band') {
    const fit = () => { c.style.top = Math.max(16, Math.min(pos.y, SH - 16 - c.offsetHeight)) + 'px'; };
    const ro = new ResizeObserver(fit);
    ro.observe(c); fit();
    P.cleanup.push(() => ro.disconnect());
  }
  return c;
}
// The guide: an infinity sign whose two loops are its eyes. Drawn in SVG so it can blink, hop and wobble.
function lemniscate(cx, cy, a, k) {
  let d = '';
  for (let i = 0; i <= 96; i++) {
    const t = i / 96 * 2 * Math.PI, sn = Math.sin(t), q = 1 + sn * sn;
    d += (i ? 'L' : 'M') + (cx + a * Math.cos(t) / q).toFixed(1) + ' ' + (cy + k * a * sn * Math.cos(t) / q).toFixed(1);
  }
  return d + 'Z';
}
function mascotEl(size = 100) {
  const svg = mk('svg', { class: 'mascot', viewBox: '0 0 120 84', width: size, height: size * .7, 'aria-hidden': 'true' });
  const body = mk('g', { class: 'mbody' }, svg);
  const line = { fill: 'none', stroke: COL.chalk, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  mk('path', { d: lemniscate(60, 40, 52, 1.5), ...line, 'stroke-width': 6 }, body);
  const eyes = mk('g', { class: 'eyes' }, body);
  for (const x of [33, 87]) {
    mk('circle', { class: 'pupil', cx: x, cy: 40, r: 6.5, fill: COL.chalk }, eyes);
    mk('path', { class: 'joy', d: `M${x - 7} 43Q${x} 32 ${x + 7} 43`, ...line, 'stroke-width': 4 }, body);
  }
  mk('path', { class: 'smile', d: 'M55 62Q60 67 65 62', ...line, 'stroke-width': 3.5 }, body);
  mk('path', { class: 'flat', d: 'M55 64H65', ...line, 'stroke-width': 3.5 }, body);
  return svg;
}
function mood(el, m) {
  el.classList.remove('happy', 'oops');
  void el.getBoundingClientRect();  // restart the CSS animation
  if (m) el.classList.add(m);
}
// A sequence of questions in one card. Each question: { id, prompt, build(body, api) -> { check?, reveal, lock? } }.
function quiz(pos, qs, done, label = translate('quickCheck')) {
  const c = card(pos, 'quiz');
  let k = 0;
  const show = () => {
    const q = qs[k];
    let first = true, resolved = false;
    const fb = h('div', 'fb'), body = h('div', 'body'), acts = h('div', 'acts');
    fb.setAttribute('role', 'status');   // screen readers announce right or wrong
    const bCheck = h('button', 'btn', [translate('check'), kbd('Enter')]), bShow = h('button', 'btn quiet', [translate('showAnswer'), kbd('S')]);
    const bNext = h('button', 'btn go', [k < qs.length - 1 ? translate('nextQuestion') : translate('continue'), kbd('Enter')]);
    bShow.hidden = bNext.hidden = true;
    const guide = pos.cls === 'band' || pos.cls === 'side' ? mascotEl(pos.cls === 'band' ? 108 : 70) : null;
    const say = (cls, parts) => { fb.className = 'fb ' + cls; fb.replaceChildren(rich(parts, 24)); fb.style.animation = 'none'; void fb.offsetWidth; fb.style.animation = ''; };
    const resolve = () => {
      resolved = true;
      bCheck.hidden = bShow.hidden = true;
      ctl.lock?.();
      bNext.hidden = false;
      bNext.focus({ preventScroll: true });
    };
    const api = {
      grade(ok, msg, score) {
        if (resolved) return;
        if (first) { if (!Object.hasOwn(SCORE, q.id)) SCORE[q.id] = score || { right: +ok, total: 1 }; first = false; }
        say(ok ? 'ok' : 'no', [ok ? translate('correct') : translate('notQuite'), ...[].concat(msg || [])]);
        if (guide) {
          mood(guide, ok ? 'happy' : 'oops');
          if (!ok) setTimeout(() => { if (guide.classList.contains('oops')) mood(guide, null); }, 1600);
        }
        if (ok) resolve(); else bShow.hidden = false;
      },
    };
    const ctl = q.build(body, api);
    if (ctl.check) { bCheck.onclick = () => ctl.check(); acts.append(bCheck); }
    acts.append(bShow, bNext);
    bShow.onclick = () => { say('', [translate('answerPrefix'), ...[].concat(ctl.reveal())]); resolve(); };
    bNext.onclick = () => { if (k < qs.length - 1) { k++; show(); } else done(); };
    P.keys = e => {
      if (e.key === 'Enter' && resolved) { bNext.click(); return true; }
      if (!resolved && ctl.key?.(e)) return true;
      if (e.key === 'Enter' && !resolved && ctl.check) { bCheck.click(); return true; }
      if (isShortcut(e, 's') && !bShow.hidden) { bShow.click(); return true; }
      return false;
    };
    const kick = label + (qs.length > 1 ? '  ·  ' + translate('countOf', { k: k + 1, n: qs.length }) : '');
    const head = h('div', 'head', [h('p', 'kicker', kick), h('p', 'prompt', [rich(q.prompt, pos.cls.startsWith('screen') ? 38 : 28)])]);   // match the prompt's type size
    if (ctl.hint) head.append(h('p', 'keys', [translate('keysPrefix'), ...ctl.hint]));
    c.replaceChildren(...(guide ? [guide] : []), head, fb, body, acts);
  };
  show();
}
function qlayer() {
  S.q?.remove();
  S.q = G(scene);
  S.q.classList.add('qlayer');
  return S.q;
}
const keyAct = (el, fn) => el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });

/* ---------- question builders ---------- */
// Single answer from buttons; each wrong option has its own explanation.
const choice = (opts, right, yes, no, onRight) => (body, api) => {
  const row = h('div', 'opts');
  const bs = opts.map((o, i) => {
    const b = h('button', 'opt', [kbd(String(i + 1)), rich(o, 32)]);
    b.onclick = () => {
      if (i === right) { b.classList.add('good'); onRight?.(); api.grade(true, yes); }
      else { b.classList.add('bad'); b.disabled = true; api.grade(false, no[i]); }
    };
    row.append(b);
    return b;
  });
  body.append(row);
  return {
    reveal() { bs[right].classList.add('good'); onRight?.(); return yes; },
    lock() { bs.forEach(b => { b.disabled = true; }); },
    key(e) { const b = bs[+e.key - 1]; if (!b || b.disabled) return false; b.click(); return true; },
  };
};
// A choice question from the chapter's item bank: ITEMS from ./items.js, built by scripts/items.py from the
// mcq-item-writer JSON. mcq('ID', onRight?) returns a quiz entry, so quiz(TOPR, [mcq('MB-03-01')], done) asks it.
function mcq(id, onRight) {
  const it = (typeof ITEMS === 'object' && ITEMS) ? ITEMS[id] : null;
  if (!it) throw new Error(`mcq: no item "${id}" in items.js`);
  return { id, prompt: it.prompt, build: choice(it.opts, it.right, it.why, it.no, onRight) };
}
// The shared body of the stage tap questions: each target ring is a focusable button that answers on click or Enter,
// and ← / → move the focus between them. targets: [{ g, label, ok, wrong }], wrong() shakes and returns the explanation.
const stageTap = (api, targets, show, yes, onRight, hint) => {
  let locked = false, cur = -1;
  const gs = targets.map(({ g, label, ok, wrong }) => {
    g.classList.add('hit');
    g.setAttribute('tabindex', 0);
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', label);
    const act = () => {
      if (locked) return;
      if (ok) { g.classList.add('good'); onRight?.(); api.grade(true, yes); }
      else { g.classList.add('bad'); api.grade(false, wrong()); }
    };
    g.addEventListener('click', act);
    keyAct(g, act);
    return g;
  });
  return {
    reveal() { gs[show].classList.add('good'); onRight?.(); return yes; },
    lock() { locked = true; },
    hint,
    key(e) {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d || locked) return false;
      cur = cur < 0 ? (d > 0 ? 0 : gs.length - 1) : (cur + d + gs.length) % gs.length;
      gs[cur].focus();
      return true;
    },
  };
};
// Tap a point on the stage number line.
const tap = (values, right, yes, no, onRight) => (body, api) => {
  const L = qlayer();
  const targets = values.map(v => {
    const g = G(L, { x: X(v), y: Y0 });
    mk('circle', { r: 30, class: 'ring' }, g);
    return { g, label: translate('pointLabel', { v: num(v) }), ok: v === right, wrong: () => { shakeFx(S.dots[v]); return no(v); } };
  });
  return stageTap(api, targets, values.lastIndexOf(right), yes, onRight,
    [kbd('←'), kbd('→'), translate('hintMoveAlongLine'), kbd('Enter'), translate('hintChoose')]);
};
// Tap one token of a stage token row, e.g. the operation to do first. idx: tappable token indexes.
const tapEls = (row, idx, right, yes, no, onRight) => (body, api) => {
  const L = qlayer();
  const targets = idx.map(i => {
    const e = row[i], w = e._w + 18, g = G(L, { x: e._px, y: row.y });
    mk('rect', { class: 'ring', x: -w / 2, y: -row.size * .95, width: w, height: row.size * 1.3, rx: 12 }, g);
    return { g, label: e.textContent.trim(), ok: i === right, wrong: () => { shakeFx(e); return no(i); } };
  });
  return stageTap(api, targets, idx.indexOf(right), yes, onRight,
    [kbd('←'), kbd('→'), translate('hintMove'), kbd('Enter'), translate('hintChoose')]);
};
// Click one of several stage objects (table cells, bars, small graphs). items: [{ el, box: [x, y, w, h], label }].
const pickEls = (items, right, yes, no, onRight) => (body, api) => {
  const L = qlayer();
  const targets = items.map((it, i) => {
    const [x, y, w, hh] = it.box, g = G(L);
    mk('rect', { class: 'ring', x, y, width: w, height: hh, rx: 12 }, g);
    return { g, label: it.label, ok: i === right, wrong: () => { shakeFx(it.el); return no(i); } };
  });
  return stageTap(api, targets, right, yes, onRight,
    [kbd('←'), kbd('→'), translate('hintMove'), kbd('Enter'), translate('hintChooseOrClick')]);
};
// Rows of toggles. items: { parts, ans: [keys], why }. parts are math parts (strings, F, R) unless text: true,
// where they are rich text (strings and $m(...)). cols: [[key, label, colour?, shortcut?]]. multi: several per row.
const grid = (items, cols, { multi = true, text = false } = {}) => (body, api) => {
  const wrap = h('div', 'grid' + (text ? ' text' : ''));
  const hot = cols.map((c, j) => c[3] || String(j + 1));
  let cur = 0, locked = false;
  const rows = items.map((it, ri) => {
    const opts = h('div', 'opts'), mark = h('div', 'mark'), why = h('div', 'why');
    const bs = cols.map(([key, lab, colr], j) => {
      const b = h('button', 'opt', [kbd(hot[j]), lab]);
      if (colr) b.style.setProperty('--c', colr);
      b.setAttribute('aria-pressed', 'false');
      b.onclick = () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        if (!multi) bs.forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', String(on));
      };
      opts.append(b);
      return b;
    });
    const el = h('div', 'row', [h('div', 'num', [text ? rich(it.parts, 26) : mathEl(it.parts, 32)]), opts, mark, why]);
    el.addEventListener('click', () => { cur = ri; showCur(); });
    wrap.append(el);
    const picked = () => cols.filter((c, i) => bs[i].getAttribute('aria-pressed') === 'true').map(c => c[0]);
    return { it, bs, mark, why, picked, el, played: false };
  });
  const single = rows.length === 1;
  const showCur = () => rows.forEach((r, i) => {
    const on = !single && !locked && i === cur;
    r.el.classList.toggle('cur', on);
    if (on && r.el.isConnected) r.el.scrollIntoView({ block: 'nearest' });   // a long practice list scrolls
  });
  showCur();
  body.append(wrap);
  const judge = r => {
    const p = r.picked(), ok = p.length === r.it.ans.length && r.it.ans.every(k => p.includes(k));
    r.mark.className = 'mark ' + (ok ? 'good' : 'bad');
    r.mark.textContent = ok ? '✓' : '✗';
    r.why.replaceChildren(ok || single ? '' : rich(r.it.why, 20));
    if (ok && !r.played) { r.played = true; r.it.fx?.(); }
    return ok;
  };
  return {
    check() {
      const right = rows.filter(judge).length;
      const all = right === rows.length;
      api.grade(all, single ? rows[0].it.why : all ? [] : [translate('rowsRight', { r: right, n: rows.length })], { right, total: rows.length });
    },
    reveal() {
      for (const r of rows) {
        r.bs.forEach((b, i) => b.setAttribute('aria-pressed', String(r.it.ans.includes(cols[i][0]))));
        judge(r);
        if (!single) r.why.replaceChildren(rich(r.it.why, 20));
      }
      return single ? rows[0].it.why : translate('choicesShown');
    },
    lock() { locked = true; showCur(); rows.forEach(r => r.bs.forEach(b => { b.disabled = true; })); },
    hint: [...(single ? [] : [kbd('↑'), kbd('↓'), translate('hintRow')]), ...(/\d/.test(hot[0]) ? [kbd(hot[0]), '–', kbd(hot[hot.length - 1])] : hot.map(kbd)), translate('hintChoose')],
    key(e) {
      if (locked) return false;
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !single) {
        cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
        showCur();
        return true;
      }
      const j = hot.findIndex(x => isShortcut(e, x));
      if (j < 0) return false;
      rows[cur].bs[j].click();
      if (!multi && cur < rows.length - 1) { cur++; showCur(); }
      return true;
    },
  };
};
// Exact value of a typed answer: integer, decimal, fraction a/b or mixed number "w a/b"; returns [num, den] or null.
// Accepts −, – or - as the sign, a currency sign before or after ($5, -$5, 5 €), thousands grouped by spaces (any kind)
// or, where the decimal sign is a point, by commas, and a decimal comma when DECIMAL_SIGN is ','. Never evaluates the text as code.
function rat(str) {
  let t = String(str).trim().replace(/^[−–]/, '-').replace(/\s+/g, ' ').replace(/^(-?) ?\p{Sc} ?|(?<=\d) ?\p{Sc}$/gu, '$1');
  const group = DECIMAL_SIGN === ',' ? ' ' : '[, ]';   // one kind of separator throughout: 1,000 000 is not a number
  t = t.replace(new RegExp(`^(-?\\d{1,3})(${group})(\\d{3}(?:\\2\\d{3})*)(?=$|[.,])`), (_, head, sep, rest) => head + rest.split(sep).join(''));
  if (DECIMAL_SIGN === ',') t = t.replace(/^(-?\d+),(\d+)$/, '$1.$2');   // 0,75 where the decimal sign is a comma
  let m = t.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (m) { const d = 10 ** (m[3] || '').length, n = (m[1] ? -1 : 1) * (Number(m[2]) * d + Number(m[3] || 0)); return Number.isSafeInteger(n) && Number.isSafeInteger(d) ? [n, d] : null; }
  m = t.match(/^(-?)(?:(\d+) )?(\d+) ?\/ ?(\d+)$/);
  if (m && Number(m[4]) > 0) { const d = Number(m[4]), n = (m[1] ? -1 : 1) * (Number(m[2] || 0) * d + Number(m[3])); return Number.isSafeInteger(n) && Number.isSafeInteger(d) ? [n, d] : null; }
  return null;
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lowest = ([n, d]) => gcd(n, d) === 1;
// Fill-in boxes inside math. rows: [{ parts: [math parts and { box: '21' }], why, hint?, fx? }].
// test(values), when given, judges the whole row from the typed numbers (e.g. a factor pair in either order); the boxes' answers are still what Show answer fills in.
// Answers are exact numbers: "−5", "-5", "0.5", "3/4" and "2 1/4" all work, and equal values match ("6/8" = "3/4")
// unless the box has lowest: true. hint is shown after a wrong try, why after a right one.
const blanks = rowsIn => (body, api) => {
  const all = [];
  const rows = rowsIn.map(it => {
    const line = h('div', 'bline'), mark = h('span', 'mark'), why = h('div', 'why');
    let run = [];
    const flush = () => { if (run.length) line.append(mathEl(run, 34)); run = []; };
    const boxes = [];
    for (const p of it.parts) {
      if (p && p.box !== undefined) {
        flush();
        const b = h('input', 'box');
        Object.assign(b, { type: 'text', inputMode: 'decimal', autocomplete: 'off', spellcheck: false });
        b.setAttribute('aria-label', translate('answerBox'));
        b.dataset.ans = p.box;
        if (p.lowest) b.dataset.lowest = '1';
        b.style.width = `${Math.max(2, String(p.box).length) + 2}ch`;
        line.append(b);
        boxes.push(b);
        all.push(b);
      } else run.push(p);
    }
    flush();
    line.append(mark);
    body.append(h('div', 'brow', [line, why]));
    return { it, boxes, mark, why, played: false };
  });
  body.classList.add('blanks');
  const single = rows.length === 1;
  const judge = r => {
    let ok = true;
    if (r.it.test) {               // the row is judged as a whole, e.g. two factors in either order
      const vals = r.boxes.map(b => rat(b.value));
      ok = vals.every(Boolean) && !!r.it.test(vals.map(([n, d]) => n / d));
      r.boxes.forEach(b => { b.classList.toggle('good', ok); b.classList.toggle('bad', !ok); });
    } else for (const b of r.boxes) {
      const want = rat(b.dataset.ans), got = rat(b.value);
      const good = !!got && !!want && BigInt(got[0]) * BigInt(want[1]) === BigInt(want[0]) * BigInt(got[1]) && (!b.dataset.lowest || lowest(got));
      b.classList.toggle('good', good);
      b.classList.toggle('bad', !good);
      ok = ok && good;
    }
    r.mark.className = 'mark ' + (ok ? 'good' : 'bad');
    r.mark.textContent = ok ? '✓' : '✗';
    r.why.replaceChildren(ok || single ? '' : rich(r.it.hint ?? r.it.why, 20));
    if (ok && !r.played) { r.played = true; r.it.fx?.(); }
    return ok;
  };
  // not on the frame ?beat=N opens before the lesson has started: there Space starts it rather than typing a space
  requestAnimationFrame(() => { if (P.started) all[0]?.focus({ preventScroll: true }); });
  return {
    check() {
      const right = rows.filter(judge).length, done = right === rows.length;
      const msg = single ? (done ? rows[0].it.why : rows[0].it.hint ?? rows[0].it.why)
        : done ? [] : [translate('rowsRight', { r: right, n: rows.length })];
      api.grade(done, msg, { right, total: rows.length });
    },
    reveal() {
      for (const r of rows) {
        r.boxes.forEach(b => { b.value = b.dataset.ans.replace('-', '−'); });   // shown exactly as authored
        judge(r);
        if (!single) r.why.replaceChildren(rich(r.it.why, 20));
      }
      return single ? rows[0].it.why : translate('numbersShown');
    },
    lock() { all.forEach(b => { b.disabled = true; }); },
    hint: [translate(all.some(b => b.dataset.ans.includes('/')) ? 'hintTypeFraction' : all.some(b => /[.,]/.test(b.dataset.ans)) ? 'hintTypeDecimal' : 'hintTypeNumber'),
      kbd('Tab'), translate('hintNextBox'), kbd('Enter'), translate('hintCheck'), kbd('Esc'), translate('hintLeaveBox')],
  };
};

/* ---------- sound effects and music ----------
   sfx(beat, at, name, vol, bed): play audio/sfx/<name>.mp3 when the clock of beat `beat` passes `at` in normal playback
   (a seek past it fires nothing), at half volume (vol 2 is full). A long ambience is listed in SFX_BED with its length
   (SFX_BED.birds = 10): a seek into it joins it part-way. A beat function runs again at every seek; an effect is listed once.
   An effect still loading when it is due plays late, joined part-way, for up to a second (or its bed).
   music(file, beats, gain, fade): a looping track under the listed beats (all of them by default). Its place is the
   length of its earlier beats plus the clock. It ducks to 30 % under the whole beat, or 70 % in the music-only lead-in
   (`pre`) of the beats in window.MUSIC_UP_IN_PRE (true: every beat). It crossfades over `fade` s (0: a cut), and
   window.MUSIC_OFF = { beat: t => true } fades it out for a moment.
   export.py reads SFX, BGM and these settings, and mixes the film by the same rules.
   Films only (a chapter without questions): effects and music go through one Web Audio graph, so ducks, fades and the
   volume slider reach them on phones too (iOS ignores an element's .volume). A pause holds them; a seek stops the effects.
   When a clip loading or buffering holds the film's clock, the music runs on and then eases back (5 % slower or faster),
   or jumps back once if it is more than a second out. */
const SND = { sfx: [], bed: {}, bgm: [], len: [], on: [], wait: [], buf: {}, ctx: null, out: null, last: { i: -1, t: 0 }, duck: .3 };
const everyBeat = () => { try { return BEATS.map(b => b.id); } catch { return undefined; } };   // undefined until BEATS is defined
// window properties, not declarations: a book with its own older sfx() or BGM declares them over these
Object.assign(window, { SFX: SND.sfx, SFX_BED: SND.bed, BGM: SND.bgm,
  sfx(beat, at, name, vol = 1, bed = SND.bed[name] || 0) {
    const e = SND.sfx.find(x => x.beat === beat && x.at === at && x.name === name);
    if (e) Object.assign(e, { vol, bed }); else SND.sfx.push({ beat, at, name, vol, bed });
    sfxLoad(name);
  },
  // without beats, every beat: boot() fills them in when music() comes before BEATS
  music(file, beats = everyBeat(), gain = 1, fade = .8) {
    const m = { n: file, beats, gain, fade, v: 0, a: Object.assign(new Audio(file), { preload: 'auto', loop: true, volume: 0 }) };
    SND.bgm.push(m);
    if (SND.ctx) bgmWire(m);
  },
});
// An effect is fetched and decoded at once, before the first click builds the sound graph: decoding needs no running
// context (an AudioBuffer plays in any), so an effect due in the first second after Play, or after an early seek, is
// ready instead of dropped on a slow line.
let DECODER = null;
function sfxLoad(name) {
  const s = SND.buf[name] ??= { data: fetch(`audio/sfx/${name}.mp3`).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null) };
  const ctx = SND.ctx || (window.OfflineAudioContext && (DECODER ??= new OfflineAudioContext(2, 1, 44100)));
  if (ctx && !s.decoded) s.decoded = s.data.then(d => d && ctx.decodeAudioData(d)).then(b => { s.b = b; }, () => {});
}
function sfxPlay(e, late) {
  const ctx = SND.ctx, src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = SND.buf[e.name].b; src._sfx = e.name; g.gain.value = src._vol = .5 * e.vol;
  src.playbackRate.value = P.rate;
  src.connect(g).connect(SND.out);
  src.start(0, late && !e.bed ? 0 : Math.max(0, P.t - e.at));   // a late one-shot starts from its attack
  SND.on.push(src);
  src.onended = () => { const k = SND.on.indexOf(src); if (k >= 0) SND.on.splice(k, 1); };
}
function bgmWire(m) {
  m.g = SND.ctx.createGain();
  SND.ctx.createMediaElementSource(m.a).connect(m.g).connect(SND.out);
  m.a.volume = 1;
}
// A browser starts sound only after a click or a key: the first one builds the graph (films only) and readies the music.
function soundUnlock() {
  if (typeof BEATS === 'undefined') return;   // the chapter's script has not run yet
  if (!SND.ctx && window.AudioContext && (!BEATS.some(b => b.ask) || CHAPTER.film)) {   // a film with a question (CHAPTER.film) keeps its sound
    if (navigator.audioSession) navigator.audioSession.type = 'playback';   // iOS: the silent switch must not mute the film
    SND.ctx = new AudioContext();
    SND.out = SND.ctx.createGain();
    SND.out.connect(SND.ctx.destination);
    for (const n in SND.buf) sfxLoad(n);
    for (const m of SND.bgm) bgmWire(m);
  }
  if (SND.ctx && SND.ctx.state !== 'running' && SND.ctx.state !== 'closed') SND.ctx.resume().catch(() => {});   // also iOS 'interrupted'
  for (const m of SND.bgm) if (!m.blessed) {   // iOS lets an element play later only if it once played inside a click
    m.blessed = true; m.a.muted = true;
    m.a.play().then(() => { if (!m.cur) m.a.pause(); m.a.muted = false; }, () => { m.a.muted = false; m.blessed = false; });
  }
}
// a touch activates the page on touchend or click, not on pointerdown
for (const type of ['pointerdown', 'touchend', 'click', 'keydown']) addEventListener(type, soundUnlock, true);
// Safari (and every iOS browser) stops a media element for .3-.6 s at each playbackRate change, so easing the music
// back would only push it further out: there it keeps the film's rate and seeks instead.
const RATE_STALLS = /AppleWebKit/.test(navigator.userAgent) && !/Chrome\/|Android/.test(navigator.userAgent);
function soundTick(dt) {
  const id = BEATS[P.i]?.id, pre = BEATS[P.i]?.pre || 0, on = P.started && P.playing && !P.waiting && !P.done, L = SND.last;
  // a film waiting for the reader (CHAPTER.film, a question beat after its narration): the music plays on, louder
  const wait = P.started && P.playing && P.waiting && !P.done && !!CHAPTER.film;
  const held = P.started && !P.playing && !P.done, ctx = SND.ctx;
  if (ctx?.state === 'running' && held) ctx.suspend();
  else if (ctx && ctx.state !== 'running' && ctx.state !== 'closed' && !held) ctx.resume().catch(() => {});
  // the clock ran on (or stood still, paused) in the same beat; anything else is a seek, a replay or the next beat
  const same = L.i === P.i && P.t >= L.t && P.t - Math.max(0, L.t) < Math.max(.5, dt * P.rate + .25);
  if (!same) { while (SND.on.length) SND.on.pop().stop(); SND.wait = []; }
  // a beat that has just begun fires its effects from 0 on; a seek fires nothing it skipped, but joins a bed
  const from = same ? L.t : P.t < .25 ? -1 : P.t, seeked = !same || L.pend;
  if (on && ctx) {
    for (const e of SND.sfx) {
      if (e.beat !== id || !(e.at > from && e.at <= P.t || seeked && e.bed && e.at < P.t && P.t < e.at + e.bed)) continue;
      if (SND.buf[e.name]?.b) sfxPlay(e); else SND.wait.push(e);
    }
    SND.wait = SND.wait.filter(e => P.t - e.at < (e.bed || 1) && !(SND.buf[e.name]?.b && (sfxPlay(e, true), true)));
    for (const s of SND.on) if (s.playbackRate.value !== P.rate) s.playbackRate.value = P.rate;
  }
  SND.last = { i: P.i, t: on ? P.t : from, pend: !on && (!same || !!L.pend) };
  const vol = +($('volume')?.value ?? 1), up = window.MUSIC_UP_IN_PRE;
  if (SND.out) SND.out.gain.value = vol;
  if (!SND.bgm.length || BEATS.some(b => b.ask) && !CHAPTER.film) return;   // a lesson with questions plays no music
  // the film's clock moved this frame (a clip loading or buffering holds it), or jumped (a seek, a replay)
  const runs = on && same && P.t > L.t, jump = !same && !(L.i === P.i - 1 && P.t < .5);
  if (!held) SND.duck += Math.max(-dt, Math.min(dt, (wait || P.t < pre && (up === true || up?.includes?.(id)) ? .7 : .3) - SND.duck));
  for (const m of SND.bgm) {
    const k = m.beats.indexOf(id), current = (on || wait) && k >= 0 && !window.MUSIC_OFF?.[id]?.(P.t);
    if (jump) m.off = 0;   // a seek or a replay puts every track back where the film's own timing says
    if (wait && current) m.off = (m.off || 0) + dt * P.rate;   // the time it ran on while the reader decided
    m.cur = current;
    if (!held) m.v = m.fade > 0 ? Math.max(0, Math.min(1, m.v + (current ? 1 : -1) * dt / m.fade)) : +current;
    const g = m.v * m.gain * SND.duck;
    if (m.g) m.g.gain.value = g; else m.a.volume = Math.min(1, g * vol);
    if (current) {
      // where the film is: the beats before this one in the track as they really ran (P.end), plus now
      const dur = m.a.duration || Infinity;
      const want = (m.beats.slice(0, k).reduce((s, b) => s + (SND.len[BEATS.findIndex(x => x.id === b)] || 0), 0) + P.t + (m.off || 0)) % dur;
      let d = m.a.currentTime - want;
      if (d > dur / 2) d -= dur; else if (d < -dur / 2) d += dur;
      // a start, a jump, or more than a second out once the clock runs again: seek. Less: ease back while the clock runs,
      // from .25 s out until .05 s
      const ok = runs && !m.a.seeking;
      // (once more after a jump: the element plays on while it seeks)
      // Where a rate change stalls, starting and seeking stall too: once a second the music's lag is learnt (m.lead),
      // seeks aim that far ahead, and a quarter second out is then worth a seek.
      let far = m.settle ? .25 : 1;
      m.sought ??= clock;
      if (RATE_STALLS && ok && clock - m.sought > 1) {
        m.sought = clock; m.lead = Math.max(0, Math.min(.6, (m.lead || 0) - d)); far = .25;
      }
      if (m.a.paused || jump && Math.abs(d) > .05 || ok && Math.abs(d) > far) {
        m.a.currentTime = (want + (RATE_STALLS && m.lead || 0)) % dur; d = 0; m.settle = !ok; m.sought = clock;
      } else if (ok) m.settle = false;
      if (Math.abs(d) > .25) m.fix = true; else if (Math.abs(d) < .05) m.fix = false;
      // a frame where the clock stood still keeps the rate it had
      const rate = !m.fix || RATE_STALLS ? P.rate : ok ? P.rate * (1 - Math.sign(d) * .05) : m.a.playbackRate;
      if (Math.abs(m.a.playbackRate - rate) > .001) m.a.playbackRate = rate;
      if (m.a.paused) m.a.play().catch(() => {});
    } else {
      if (m.a.playbackRate !== P.rate) m.a.playbackRate = P.rate;
      if (m.v === 0 && !m.a.paused) m.a.pause();
    }
  }
  if (!on && !wait && !P.done) for (const m of SND.bgm) m.a.pause();
}

/* ---------- player ---------- */
const P = { i: 0, t: 0, end: 1, back: 0, playing: false, waiting: false, done: false, started: false, audio: null, afail: false, stall: 0, cleanup: [], rate: 1, nextClip: null };
function runBeat(i) {
  TW = [];
  const b = BEATS[i], tm = TIMINGS[b.id], pre = b.pre || 0;   // pre: seconds of picture before the narration starts
  const m = (k, off = 0) => {
    if (!(k in tm.marks)) throw new Error(`${b.id}: missing mark ${k}`);
    return pre + tm.marks[k] + off;
  };
  S.cleared = false;
  b.run(m, pre + tm.dur);
  if (S.cleared && b.lead !== false && CHAPTER.lead !== false && !pre) leadIn();   // CHAPTER.lead false: no beat gets one (a film)
  TW.sort((a, c) => a.t0 - c.t0);
  // runs that last to the end anyway (tails, follow cameras) do not set it: only the narration and the other tweens do,
  // and minDur, the least the whole beat lasts (two mirrored beats run the same seconds)
  const end = Math.max(Math.max(pre + tm.dur, ...TW.filter(w => !w.tail).map(w => w.t0 + w.dur)) + HOLD, b.minDur || 0);
  const tail = TW.some(w => w.tail === true);
  for (const w of TW) if (w.tail === true || tail && w.tail === 'follow') w.dur = end - w.t0;
  return SND.len[i] = end;   // the music places itself by how long each beat really runs
}
const HOLD = .6;
// A beat that clears the picture must not leave it empty while the narration has started.
// If nothing appears before LEAD_MAX, the opening group (every tween that starts within LEAD_GROUP s of the
// first reveal) moves earlier so it begins at LEAD_AT, just after the old panel has faded. Later steps keep their word timing.
const LEAD_AT = .4, LEAD_MAX = .8, LEAD_GROUP = 1.2;
function leadIn() {
  const reveals = TW.filter(w => {
    if (!w.e) return false;
    const s = st(w.e), to = w.to;
    return (to.o > 0 && s.o === 0) || (to.s > 0 && s.s === 0) || (to.d > 0 && (s.d ?? 1) === 0);
  });
  if (!reveals.length) return;
  const first = Math.min(...reveals.map(w => w.t0));
  if (first <= LEAD_MAX) return;
  for (const w of TW) if (w.t0 >= first && w.t0 < first + LEAD_GROUP) w.t0 -= first - LEAD_AT;
}
function stopAudio() {
  const a = P.audio;
  if (!a) return;
  a.onerror = null; a.pause(); a.removeAttribute('src'); a.load();
  P.audio = null;
}
function clearCards() {
  $('ui').replaceChildren();
  P.cleanup.forEach(f => f());
  P.cleanup = [];
  finishFx();
  P.keys = null;
  S.q?.remove();
  delete S.q;
}
// Rebuild the scene from scratch and fast-forward every earlier beat, so any step starts from its exact picture.
function seek(i, play = P.playing) {
  stopAudio(); clearCards(); reset();
  seeking = true;
  try {
    for (let k = 0; k < i; k++) { runBeat(k); evalTo(Infinity); }
    start(i, play);
  } finally { seeking = false; }
}
// Jump to a point inside beat i (frac of its narration); question beats always start at their beginning.
function seekInto(i, frac) {
  seek(i, true);
  const pre = BEATS[i].pre || 0, t = BEATS[i].ask && !CHAPTER.film ? 0 : frac * (pre + TIMINGS[BEATS[i].id].dur);   // a film's question beats seek like any other
  if (t < .3) return;
  P.t = t;
  evalTo(t);
  if (P.audio) P.audio.currentTime = Math.max(0, t - pre);
}
function start(i, play) {
  stopAudio(); clearCards();
  // P.gen counts starts: a done() kept from an earlier start of this same beat (a step replayed) no longer counts
  const gen = P.gen = (P.gen || 0) + 1;
  Object.assign(P, { i, t: 0, waiting: false, done: false, afail: false, stall: 0, lost: 0, back: 0 });
  P.end = runBeat(i);
  evalTo(0);
  const a = P.audio = beatClip(i, true);
  if (a) {   // a beat with no narration ({ dur }) has no clip: wall time drives its clock
    a.volume = +($('volume')?.value ?? 1);
    a.playbackRate = P.rate;
    // An aborted or superseded load (fast stepping, a reload) is not a failure: only a real error for the current clip
    // shows the note, and the note goes away as soon as a clip plays.
    a.onerror = () => { if (P.audio === a && a.error && a.error.code !== MediaError.MEDIA_ERR_ABORTED) soundFailed(); };
    a.onplaying = () => {
      if (P.audio !== a) return;
      $('soundNote').hidden = true;
      if (P.afail) { P.afail = false; a.currentTime = Math.max(0, P.t - (BEATS[P.i].pre || 0)); }   // sound came back late: rejoin the picture where it is
    };
  }
  const b = BEATS[i];
  if (b.ask) b.ask(() => {
    if (P.gen !== gen || P.done) return;
    evalTo(Infinity);
    if (i + 1 < BEATS.length) start(i + 1, true);
    else { P.done = true; setPlaying(false); filmDone(); }
  });
  setPlaying(play);
  if (i + 1 < BEATS.length) beatClip(i + 1);
}
// The next beat's clip starts loading while this one plays, so a slow connection does not stall between beats.
function beatClip(i, take) {
  if (TIMINGS[BEATS[i].id]?.silent) return null;
  // the clip's length rides on the URL: regenerated narration gets a new address, so a browser cache cannot pair new
  // timings with an old clip
  const src = `audio/${CHAPTER.language || 'en'}/${BEATS[i].id}.mp3?v=${TIMINGS[BEATS[i].id]?.dur ?? ''}`;
  let a = P.nextClip?._src === src ? P.nextClip : null;
  if (!a) {
    if (P.nextClip && P.nextClip !== P.audio) { P.nextClip.removeAttribute('src'); P.nextClip.load(); }   // abandon a stale preload
    a = Object.assign(new Audio(src), { preload: 'auto', _src: src });
  }
  P.nextClip = take ? null : a;
  return a;
}
// Playback speed: the audio clock drives the picture, so changing the clip's rate keeps them together.
const SPEEDS = [.75, 1, 1.25, 1.5];
function setSpeed(r) {
  P.rate = r;
  $('bSpeed').textContent = r + '×';
  if (P.audio) P.audio.playbackRate = r;
  try { localStorage.setItem('speed', String(r)); } catch {}
}
const stepSpeed = d => setSpeed(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, SPEEDS.indexOf(P.rate) + d))]);
function soundFailed() { P.afail = true; $('soundNote').hidden = false; }
function setPlaying(v) {
  P.playing = v;
  const a = P.audio;
  if (!a) return;
  const lead = v && P.t < (BEATS[P.i]?.pre || 0);
  if (v && !P.waiting && !a.ended && !P.afail && !lead) a.play().catch(e => { if (P.audio === a && e.name === 'NotAllowedError') soundFailed(); });
  else if (lead && !a._unlocked) {   // the clip starts later, outside this click: play it silently now so the browser allows that
    a._unlocked = true; a.muted = true;
    a.play().then(() => { if (P.t < (BEATS[P.i].pre || 0)) { a.pause(); a.currentTime = 0; } a.muted = false; }, () => { a.muted = false; });
  } else a.pause();
}
function beatDone() {
  // Steps finish; continuous motion (tails) stays where the clock is: a beat under music ends up to HOLD early, and
  // jumping its tails to their end would move them a few px on the last frame
  evalTo(Infinity, TW.filter(w => !w.tail));
  const b = BEATS[P.i];
  if (b.ask) P.waiting = true;
  else if (P.i < BEATS.length - 1) start(P.i + 1, true);
  else { P.done = true; setPlaying(false); filmDone(); }
}
// A chapter that ends on its last frame, with no closing card of questions (a picture book), is finished there: it
// counts as done, and CHAPTER.next is offered over that frame. Seeking or replaying clears the button with the cards.
function filmDone() {
  progress(p => { p.done = [...new Set([...(p.done || []), CHAPTER.number])]; });
  document.activeElement?.blur();   // a last question's Continue keeps focus, and Enter would press it again
  // as on the finish card: Enter opens the next chapter (or replays), R and Space replay
  const go = () => { if (CHAPTER.next) location.href = CHAPTER.next; else restart(); };
  P.keys = e => e.key === 'Enter' ? (go(), true) : isShortcut(e, 'r') ? (restart(), true) : false;
  if (!CHAPTER.next) return;
  const next = h('button', 'btn go', [translate('nextChapter'), kbd('Enter')]);
  next.onclick = go;
  const c = card({ x: 0, y: SH - 130, w: 0, cls: 'side' }, 'next');
  Object.assign(c.style, { left: 'auto', right: '40px', width: 'auto' });
  c.append(h('div', 'acts', [next]));
}
let last = performance.now();
function frame(now) {
  frameStep(now, .1);
  requestAnimationFrame(frame);
}
function frameStep(now, most) {
  const raw = Math.max(0, now - last) / 1000, dt = Math.min(most, raw);
  last = now;
  clock += dt;
  if (FX.length) { evalTo(clock, FX); FX = FX.filter(w => !w.done); }
  if (P.playing && !P.waiting && !P.done) {
    const a = P.audio, t0 = P.t;
    // While the clip plays, its clock drives the picture; before it starts or after it ends, wall time does.
    const pre = BEATS[P.i].pre || 0;
    if (a && P.t < pre) {   // the picture's lead before the narration, on wall time; then the clip starts
      P.t += dt * P.rate;
      if (P.t >= pre && !P.afail) { a.muted = false; a.currentTime = P.t - pre; a.play().catch(e => { if (P.audio === a && e.name === 'NotAllowedError') soundFailed(); }); }
    } else if (a && !P.afail && !a.ended) {
      if (a.currentTime > 0) { P.t = Math.max(P.t, pre + a.currentTime); P.stall = 0; }
      else if ((P.stall += dt) > (a.readyState < 2 ? 8 : 15)) soundFailed();   // nothing to play after 8 s, or stuck for 15
    } else P.t += dt * P.rate;
    // P.lost: how long the clock stood still while the film played (a clip getting going, buffering). Music runs on
    // through it, so a beat under music gives that time back from its closing hold: each beat then lasts as long in
    // real time as on the music's timeline, and the music stays with the picture instead of drifting ahead beat by beat.
    P.lost += raw * P.rate - (P.t - t0);   // real time: a long frame moves the music by all of it
    const back = P.back = SND.bgm.some(m => m.beats.includes(BEATS[P.i].id)) ? Math.max(0, Math.min(HOLD, P.lost)) : 0;
    evalTo(P.t);
    if (P.t >= P.end - back) beatDone();
  }
  soundTick(dt);
  syncLinks();
  ui();
}
let segs = [];
function buildSegs() {
  segs = BEATS.map((b, i) => {
  const s = h('button', 'seg' + (b.ask ? ' ask' : ''), [h('i')]);
  s.style.flex = TIMINGS[b.id].dur + (b.ask ? 12 : 0);
  s.title = b.title;
  s.setAttribute('aria-label', translate('goToStep', { n: i + 1, title: b.title }));
  // A click lands at that point of the step; keyboard activation (no pointer position) starts the step.
  s.onclick = e => {
    const r = s.getBoundingClientRect();
    hideCover(); seekInto(i, e.detail ? (e.clientX - r.left) / r.width : 0);
  };
  $('segs').append(s);
  return s.firstChild;
  });
}
// ui() runs on every frame, paused or not: it writes only what changed, so an idle lesson does no layout work.
let stepText = '';
const setWidth = (f, w) => { if (f._w !== w) { f._w = w; f.style.width = w + '%'; } };
function ui() {
  segs.forEach((f, k) => setWidth(f, k < P.i || P.done ? 100 : k > P.i ? 0 : Math.min(100, P.t / P.end * 100)));
  const fr = $('frame');
  fr.classList.toggle('is-playing', P.playing && !P.done && !P.waiting);
  fr.classList.toggle('held', P.started && (!P.playing || P.done));   // paused or ended: full screen keeps the controls
  fr.classList.toggle('paused', P.started && !P.playing && !P.waiting && !P.done && !BEATS[P.i].ask);
  const step = `${P.i + 1} / ${BEATS.length}   ${BEATS[P.i].title}`;
  if (step !== stepText) { stepText = step; $('stepName').textContent = step; }
  const b = BEATS[P.i];
  let text = '';
  // a question's caption shows while its narration plays, clear of the cards; a full-screen card already shows the
  // question, so it has none
  const asking = !!b.ask;
  if (P.started && !P.done && !(asking && (P.waiting || $('ui').querySelector('.card.screen')))) {
    // a cue is [start, line], [start, line, end] or [start, line, end, 1]: with an end, the caption clears once its
    // words are over; a 1 marks a line in another language, whose subtitle shows even with captions off (as does every
    // cue of a beat whose timings say forced: true, from tts.py or eleven.py)
    // the last line without an end clears a second after the narration, so it does not sit on a closing title
    const cues = TIMINGS[b.id].cues;
    for (const [k, [t, line, end = k === cues.length - 1 ? TIMINGS[b.id].dur + 1 : null, forced]] of cues.entries()) {
      if (t + (b.pre || 0) > P.t + .05) break;
      text = (captions || forced || TIMINGS[b.id].forced) && !(end != null && P.t > end + (b.pre || 0)) ? line : '';
    }
  }
  if (text !== capText) { capText = text; $('caption').textContent = text; $('caption').hidden = !text; }
  if (text) placeCaption(asking);
}
// Above a bottom band, or centred left of a card in the bottom right; elsewhere the caption keeps its place.
let capAt = '';
function placeCaption(asking) {
  const c = asking ? $('ui').querySelector('.card.band, .card.side') : null;
  let at = '';
  if (c?.classList.contains('band')) at = `${SH + 60 - c.offsetTop + 12}||`;
  else if (c && c.offsetLeft > 800 && c.offsetTop + c.offsetHeight > 700) at = `|${c.offsetLeft / 2}|${c.offsetLeft - 60}`;
  if (at === capAt) return;
  capAt = at;
  const [bottom, left, width] = at.split('|'), s = $('caption').style;
  Object.assign(s, { bottom: bottom && bottom + 'px', left: left && left + 'px', maxWidth: width && width + 'px' });
}
let capText = '';
try { captions = localStorage.getItem('captions') === '1'; } catch {}
function setCaptions(on, save = true) {
  captions = on;
  $('bCC').setAttribute('aria-pressed', String(on));
  if (save) try { localStorage.setItem('captions', on ? '1' : '0'); } catch {}
}
setCaptions(captions, false);   // only the reader's own choice is stored, so a book can still pick the first-time default
function hideCover() {
  P.started = true; $('cover').hidden = true;
  // a question that ?beat=N opened before the start (its box waited unfocused, so Space started) now takes the typing
  if (BEATS[P.i].ask) $('ui').querySelector('input.box:not(:disabled)')?.focus({ preventScroll: true });
}
function togglePlay() {
  if (!P.started) { turnPhone(); hideCover(); return setPlaying(true); }
  if (P.done) return restart();   // the end of a film (or of a chapter whose last step is a question): play again
  if (P.waiting) return;
  setPlaying(!P.playing);
}
const back1 = () => seek(P.t > 2.5 || P.i === 0 ? P.i : P.i - 1);
const restart = () => { for (const k in SCORE) delete SCORE[k]; hideCover(); seek(0, true); };
$('cover').onclick = togglePlay;
$('stage').addEventListener('click', e => {
  if (e.target.closest('a.cite')) { if (P.playing && !P.waiting) setPlaying(false); return; }   // opening a source pauses the lesson
  const b = BEATS[P.i];
  if (!b.ask && !P.done && !e.target.closest('.qlayer')) togglePlay();   // a tap on a finished film's last frame does nothing
});
const citeObs = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) autoCite(n); });
citeObs.observe(scene, { childList: true, subtree: true });
citeObs.observe($('ui'), { childList: true, subtree: true });
$('bPlay').onclick = togglePlay;
$('bBack').onclick = () => { hideCover(); back1(); };
$('bRestart').onclick = restart;
$('bCC').onclick = () => setCaptions(!captions);
$('bSpeed').onclick = () => setSpeed(SPEEDS[(SPEEDS.indexOf(P.rate) + 1) % SPEEDS.length]);
try { const r = +localStorage.getItem('speed'); if (SPEEDS.includes(r)) setSpeed(r); } catch {}
$('bFull').onclick = () => toggleFull();
// Full screen also turns the screen to the stage's orientation where the browser allows it (Android browsers lock
// orientation only in full screen; iOS has no lock, so there the reader turns the phone). On a phone held across the
// stage's orientation, starting the lesson goes full screen the same way, since the stage would otherwise be a strip.
function goFull() {
  return document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.(PORTRAIT ? 'portrait' : 'landscape')).catch(() => {});
}
function turnPhone() {
  const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 600;
  if (phone && !document.fullscreenElement && (innerHeight > innerWidth) !== PORTRAIT) goFull();
}
const toggleFull = () => document.fullscreenElement ? document.exitFullscreen() : goFull();
// In full screen the stage fills the screen and the controls lie over its foot: they show while the pointer moves (a
// tap on a phone) or a key is pressed, for 2.5 s after, while paused and while the pointer is on them.
document.addEventListener('fullscreenchange', () => {
  document.documentElement.classList.toggle('full', !!document.fullscreenElement);
  fit(); wake();
  if (!document.fullscreenElement) try { screen.orientation?.unlock?.(); } catch {}
});
let wakeT = 0;
function wake() { $('frame').classList.add('awake'); clearTimeout(wakeT); wakeT = setTimeout(() => $('frame').classList.remove('awake'), 2500); }
for (const type of ['pointermove', 'pointerdown', 'keydown']) addEventListener(type, wake, true);
let helpResume = false;
function toggleHelp() {
  const open = $('help').hidden;
  $('help').hidden = !open;
  if (open) { helpResume = P.playing; if (P.playing) setPlaying(false); }
  else if (helpResume) setPlaying(true);
}
// Review notes, only with ?review in the URL: N pauses and asks for a note on this moment, Shift+N copies every
// note of the chapter (one line each, with the ?beat=N&t=S that reopens it) and offers to clear them.
const REVIEW = new URLSearchParams(location.search).has('review');
const REVIEW_KEY = 'papermorph:review:' + location.pathname;
const reviewNotes = () => { try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]'); } catch { return []; } };
function reviewNote() {
  if (P.playing) setPlaying(false);
  const at = `?beat=${P.i}&t=${P.t.toFixed(1)}`, note = prompt(`Note at ${BEATS[P.i].id} ${at}`);
  if (!note) return;
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify([...reviewNotes(), `ch${String(CHAPTER.number).padStart(2, '0')} ${at} (${BEATS[P.i].id}): ${note}`])); } catch {}
}
function reviewCopy() {
  const notes = reviewNotes(), text = notes.join('\n');
  console.log(text);
  navigator.clipboard?.writeText(text).catch(() => {});
  if (confirm(`${notes.length} notes copied (also in the console). Clear them?`)) try { localStorage.removeItem(REVIEW_KEY); } catch {}
}
// Every action has a key. A question's own keys (P.keys) come first; Shift reaches the player during a question.
document.addEventListener('keydown', e => {
  if (e.altKey || e.metaKey || e.ctrlKey) return;
  const k = e.key;
  if (!$('help').hidden) { if (k === 'Escape' || k === '?') { e.preventDefault(); toggleHelp(); } return; }
  if (e.target.matches?.('input')) {        // Keep native input keys; only answer boxes use Enter to check.
    if (k === 'Enter' && e.target.type !== 'range' && P.keys) { e.preventDefault(); P.keys(e); }
    else if (k === 'Escape') e.target.blur();
    return;
  }
  if (k === '?') { e.preventDefault(); toggleHelp(); return; }
  if (REVIEW && isShortcut(e, 'n')) { e.preventDefault(); e.shiftKey ? reviewCopy() : reviewNote(); return; }
  if ((k === 'Enter' || k === ' ') && e.target.closest?.('button, [tabindex], a')) return;  // a Tab-focused control acts itself
  if (!P.started) { if (k === ' ' || k === 'Enter') { e.preventDefault(); togglePlay(); } return; }
  if (P.keys && !e.shiftKey && P.keys(e)) { e.preventDefault(); return; }
  const free = e.shiftKey || !P.keys || P.done;   // after the end no question holds the arrows
  let used = true;
  if (k === ' ') togglePlay();
  else if (k === 'ArrowLeft' && free) back1();
  else if (k === 'ArrowRight' && free) { if (P.i < BEATS.length - 1) seek(P.i + 1); }
  else if (k === 'Home') restart();
  else if (isShortcut(e, 'c')) setCaptions(!captions);
  else if (k === '<' || k === ',' || isShortcutCode(e, 'Comma')) stepSpeed(-1);
  else if (k === '>' || k === '.' || isShortcutCode(e, 'Period')) stepSpeed(1);
  else if (isShortcut(e, 'f')) toggleFull();
  else used = false;
  if (used) e.preventDefault();
});
// Mouse clicks should not leave focus on a control, so Enter and Space keep meaning "check" and "play".
$('frame').addEventListener('mousedown', e => { if (e.target.closest('button, [tabindex]')) e.preventDefault(); });
$('bHelp').onclick = toggleHelp;
// full screen: the stage alone, except that a touch screen keeps the controls under it (engine.css)
const fit = () => document.documentElement.style.setProperty('--k', document.fullscreenElement
  ? Math.min(innerWidth / SW, (innerHeight - (matchMedia('(pointer: coarse)').matches ? innerWidth <= 700 ? 110 : 60 : 0)) / SH)
  : Math.min(innerWidth / (SW + 40), (innerHeight - (innerWidth <= 700 ? 120 : 0)) / (SH + 100)));
addEventListener('resize', fit);
fit();

// Start the lesson once the chapter page has defined CHAPTER and BEATS.
// ?beat=N&t=S opens a paused frame, for reviewing a single moment.
function boot() {
  // a beat with no narration: { dur } in its fourth slot stands in for its clip and its TIMINGS entry
  window.TIMINGS ??= {};
  for (const b of BEATS) if (!TIMINGS[b.id] && b.dur != null) TIMINGS[b.id] = { dur: b.dur, marks: {}, cues: [], silent: true };
  for (const m of SND.bgm) {   // music() above BEATS plays under every beat
    m.beats ??= BEATS.map(b => b.id);
    const lost = m.beats.filter(id => !BEATS.some(b => b.id === id));
    if (lost.length) console.warn(`music('${m.n}'): no beat ${lost.join(', ')} in BEATS`);
  }
  $('coverK').textContent = translate('chapterNumber', { n: CHAPTER.label ?? CHAPTER.number });
  $('coverT').textContent = CHAPTER.title;
  $('bHome').href = `../#ch${String(CHAPTER.number).padStart(2, '0')}`;
  progress(p => { p.last = CHAPTER.number; });
  document.getElementById('stage').setAttribute('aria-label', translate('stageLabelTitled', { title: CHAPTER.title }));
  const film = !!CHAPTER.film || !BEATS.some(b => b.ask);   // a picture book or a film: no "lesson" or "quick checks" on its cover
  if (film) $('coverGo').textContent = translate('startFilm');
  if (film && (!BEATS.some(b => b.ask) || CHAPTER.questionKeys === false)) {   // nothing to answer with keys (or its own controls): the help lists no question keys and needs no column titles
    const shift = [...$('help').querySelectorAll('dt')].find(e => e.textContent.startsWith('Shift'));
    for (const e of [$('help').querySelector('.help-cols > :last-child'), $('help').querySelector('h3'), shift, shift.nextElementSibling]) e.hidden = true;
  }
  $('coverMeta').textContent = translate(film ? 'aboutMinutesFilm' : 'aboutMinutes', { n: num(CHAPTER.minutes) });
  buildSegs();
  const qs = new URLSearchParams(location.search);
  if (qs.has('lengths')) {   // each beat's voice against its length on screen: a tween or a run past the voice lengthens it
    reset(); seeking = true;
    try { for (let k = 0; k < BEATS.length; k++) { runBeat(k); evalTo(Infinity); } } finally { seeking = false; }
    console.log(`?lengths: beat, voice (pre + clip), on screen (hold included), and the time past voice + ${HOLD} s hold\n` + BEATS.map((b, i) => {
      const v = (b.pre || 0) + TIMINGS[b.id].dur, over = SND.len[i] - HOLD - v;
      return `${b.id.padEnd(16)} ${v.toFixed(2).padStart(6)} ${SND.len[i].toFixed(2).padStart(6)}${over > .005 ? `  +${over.toFixed(2)}` : ''}`;
    }).join('\n'));
  }
  if (qs.has('beat')) {
    $('cover').hidden = true;
    seek(Math.max(0, Math.min(BEATS.length - 1, qs.get('beat') | 0)), false);
    P.t = +(qs.get('t') || 0);
    evalTo(P.t);
    if (P.audio) P.audio.currentTime = Math.max(0, P.t - (BEATS[P.i].pre || 0));
  } else seek(0, false);
  requestAnimationFrame(frame);
  // A hidden tab gets no animation frames: a timer keeps the film going, so a beat that ends there still starts the next
  // one (a tab playing sound keeps its timers). Its ticks come late, so they may move the clock further at once.
  setInterval(() => { if (document.hidden) frameStep(performance.now(), 1.5); }, 250);
}
return { TRANSLATIONS, PORTRAIT, SW, SH, LANGUAGE, translate, DECIMAL_SIGN, isShortcut, NS, UI, BOOK, bookSetting,
  COL, MATH, NAME, BAND, RIGHT, TOPR, SCREEN, SORT_SCREEN, $m, mk, st, put, render, G, path, T, cite, ctx2d, textW, F,
  R, E, TX, $tex, texGraphic, texPart, OV, M, chip, tokens, layRow, collapse, mathEl, io, out, back, lin, tw, prog,
  show, hide, draw, pop, pulse, stream, mix, evalTo, soft, clockRun, camera, scene, S, AXIS, X, Y0, num, reset, tick,
  dot, arrow, panel, retire, header, fx, fxp, finishFx, pulseFx, shakeFx, floatText, TF, $, kbd, sources, uiW, SCORE,
  h, rich, card, mascotEl, quiz, qlayer, keyAct, choice, mcq, tap, tapEls, pickEls, grid, rat, gcd, lowest, blanks,
  SND, P, HOLD, clearCards, seek, seekInto, start, setSpeed, setPlaying, setCaptions, hideCover, restart, boot,
  finishCard };
})();

// The API, one global each: lint.py reads these declarations, and a chapter that declares one of them again stops
// with an error, as before.
const TRANSLATIONS = ENGINE.TRANSLATIONS, PORTRAIT = ENGINE.PORTRAIT, SW = ENGINE.SW, SH = ENGINE.SH,
  LANGUAGE = ENGINE.LANGUAGE, translate = ENGINE.translate, DECIMAL_SIGN = ENGINE.DECIMAL_SIGN,
  isShortcut = ENGINE.isShortcut, NS = ENGINE.NS, UI = ENGINE.UI, BOOK = ENGINE.BOOK,
  bookSetting = ENGINE.bookSetting, COL = ENGINE.COL, MATH = ENGINE.MATH, NAME = ENGINE.NAME, BAND = ENGINE.BAND,
  RIGHT = ENGINE.RIGHT, TOPR = ENGINE.TOPR, SCREEN = ENGINE.SCREEN, SORT_SCREEN = ENGINE.SORT_SCREEN, $m = ENGINE.$m,
  mk = ENGINE.mk, st = ENGINE.st, put = ENGINE.put, render = ENGINE.render, G = ENGINE.G, path = ENGINE.path,
  T = ENGINE.T, cite = ENGINE.cite, ctx2d = ENGINE.ctx2d, textW = ENGINE.textW, F = ENGINE.F, R = ENGINE.R,
  E = ENGINE.E, TX = ENGINE.TX, $tex = ENGINE.$tex, texGraphic = ENGINE.texGraphic, texPart = ENGINE.texPart,
  OV = ENGINE.OV, M = ENGINE.M, chip = ENGINE.chip, tokens = ENGINE.tokens, layRow = ENGINE.layRow,
  collapse = ENGINE.collapse, mathEl = ENGINE.mathEl, io = ENGINE.io, out = ENGINE.out, back = ENGINE.back,
  lin = ENGINE.lin, tw = ENGINE.tw, prog = ENGINE.prog, show = ENGINE.show, hide = ENGINE.hide, draw = ENGINE.draw,
  pop = ENGINE.pop, pulse = ENGINE.pulse, stream = ENGINE.stream, mix = ENGINE.mix, evalTo = ENGINE.evalTo,
  soft = ENGINE.soft, clockRun = ENGINE.clockRun, camera = ENGINE.camera, scene = ENGINE.scene, S = ENGINE.S,
  AXIS = ENGINE.AXIS, X = ENGINE.X, Y0 = ENGINE.Y0, num = ENGINE.num, reset = ENGINE.reset, tick = ENGINE.tick,
  dot = ENGINE.dot, arrow = ENGINE.arrow, panel = ENGINE.panel, retire = ENGINE.retire, header = ENGINE.header,
  fx = ENGINE.fx, fxp = ENGINE.fxp, finishFx = ENGINE.finishFx, pulseFx = ENGINE.pulseFx, shakeFx = ENGINE.shakeFx,
  floatText = ENGINE.floatText, TF = ENGINE.TF, $ = ENGINE.$, kbd = ENGINE.kbd, sources = ENGINE.sources,
  uiW = ENGINE.uiW, SCORE = ENGINE.SCORE, h = ENGINE.h, rich = ENGINE.rich, card = ENGINE.card,
  mascotEl = ENGINE.mascotEl, quiz = ENGINE.quiz, qlayer = ENGINE.qlayer, keyAct = ENGINE.keyAct,
  choice = ENGINE.choice, mcq = ENGINE.mcq, tap = ENGINE.tap, tapEls = ENGINE.tapEls, pickEls = ENGINE.pickEls,
  grid = ENGINE.grid, rat = ENGINE.rat, gcd = ENGINE.gcd, lowest = ENGINE.lowest, blanks = ENGINE.blanks,
  SND = ENGINE.SND, P = ENGINE.P, HOLD = ENGINE.HOLD, clearCards = ENGINE.clearCards, seek = ENGINE.seek,
  seekInto = ENGINE.seekInto, start = ENGINE.start, setSpeed = ENGINE.setSpeed, setPlaying = ENGINE.setPlaying,
  setCaptions = ENGINE.setCaptions, hideCover = ENGINE.hideCover, restart = ENGINE.restart, boot = ENGINE.boot;
// Hooks: scorm-bridge.js wraps these two, and the engine calls progress() through this global.
let finishCard = ENGINE.finishCard;
// Per-book progress shared with the cover/contents at the parent URL folder.
const BOOK_PROGRESS_KEY = bookSetting('--progress-key') || 'animebook:progress:' + new URL('../', location.href).pathname;
function progress(f) {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOK_PROGRESS_KEY) || '{}');
    const p = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    p.done = Array.isArray(p.done) ? p.done.filter(n => Number.isInteger(n) && n > 0) : [];
    f(p); localStorage.setItem(BOOK_PROGRESS_KEY, JSON.stringify(p));
  } catch {}
}
