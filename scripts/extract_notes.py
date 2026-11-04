"""Turn lecture PDFs into compact Markdown so they cost a fraction of the context.

    python3 -m venv .venv && .venv/bin/pip install pypdf
    .venv/bin/python scripts/extract_notes.py slides/*.pdf -o notes/

Per PDF it writes notes/<name>.md and drops:
  - lines repeated from the previous page (slides that build up one bullet at a time)
  - lines on 40%+ of pages (course name, prof name, footers)
  - bare page numbers and blank runs
Diagrams/images are not extracted: the output marks pages that were mostly image.
"""
import argparse, collections, pathlib, re, sys
from pypdf import PdfReader


def clean(path):
    pages = [(p.extract_text() or '').split('\n') for p in PdfReader(path).pages]
    pages = [[re.sub(r'\s+', ' ', l).strip() for l in p] for p in pages]
    seen_on = collections.Counter(l for p in pages for l in set(p) if l)
    boiler = {l for l, n in seen_on.items() if len(pages) >= 5 and n >= 0.4 * len(pages)}
    out, prev = [f'# {path.stem}\n'], set()
    for i, lines in enumerate(pages, 1):
        keep = [l for l in lines if l and l not in prev and l not in boiler and not re.fullmatch(r'\d{1,3}(\s*/\s*\d{1,3})?', l)]
        prev = set(lines)
        if keep:
            out.append(f'\n## p{i}\n' + '\n'.join(keep))
        elif not any(lines):
            out.append(f'\n## p{i}\n[image/diagram only: check the PDF]')
    return '\n'.join(out) + '\n', len(pages)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdfs', nargs='+', type=pathlib.Path)
    ap.add_argument('-o', '--out', type=pathlib.Path, default=pathlib.Path('notes'))
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    tot_pages = tot_chars = 0
    for f in a.pdfs:
        try:
            md, n = clean(f)
        except Exception as e:  # one bad PDF shouldn't stop the batch
            print(f'skip {f.name}: {e}', file=sys.stderr)
            continue
        (a.out / (f.stem + '.md')).write_text(md)
        tot_pages += n; tot_chars += len(md)
        print(f'{f.name}: {n} pages → ~{len(md) // 4:,} tokens')
    # rough: a PDF page sent as a document costs ~1.5–3k tokens (text + page image); text is ~4 chars/token
    print(f'\nTotal: {tot_pages} pages. As PDFs ≈ {tot_pages * 1500:,}+ tokens; as Markdown ≈ {tot_chars // 4:,} tokens.')


if __name__ == '__main__':
    main()
