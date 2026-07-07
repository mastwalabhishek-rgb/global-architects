import glob

paths = sorted(glob.glob('journal*.html'))
if not paths:
    raise SystemExit('No journal files found')

for path in paths:
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    bad_dash = '\u00e2\u20ac\u201d'
    bad_arrow = '\u00e2\u2020\u2019'
    count_dash = text.count(bad_dash)
    count_arrow = text.count(bad_arrow)
    if count_dash or count_arrow:
        new_text = text.replace(bad_dash, '-').replace(bad_arrow, '->')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f'Updated {path}: {count_dash} dashes, {count_arrow} arrows')
    else:
        print(f'No changes needed for {path}')
