import glob

paths = sorted(glob.glob('journal*.html'))
if not paths:
    raise SystemExit('No journal files found')

for path in paths:
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    count_dash = text.count('â€”')
    count_arrow = text.count('â†’')
    if count_dash or count_arrow:
        new_text = text.replace('â€”', '—').replace('â†’', '→')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f'Updated {path}: {count_dash} dashes, {count_arrow} arrows')
    else:
        print(f'No changes needed for {path}')
