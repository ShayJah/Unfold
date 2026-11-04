# study-drill-kit

Turn a course into an exam-style practice quiz and a one-page cheat sheet with Claude.

The quiz is one HTML file: mock exam laid out like the past exam, topic drills, a practice lab with generated questions (new numbers every time), partial credit, progress per topic, light/dark mode.

## What's here
| Path | What it is |
|---|---|
| `SKILL.md` | Instructions Claude follows (works as a Claude skill) |
| `templates/quiz-template.html` | The quiz. Only the `COURSE` block changes per course |
| `templates/cheatsheet-template.html` | 1-page, 3-column printable layout |
| `course-pack/COURSE.md` | Fill this in per exam; give it to Claude instead of the PDFs |
| `course-pack/notebooklm-prompt.md` | Prompt to condense slides with NotebookLM/Gemini |
| `scripts/extract_notes.py` | PDFs → compact Markdown (~10–20× fewer tokens) |
| `scripts/check_quiz.js` | Checks every question grades correctly before you use it |

## Workflow per exam
1. **Shrink the PDFs.**
   ```bash
   python3 -m venv .venv && .venv/bin/pip install pypdf
   .venv/bin/python scripts/extract_notes.py ~/Downloads/lectures/*.pdf -o notes/
   ```
2. **Fill in `COURSE.md`.** The topic list and past exam verbatim matter most. For section 6, either paste from NotebookLM using the prompt, or let Claude grep `notes/`.
3. **Ask Claude:** "Use the study-drill skill with this COURSE.md for my physics midterm."
4. Claude builds the quiz from the template, runs `check_quiz.js`, publishes it, and makes the cheat sheet.

## Install
**Claude Code / desktop:** clone into your skills folder:
```bash
git clone https://github.com/<you>/study-drill-kit ~/.claude/skills/study-drill
```
**claude.ai:** zip the folder and upload it in claude.ai’s Skills settings, or add `SKILL.md` and the templates to a Project's knowledge.

## Question types
Multiple choice, true/false, select-all, numeric (units, tolerance, `3x10^8` input), match, order, sequence traces, find-the-bugs, and custom-checked text. See the table in `SKILL.md`.
