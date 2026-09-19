import os
import re
import shutil
import glob

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
    
    # Extract component name from export const Route
    match = re.search(r'export const Route\s*=\s*(?:createFileRoute|)[^{]*\(\{[\s\S]*?component:\s*([a-zA-Z0-9_]+),?\s*\}\);?', content)
    if match:
        component_name = match.group(1)
        # Remove the Route definition
        content = re.sub(r'export const Route\s*=\s*(?:createFileRoute|)[^{]*\(\{[\s\S]*?component:\s*[a-zA-Z0-9_]+,?\s*\}\);?', f'export default {component_name};', content)

    content = content.replace('createFileRoute,', '')
    content = content.replace('createFileRoute', '')

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

    # Some uses of useParams()
    # import { useParams } from "wouter"; -> wouter has useParams() but returns `{ id: string }` without needing `from '/videos/$id'`
    content = re.sub(r'Route\.useParams\(\)', r'useParams()', content)

    # Also import useParams if needed:
    if 'useParams()' in content and 'useParams' not in content[:content.find(';')]:
        # we can just add it to wouter imports
        content = re.sub(r'import \{([^}]*)\} from "wouter"', r'import {\1, useParams} from "wouter"', content)

    with open(filepath, 'w') as f:
        f.write(content)

for filepath in glob.glob('artifacts/moonirat/src/pages/*.tsx'):
    if 'not-found' in filepath:
        continue
    # reload original
    rel = os.path.basename(filepath).replace(':', '$').replace('home', 'index')
    if not os.path.exists(f'.conversation/src/routes/{rel}'):
        rel = f'_authenticated/{rel}'
    
    original_path = f'.conversation/src/routes/{rel}'
    if os.path.exists(original_path):
        shutil.copy(original_path, filepath)
        process_file(filepath)
