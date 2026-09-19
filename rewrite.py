import os
import re
import shutil

def process_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        return

    # Replace import { createFileRoute, Link } from "@tanstack/react-router"
    content = re.sub(
        r'import \{(.*?)\} from "@tanstack/react-router";?',
        r'import {\1} from "wouter";',
        content
    )
    content = content.replace('createFileRoute,', '')
    content = content.replace('createFileRoute', '')

    # Remove Route definition
    content = re.sub(
        r'export const Route = createFileRoute[^{]*\(\{[\s\S]*?component: ([a-zA-Z0-9_]+),?\s*\}\);?',
        r'export default \1;',
        content
    )

    # Replace <Link to="/path" ...> with <Link href="/path" ...>
    content = re.sub(r'<Link\s+to=', r'<Link href=', content)

    # Fix <Link href="/videos/$id" params={{ id: video.id }}> to <Link href={`/videos/${video.id}`}>
    def replace_params(m):
        href = m.group(1)
        params_str = m.group(2)
        
        # Parse params object
        params_matches = re.findall(r'([a-zA-Z0-9_]+):\s*([^,}]+)', params_str)
        for key, val in params_matches:
            href = href.replace(f'${key}', f'${{{val.strip()}}}')
            href = href.replace(f':{key}', f'${{{val.strip()}}}')

        return f'<Link href={{`{href}`}}'

    content = re.sub(r'<Link\s+href="([^"]+)"\s+params=\{\{([^}]+)\}\}', replace_params, content)
    
    # Fix import { Link, useRouterState, useNavigate } from "wouter"
    content = re.sub(r'useNavigate\(\)', r'useLocation()', content)
    content = re.sub(r'const navigate = useLocation\(\)', r'const [, navigate] = useLocation()', content)
    content = re.sub(r'navigate\(\{\s*to:\s*([^}]+)\s*\}\)', r'navigate(\1)', content)

    with open(filepath, 'w') as f:
        f.write(content)

os.makedirs('artifacts/moonirat/src/pages', exist_ok=True)
for root, dirs, files in os.walk('.conversation/src/routes'):
    for file in files:
        if '__root' in file or 'README' in file or 'routeTree' in file or 'xml' in file:
            continue
        filepath = os.path.join(root, file)
        rel_path = os.path.relpath(filepath, '.conversation/src/routes')
        
        # Determine dest_path
        new_name = rel_path.replace('.tsx', '').replace('$', ':').replace('index', 'home')
        if new_name.startswith('_authenticated/'):
            new_name = new_name.replace('_authenticated/', '')
        if new_name == '_authenticated':
            continue
            
        dest_path = os.path.join('artifacts/moonirat/src/pages', new_name + '.tsx')
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        # copy file
        shutil.copy(filepath, dest_path)
        process_file(dest_path)
