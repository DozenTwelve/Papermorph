'use strict';
// All prices are cents; rates are whole percents. Round the CHANGE, half a cent up.
const SE = (() => {
  const money = cents => (cents / 100).toFixed(2);
  const change = (base, rate, up = false) => {
    if (!Number.isSafeInteger(base) || base < 0 || !Number.isInteger(rate) ||
        rate < 0 || rate > 100 || !Number.isSafeInteger(base * rate + 50)) {
      throw new Error('Price needs nonnegative integer cents and a rate from 0 to 100.');
    }
    const amount = Math.floor((base * rate + 50) / 100);
    const next = base + (up ? amount : -amount);
    return {
      base, rate, up, amount, next,
      why: rate + '% of $' + money(base) + ' is $' + money(amount) + '; $' +
        money(base) + (up ? ' + $' : ' − $') + money(amount) + ' = $' + money(next) + '.'
    };
  };
  const box = cents => ({ box: money(cents) });
  const row = (parts, why, hint = 'Find the percent of its base, then add or subtract the change.') => ({ parts, why, hint });
  // One model supplies each displayed tag, its bar, its answer and its feedback.
  function problem(kind, item, base, rate, second = 0) {
    const a = change(base, rate, kind === 'markup' || kind === 'cost' || kind === 'updown');
    const b = change(a.next, second || rate, kind === 'downup');
    const title = item + ' · $' + money(base) + ' · ' + rate + '% ' + (a.up ? 'markup' : 'off');
    let prompt, answer, why, hint, subtitle = 'Percent of the price on this tag';
    if (kind === 'discount') {
      prompt = ['Discount $', box(a.amount), '   Pay $', box(a.next)];
      why = a.why;
    } else if (kind === 'two' || kind === 'updown' || kind === 'downup') {
      prompt = ['After first $', box(a.next), '   Final $', box(b.next)];
      why = a.why + ' Then ' + b.why;
      subtitle = 'Then ' + (second || rate) + '% ' + (b.up ? 'up' : 'off') + ' the changed price';
      hint = 'Calculate the first price. That result is the base for the second percent.';
    } else if (kind === 'original' || kind === 'cost') {
      prompt = [kind === 'cost' ? 'Original cost $' : 'Original price $', box(base)];
      why = '$' + money(a.next) + ' ÷ ' + ((100 + (a.up ? rate : -rate)) / 100).toFixed(2) +
        ' = $' + money(base) + '. Check: ' + a.why;
      hint = 'The known price is ' + (100 + (a.up ? rate : -rate)) + '% of the missing base. Divide by that factor.';
    } else if (kind === 'rate') {
      prompt = ['Discount ', { box: String(rate) }, ' %'];
      why = '$' + money(a.amount) + ' saved ÷ $' + money(base) + ' original × 100 = ' + rate + '%.';
      hint = 'Subtract to find the saving. Divide the saving by the original price, then multiply by 100.';
    } else if (kind === 'markup') {
      prompt = ['Markup $', box(a.amount), '   Sell for $', box(a.next)];
      why = a.why;
    } else throw new Error('Unknown price problem: ' + kind);
    answer = row(prompt, why, hint);
    return { kind, item, title, subtitle, a, b, row: answer };
  }
  // Price, rate and kind of every example and exercise in the source chapter (PDF 143–152), in cents: a random draw
  // that lands on one is drawn again, so no task repeats the book's numbers.
  const SOURCE = new Set(['discount 1250 20', 'discount 30000 15', 'discount 4800 20', 'two 10000 25', 'two 3000 15',
    'original 54500 45', 'original 5999 30', 'rate 5000 30', 'markup 4000 20', 'markup 5000 8', 'markup 35000 15',
    'markup 25000 25', 'cost 299 70', 'cost 240 35', 'cost 4000 20', 'downup 20000 30']);
  function questions(random = Math.random) {
    const fresh = (kind, item, base, rate, second) => {
      let b, r;
      do { b = base(); r = rate(); } while (SOURCE.has(kind + ' ' + b + ' ' + r));
      return problem(kind, item, b, r, second);
    };
    const pick = values => values[Math.floor(random() * values.length)];
    const between = (lo, hi, step = 1) => lo + step * Math.floor(random() * (Math.floor((hi - lo) / step) + 1));
    // Exact by construction: quarter-dollar tags with rates in steps of 4, or whole-dollar tags.
    const small = () => between(1500, 4975, 25);
    const rate = () => between(8, 32, 4);
    const original = () => between(20, 60) * 100;
    const reverseRate = () => between(10, 40);
    const series = () => between(50, 120) * 100;
    const markBase = () => between(800, 2475, 25);
    const cycleBase = () => between(30, 90) * 100;
    const q1 = fresh('discount', 'Paper lantern kit', small, rate);
    const q2 = fresh('two', 'Printmaking set', series, rate, 25);
    const q3 = fresh('original', 'Fabric bundle', original, reverseRate);
    const q4 = fresh('updown', 'Display stand', cycleBase, () => pick([10, 20, 30]));
    // Supplier B starts higher but takes more off; either one can end lower, never a tie.
    let left, right;
    do {
      const compareBase = original();
      left = change(compareBase, 12);
      right = change(compareBase + between(1, 6) * 100, 18);
    } while (left.next === right.next);
    const compare = {
      kind: 'compare', item: 'Same ink tray, two suppliers', a: left, b: right,
      title: 'Same ink tray · compare final prices', subtitle: 'Choose the lower price after its own discount',
      row: row(['Lower final price $', box(Math.min(left.next, right.next))],
        'A: ' + left.why + ' B: ' + right.why, 'Find both sale prices, then compare dollars, not rates.')
    };
    let roundBase, roundRate;
    do { roundBase = between(505, 995, 10); roundRate = between(14, 26, 4); }
    while (roundBase * roundRate % 100 === 0);  // this task is about rounding, so a fraction of a cent must appear
    const round = problem('discount', 'Bead tray', roundBase, roundRate);
    round.rule = round.subtitle = 'Round the discount to the nearest cent; half a cent rounds up. Then subtract.';
    round.row.hint = round.rule;
    return {
      q1: [q1], q2: [q2], q3: [q3], q4: [q4],
      final1: [fresh('discount', 'Carving block', small, rate), compare, round],
      final2: [
        fresh('original', 'Ribbon bundle', original, reverseRate),
        fresh('two', 'Screen-print frame', series, rate, 25),
        fresh('rate', 'Paper cutting mat', original, reverseRate)
      ],
      final3: [
        fresh('markup', 'Stencil pack', markBase, rate),
        fresh('cost', 'Stamp set', original, reverseRate),
        fresh('downup', 'Drying rack', cycleBase, () => pick([10, 20, 30]), 20)
      ]
    };
  }
  const worked = {
    pad: problem('discount', 'Sketch pad', 1875, 12),
    twice: problem('two', 'Tracing panel', 9600, 20, 25),
    reverse: problem('original', 'Fabric roll', 3600, 12),
    rate: problem('rate', 'Clay stamp kit', 7200, 18),
    markup: problem('markup', 'Stencil pack', 1440, 40),
    cost: problem('cost', 'Wire sculpture kit', 2400, 15),
    cycle: problem('updown', 'Sign easel', 6400, 20),
    cents: problem('discount', 'Pompom tray', 735, 18)
  };
  return { money, change, problem, questions, worked, SOURCE };
})();
