---
name: study-drill
description: Turn a course pack (COURSE.md) or lecture PDFs into an interactive practice quiz with a mock exam, topic drills, generated questions and partial credit, plus a one-page printable cheat sheet, then explain questions in plain language. Use when the user wants to study for a quiz/midterm/exam, be quizzed on a course, wants a cheat sheet, or asks how to solve a practice question.
---

# Study drill + cheat sheet

## Who this is for
A university student. What works:
- **Only test what's on the exam.** The topic list in COURSE.md is the filter. No trivia, history or side examples.
- **Plain words.** Step by step, small tables, worked examples. Say exactly where their thinking went wrong.
- **Match the exam.** Same question styles, notation and mark split as the past exam.
- **Cheat sheet = one letter page, one side,** unless COURSE.md says otherwise.

## 1. Get the material (protect the context window)
Best: the user gives a filled-in `course-pack/COURSE.md`. Read that and nothing else unless you need to check a detail.

If they give PDFs instead, **don't read the PDFs directly.** Convert them to text first (≈10–20× smaller):
```bash
python3 -m venv .venv && .venv/bin/pip -q install pypdf
.venv/bin/python -I <skill>/scripts/extract_notes.py path/to/*.pdf -o notes/
```
Then read the past exam fully, and `grep` the notes for each listed topic, reading only the matching pages.
Pages marked `[image/diagram only]` lost their content; open just that PDF page if it matters.

Ask once, only for what's missing: official topic list, exam format and marks, cheat-sheet rules.

## 2. Build the quiz
Copy `templates/quiz-template.html`. **Edit only the `COURSE` block** (between the COURSE and engine comment lines):
- `COURSE`: `key` (unique per exam, or progress mixes), title, eyebrow, lede, mode descriptions.
- `TOPICS` / `WHY`: study order, one line on why each matters for the exam.
- `BANK`: written questions. `GEN`: generator functions (new numbers each time). `MOCK`: past-exam layout. `REF_HTML`: formulas/rules.

Question builders:
| Builder | Use for | Graded |
|---|---|---|
| `mc(topic, q, opts, ansIdx, exp)` / `tf(topic, q, bool, exp)` | concepts | right/wrong |
| `multi(topic, q, opts, [idx…], exp)` | select all | partial: (right − wrong picks) ÷ answers |
| `num(topic, q, ans, exp, {unit, tol})` | calculations | integer = exact; decimal ±1% (or `tol`, relative). Accepts 3e8 / 3x10^8 |
| `match(topic, q, [[left, right]…], exp)` | definitions, complexities | partial per pair |
| `order(topic, q, [steps in order], exp)` | algorithms, procedures | partial per position |
| `seqQ(topic, q, 'a b c', exp)` | traces: stack/queue/heap arrays, traversal orders | partial per position |
| `{type:'lines', lines, ans, notes, marks}` | find the bugs in code | +1 per bug, −1 per wrong line |
| `{type:'code', q, ref, check(src) → {ok, msg, frac}}` | anything custom | your checker |

Rules:
- Every question gets an explanation; generated ones show the worked steps with their numbers.
- ~40% of a drill comes from `GEN`, so any topic with numbers or traces needs a generator.
- **Physics:** generators for each formula type; `unit` on every `num`; `tol` 0.02 when the answer depends on g = 9.8 vs 9.81. Concept MC for sign/direction traps.
- **Data structures:** generators for traces (insert/delete sequences into stack, queue, heap, BST → `seqQ`), Big-O `match`, algorithm step `order`, bug hunts in the course's language. Code can't run in the page; test it through traces.
- Verify before publishing: `node <skill>/scripts/check_quiz.js quiz.html` must print ALL PASS (grades every question with its own answer, runs each generator 300×, builds mocks).
- Publish as an Artifact, one per course/exam.

## 3. Cheat sheet
Start from `templates/cheatsheet-template.html`: 3 columns, ~7.7pt, black/white. "I want to… → write" table, recipes, key tables, one worked example per tricky rule, "Never do this".
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$PWD/Cheat-Sheet.pdf" "file://$PWD/cheatsheet.html"
```
Check it's exactly 1 page (pypdf page count), look at it once, then give the user the PDF.

## 4. Explaining a question
Answer first, then what each piece means, the steps, and the exact misconception. Use the course's notation. Keep it short.
