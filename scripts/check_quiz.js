// Usage: node scripts/check_quiz.js quiz.html
// Grades every BANK question with its own answer, runs each generator 300×, builds mocks and lab items.
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const js = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
const fake = () => new Proxy({}, { get: (t, k) => k === 'querySelectorAll' ? () => [] : k === 'querySelector' ? () => fake() : k === 'dataset' ? {} : k === 'classList' ? { toggle() {} } : t[k], set: (t, k, v) => (t[k] = v, true) });
global.window = global; global.document = { querySelector: () => fake(), querySelectorAll: () => [], addEventListener() {}, createElement: () => fake() };
global.matchMedia = () => ({ matches: false }); global.scrollTo = () => {};
eval(js);
const { BANK, GEN, MOCK, prep, initState, grade, explain, buildMock, labItem, fracOf } = window.__md;
let fails = 0; const F = (...a) => { fails++; console.log('FAIL', ...a); };
const solve = q => { const p = prep(q), st = initState(p);
  if (p.type === 'mc') st.sel = p.ans; else if (p.type === 'multi' || p.type === 'lines') st.sel = [...p.ans]; else if (p.type === 'num') st.val = String(p.ans);
  else if (p.type === 'match') st.sel = p.pairs.map(x => x[1]); else if (p.type === 'order') st.ord = p.steps.map((_, i) => i); else st.src = p.ref;
  return [p, st]; };
const check = (q, where) => {
  if (!q || !q.topic) return F(where, 'no question/topic');
  const [p, st] = solve(q); const txt = (q.q || '').replace(/<[^>]+>/g, '').slice(0, 60);
  if (!grade(p, st)) F(where, q.topic, txt, st.res && st.res.msg);
  if (q.type === 'mc' && !(q.ans >= 0 && q.ans < q.opts.length)) F(where, 'mc ans out of range');
  if (q.type === 'num' && typeof q.ans !== 'number') F(where, 'num ans must be a number');
  if (q.type === 'code' && grade(p, { src: 'zzz' })) F(where, 'accepts junk');
  try { explain(p, st); } catch (e) { F(where, 'explain', e.message); }
};
const known = Object.keys(window.__md.BANK.reduce((o, q) => (o[q.topic] = 1, o), {}));
BANK.forEach((q, i) => check(q, `BANK[${i}]`));
for (const [t, gs] of Object.entries(GEN)) gs.forEach((g, j) => { for (let k = 0; k < 300; k++) check(g(), `GEN.${t}[${j}]`); });
for (let k = 0; k < 50; k++) { const m = buildMock(); if (!m.length) F('mock empty'); m.forEach((it, i) => it.q || F('mock item', i, 'missing: not enough BANK questions for that part')); }
for (let k = 0; k < 50; k++) check(labItem().q, 'lab');
// partial credit sanity
const ms = BANK.find(q => q.type === 'match');
if (ms) { const p = prep(ms), st = initState(p); st.sel = p.pairs.map((x, i) => i ? x[1] : ''); grade(p, st); const f = fracOf({ q: p, st, ok: false });
  if (Math.abs(f - (p.pairs.length - 1) / p.pairs.length) > 1e-9) F('match partial', f); }
console.log(`${BANK.length} bank questions, ${Object.values(GEN).flat().length} generators, ${MOCK.length} mock parts, topics: ${known.join(', ')}`);
console.log(fails ? `${fails} FAILURES` : 'ALL PASS'); process.exit(fails ? 1 : 0);
