import re
def fix(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # <Link href="/videos/$id" params={{ id }}>
    content = re.sub(
        r'<Link\s+href="[^"]+"\s*params=\{\{\s*([a-zA-Z0-9_]+)\s*\}\}',
        r'<Link href={`/' + r'\g<1>' + r's/${\g<1>}`}',
        content
    )
    with open(path, 'w') as f:
        f.write(content)

fix('artifacts/moonirat/src/components/VideoCard.tsx')
fix('artifacts/moonirat/src/components/ArtistCard.tsx')
